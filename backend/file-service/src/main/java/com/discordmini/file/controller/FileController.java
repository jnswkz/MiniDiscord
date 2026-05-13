package com.discordmini.file.controller;

import com.discordmini.common.dto.ApiResponse;
import com.discordmini.file.model.dto.FileResponse;
import com.discordmini.file.service.StorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final StorageService storageService;

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileResponse>> uploadFile(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam("file") MultipartFile file) {
        
        FileResponse response = storageService.uploadFile(userId, file);
        return ResponseEntity.ok(ApiResponse.ok("File uploaded successfully", response));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam("key") String fileKey) {
            
        storageService.deleteFile(userId, fileKey);
        return ResponseEntity.ok(ApiResponse.ok("File deleted successfully", null));
    }
}
