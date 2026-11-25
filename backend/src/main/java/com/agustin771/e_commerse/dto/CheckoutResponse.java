package com.agustin771.e_commerse.dto;

import java.math.BigDecimal;

public record CheckoutResponse(
        String orderNumber,
        String checkoutUrl,
        BigDecimal total,
        String status
) {}