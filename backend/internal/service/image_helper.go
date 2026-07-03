package service

import (
	"encoding/base64"
	"fmt"
	"math/rand"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// saveBase64Image processes a base64 image string and saves it to the uploads folder.
// It returns the public URL/path of the saved image, or the original string if it's not base64.
func saveBase64Image(dataStr string, prefix string) (string, error) {
	if !strings.HasPrefix(dataStr, "data:image/") {
		return dataStr, nil
	}

	// Format: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
	parts := strings.SplitN(dataStr, ";base64,", 2)
	if len(parts) != 2 {
		return dataStr, nil
	}

	header := parts[0]
	base64Data := parts[1]

	// Extract extension
	ext := "png" // default
	if strings.Contains(header, "image/jpeg") || strings.Contains(header, "image/jpg") {
		ext = "jpg"
	} else if strings.Contains(header, "image/gif") {
		ext = "gif"
	} else if strings.Contains(header, "image/webp") {
		ext = "webp"
	} else if strings.Contains(header, "image/svg+xml") {
		ext = "svg"
	}

	// Decode base64
	decoded, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64: %w", err)
	}

	// Ensure uploads directory exists
	uploadDir := "./uploads"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Generate clean and professional filename
	filename := fmt.Sprintf("img_%s_%d_%d.%s", prefix, time.Now().Unix(), rand.Intn(1000), ext)
	filePath := filepath.Join(uploadDir, filename)

	// Write file
	if err := os.WriteFile(filePath, decoded, 0644); err != nil {
		return "", fmt.Errorf("failed to write file: %w", err)
	}

	// Return public URL path
	return fmt.Sprintf("/api/uploads/%s", filename), nil
}
