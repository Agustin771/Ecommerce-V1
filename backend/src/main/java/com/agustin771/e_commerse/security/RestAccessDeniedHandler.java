package com.agustin771.e_commerse.security;


import com.agustin771.e_commerse.exception.ErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.databind.json.JsonMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final JsonMapper jsonMapper;

    private static final Logger log =
            LoggerFactory.getLogger(RestAccessDeniedHandler.class);

    public RestAccessDeniedHandler(JsonMapper jsonMapper) {
        this.jsonMapper = jsonMapper;
    }

    @Override
    public void handle(
            HttpServletRequest request,
            HttpServletResponse response,
            AccessDeniedException accessDeniedException
    ) throws IOException {

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        ErrorResponse error = new ErrorResponse(
                HttpStatus.FORBIDDEN.value(),
                "No tenés permisos para realizar esta operación.",
                LocalDateTime.now()
        );

        log.error(
                "403 DENEGADO | URI={} | METHOD={} | EXCEPTION={} | MESSAGE={}",
                request.getRequestURI(),
                request.getMethod(),
                accessDeniedException.getClass().getName(),
                accessDeniedException.getMessage(),
                accessDeniedException
        );

        jsonMapper.writeValue(response.getOutputStream(), error);
    }
}