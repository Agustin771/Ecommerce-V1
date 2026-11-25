package com.agustin771.e_commerse.security;


import com.agustin771.e_commerse.exception.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.databind.json.JsonMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Component
public class RestAuthenticationEntryPoint
        implements AuthenticationEntryPoint {

    private final JsonMapper jsonMapper;

    private static final Logger log =
            LoggerFactory.getLogger(RestAuthenticationEntryPoint.class);

    public RestAuthenticationEntryPoint(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    ) throws IOException {

        log.error(
                "401 AUTHENTICATION | URI={} | METHOD={} | SERVLET_PATH={} | DISPATCHER={} | EXCEPTION={}",
                request.getRequestURI(),
                request.getMethod(),
                request.getServletPath(),
                request.getDispatcherType(),
                authException.getClass().getSimpleName()
        );

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        ErrorResponse error = new ErrorResponse(
                HttpStatus.UNAUTHORIZED.value(),
                "No estás autenticado o tu sesión no es válida.",
                LocalDateTime.now()
        );

        jsonMapper.writeValue(response.getOutputStream(), error);
    }
}