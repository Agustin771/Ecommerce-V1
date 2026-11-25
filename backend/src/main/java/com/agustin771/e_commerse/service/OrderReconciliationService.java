package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.model.OrderStatus;
import com.agustin771.e_commerse.model.PaymentStatus;
import com.agustin771.e_commerse.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderReconciliationService {

    private static final Logger log =
            LoggerFactory.getLogger(OrderReconciliationService.class);

    private final PaymentRepository paymentRepository;
    private final MercadoPagoWebhookService webhookService;

    @Value("${app.orders.reconciliation-age-minutes:35}")
    private long reconciliationAgeMinutes;

    @Scheduled(fixedDelayString =
            "${app.orders.failure-email-delay-ms:15000}")
    public void retryUnsentPaymentFailureEmails() {
        List<Long> orderIds =
                paymentRepository.findOrderIdsWithUnsentPaymentFailureEmail(
                        OrderStatus.CANCELLED,
                        List.of(PaymentStatus.CANCELLED, PaymentStatus.REJECTED)
                );

        for (Long orderId : orderIds) {
            try {
                webhookService.retryUnsentPaymentFailureEmail(orderId);
            } catch (Exception exception) {
                log.error("No se pudo reintentar el email de pago no completado para la orden {}",
                        orderId, exception);
            }
        }
    }

    @Scheduled(fixedDelayString =
            "${app.orders.reconciliation-delay-ms:120000}")
    public void reconcilePendingOrders() {

        LocalDateTime cutoff = LocalDateTime.now()
                .minusMinutes(reconciliationAgeMinutes);

        List<String> pendingOrders =
                paymentRepository.findPendingMercadoPagoOrders(
                        PaymentStatus.PENDING,
                        OrderStatus.PENDING,
                        cutoff
                );

        if (pendingOrders.isEmpty()) {
            return;
        }

        log.info(
                "Reconciliación de órdenes: {} pendientes para revisar.",
                pendingOrders.size()
        );

        for (String mercadoPagoOrderId : pendingOrders) {

            try {
                webhookService.processOrderNotification(
                        mercadoPagoOrderId
                );

            } catch (Exception exception) {

                log.error(
                        "No se pudo reconciliar la orden de Mercado Pago {}",
                        mercadoPagoOrderId,
                        exception
                );
            }
        }
    }
}
