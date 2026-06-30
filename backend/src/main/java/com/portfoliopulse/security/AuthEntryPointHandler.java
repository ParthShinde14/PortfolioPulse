package com.portfoliopulse.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfoliopulse.dto.ApiErrorDto;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Converts Spring Security's default HTML/blank 401 & 403 responses into the
 * same JSON {@link ApiErrorDto} shape used by {@code GlobalExceptionHandler},
 * so the frontend's error-handling stays consistent.
 */
@Component
@RequiredArgsConstructor
public class AuthEntryPointHandler implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                          AuthenticationException authException) throws IOException {
        writeError(request, response, HttpStatus.UNAUTHORIZED, "Unauthorized",
                "Authentication is required to access this resource.");
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                        AccessDeniedException accessDeniedException) throws IOException, ServletException {
        writeError(request, response, HttpStatus.FORBIDDEN, "Forbidden",
                "You do not have permission to access this resource.");
    }

    private void writeError(HttpServletRequest request, HttpServletResponse response,
                             HttpStatus status, String error, String message) throws IOException {
        ApiErrorDto body = ApiErrorDto.builder()
                .status(status.value())
                .error(error)
                .message(message)
                .path(request.getRequestURI())
                .timestamp(LocalDateTime.now())
                .build();

        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
