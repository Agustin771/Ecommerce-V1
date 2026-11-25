package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.dto.OrderStatusResponse;
import com.agustin771.e_commerse.model.*;
import com.agustin771.e_commerse.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServicePendingOrdersTest {

    @Mock private CartRepository cartRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProductRepository productRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private MercadoPagoService mercadoPagoService;
    @Mock private MercadoPagoWebhookService webhookService;

    @InjectMocks private OrderService orderService;

    @Test
    void shouldReturnOnlyPendingOrdersForRequestedUser() {
        Long authenticatedUserId = 42L;

        Order order = new Order();
        order.setOrderNumber("ORD-USER-42");
        order.setStatus(OrderStatus.PENDING);
        order.setTotal(new BigDecimal("150.00"));
        order.setCreatedAt(LocalDateTime.now());

        OrderItem item = new OrderItem();
        item.setProductName("Mouse");
        item.setSku("MOUSE-01");
        item.setUnitPrice(new BigDecimal("150.00"));
        item.setQuantity(1);
        item.setSubtotal(new BigDecimal("150.00"));
        order.addItem(item);

        when(orderRepository.findAllByUser_IdAndStatusOrderByCreatedAtDesc(
                authenticatedUserId, OrderStatus.PENDING
        )).thenReturn(List.of(order));

        List<OrderStatusResponse> result =
                orderService.getPendingOrders(authenticatedUserId);

        assertEquals(1, result.size());
        assertEquals("ORD-USER-42", result.get(0).orderNumber());
        assertEquals("PENDING", result.get(0).status());
        assertEquals("Mouse", result.get(0).items().get(0).productName());

        verify(orderRepository).findAllByUser_IdAndStatusOrderByCreatedAtDesc(
                authenticatedUserId, OrderStatus.PENDING
        );
        verifyNoMoreInteractions(orderRepository);
    }

    @Test
    void shouldReturnEmptyListWhenUserHasNoPendingOrders() {
        when(orderRepository.findAllByUser_IdAndStatusOrderByCreatedAtDesc(
                99L, OrderStatus.PENDING
        )).thenReturn(List.of());

        assertTrue(orderService.getPendingOrders(99L).isEmpty());
    }
}
