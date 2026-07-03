package http

import (
	"backend/internal/models"

	"github.com/gofiber/fiber/v2"
)

func (h *Handlers) RequireAuth(c *fiber.Ctx) error {
	token := getBearerToken(c)
	if token == "" {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "authorization token wajib dikirim"})
	}

	user, err := h.services.Auth.GetUserByToken(token)
	if err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": err.Error()})
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
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "session tidak ditemukan"})
		}
		if !allowed[user.Role] {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "role akun tidak memiliki akses"})
		}
		return c.Next()
	}
}
