package http

import (
	"net/http/httptest"
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
