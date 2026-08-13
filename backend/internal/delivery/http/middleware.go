package http

import (
	"backend/internal/models"
	"strings"

	"github.com/gofiber/fiber/v2"
)

const csrfCookieName = "sion_csrf"

func CSRFProtection(allowedOrigins []string) fiber.Handler {
	allowed := map[string]bool{}
	for _, origin := range allowedOrigins {
		allowed[strings.TrimRight(origin, "/")] = true
	}
	return func(c *fiber.Ctx) error {
		if c.Method() == fiber.MethodGet || c.Method() == fiber.MethodHead || c.Method() == fiber.MethodOptions {
			return c.Next()
		}
		origin := strings.TrimRight(c.Get("Origin"), "/")
		if origin != "" && !allowed[origin] {
			return WriteAPIError(c, fiber.StatusForbidden, "csrf_forbidden", "Permintaan tidak dapat diverifikasi.")
		}
		// Login and activation do not have a session or CSRF cookie yet, but an
		// explicit browser Origin is still constrained to the allowlist above.
		if c.Path() == "/api/auth/login" || c.Path() == "/api/auth/activate" || c.Cookies(sessionCookieName()) == "" {
			return c.Next()
		}
		if origin == "" || c.Get("X-CSRF-Token") == "" || c.Get("X-CSRF-Token") != c.Cookies(csrfCookieName) {
			return WriteAPIError(c, fiber.StatusForbidden, "csrf_forbidden", "Permintaan tidak dapat diverifikasi.")
		}
		return c.Next()
	}
}

func (h *Handlers) RequireAuth(c *fiber.Ctx) error {
	token := getSessionToken(c)
	if token == "" {
		return WriteAPIError(c, fiber.StatusUnauthorized, "missing_session", "Sesi login wajib dikirim.")
	}

	user, err := h.services.Auth.GetUserByToken(token)
	if err != nil {
		return WriteAPIError(c, fiber.StatusUnauthorized, "invalid_session", "Sesi tidak valid atau sudah berakhir.")
	}
	c.Locals("user", user)
	return c.Next()
}

func RequireRoles(roles ...string) fiber.Handler {
	allowed := map[string]bool{}
	for _, role := range roles {
		allowed[role] = true
	}

	return func(c *fiber.Ctx) error {
		user, ok := c.Locals("user").(*models.User)
		if !ok || user == nil {
			return WriteAPIError(c, fiber.StatusUnauthorized, "missing_session", "Sesi tidak ditemukan.")
		}
		if !allowed[user.Role] {
			return WriteAPIError(c, fiber.StatusForbidden, "forbidden", "Role akun tidak memiliki akses.")
		}
		return c.Next()
	}
}

func (h *Handlers) RequirePermission(permission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		user, ok := c.Locals("user").(*models.User)
		if !ok || user == nil {
			return WriteAPIError(c, fiber.StatusUnauthorized, "missing_session", "Sesi tidak ditemukan.")
		}
		if h.services == nil || h.services.Access == nil {
			return WriteAPIError(c, fiber.StatusForbidden, "policy_unavailable", "Policy akses tidak tersedia.")
		}
		access, err := h.services.Access.Resolve(user)
		if err != nil || !h.services.Access.HasPermission(access, permission) {
			h.services.Access.RecordAudit(user.ID, "access.denied", "api", c.Path(), "", "", "denied", requestID(c), c.IP(), map[string]any{"permission": permission, "method": c.Method()})
			return WriteAPIError(c, fiber.StatusForbidden, "forbidden", "Role atau scope akun tidak memiliki izin untuk aksi ini.")
		}
		c.Locals("access", access)
		if permission == "journal.sensitive.read" || permission == "audit.read" || permission == "donation.verify" {
			h.services.Access.RecordAudit(user.ID, "access.allowed", "api", c.Path(), "", "", "success", requestID(c), c.IP(), map[string]any{"permission": permission, "method": c.Method()})
		}
		return c.Next()
	}
}
