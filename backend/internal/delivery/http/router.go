package http

import (
	"backend/config"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"strings"
	"time"
)

func SetupRouter(app *fiber.App, handlers *Handlers, cfg *config.Config) {
	// General Middlewares
	app.Use(RequestID())
	app.Use(SecurityHeaders(cfg.AppEnv == "production"))
	app.Use(logger.New(logger.Config{Format: "{\"time\":\"${time}\",\"request_id\":\"${locals:request_id}\",\"method\":\"${method}\",\"path\":\"${path}\",\"status\":${status},\"latency\":\"${latency}\"}\n"}))
	app.Use(recover.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins:     strings.Join(cfg.AllowedOrigins, ","),
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: false,
		MaxAge:           86400,
	}))
	app.Use(NormalizeErrorResponses())

	// API Endpoint Group
	api := app.Group("/api")

	// Health check
	api.Get("/health", handlers.HealthCheck)

	// Authentication
	authLimiter := limiter.New(limiter.Config{Max: 5, Expiration: 15 * time.Minute, LimitReached: RateLimitError})
	aiLimiter := limiter.New(limiter.Config{Max: 20, Expiration: time.Minute, LimitReached: RateLimitError})
	uploadLimiter := limiter.New(limiter.Config{Max: 10, Expiration: time.Minute, LimitReached: RateLimitError})
	api.Post("/auth/register", authLimiter, handlers.Register)
	api.Post("/auth/login", authLimiter, handlers.Login)

	protected := api.Group("", handlers.RequireAuth)
	protected.Get("/auth/me", handlers.Me)
	protected.Post("/auth/logout", handlers.Logout)
	protected.Post("/auth/logout-all", handlers.LogoutAll)
	protected.Get("/auth/access", handlers.GetAccessContext)
	protected.Get("/auth/users", handlers.RequirePermission("user.manage"), handlers.GetUsers)
	protected.Put("/auth/users/:id/approve", handlers.RequirePermission("user.manage"), handlers.ApproveUser)
	protected.Get("/auth/role-assignments", handlers.RequirePermission("assignment.manage"), handlers.GetRoleAssignments)
	protected.Post("/auth/role-assignments", handlers.RequirePermission("assignment.manage"), handlers.CreateRoleAssignment)
	protected.Put("/auth/role-assignments/:id/approve", handlers.RequirePermission("assignment.manage"), handlers.ApproveRoleAssignment)
	protected.Delete("/auth/role-assignments/:id", handlers.RequirePermission("assignment.manage"), handlers.RevokeRoleAssignment)
	protected.Post("/auth/mentorships", handlers.RequirePermission("assignment.manage"), handlers.AssignMentor)
	protected.Get("/auth/scopes", handlers.RequirePermission("assignment.manage"), handlers.GetScopeCatalog)
	protected.Get("/auth/audit-logs", handlers.RequirePermission("audit.read"), handlers.GetAuditLogs)
	protected.Get("/auth/sessions", handlers.GetSessions)
	protected.Delete("/auth/sessions/:id", handlers.RevokeSession)

	// AI Assistant
	protected.Post("/gemini/assistant", handlers.RequirePermission("ai.use"), aiLimiter, handlers.AiAssistant)
	protected.Get("/uploads/:filename", handlers.RequirePermission("content.read"), handlers.ServeUpload)
	protected.Post("/uploads/presign", handlers.RequirePermission("upload.write"), uploadLimiter, handlers.PresignUpload)
	protected.Get("/uploads/signed", handlers.RequirePermission("upload.write"), handlers.PresignDownload)

	// Sync endpoint
	protected.Post("/sync", handlers.RequirePermission("sync.write"), handlers.Sync)

	// Cities
	protected.Get("/cities", handlers.RequirePermission("city.read"), handlers.GetCities)
	protected.Post("/cities", handlers.RequirePermission("city.manage"), handlers.CreateCity)

	// Members
	protected.Get("/members", handlers.RequirePermission("member.read"), handlers.GetMembers)
	protected.Post("/members", handlers.RequirePermission("member.write"), handlers.CreateMember)
	protected.Put("/members/:id", handlers.RequirePermission("member.write"), handlers.UpdateMember)
	protected.Delete("/members/:id", handlers.RequirePermission("member.delete"), handlers.DeleteMember)

	// Berita Acara
	protected.Get("/berita", handlers.RequirePermission("event.read"), handlers.GetBerita)
	protected.Post("/berita", handlers.RequirePermission("event.manage"), uploadLimiter, handlers.CreateBerita)
	protected.Delete("/berita/:id", handlers.RequirePermission("event.delete"), handlers.DeleteBerita)
	protected.Get("/attendance", handlers.RequirePermission("attendance.check_in"), handlers.GetAttendance)
	protected.Post("/attendance/check-in", handlers.RequirePermission("attendance.check_in"), handlers.CheckInAttendance)

	// Jurnal PA
	protected.Get("/jurnal-pa", handlers.RequirePermission("journal.sensitive.read"), handlers.GetJurnalPA)
	protected.Post("/jurnal-pa", handlers.RequirePermission("journal.write"), uploadLimiter, handlers.CreateJurnalPA)
	protected.Delete("/jurnal-pa/:id", handlers.RequirePermission("journal.delete"), handlers.DeleteJurnalPA)

	// Donations
	protected.Get("/campaigns", handlers.RequirePermission("donation.read"), handlers.GetCampaigns)
	protected.Post("/campaigns", handlers.RequirePermission("content.publish"), handlers.CreateCampaign)
	protected.Get("/donations", handlers.RequirePermission("donation.read"), handlers.GetDonationRecords)
	protected.Post("/donations", handlers.RequirePermission("donation.create"), handlers.CreateDonationRecord)
	protected.Put("/donations/:id/verify", handlers.RequirePermission("donation.verify"), handlers.VerifyDonationRecord)

	// Links
	protected.Get("/links", handlers.RequirePermission("content.read"), handlers.GetLinks)
	protected.Post("/links", handlers.RequirePermission("content.publish"), handlers.CreateLink)
	protected.Put("/links/:id", handlers.RequirePermission("content.publish"), handlers.UpdateLink)
	protected.Delete("/links/:id", handlers.RequirePermission("content.publish"), handlers.DeleteLink)

	// Jobs
	protected.Get("/jobs", handlers.RequirePermission("job.read"), handlers.GetJobs)
	protected.Post("/jobs", handlers.RequirePermission("content.publish"), handlers.CreateJob)
	protected.Get("/applications", handlers.RequirePermission("application.read"), handlers.GetJobApplications)
	protected.Post("/applications", handlers.RequirePermission("job.apply"), handlers.CreateJobApplication)

	// Modules
	protected.Get("/modules", handlers.RequirePermission("module.read"), handlers.GetModules)
	protected.Put("/modules/:id", handlers.RequirePermission("module.publish"), handlers.UpdateModule)
}
