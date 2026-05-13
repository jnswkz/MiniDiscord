package com.discordmini.file.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileResponse {
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private String fileKey;
}
