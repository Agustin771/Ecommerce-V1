package com.agustin771.e_commerse.controller;

import com.agustin771.e_commerse.dto.CartItemRequest;
import com.agustin771.e_commerse.dto.CartQuantityRequest;
import com.agustin771.e_commerse.dto.CartResponse;
import com.agustin771.e_commerse.security.services.UserDetailsImpl;
import com.agustin771.e_commerse.service.CartService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @AuthenticationPrincipal UserDetailsImpl user
    ) {
        return ResponseEntity.ok(
                cartService.getCart(user.getId())
        );
    }

    @PostMapping("/items")
    public ResponseEntity<CartResponse> addItem(
            @AuthenticationPrincipal UserDetailsImpl user,
            @Valid @RequestBody CartItemRequest request
    ) {
        return ResponseEntity.ok(
                cartService.addItem(user.getId(), request)
        );
    }

    @PutMapping("/items/{productId}")
    public ResponseEntity<CartResponse> updateQuantity(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long productId,
            @Valid @RequestBody CartQuantityRequest request
    ) {
        return ResponseEntity.ok(
                cartService.updateQuantity(
                        user.getId(),
                        productId,
                        request.quantity()
                )
        );
    }

    @DeleteMapping("/items/{productId}")
    public ResponseEntity<CartResponse> removeItem(
            @AuthenticationPrincipal UserDetailsImpl user,
            @PathVariable Long productId
    ) {
        return ResponseEntity.ok(
                cartService.removeItem(user.getId(), productId)
        );
    }

    @DeleteMapping
    public ResponseEntity<Void> clearCart(
            @AuthenticationPrincipal UserDetailsImpl user
    ) {
        cartService.clearCart(user.getId());

        return ResponseEntity.noContent().build();
    }
}
