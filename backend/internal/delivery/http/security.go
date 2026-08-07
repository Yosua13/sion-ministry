package http

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"strings"

	"backend/internal/monitoring"

	"github.com/gofiber/fiber/v2"
)

type APIError struct {
	Code      string `json:"code"`
	Message   string `json:"message"`
	RequestID string `json:"requestId"`
}

func RequestID() fiber.Handler {
	return func(c *fiber.Ctx) error {
		requestID := c.Get("X-Request-ID")
		if requestID == "" || len(requestID) > 128 {
			bytes := make([]byte, 16)
			if _, err := rand.Read(bytes); err == nil {
				requestID = hex.EncodeToString(bytes)
			} else {
				requestID = "unavailable"
			}
		}
		c.Locals("request_id", requestID)
		c.Set("X-Request-ID", requestID)
		return c.Next()
	}
}

func SecurityHeaders(production bool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "DENY")
		c.Set("Referrer-Policy", "no-referrer")
		c.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		if strings.HasPrefix(c.Path(), "/api") {
			c.Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
		} else {
			c.Set("Content-Security-Policy", "default-src 'self'; connect-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'")
		}
		if production {
			c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		return c.Next()
	}
}

func ErrorHandler(c *fiber.Ctx, err error) error {
	monitoring.CaptureError(err, requestID(c), c.Path())
	status := fiber.StatusInternalServerError
	code := "internal_error"
	message := "Terjadi kesalahan pada server."
	if fiberError, ok := err.(*fiber.Error); ok {
		status = fiberError.Code
		message = fiberError.Message
		code = "request_error"
	}
	return c.Status(status).JSON(fiber.Map{"error": APIError{Code: code, Message: message, RequestID: requestID(c)}})
}

// NormalizeErrorResponses keeps legacy handlers from leaking raw database errors or
// returning a different error schema than newer handlers.
func NormalizeErrorResponses() fiber.Handler {
	return func(c *fiber.Ctx) error {
		if err := c.Next(); err != nil {
			return err
		}
		status := c.Response().StatusCode()
		if status < fiber.StatusBadRequest || len(c.Response().Body()) == 0 {
			return nil
		}
		var response struct {
			Error any `json:"error"`
		}
		if err := json.Unmarshal(c.Response().Body(), &response); err != nil {
			return nil
		}
		message, isLegacyError := response.Error.(string)
		if !isLegacyError {
			return nil
		}
		code := "request_error"
		if status >= fiber.StatusInternalServerError {
			code = "internal_error"
			message = "Terjadi kesalahan pada server."
		}
		return WriteAPIError(c, status, code, message)
	}
}

func RateLimitError(c *fiber.Ctx) error {
	return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{"error": APIError{Code: "rate_limited", Message: "Terlalu banyak permintaan. Silakan coba lagi nanti.", RequestID: requestID(c)}})
}

func WriteAPIError(c *fiber.Ctx, status int, code string, message string) error {
	if status >= fiber.StatusInternalServerError {
		monitoring.CaptureError(errors.New(message), requestID(c), c.Path())
	}
	return c.Status(status).JSON(fiber.Map{"error": APIError{Code: code, Message: message, RequestID: requestID(c)}})
}

func requestID(c *fiber.Ctx) string {
	value, _ := c.Locals("request_id").(string)
	return value
}

func (h *Handlers) ServeUpload(c *fiber.Ctx) error {
	filename := c.Params("filename")
	if filename == "" || filepath.Base(filename) != filename || strings.Contains(filename, "..") {
		return c.SendStatus(fiber.StatusNotFound)
	}
	uploadDir := strings.TrimSpace(os.Getenv("UPLOAD_DIR"))
	if uploadDir == "" {
		uploadDir = "uploads"
	}
	return c.SendFile(filepath.Join(uploadDir, filename))
}
