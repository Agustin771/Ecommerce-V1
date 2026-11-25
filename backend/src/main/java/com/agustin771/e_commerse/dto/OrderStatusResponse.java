package com.agustin771.e_commerse.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderStatusResponse(
        String orderNumber,
        String status,
        BigDecimal total,
        LocalDateTime createdAt,
        List<OrderLineResponse> items
) {
    public record OrderLineResponse(
            String productName,
            String sku,
            BigDecimal unitPrice,
            Integer quantity,
            BigDecimal subtotal
    ) {}
}
