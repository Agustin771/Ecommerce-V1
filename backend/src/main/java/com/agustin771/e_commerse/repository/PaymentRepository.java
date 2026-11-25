package com.agustin771.e_commerse.repository;

import com.agustin771.e_commerse.model.Payment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import com.agustin771.e_commerse.model.OrderStatus;
import com.agustin771.e_commerse.model.PaymentStatus;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByMercadoPagoOrderId(String mercadoPagoOrderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT p FROM Payment p
            JOIN FETCH p.order
            WHERE p.mercadoPagoOrderId = :orderId
            """)
    Optional<Payment> findByMercadoPagoOrderIdForUpdate(
            @Param("orderId") String orderId
    );

    @Query("""
        SELECT p.mercadoPagoOrderId
        FROM Payment p
        JOIN p.order o
        WHERE p.status = :paymentStatus
        AND o.status = :orderStatus
        AND o.createdAt <= :cutoff
        AND p.mercadoPagoOrderId IS NOT NULL
        """)
    List<String> findPendingMercadoPagoOrders(
            @Param("paymentStatus") PaymentStatus paymentStatus,
            @Param("orderStatus") OrderStatus orderStatus,
            @Param("cutoff") LocalDateTime cutoff
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT p FROM Payment p
        JOIN FETCH p.order
        WHERE p.order.id = :orderId
        """)
    Optional<Payment> findByOrderIdForUpdate(
            @Param("orderId") Long orderId
    );

    @Query("""
        SELECT p.order.id
        FROM Payment p
        JOIN p.order o
        WHERE o.status = :orderStatus
          AND o.paymentFailureEmailSent = false
          AND p.status IN :paymentStatuses
        """)
    List<Long> findOrderIdsWithUnsentPaymentFailureEmail(
            @Param("orderStatus") OrderStatus orderStatus,
            @Param("paymentStatuses") List<PaymentStatus> paymentStatuses
    );
}
