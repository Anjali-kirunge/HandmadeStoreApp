package com.handmade.store.service.impl;

import com.handmade.store.exception.BadRequestException;
import com.handmade.store.service.ImageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImageServiceImpl implements ImageService {

    @Value("${app.upload.dir:./uploads}")
    private String uploadPath;

    @Override
    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Please select an image to upload");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png")
                && !contentType.equals("image/webp") && !contentType.equals("image/gif"))) {
            throw new BadRequestException("Only JPEG, PNG, WebP, and GIF images are allowed");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("Image size must not exceed 5MB");
        }

        try {
            Path uploadDir = Paths.get(uploadPath).toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);

            String originalFilename = file.getOriginalFilename();
            String extension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String filename = UUID.randomUUID() + extension;

            Path targetPath = uploadDir.resolve(filename);
            file.transferTo(targetPath.toFile());

            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new BadRequestException("Failed to upload image: " + e.getMessage());
        }
    }
}
