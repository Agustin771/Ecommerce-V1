package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.dto.CheckoutResponse;
import com.agustin771.e_commerse.dto.OrderStatusResponse;
import com.agustin771.e_commerse.exception.BusinessException;
import com.agustin771.e_commerse.exception.ResourceNotFoundException;
import com.agustin771.e_commerse.model.*;
import com.agustin771.e_commerse.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final MercadoPagoService mercadoPagoService;
    private final MercadoPagoWebhookService webhookService;

    private static final Logger log =
            LoggerFactory.getLogger(OrderService.class);

    @Transactional
    public CheckoutResponse createCheckout(Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No encontramos tu usuario."
                ));

        Cart cart = cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() -> new BusinessException(
                        "Tu carrito está vacío."
                ));

        if (cart.getItems().isEmpty()) {
            throw new BusinessException(
                    "No podés iniciar una compra con el carrito vacío."
            );
        }

        Order order = new Order();
        order.setOrderNumber(UUID.randomUUID().toString());
        order.setUser(user);
        order.setStatus(OrderStatus.PENDING);

        BigDecimal total = BigDecimal.ZERO;
        List<MercadoPagoService.MercadoPagoItem> mpItems =
                new ArrayList<>();

        for (CartItem cartItem : cart.getItems()) {

            Product product = productRepository
                    .findByIdForUpdate(cartItem.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Uno de los productos de tu carrito ya no existe."
                    ));

            if (!product.isActive()) {
                throw new BusinessException(
                        "El producto " + product.getName()
                                + " ya no está disponible."
                );
            }

            Integer quantity = cartItem.getQuantity();

            if (quantity == null || quantity < 1) {
                throw new BusinessException(
                        "Hay una cantidad inválida en tu carrito."
                );
            }

            if (product.getStock() < quantity) {
                throw new BusinessException(
                        "No hay stock suficiente de "
                                + product.getName()
                                + ". Stock disponible: "
                                + product.getStock()
                );
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal subtotal = unitPrice.multiply(
                    BigDecimal.valueOf(quantity)
            );

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(product.getId());
            orderItem.setSku(product.getSku());
            orderItem.setProductName(product.getName());
            orderItem.setUnitPrice(unitPrice);
            orderItem.setQuantity(quantity);
            orderItem.setSubtotal(subtotal);

            order.addItem(orderItem);
            total = total.add(subtotal);

            mpItems.add(
                    new MercadoPagoService.MercadoPagoItem(
                            product.getName(),
                            quantity,
                            unitPrice
                    )
            );

            product.setStock(product.getStock() - quantity);
        }

        if (total.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessException(
                    "El total de la compra debe ser mayor a cero."
            );
        }

        order.setTotal(total);

        String idempotencyKey = UUID.randomUUID().toString();

        MercadoPagoService.MercadoPagoOrder mpOrder =
                mercadoPagoService.createOrder(
                        idempotencyKey,
                        order.getOrderNumber(),
                        user.getEmail(),
                        total,
                        mpItems
                );

        Order savedOrder = orderRepository.save(order);

        Payment payment = new Payment();
        payment.setOrder(savedOrder);
        payment.setMercadoPagoOrderId(mpOrder.id());
        payment.setCheckoutUrl(mpOrder.checkoutUrl());
        payment.setStatus(PaymentStatus.PENDING);
        payment.setIdempotencyKey(idempotencyKey);

        paymentRepository.save(payment);

        cart.getItems().clear();
        cartRepository.save(cart);

        return new CheckoutResponse(
                savedOrder.getOrderNumber(),
                payment.getCheckoutUrl(),
                savedOrder.getTotal(),
                savedOrder.getStatus().name()
        );
    }

    @Transactional
    public OrderStatusResponse cancelOrder(
            String orderNumber,
            Long userId
    ) {

        Order order = orderRepository
                .findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No encontramos esa compra."
                ));

        if (order.getStatus() != OrderStatus.PENDING) {
            return getOrderStatus(orderNumber, userId);
        }

        Payment payment = paymentRepository
                .findByOrderIdForUpdate(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No encontramos el pago asociado a esta compra."
                ));

        String mercadoPagoOrderId = payment.getMercadoPagoOrderId();

        if (mercadoPagoOrderId == null
                || mercadoPagoOrderId.isBlank()) {
            throw new BusinessException(
                    "La compra no tiene una orden de Mercado Pago asociada."
            );
        }
        Map<String, Object> remoteOrder =
                mercadoPagoService.getOrder(mercadoPagoOrderId);

        String remoteStatus = String.valueOf(
                remoteOrder.get("status")
        );

        log.info(
                "Solicitud de cancelación | order={} | MP status={}",
                orderNumber,
                remoteStatus
        );

        if ("created".equalsIgnoreCase(remoteStatus)
                || "action_required".equalsIgnoreCase(remoteStatus)) {

            mercadoPagoService.cancelOrder(
                    mercadoPagoOrderId,
                    UUID.randomUUID().toString()
            );
        }

        webhookService.processOrderNotification(mercadoPagoOrderId);

        return getOrderStatus(orderNumber, userId);
    }

    @Transactional
    public CheckoutResponse retryPayment(String orderNumber, Long userId) {
        Order order = orderRepository
                .findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No encontramos esa compra."
                ));

        Payment payment = paymentRepository
                .findByOrderIdForUpdate(order.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No encontramos el pago asociado a esta compra."
                ));

        if (order.getStatus() != OrderStatus.PENDING
                || payment.getStatus() != PaymentStatus.PENDING) {
            return new CheckoutResponse(
                    order.getOrderNumber(), null, order.getTotal(),
                    order.getStatus().name()
            );
        }

        String mpOrderId = payment.getMercadoPagoOrderId();
        if (mpOrderId == null || mpOrderId.isBlank()) {
            throw new BusinessException(
                    "Esta compra no tiene un enlace de pago disponible."
            );
        }

        Map<String, Object> remoteOrder = mercadoPagoService.getOrder(mpOrderId);
        String remoteStatus = String.valueOf(remoteOrder.get("status"));

        String externalReference = String.valueOf(
                remoteOrder.get("external_reference")
        );
        BigDecimal remoteTotal;
        try {
            remoteTotal = new BigDecimal(
                    String.valueOf(remoteOrder.get("total_amount"))
            );
        } catch (NumberFormatException | NullPointerException exception) {
            throw new BusinessException(
                    "Mercado Pago devolvió un importe inválido para esta compra."
            );
        }

        if (!order.getOrderNumber().equals(externalReference)
                || remoteTotal.compareTo(order.getTotal()) != 0) {
            throw new BusinessException(
                    "Los datos de la orden no coinciden con Mercado Pago."
            );
        }

        if ("created".equalsIgnoreCase(remoteStatus)
                || "action_required".equalsIgnoreCase(remoteStatus)) {
            if (payment.getCheckoutUrl() == null
                    || payment.getCheckoutUrl().isBlank()) {
                throw new BusinessException(
                        "Mercado Pago no devolvió un enlace para continuar el pago."
                );
            }

            log.info("Reintento de pago solicitado | order={} | MP status={}",
                    orderNumber, remoteStatus);

            return new CheckoutResponse(
                    order.getOrderNumber(), payment.getCheckoutUrl(),
                    order.getTotal(), order.getStatus().name()
            );
        }

        // Si Mercado Pago ya resolvió la orden, sincronizamos el estado antes de responder.
        webhookService.processOrderNotification(mpOrderId);

        return new CheckoutResponse(
                order.getOrderNumber(), null, order.getTotal(),
                order.getStatus().name()
        );
    }

    @Transactional(readOnly = true)
    public List<OrderStatusResponse> getPendingOrders(Long userId) {
        return orderRepository
                .findAllByUser_IdAndStatusOrderByCreatedAtDesc(
                        userId, OrderStatus.PENDING
                )
                .stream()
                .map(order -> new OrderStatusResponse(
                        order.getOrderNumber(),
                        order.getStatus().name(),
                        order.getTotal(),
                        order.getCreatedAt(),
                        order.getItems().stream()
                                .map(item -> new OrderStatusResponse.OrderLineResponse(
                                        item.getProductName(),
                                        item.getSku(),
                                        item.getUnitPrice(),
                                        item.getQuantity(),
                                        item.getSubtotal()
                                ))
                                .toList()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public OrderStatusResponse getOrderStatus(String orderNumber, Long userId) {

        Order order = orderRepository.findByOrderNumberAndUserId(orderNumber, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No encontramos esa compra."
                ));

        return new OrderStatusResponse(
                order.getOrderNumber(),
                order.getStatus().name(),
                order.getTotal(),
                order.getCreatedAt(),
                order.getItems().stream()
                        .map(item -> new OrderStatusResponse.OrderLineResponse(
                                item.getProductName(),
                                item.getSku(),
                                item.getUnitPrice(),
                                item.getQuantity(),
                                item.getSubtotal()
                        ))
                        .toList()
        );
    }

}
