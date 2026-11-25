package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.model.*;
import com.agustin771.e_commerse.exception.BusinessException;
import com.agustin771.e_commerse.repository.PaymentRepository;
import com.agustin771.e_commerse.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MercadoPagoWebhookServiceTest {

    @Mock private MercadoPagoService mercadoPagoService;
    @Mock private PaymentRepository paymentRepository;
    @Mock private ProductRepository productRepository;
    @Mock private EmailService emailService;
    @Mock private CartService cartService;

    @InjectMocks private MercadoPagoWebhookService webhookService;

    private Order order;
    private Payment payment;
    private Product product;

    @BeforeEach
    void setUp() {
        order = new Order();
        order.setId(10L);
        order.setOrderNumber("ORD-TEST-001");
        order.setStatus(OrderStatus.PENDING);
        order.setTotal(new BigDecimal("200.00"));

        OrderItem item = new OrderItem();
        item.setProductId(5L);
        item.setQuantity(2);
        item.setUnitPrice(new BigDecimal("100.00"));
        item.setSubtotal(new BigDecimal("200.00"));
        order.addItem(item);

        payment = new Payment();
        payment.setOrder(order);
        payment.setMercadoPagoOrderId("MP-ORDER-001");
        payment.setStatus(PaymentStatus.PENDING);

        product = new Product();
        product.setId(5L);
        product.setStock(8);
    }

    @Test
    void shouldMarkOrderAsPaidAndSendConfirmationOnlyOnce() {
        when(paymentRepository.findByMercadoPagoOrderIdForUpdate("MP-ORDER-001"))
                .thenReturn(Optional.of(payment));
        when(mercadoPagoService.getOrder("MP-ORDER-001"))
                .thenReturn(Map.of(
                        "external_reference", "ORD-TEST-001",
                        "status", "processed",
                        "status_detail", "accredited",
                        "total_amount", "200.00",
                        "total_paid_amount", "200.00"
                ));

        webhookService.processOrderNotification("MP-ORDER-001");
        webhookService.processOrderNotification("MP-ORDER-001");

        assertEquals(OrderStatus.PAID, order.getStatus());
        assertEquals(PaymentStatus.APPROVED, payment.getStatus());
        assertTrue(order.isConfirmationEmailSent());
        verify(emailService, times(1)).sendPurchaseConfirmation(order);
        verify(productRepository, never()).findByIdForUpdate(anyLong());
    }

    @Test
    void shouldReleaseStockOnlyOnceWhenCancellationWebhookIsRepeated() {
        when(paymentRepository.findByMercadoPagoOrderIdForUpdate("MP-ORDER-001"))
                .thenReturn(Optional.of(payment));
        when(mercadoPagoService.getOrder("MP-ORDER-001"))
                .thenReturn(Map.of(
                        "external_reference", "ORD-TEST-001",
                        "status", "canceled",
                        "status_detail", "expired",
                        "total_amount", "200.00"
                ));
        when(productRepository.findByIdForUpdate(5L))
                .thenReturn(Optional.of(product));

        webhookService.processOrderNotification("MP-ORDER-001");
        webhookService.processOrderNotification("MP-ORDER-001");

        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        assertEquals(PaymentStatus.CANCELLED, payment.getStatus());
        assertEquals(10, product.getStock(), "El stock debe liberarse una sola vez");
        verify(productRepository, times(1)).findByIdForUpdate(5L);
        verify(cartService, times(1)).restoreOrderItems(order);
    }

    @Test
    void shouldRejectNotificationWhenExternalReferenceDoesNotMatch() {
        when(paymentRepository.findByMercadoPagoOrderIdForUpdate("MP-ORDER-001"))
                .thenReturn(Optional.of(payment));
        when(mercadoPagoService.getOrder("MP-ORDER-001"))
                .thenReturn(Map.of(
                        "external_reference", "ORD-OTHER",
                        "status", "processed",
                        "status_detail", "accredited",
                        "total_amount", "200.00",
                        "total_paid_amount", "200.00"
                ));

        assertThrows(BusinessException.class,
                () -> webhookService.processOrderNotification("MP-ORDER-001"));

        assertEquals(OrderStatus.PENDING, order.getStatus());
        assertEquals(PaymentStatus.PENDING, payment.getStatus());
        verifyNoInteractions(emailService);
        verifyNoInteractions(productRepository);
    }

    @Test
    void shouldRejectNotificationWhenAmountDoesNotMatch() {
        when(paymentRepository.findByMercadoPagoOrderIdForUpdate("MP-ORDER-001"))
                .thenReturn(Optional.of(payment));
        when(mercadoPagoService.getOrder("MP-ORDER-001"))
                .thenReturn(Map.of(
                        "external_reference", "ORD-TEST-001",
                        "status", "processed",
                        "status_detail", "accredited",
                        "total_amount", "199.00",
                        "total_paid_amount", "199.00"
                ));

        assertThrows(BusinessException.class,
                () -> webhookService.processOrderNotification("MP-ORDER-001"));

        assertEquals(OrderStatus.PENDING, order.getStatus());
        verifyNoInteractions(emailService);
    }
}
