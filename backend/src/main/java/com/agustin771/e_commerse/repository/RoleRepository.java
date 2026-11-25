package com.agustin771.e_commerse.repository;


import com.agustin771.e_commerse.model.ERole;
import com.agustin771.e_commerse.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Integer> {
    Optional<Role> findByNameRole(ERole nameRole);
}
