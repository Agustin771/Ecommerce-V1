package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.dto.CategoryRequest;
import com.agustin771.e_commerse.dto.CategoryResponse;
import com.agustin771.e_commerse.exception.BusinessException;
import com.agustin771.e_commerse.exception.ResourceNotFoundException;
import com.agustin771.e_commerse.model.Category;
import com.agustin771.e_commerse.repository.CategoryRepository;
import com.agustin771.e_commerse.repository.ProductRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional
    public CategoryResponse create(CategoryRequest request) {

        String name = request.name().trim();

        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException(
                    "Ya existe una categoría con ese nombre."
            );
        }

        Category category = new Category();
        category.setName(name);
        category.setDescription(request.description());
        category.setActive(true);

        return toResponse(categoryRepository.save(category));
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> findActiveCategories() {

        return categoryRepository.findAllByActiveTrueOrderByNameAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAllCategories() {

        return categoryRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(Long id) {

        return toResponse(findCategory(id));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {

        Category category = findCategory(id);
        String name = request.name().trim();

        categoryRepository.findByNameIgnoreCase(name)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessException(
                            "Ya existe otra categoría con ese nombre."
                    );
                });

        category.setName(name);
        category.setDescription(request.description());

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deactivate(Long id) {

        Category category = findCategory(id);

        long activeProducts =
                productRepository.countByCategoryIdAndActiveTrue(id);

        if (activeProducts > 0) {
            throw new BusinessException(
                    "No podés desactivar esta categoría porque tiene productos activos."
            );
        }

        category.setActive(false);
        categoryRepository.save(category);
    }

    @Transactional
    public void activate(Long id) {

        Category category = findCategory(id);
        category.setActive(true);

        categoryRepository.save(category);
    }

    private Category findCategory(Long id) {

        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No encontramos la categoría solicitada."
                ));
    }

    private CategoryResponse toResponse(Category category) {

        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.isActive()
        );
    }
}
