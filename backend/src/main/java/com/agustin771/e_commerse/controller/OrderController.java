package com.agustin771.e_commerse.controller;

import com.agustin771.e_commerse.dto.CheckoutResponse;
import com.agustin771.e_commerse.dto.OrderStatusResponse;
import com.agustin771.e_commerse.exception.ResourceNotFoundException;
import com.agustin771.e_commerse.security.services.UserDetailsImpl;
import com.agustin771.e_commerse.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;

import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public ResponseEntity<CheckoutResponse> createCheckout(
            @AuthenticationPrincipal UserDetailsImpl user
    ) {
        return ResponseEntity.ok(
                orderService.createCheckout(user.getId())
        );
    }

    @GetMapping("/pending")
    public ResponseEntity<List<OrderStatusResponse>> getPendingOrders(
            @AuthenticationPrincipal UserDetailsImpl user
    ) {
        return ResponseEntity.ok(
                orderService.getPendingOrders(user.getId())
        );
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<OrderStatusResponse> getOrderStatus(
            @PathVariable String orderNumber,
            @AuthenticationPrincipal UserDetailsImpl user
    ) {
        return ResponseEntity.ok(
                orderService.getOrderStatus(orderNumber, user.getId())
        );
    }

    @PostMapping("/{orderNumber}/retry")
    public ResponseEntity<CheckoutResponse> retryPayment(
            @PathVariable String orderNumber,
            @AuthenticationPrincipal UserDetailsImpl user
    ) {
        return ResponseEntity.ok(
                orderService.retryPayment(orderNumber, user.getId())
        );
    }

    @PostMapping("/{orderNumber}/cancel")
    public ResponseEntity<OrderStatusResponse> cancelOrder(
            @PathVariable String orderNumber,
            @AuthenticationPrincipal UserDetailsImpl user
    ) {
        return ResponseEntity.ok(
                orderService.cancelOrder(orderNumber, user.getId())
        );
    }
}
