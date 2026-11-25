package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.exception.BusinessException;
import com.agustin771.e_commerse.model.*;
import com.agustin771.e_commerse.repository.PaymentRepository;
import com.agustin771.e_commerse.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MercadoPagoWebhookService {

    private static final Logger log =
            LoggerFactory.getLogger(MercadoPagoWebhookService.class);

    private final MercadoPagoService mercadoPagoService;
    private final PaymentRepository paymentRepository;
    private final ProductRepository productRepository;
    private final EmailService emailService;
    private final CartService cartService;

    @Transactional
    public void processOrderNotification(String mercadoPagoOrderId) {

        Payment payment = paymentRepository
                .findByMercadoPagoOrderIdForUpdate(mercadoPagoOrderId)
                .orElseThrow(() -> new BusinessException(
                        "No encontramos el pago asociado a la notificación."
                ));

        Order order = payment.getOrder();

        Map<String, Object> mpOrder =
                mercadoPagoService.getOrder(mercadoPagoOrderId);

        String externalReference = value(
                mpOrder.get("external_reference")
        );

        String remoteStatus = value(mpOrder.get("status"));
        String remoteStatusDetail = value(mpOrder.get("status_detail"));

        if (!order.getOrderNumber().equals(externalReference)) {
            throw new BusinessException(
                    "La referencia de la orden no coincide con Mercado Pago."
            );
        }

        BigDecimal remoteTotal = decimal(mpOrder.get("total_amount"));

        if (remoteTotal == null
                || remoteTotal.compareTo(order.getTotal()) != 0) {
            throw new BusinessException(
                    "El importe informado por Mercado Pago no coincide con la orden."
            );
        }

        log.info(
                "Notificación Mercado Pago | order={} | status={} | detail={}",
                order.getOrderNumber(),
                remoteStatus,
                remoteStatusDetail
        );

        if (order.getStatus() == OrderStatus.CANCELLED) {
            log.warn(
                    "Se ignoró una actualización de una orden ya cancelada: {}",
                    order.getOrderNumber()
            );
            return;
        }

        if ("processed".equalsIgnoreCase(remoteStatus)
                && "accredited".equalsIgnoreCase(remoteStatusDetail)) {

            BigDecimal paidAmount = decimal(
                    mpOrder.get("total_paid_amount")
            );

            if (paidAmount == null
                    || paidAmount.compareTo(order.getTotal()) != 0) {
                throw new BusinessException(
                        "El importe acreditado no coincide con el total de la compra."
                );
            }

            payment.setStatus(PaymentStatus.APPROVED);
            order.setStatus(OrderStatus.PAID);

            if (!order.isConfirmationEmailSent()) {
                try {
                    emailService.sendPurchaseConfirmation(order);
                    order.setConfirmationEmailSent(true);

                } catch (Exception exception) {
                    log.error(
                            "El pago fue aprobado, pero no se pudo enviar el email de la orden {}",
                            order.getOrderNumber(),
                            exception
                    );
                }
            }

            log.info(
                    "Orden {} PAGADA correctamente.",
                    order.getOrderNumber()
            );

            return;
        }

        if ("failed".equalsIgnoreCase(remoteStatus)) {

            cancelAndReleaseStock(
                    order,
                    payment,
                    PaymentStatus.REJECTED
            );

            return;
        }

        if ("canceled".equalsIgnoreCase(remoteStatus)
                || "cancelled".equalsIgnoreCase(remoteStatus)
                || "expired".equalsIgnoreCase(remoteStatus)) {

            cancelAndReleaseStock(
                    order,
                    payment,
                    PaymentStatus.CANCELLED
            );

            return;
        }

        log.info(
                "Orden {} continúa pendiente. Estado remoto: {}",
                order.getOrderNumber(),
                remoteStatus
        );
    }

    @Transactional
    public void retryUnsentPaymentFailureEmail(Long orderId) {
        Payment payment = paymentRepository.findByOrderIdForUpdate(orderId)
                .orElse(null);

        if (payment == null) return;

        Order order = payment.getOrder();
        if (order.getStatus() != OrderStatus.CANCELLED
                || order.isPaymentFailureEmailSent()) {
            return;
        }

        try {
            emailService.sendPaymentNotCompleted(
                    order,
                    payment.getStatus().name()
            );
            order.setPaymentFailureEmailSent(true);
        } catch (Exception exception) {
            log.error(
                    "No se pudo reenviar el email de pago no completado para la orden {}",
                    order.getOrderNumber(),
                    exception
            );
        }
    }

    private void cancelAndReleaseStock(
            Order order,
            Payment payment,
            PaymentStatus finalPaymentStatus
    ) {
        if (order.getStatus() != OrderStatus.PENDING) {
            return;
        }

        for (OrderItem item : order.getItems()) {

            Product product = productRepository
                    .findByIdForUpdate(item.getProductId())
                    .orElse(null);

            if (product != null) {
                product.setStock(
                        product.getStock() + item.getQuantity()
                );
            }
        }

        payment.setStatus(finalPaymentStatus);
        order.setStatus(OrderStatus.CANCELLED);

        cartService.restoreOrderItems(order);

        // El email se envía desde el proceso programado después del commit.
        // Así nunca avisamos una cancelación cuya transacción luego pudiera revertirse.

        log.info(
                "Orden {} cancelada. Stock liberado y carrito recuperado. Estado de pago: {}",
                order.getOrderNumber(),
                finalPaymentStatus
        );
    }

    private String value(Object value) {
        return value == null ? null : value.toString();
    }

    private BigDecimal decimal(Object value) {

        if (value == null) {
            return null;
        }

        try {
            return new BigDecimal(value.toString());

        } catch (NumberFormatException exception) {
            return null;
        }
    }
}
