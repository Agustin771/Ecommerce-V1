package com.agustin771.e_commerse.service;

import com.agustin771.e_commerse.dto.AuthTokens;
import com.agustin771.e_commerse.dto.LoginRequest;
import com.agustin771.e_commerse.exception.AccountNotVerifiedException;
import com.agustin771.e_commerse.exception.InvalidTokenException;
import com.agustin771.e_commerse.model.ERole;
import com.agustin771.e_commerse.model.Role;
import com.agustin771.e_commerse.model.User;
import com.agustin771.e_commerse.repository.RoleRepository;
import com.agustin771.e_commerse.repository.UserRepository;
import com.agustin771.e_commerse.security.jwt.JwtUtils;
import com.agustin771.e_commerse.security.services.UserDetailsImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtils jwtUtils;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private EmailService emailService;
    @Mock private RefreshTokenService refreshTokenService;

    @InjectMocks private AuthService authService;

    private User enabledUser;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        Role userRole = new Role();
        userRole.setNameRole(ERole.ROLE_USER);

        enabledUser = new User();
        enabledUser.setId(1L);
        enabledUser.setEmail("user@test.com");
        enabledUser.setName("Agus");
        enabledUser.setLastName("Perez");
        enabledUser.setPassword("hashed");
        enabledUser.setEnabled(true);
        enabledUser.setRoles(Set.of(userRole));

        loginRequest = new LoginRequest();
        loginRequest.setEmail("user@test.com");
        loginRequest.setPassword("password123");
    }

    @Test
    void login_shouldReturnAccessAndRefreshTokens_whenCredentialsAreValid() {
        UserDetailsImpl userDetails = UserDetailsImpl.build(enabledUser);
        Authentication authentication =
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

        when(userRepository.findByEmailIgnoreCase("user@test.com"))
                .thenReturn(Optional.of(enabledUser));
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(jwtUtils.generateJwtToken(userDetails)).thenReturn("access-jwt");
        when(refreshTokenService.createRefreshToken(enabledUser)).thenReturn("raw-refresh");

        AuthTokens tokens = authService.login(loginRequest);

        assertEquals("access-jwt", tokens.accessToken());
        assertEquals("raw-refresh", tokens.refreshToken());
        verify(refreshTokenService).createRefreshToken(enabledUser);
    }

    @Test
    void login_shouldFail_whenAccountIsNotVerified() {
        enabledUser.setEnabled(false);

        when(userRepository.findByEmailIgnoreCase("user@test.com"))
                .thenReturn(Optional.of(enabledUser));

        assertThrows(AccountNotVerifiedException.class,
                () -> authService.login(loginRequest));

        verifyNoInteractions(authenticationManager);
        verifyNoInteractions(refreshTokenService);
    }

    @Test
    void login_shouldFail_whenEmailDoesNotExist() {
        when(userRepository.findByEmailIgnoreCase("user@test.com"))
                .thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class,
                () -> authService.login(loginRequest));

        verifyNoInteractions(authenticationManager);
    }

    @Test
    void refreshToken_shouldReturnNewTokens_whenRefreshIsValid() {
        when(refreshTokenService.rotateRefreshToken("old-refresh"))
                .thenReturn(new RefreshTokenRotation("new-refresh", enabledUser));
        when(jwtUtils.generateJwtToken(any(UserDetailsImpl.class)))
                .thenReturn("new-access-jwt");

        AuthTokens tokens = authService.refreshToken("old-refresh");

        assertEquals("new-access-jwt", tokens.accessToken());
        assertEquals("new-refresh", tokens.refreshToken());
    }

    @Test
    void refreshToken_shouldFail_whenUserIsDisabled() {
        enabledUser.setEnabled(false);

        when(refreshTokenService.rotateRefreshToken("old-refresh"))
                .thenReturn(new RefreshTokenRotation("new-refresh", enabledUser));

        assertThrows(InvalidTokenException.class,
                () -> authService.refreshToken("old-refresh"));
    }

    @Test
    void refreshToken_shouldPropagateInvalidTokenException() {
        when(refreshTokenService.rotateRefreshToken("bad-token"))
                .thenThrow(new InvalidTokenException("Invalid refresh token"));

        assertThrows(InvalidTokenException.class,
                () -> authService.refreshToken("bad-token"));
    }
}