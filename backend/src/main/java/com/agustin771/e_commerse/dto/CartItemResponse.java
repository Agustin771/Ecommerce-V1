package com.agustin771.e_commerse.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartItemResponse(
        Long productId,
        String name,
        String sku,
        BigDecimal price,
        Integer stock,
        Integer quantity,
        List<String> images,
        BigDecimal subtotal
) {}
