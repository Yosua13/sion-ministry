package service

import (
	"errors"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const onePixelPNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL1NwAAAABJRU5ErkJggg=="

func TestSaveBase64ImageValidatesBeforeWriting(t *testing.T) {
	tempDir := t.TempDir()
	original, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	if err := os.Chdir(tempDir); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.Chdir(original) })

	if _, err := saveBase64Image("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=", "test"); !errors.Is(err, ErrInvalidUpload) {
		t.Fatalf("expected an invalid-upload error, got %v", err)
	}
	if _, err := os.Stat(filepath.Join(tempDir, "uploads")); !errors.Is(err, os.ErrNotExist) {
		t.Fatal("invalid upload must not create an upload directory or write a file")
	}

	path, err := saveBase64Image(onePixelPNG, "test")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(path, "/api/uploads/img_test_") {
		t.Fatalf("unexpected public path %q", path)
	}
	if _, err := os.Stat(filepath.Join(tempDir, "uploads", filepath.Base(path))); err != nil {
		t.Fatalf("validated image was not stored: %v", err)
	}
}
