package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.dto.ProductRequest;
import com.agustin771.e_commerse.dto.ProductResponse;
import com.agustin771.e_commerse.exception.BusinessException;
import com.agustin771.e_commerse.exception.ResourceNotFoundException;
import com.agustin771.e_commerse.model.Category;
import com.agustin771.e_commerse.model.Product;
import com.agustin771.e_commerse.repository.CategoryRepository;
import com.agustin771.e_commerse.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Transactional
    public ProductResponse create(ProductRequest request) {

        String sku = request.sku().trim();

        if (productRepository.existsBySkuIgnoreCase(sku)) {
            throw new BusinessException(
                    "Ya existe un producto con ese SKU."
            );
        }

        Category category = findActiveCategory(request.categoryId());

        Product product = new Product();

        applyRequest(product, request, category);

        product.setSku(sku);
        product.setActive(true);

        return toResponse(productRepository.save(product));
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> findActiveProducts(
            String name,
            Long categoryId,
            int page,
            int size
    ) {

        validatePagination(page, size);

        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending()
        );

        String search = normalizeSearch(name);

        return productRepository.searchActiveProducts(
                        categoryId,
                        search,
                        pageable
                )
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> findAllProducts() {

        return productRepository.findAll(
                        Sort.by("createdAt").descending()
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductResponse findActiveById(Long id) {

        Product product = findProduct(id);

        if (!product.isActive()) {
            throw new ResourceNotFoundException(
                    "El producto solicitado no está disponible."
            );
        }

        return toResponse(product);
    }

    @Transactional
    public void delete(Long id) {

        Product product = findProduct(id);

        productRepository.delete(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse findByIdForAdmin(Long id) {

        return toResponse(findProduct(id));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {

        Product product = findProduct(id);

        String sku = request.sku().trim();

        productRepository.findBySkuIgnoreCase(sku)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessException(
                            "Ya existe otro producto con ese SKU."
                    );
                });

        Category category = findActiveCategory(request.categoryId());

        applyRequest(product, request, category);
        product.setSku(sku);

        return toResponse(product);
    }

    @Transactional
    public void deactivate(Long id) {

        Product product = findProduct(id);

        product.setActive(false);
        productRepository.save(product);
    }

    @Transactional
    public void activate(Long id) {

        Product product = findProduct(id);

        if (!product.getCategory().isActive()) {
            throw new BusinessException(
                    "No podés activar un producto cuya categoría está inactiva."
            );
        }

        product.setActive(true);
        productRepository.save(product);
    }

    private void applyRequest(
            Product product,
            ProductRequest request,
            Category category
    ) {

        product.setName(request.name().trim());
        product.setDescription(request.description().trim());
        product.setPrice(request.price());
        product.setStock(request.stock());

        product.setImages(
                request.images().stream()
                        .map(String::trim)
                        .toList()
        );

        product.setCategory(category);
    }

    private Category findActiveCategory(Long id) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No encontramos la categoría seleccionada."
                ));

        if (!category.isActive()) {
            throw new BusinessException(
                    "No podés asignar un producto a una categoría inactiva."
            );
        }

        return category;
    }

    private Product findProduct(Long id) {

        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No encontramos el producto solicitado."
                ));
    }

    private String normalizeSearch(String name) {

        if (name == null || name.isBlank()) {
            return null;
        }

        return name.trim();
    }

    private void validatePagination(int page, int size) {

        if (page < 0) {
            throw new IllegalArgumentException(
                    "El número de página no puede ser negativo."
            );
        }

        if (size < 1 || size > 100) {
            throw new IllegalArgumentException(
                    "El tamaño de página debe estar entre 1 y 100."
            );
        }
    }

    private ProductResponse toResponse(Product product) {

        return new ProductResponse(
                product.getId(),
                product.getSku(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                List.copyOf(product.getImages()),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.isActive(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}
