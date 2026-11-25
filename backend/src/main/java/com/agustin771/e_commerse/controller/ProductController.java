package com.agustin771.e_commerse.controller;

import com.agustin771.e_commerse.dto.ProductRequest;
import com.agustin771.e_commerse.dto.ProductResponse;
import com.agustin771.e_commerse.service.ProductService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getActiveProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {

        return ResponseEntity.ok(
                productService.findActiveProducts(
                        name,
                        categoryId,
                        page,
                        size
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProduct(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                productService.findActiveById(id)
        );
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {

        return ResponseEntity.ok(
                productService.findAllProducts()
        );
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<ProductResponse> getProductForAdmin(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                productService.findByIdForAdmin(id)
        );
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(
            @Valid @RequestBody ProductRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(productService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request
    ) {

        return ResponseEntity.ok(
                productService.update(id, request)
        );
    }

    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateProduct(
            @PathVariable Long id
    ) {

        productService.deactivate(id);

        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(
            @PathVariable Long id
    ) {

        productService.delete(id);

        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateProduct(
            @PathVariable Long id
    ) {

        productService.activate(id);

        return ResponseEntity.noContent().build();
    }
}
