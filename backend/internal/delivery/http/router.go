package http

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func SetupRouter(app *fiber.App, handlers *Handlers) {
	// General Middlewares
	app.Use(logger.New())
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// API Endpoint Group
	api := app.Group("/api")

	// Health check
	api.Get("/health", handlers.HealthCheck)

	// Authentication
	api.Post("/auth/register", handlers.Register)
	api.Post("/auth/login", handlers.Login)

	protected := api.Group("", handlers.RequireAuth)
	protected.Get("/auth/me", handlers.Me)
	protected.Post("/auth/logout", handlers.Logout)
	protected.Get("/auth/users", RequireRoles("admin"), handlers.GetUsers)
	protected.Put("/auth/users/:id/approve", RequireRoles("admin"), handlers.ApproveUser)

	// AI Assistant
	protected.Post("/gemini/assistant", handlers.AiAssistant)

	// Sync / Proxy Endpoints
	protected.Post("/sion-proxy", handlers.LambdaProxy) // Standard legacy proxy
	protected.Post("/sync", handlers.Sync)              // Real local Postgres sync

	// Cities
	protected.Get("/cities", handlers.GetCities)
	protected.Post("/cities", RequireRoles("admin", "pekerja"), handlers.CreateCity)

	// Members
	protected.Get("/members", RequireRoles("admin", "pekerja"), handlers.GetMembers)
	protected.Post("/members", RequireRoles("admin", "pekerja"), handlers.CreateMember)
	protected.Put("/members/:id", RequireRoles("admin", "pekerja"), handlers.UpdateMember)
	protected.Delete("/members/:id", RequireRoles("admin"), handlers.DeleteMember)

	// Berita Acara
	protected.Get("/berita", RequireRoles("admin", "pekerja", "jemaat"), handlers.GetBerita)
	protected.Post("/berita", RequireRoles("admin", "pekerja"), handlers.CreateBerita)
	protected.Delete("/berita/:id", RequireRoles("admin"), handlers.DeleteBerita)

	// Jurnal PA
	protected.Get("/jurnal-pa", RequireRoles("admin", "pekerja", "jemaat"), handlers.GetJurnalPA)
	protected.Post("/jurnal-pa", RequireRoles("admin", "pekerja"), handlers.CreateJurnalPA)
	protected.Delete("/jurnal-pa/:id", RequireRoles("admin"), handlers.DeleteJurnalPA)

	// Donations
	protected.Get("/campaigns", handlers.GetCampaigns)
	protected.Post("/campaigns", RequireRoles("admin", "pekerja"), handlers.CreateCampaign)
	protected.Get("/donations", RequireRoles("admin", "pekerja", "jemaat"), handlers.GetDonationRecords)
	protected.Post("/donations", RequireRoles("admin", "pekerja"), handlers.CreateDonationRecord)

	// Links
	protected.Get("/links", handlers.GetLinks)
	protected.Post("/links", RequireRoles("admin", "pekerja"), handlers.CreateLink)
	protected.Put("/links/:id", RequireRoles("admin", "pekerja"), handlers.UpdateLink)
	protected.Delete("/links/:id", RequireRoles("admin"), handlers.DeleteLink)

	// Jobs
	protected.Get("/jobs", handlers.GetJobs)
	protected.Post("/jobs", RequireRoles("admin", "pekerja"), handlers.CreateJob)
	protected.Get("/applications", RequireRoles("admin", "pekerja"), handlers.GetJobApplications)
	protected.Post("/applications", handlers.CreateJobApplication)

	// Modules
	protected.Get("/modules", handlers.GetModules)
	protected.Put("/modules/:id", handlers.UpdateModule)
}
