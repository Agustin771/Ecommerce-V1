package com.agustin771.e_commerse.repository;

import com.agustin771.e_commerse.model.Order;
import com.agustin771.e_commerse.model.OrderStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumberAndUserId(
            String orderNumber,
            Long userId
    );

    Optional<Order> findByOrderNumber(String orderNumber);

    @EntityGraph(attributePaths = "items")
    List<Order> findAllByUser_IdAndStatusOrderByCreatedAtDesc(
            Long userId,
            OrderStatus status
    );
}
