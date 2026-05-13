package com.discordmini.file.controller;

import com.discordmini.common.dto.ApiResponse;
import com.discordmini.file.exception.FileValidationException;
import com.discordmini.file.exception.GlobalExceptionHandler;
import com.discordmini.file.model.dto.FileResponse;
import com.discordmini.file.service.StorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class FileControllerTest {

    private MockMvc mockMvc;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private FileController fileController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(fileController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void uploadFile_Success_Returns200() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "data".getBytes());
        FileResponse mockResponse = FileResponse.builder()
                .fileUrl("http://localhost/bucket/test.png")
                .fileName("test.png")
                .fileSize(4L)
                .contentType("image/png")
                .build();

        when(storageService.uploadFile(eq("user1"), any())).thenReturn(mockResponse);

        mockMvc.perform(multipart("/api/files/upload")
                        .file(file)
                        .header("X-User-Id", "user1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.fileUrl").value("http://localhost/bucket/test.png"));
    }

    @Test
    void uploadFile_MissingUserIdHeader_Returns400() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "data".getBytes());

        mockMvc.perform(multipart("/api/files/upload")
                        .file(file))
                .andExpect(status().isBadRequest()); // Missing header standard spring response
    }

    @Test
    void uploadFile_ValidationFailed_Returns400() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.exe", "application/octet-stream", "data".getBytes());
        when(storageService.uploadFile(eq("user1"), any())).thenThrow(new FileValidationException("Executable files are not allowed"));

        mockMvc.perform(multipart("/api/files/upload")
                        .file(file)
                        .header("X-User-Id", "user1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Executable files are not allowed"));
    }

    @Test
    void deleteFile_Success_Returns200() throws Exception {
        doNothing().when(storageService).deleteFile("user1", "user1/test.png");

        mockMvc.perform(delete("/api/files")
                        .param("key", "user1/test.png")
                        .header("X-User-Id", "user1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
