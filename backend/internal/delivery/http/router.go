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

	// AI Assistant
	api.Post("/gemini/assistant", handlers.AiAssistant)

	// Sync / Proxy Endpoints
	api.Post("/sion-proxy", handlers.LambdaProxy) // Standard legacy proxy
	api.Post("/sync", handlers.Sync)             // Real local Postgres sync

	// Cities
	api.Get("/cities", handlers.GetCities)
	api.Post("/cities", handlers.CreateCity)

	// Members
	api.Get("/members", handlers.GetMembers)
	api.Post("/members", handlers.CreateMember)
	api.Put("/members/:id", handlers.UpdateMember)
	api.Delete("/members/:id", handlers.DeleteMember)

	// Berita Acara
	api.Get("/berita", handlers.GetBerita)
	api.Post("/berita", handlers.CreateBerita)
	api.Delete("/berita/:id", handlers.DeleteBerita)

	// Jurnal PA
	api.Get("/jurnal-pa", handlers.GetJurnalPA)
	api.Post("/jurnal-pa", handlers.CreateJurnalPA)
	api.Delete("/jurnal-pa/:id", handlers.DeleteJurnalPA)

	// Donations
	api.Get("/campaigns", handlers.GetCampaigns)
	api.Post("/campaigns", handlers.CreateCampaign)
	api.Get("/donations", handlers.GetDonationRecords)
	api.Post("/donations", handlers.CreateDonationRecord)

	// Links
	api.Get("/links", handlers.GetLinks)
	api.Post("/links", handlers.CreateLink)
	api.Put("/links/:id", handlers.UpdateLink)
	api.Delete("/links/:id", handlers.DeleteLink)

	// Jobs
	api.Get("/jobs", handlers.GetJobs)
	api.Post("/jobs", handlers.CreateJob)
	api.Get("/applications", handlers.GetJobApplications)
	api.Post("/applications", handlers.CreateJobApplication)

	// Modules
	api.Get("/modules", handlers.GetModules)
	api.Put("/modules/:id", handlers.UpdateModule)
}
