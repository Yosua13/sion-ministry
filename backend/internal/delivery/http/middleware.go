package http

import (
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) RequireAuth(c *fiber.Ctx) error {
	token := getBearerToken(c)
	if token == "" {
		return WriteAPIError(c, fiber.StatusUnauthorized, "missing_token", "Authorization token wajib dikirim.")
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
