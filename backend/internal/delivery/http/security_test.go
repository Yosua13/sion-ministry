package http

import (
	"encoding/json"
	"net/http/httptest"
	"os"
	"testing"

	"backend/config"
	"backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

func TestHealthUsesSecurityHeadersAndOriginAllowlist(t *testing.T) {
	app := fiber.New(fiber.Config{ErrorHandler: ErrorHandler})
	SetupRouter(app, NewHandlers(&service.Service{}), &config.Config{AppEnv: "production", AllowedOrigins: []string{"https://app.example.test"}})

	request := httptest.NewRequest("GET", "/api/health", nil)
	request.Header.Set("Origin", "https://app.example.test")
	response, err := app.Test(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.Header.Get("Access-Control-Allow-Origin") != "https://app.example.test" {
		t.Fatal("allowed origin was not returned")
	}
	if response.Header.Get("X-Content-Type-Options") != "nosniff" || response.Header.Get("Strict-Transport-Security") == "" {
		t.Fatal("expected production security headers")
	}
	if response.Header.Get("X-Request-ID") == "" {
		t.Fatal("request ID was not attached")
	}

	untrustedRequest := httptest.NewRequest("GET", "/api/health", nil)
	untrustedRequest.Header.Set("Origin", "https://untrusted.example.test")
	untrustedResponse, err := app.Test(untrustedRequest)
	if err != nil {
		t.Fatal(err)
	}
	defer untrustedResponse.Body.Close()
	if untrustedResponse.Header.Get("Access-Control-Allow-Origin") != "" {
		t.Fatal("origin outside the allowlist must not receive CORS access")
	}
}

func TestCSRFProtectionRequiresOriginAndDoubleSubmitTokenForSessionMutation(t *testing.T) {
	previousEnv, hadEnv := os.LookupEnv("APP_ENV")
	if err := os.Setenv("APP_ENV", "development"); err != nil {
		t.Fatal(err)
	}
	defer func() {
		if hadEnv {
			_ = os.Setenv("APP_ENV", previousEnv)
		} else {
			_ = os.Unsetenv("APP_ENV")
		}
	}()

	app := fiber.New(fiber.Config{ErrorHandler: ErrorHandler})
	app.Use(CSRFProtection([]string{"http://localhost:5173"}))
	app.Post("/api/protected-change", func(c *fiber.Ctx) error { return c.SendStatus(fiber.StatusNoContent) })

	request := httptest.NewRequest("POST", "/api/protected-change", nil)
	request.Header.Set("Origin", "http://localhost:5173")
	request.Header.Set("Cookie", "sion_session=opaque; sion_csrf=expected-token")
	response, err := app.Test(request)
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	if response.StatusCode != fiber.StatusForbidden {
		t.Fatalf("mutation without CSRF header status = %d, want %d", response.StatusCode, fiber.StatusForbidden)
	}

	trustedRequest := httptest.NewRequest("POST", "/api/protected-change", nil)
	trustedRequest.Header.Set("Origin", "http://localhost:5173")
	trustedRequest.Header.Set("Cookie", "sion_session=opaque; sion_csrf=expected-token")
	trustedRequest.Header.Set("X-CSRF-Token", "expected-token")
	trustedResponse, err := app.Test(trustedRequest)
	if err != nil {
		t.Fatal(err)
	}
	defer trustedResponse.Body.Close()
	if trustedResponse.StatusCode != fiber.StatusNoContent {
		t.Fatalf("trusted mutation status = %d, want %d", trustedResponse.StatusCode, fiber.StatusNoContent)
	}

	untrustedLogin := httptest.NewRequest("POST", "/api/auth/login", nil)
	untrustedLogin.Header.Set("Origin", "https://attacker.example")
	untrustedResponse, err := app.Test(untrustedLogin)
	if err != nil {
		t.Fatal(err)
	}
	defer untrustedResponse.Body.Close()
	if untrustedResponse.StatusCode != fiber.StatusForbidden {
		t.Fatalf("cross-origin login status = %d, want %d", untrustedResponse.StatusCode, fiber.StatusForbidden)
	}
}

func TestNormalizeErrorResponsesUsesStandardSchema(t *testing.T) {
	app := fiber.New(fiber.Config{ErrorHandler: ErrorHandler})
	app.Use(RequestID())
	app.Use(NormalizeErrorResponses())
	app.Get("/legacy-error", func(c *fiber.Ctx) error {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "database connection details"})
	})

	response, err := app.Test(httptest.NewRequest("GET", "/legacy-error", nil))
	if err != nil {
		t.Fatal(err)
	}
	defer response.Body.Close()
	var payload struct {
		Error APIError `json:"error"`
	}
	if err := json.NewDecoder(response.Body).Decode(&payload); err != nil {
		t.Fatal(err)
	}
	if payload.Error.Code != "internal_error" || payload.Error.Message != "Terjadi kesalahan pada server." || payload.Error.RequestID == "" {
		t.Fatalf("legacy error was not normalized: %#v", payload.Error)
	}
}
