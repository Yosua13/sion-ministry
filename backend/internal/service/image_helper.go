package service

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"os"
	"path/filepath"
	"strings"
)

const (
	maxUploadBytes    = 5 << 20
	maxImageDimension = 4096
)

var ErrInvalidUpload = errors.New("invalid image upload")

func invalidUpload(format string, args ...any) error {
	return fmt.Errorf("%w: "+format, append([]any{ErrInvalidUpload}, args...)...)
}

// saveBase64Image validates a base64 image completely before creating the upload directory
// or writing any file. Remote URLs are retained because legacy records already use them.
func saveBase64Image(dataStr string, prefix string) (string, error) {
	if !strings.HasPrefix(dataStr, "data:image/") {
		return dataStr, nil
	}

	parts := strings.SplitN(dataStr, ";base64,", 2)
	if len(parts) != 2 {
		return "", invalidUpload("format upload gambar tidak valid")
	}

	mimeType := strings.TrimPrefix(parts[0], "data:")
	extension, allowed := map[string]string{
		"image/jpeg": "jpg",
		"image/png":  "png",
	}[mimeType]
	if !allowed {
		return "", invalidUpload("format gambar tidak didukung; gunakan PNG atau JPEG")
	}

	decoded, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", invalidUpload("data gambar tidak valid")
	}
	if len(decoded) == 0 || len(decoded) > maxUploadBytes {
		return "", invalidUpload("ukuran gambar harus antara 1 byte dan %d MB", maxUploadBytes>>20)
	}

	config, format, err := image.DecodeConfig(bytes.NewReader(decoded))
	if err != nil {
		return "", invalidUpload("isi berkas bukan gambar valid")
	}
	if (mimeType == "image/jpeg" && format != "jpeg") || (mimeType == "image/png" && format != "png") {
		return "", invalidUpload("tipe MIME gambar tidak cocok dengan isi berkas")
	}
	if config.Width < 1 || config.Height < 1 || config.Width > maxImageDimension || config.Height > maxImageDimension {
		return "", invalidUpload("dimensi gambar harus maksimal %d x %d piksel", maxImageDimension, maxImageDimension)
	}

	uploadDir := strings.TrimSpace(os.Getenv("UPLOAD_DIR"))
	if uploadDir == "" {
		uploadDir = "./uploads"
	}
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("gagal menyiapkan penyimpanan upload")
	}

	checksum := sha256.Sum256(decoded)
	filename := fmt.Sprintf("img_%s_%x.%s", prefix, checksum[:16], extension)
	filePath := filepath.Join(uploadDir, filename)

	if err := os.WriteFile(filePath, decoded, 0644); err != nil {
		return "", fmt.Errorf("gagal menyimpan gambar")
	}

	return fmt.Sprintf("/api/uploads/%s", filename), nil
}
