package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.dto.CheckoutResponse;
import com.agustin771.e_commerse.exception.BusinessException;
import com.agustin771.e_commerse.model.*;
import com.agustin771.e_commerse.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceCheckoutStockTest {

    @Mock private CartRepository cartRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProductRepository productRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private MercadoPagoService mercadoPagoService;
    @Mock private MercadoPagoWebhookService webhookService;

    @InjectMocks private OrderService orderService;

    private User user;
    private Product product;
    private Cart cart;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(10L);
        user.setEmail("buyer@test.com");
        user.setEnabled(true);

        product = new Product();
        product.setId(5L);
        product.setSku("AUR-01");
        product.setName("Auriculares");
        product.setPrice(new BigDecimal("100.00"));
        product.setStock(8);
        product.setActive(true);

        CartItem cartItem = new CartItem();
        cartItem.setProduct(product);
        cartItem.setQuantity(2);

        cart = new Cart();
        cart.setUser(user);
        cart.setItems(new ArrayList<>());
        cart.addItem(cartItem);
    }

    @Test
    void createCheckout_shouldReserveStockAndClearCart() {
        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUserIdWithItems(10L)).thenReturn(Optional.of(cart));
        when(productRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(product));
        when(mercadoPagoService.createOrder(anyString(), anyString(), eq("buyer@test.com"),
                any(BigDecimal.class), anyList()))
                .thenReturn(new MercadoPagoService.MercadoPagoOrder("MP-1", "https://mp.test/checkout"));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(99L);
            return o;
        });

        CheckoutResponse response = orderService.createCheckout(10L);

        assertEquals(6, product.getStock()); // 8 - 2
        assertTrue(cart.getItems().isEmpty());
        assertEquals("PENDING", response.status());
        assertEquals("https://mp.test/checkout", response.checkoutUrl());
        assertNotNull(response.orderNumber());

        ArgumentCaptor<Payment> paymentCaptor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(paymentCaptor.capture());
        assertEquals(PaymentStatus.PENDING, paymentCaptor.getValue().getStatus());
        assertEquals("MP-1", paymentCaptor.getValue().getMercadoPagoOrderId());
    }

    @Test
    void createCheckout_shouldFail_whenStockIsInsufficient() {
        cart.getItems().get(0).setQuantity(20); // más que el stock (8)

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUserIdWithItems(10L)).thenReturn(Optional.of(cart));
        when(productRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(product));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> orderService.createCheckout(10L));

        assertTrue(ex.getMessage().contains("stock"));
        assertEquals(8, product.getStock()); // no se descontó
        verifyNoInteractions(mercadoPagoService);
        verify(orderRepository, never()).save(any());
    }

    @Test
    void createCheckout_shouldFail_whenCartIsEmpty() {
        cart.getItems().clear();

        when(userRepository.findById(10L)).thenReturn(Optional.of(user));
        when(cartRepository.findByUserIdWithItems(10L)).thenReturn(Optional.of(cart));

        assertThrows(BusinessException.class,
                () -> orderService.createCheckout(10L));

        verifyNoInteractions(mercadoPagoService);
        verify(productRepository, never()).findByIdForUpdate(anyLong());
    }
}