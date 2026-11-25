package com.agustin771.e_commerse.repository;

import com.agustin771.e_commerse.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCase(String sku);

    long countByCategoryIdAndActiveTrue(Long categoryId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
            AND (:categoryId IS NULL OR p.category.id = :categoryId)
            AND (
                :name IS NULL
                OR LOWER(p.name) LIKE LOWER(CONCAT('%', :name, '%'))
            )
            """)
    Page<Product> searchActiveProducts(
            @Param("categoryId") Long categoryId,
            @Param("name") String name,
            Pageable pageable
    );
}
