package com.agustin771.e_commerse.dto;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        boolean active
) {}
