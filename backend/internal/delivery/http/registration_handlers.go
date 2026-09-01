package http

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"html"
	"strings"

	"backend/internal/models"
	"backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) CreatePublicRegistration(c *fiber.Ctx) error {
	if h.services == nil || h.services.Registration == nil {
		return WriteAPIError(c, fiber.StatusServiceUnavailable, "registration_unavailable", "Pendaftaran belum siap. Silakan hubungi panitia.")
	}
	var input service.PublicRegistrationInput
	if err := c.BodyParser(&input); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_request", "Data pendaftaran tidak valid.")
	}
	if err := h.services.Registration.SubmitRegistration(c.UserContext(), input); err != nil {
		switch {
		case errors.Is(err, service.ErrGoogleSheetsUnavailable), errors.Is(err, service.ErrGoogleSheetsNotConnected):
			return WriteAPIError(c, fiber.StatusServiceUnavailable, "registration_unavailable", "Pendaftaran belum siap. Silakan hubungi panitia.")
		case strings.Contains(err.Error(), "harus berisi"), strings.Contains(err.Error(), "pendaftaran tidak dapat"):
			return WriteAPIError(c, fiber.StatusBadRequest, "invalid_registration", err.Error())
		default:
			return WriteAPIError(c, fiber.StatusBadGateway, "registration_delivery_failed", "Pendaftaran belum dapat dikirim. Silakan coba beberapa saat lagi.")
		}
	}
	return c.Status(fiber.StatusCreated).JSON(fiber.Map{"success": true})
}

func (h *Handlers) GoogleSheetsStatus(c *fiber.Ctx) error {
	configured, connected := h.services.Registration.Status()
	return c.JSON(fiber.Map{"configured": configured, "connected": connected})
}

func (h *Handlers) GoogleSheetsAuthorize(c *fiber.Ctx) error {
	stateBytes := make([]byte, 32)
	if _, err := rand.Read(stateBytes); err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "oauth_state_failed", "Gagal menyiapkan koneksi Google.")
	}
	state := hex.EncodeToString(stateBytes)
	url, err := h.services.Registration.AuthorizationURL(state)
	if err != nil {
		return WriteAPIError(c, fiber.StatusServiceUnavailable, "google_not_configured", "Konfigurasi Google Sheet belum lengkap.")
	}
	setGoogleOAuthStateCookie(c, state)
	return c.Redirect(url, fiber.StatusFound)
}

func (h *Handlers) GoogleSheetsCallback(c *fiber.Ctx) error {
	state := c.Query("state")
	if state == "" || state != c.Cookies(googleOAuthStateCookieName) {
		clearGoogleOAuthStateCookie(c)
		return googleConnectionResult(c, false, "Koneksi Google tidak dapat diverifikasi. Kembali ke aplikasi lalu coba hubungkan lagi.")
	}
	clearGoogleOAuthStateCookie(c)
	if reason := strings.TrimSpace(c.Query("error")); reason != "" {
		return googleConnectionResult(c, false, "Izin Google dibatalkan atau ditolak. Tidak ada perubahan yang dibuat.")
	}
	actorID := ""
	if user, _ := c.Locals("user").(*models.User); user != nil {
		actorID = user.ID
	}
	if err := h.services.Registration.CompleteAuthorization(c.UserContext(), c.Query("code"), actorID); err != nil {
		return googleConnectionResult(c, false, "Koneksi belum berhasil. Pastikan redirect URI dan izin Google sudah benar, lalu coba lagi.")
	}
	return googleConnectionResult(c, true, "Google Sheet berhasil dihubungkan. Form registrasi sekarang siap dipakai.")
}

func googleConnectionResult(c *fiber.Ctx, success bool, message string) error {
	color := "#b91c1c"
	if success {
		color = "#047857"
	}
	c.Type("html", "utf-8")
	return c.SendString("<!doctype html><html lang=\"id\"><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>Koneksi Google Sheet</title><main style=\"font-family:Inter,system-ui,sans-serif;max-width:560px;margin:12vh auto;padding:32px;color:#172033\"><section style=\"border:1px solid #e2e8f0;border-radius:24px;padding:32px;box-shadow:0 10px 24px #0f172a12\"><p style=\"font-weight:700;color:" + color + "\">SION MINISTRY</p><h1 style=\"font-size:24px\">Koneksi Google Sheet</h1><p style=\"line-height:1.6;color:#475569\">" + html.EscapeString(message) + "</p><a href=\"/users\" style=\"display:inline-block;margin-top:10px;background:" + color + ";color:white;padding:12px 18px;border-radius:12px;text-decoration:none;font-weight:700\">Kembali ke aplikasi</a></section></main></html>")
}
