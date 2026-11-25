package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.dto.CartItemRequest;
import com.agustin771.e_commerse.dto.CartItemResponse;
import com.agustin771.e_commerse.dto.CartResponse;
import com.agustin771.e_commerse.exception.BusinessException;
import com.agustin771.e_commerse.exception.ResourceNotFoundException;
import com.agustin771.e_commerse.model.*;
import com.agustin771.e_commerse.repository.CartItemRepository;
import com.agustin771.e_commerse.repository.CartRepository;
import com.agustin771.e_commerse.repository.ProductRepository;
import com.agustin771.e_commerse.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public CartResponse getCart(Long userId) {

        return cartRepository.findByUserIdWithItems(userId)
                .map(this::toResponse)
                .orElseGet(this::emptyCart);
    }

    @Transactional
    public CartResponse addItem(
            Long userId,
            CartItemRequest request
    ) {

        Cart cart = getOrCreateCart(userId);

        Product product = findAvailableProduct(request.productId());

        CartItem item = cart.getItems()
                .stream()
                .filter(existing ->
                        existing.getProduct().getId()
                                .equals(product.getId())
                )
                .findFirst()
                .orElse(null);

        int currentQuantity =
                item == null ? 0 : item.getQuantity();

        int newQuantity = currentQuantity + request.quantity();

        validateStock(product, newQuantity);

        if (item == null) {
            item = new CartItem();
            item.setProduct(product);
            item.setQuantity(request.quantity());
            cart.addItem(item);
        } else {
            item.setQuantity(newQuantity);
        }

        cartRepository.save(cart);

        return toResponse(cart);
    }

    @Transactional
    public CartResponse updateQuantity(
            Long userId,
            Long productId,
            Integer quantity
    ) {

        if (quantity == null || quantity < 1) {
            throw new BusinessException(
                    "La cantidad debe ser como mínimo 1."
            );
        }

        Cart cart = findCart(userId);

        CartItem item = findCartItem(cart, productId);

        Product product = findAvailableProduct(productId);

        validateStock(product, quantity);

        item.setQuantity(quantity);

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeItem(
            Long userId,
            Long productId
    ) {

        Cart cart = findCart(userId);

        CartItem item = findCartItem(cart, productId);

        cart.removeItem(item);

        return toResponse(cartRepository.save(cart));
    }

    @Transactional
    public void clearCart(Long userId) {

        Cart cart = findCart(userId);

        cart.getItems().clear();

        cartRepository.save(cart);
    }

    @Transactional
    public void restoreOrderItems(Order order) {

        Cart cart = getOrCreateCart(order.getUser().getId());

        for (OrderItem orderItem : order.getItems()) {

            Product product = productRepository
                    .findById(orderItem.getProductId())
                    .orElse(null);

            if (product == null || !product.isActive()) {
                continue;
            }

            CartItem existingItem = cart.getItems()
                    .stream()
                    .filter(item -> item.getProduct().getId()
                            .equals(product.getId()))
                    .findFirst()
                    .orElse(null);

            if (existingItem == null) {

                CartItem newItem = new CartItem();
                newItem.setProduct(product);
                newItem.setQuantity(orderItem.getQuantity());

                cart.addItem(newItem);

            } else {

                existingItem.setQuantity(
                        existingItem.getQuantity()
                                + orderItem.getQuantity()
                );
            }
        }

        cartRepository.save(cart);
    }

    private Cart getOrCreateCart(Long userId) {

        return cartRepository.findByUserIdWithItems(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() ->
                                    new ResourceNotFoundException(
                                            "No encontramos el usuario."
                                    )
                            );

                    Cart cart = new Cart();
                    cart.setUser(user);

                    return cartRepository.save(cart);
                });
    }

    private Cart findCart(Long userId) {

        return cartRepository.findByUserIdWithItems(userId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "No encontramos tu carrito."
                        )
                );
    }

    private Product findAvailableProduct(Long productId) {

        Product product = productRepository.findById(productId)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "No encontramos el producto."
                        )
                );

        if (!product.isActive()) {
            throw new BusinessException(
                    "Este producto ya no está disponible."
            );
        }

        if (product.getStock() <= 0) {
            throw new BusinessException(
                    "Este producto no tiene stock disponible."
            );
        }

        return product;
    }

    private CartItem findCartItem(
            Cart cart,
            Long productId
    ) {

        return cart.getItems()
                .stream()
                .filter(item ->
                        item.getProduct().getId().equals(productId)
                )
                .findFirst()
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "El producto no está en tu carrito."
                        )
                );
    }

    private void validateStock(Product product, Integer quantity) {

        if (quantity > product.getStock()) {
            throw new BusinessException(
                    "No hay stock suficiente para "
                            + product.getName()
                            + ". Stock disponible: "
                            + product.getStock()
            );
        }
    }

    private CartResponse emptyCart() {

        return new CartResponse(
                List.of(),
                0,
                BigDecimal.ZERO
        );
    }

    private CartResponse toResponse(Cart cart) {

        List<CartItemResponse> items = cart.getItems()
                .stream()
                .map(item -> {

                    Product product = item.getProduct();

                    BigDecimal subtotal = product.getPrice()
                            .multiply(
                                    BigDecimal.valueOf(item.getQuantity())
                            );

                    return new CartItemResponse(
                            product.getId(),
                            product.getName(),
                            product.getSku(),
                            product.getPrice(),
                            product.getStock(),
                            item.getQuantity(),
                            List.copyOf(product.getImages()),
                            subtotal
                    );
                })
                .toList();

        int totalItems = items.stream()
                .mapToInt(CartItemResponse::quantity)
                .sum();

        BigDecimal total = items.stream()
                .map(CartItemResponse::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new CartResponse(
                items,
                totalItems,
                total
        );
    }
}
