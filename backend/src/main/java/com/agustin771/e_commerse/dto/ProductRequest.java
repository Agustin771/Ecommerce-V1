package com.agustin771.e_commerse.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(

        @NotBlank(message = "El SKU es obligatorio")
        @Size(max = 50, message = "El SKU no puede superar los 50 caracteres")
        String sku,

        @NotBlank(message = "El nombre del producto es obligatorio")
        @Size(max = 120, message = "El nombre no puede superar los 120 caracteres")
        String name,

        @NotBlank(message = "La descripción es obligatoria")
        @Size(max = 2000, message = "La descripción no puede superar los 2000 caracteres")
        String description,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.01", message = "El precio debe ser mayor a cero")
        @Digits(integer = 10, fraction = 2,
                message = "El precio admite hasta 10 enteros y 2 decimales")
        BigDecimal price,

        @NotNull(message = "El stock es obligatorio")
        @PositiveOrZero(message = "El stock no puede ser negativo")
        Integer stock,

        @NotEmpty(message = "Debe ingresar al menos 3 imágenes")
        @Size(min = 3, message = "El producto debe tener al menos 3 imágenes")
        List<
                @NotBlank(message = "La URL de imagen no puede estar vacía")
                @Size(max = 1000, message = "La URL es demasiado larga")
                        String
                > images,

        @NotNull(message = "Debe seleccionar una categoría")
        @Positive(message = "La categoría no es válida")
        Long categoryId

) {}
