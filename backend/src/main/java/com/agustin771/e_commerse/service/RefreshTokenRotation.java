package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.model.User;

public record RefreshTokenRotation(
        String rawToken,
        User user
) {}
