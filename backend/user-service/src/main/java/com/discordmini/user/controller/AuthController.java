package com.discordmini.user.controller;

import com.discordmini.common.dto.ApiResponse;
import com.discordmini.user.model.dto.AuthResponse;
import com.discordmini.user.model.dto.LoginRequest;
import com.discordmini.user.model.dto.OAuthRequest;
import com.discordmini.user.model.dto.RegisterRequest;
import com.discordmini.user.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse result = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registration successful", result));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse result = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", result));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> googleLogin(
            @Valid @RequestBody OAuthRequest request) throws Exception {
        AuthResponse result = authService.loginWithGoogle(request);
        return ResponseEntity.ok(ApiResponse.ok("Google login successful", result));
    }
}
