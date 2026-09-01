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
		AllowHeaders:     "Origin, Content-Type, Accept, X-CSRF-Token, X-Device-Name",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
		MaxAge:           86400,
	}))
	app.Use(NormalizeErrorResponses())
	app.Use(CSRFProtection(cfg.AllowedOrigins))

	// API Endpoint Group
	api := app.Group("/api")

	// Health check
	api.Get("/health", handlers.HealthCheck)

	// Authentication
	authLimiter := limiter.New(limiter.Config{Max: 5, Expiration: 15 * time.Minute, LimitReached: RateLimitError})
	aiLimiter := limiter.New(limiter.Config{Max: 20, Expiration: time.Minute, LimitReached: RateLimitError})
	uploadLimiter := limiter.New(limiter.Config{Max: 10, Expiration: time.Minute, LimitReached: RateLimitError})
	registrationLimiter := limiter.New(limiter.Config{Max: 10, Expiration: 10 * time.Minute, LimitReached: RateLimitError})
	api.Post("/auth/login", authLimiter, handlers.Login)
	api.Post("/auth/activate", authLimiter, handlers.Activate)
	api.Post("/public/registrations", registrationLimiter, handlers.CreatePublicRegistration)
	api.Get("/integrations/google/callback", handlers.GoogleSheetsCallback)

	protected := api.Group("", handlers.RequireAuth)
	protected.Get("/auth/me", handlers.Me)
	protected.Post("/auth/logout", handlers.Logout)
	protected.Post("/auth/logout-all", handlers.LogoutAll)
	protected.Get("/auth/access", handlers.GetAccessContext)
	protected.Get("/auth/users", handlers.RequirePermission("user.manage"), handlers.GetUsers)
	protected.Post("/auth/users/:id/resend-invitation", handlers.RequirePermission("user.invite"), handlers.ResendInvitation)
	protected.Get("/auth/roles", handlers.RequirePermission("assignment.manage"), handlers.GetRoles)
	protected.Post("/auth/roles", handlers.RequirePermission("assignment.manage"), handlers.GrantRole)
	protected.Delete("/auth/roles/:id", handlers.RequirePermission("assignment.manage"), handlers.RevokeRole)
	protected.Post("/auth/mentorships", handlers.RequirePermission("assignment.manage"), handlers.AssignMentor)
	protected.Get("/auth/scopes", handlers.RequirePermission("assignment.manage"), handlers.GetScopeCatalog)
	protected.Get("/auth/audit-logs", handlers.RequirePermission("audit.read"), handlers.GetAuditLogs)
	protected.Get("/auth/sessions", handlers.GetSessions)
	protected.Delete("/auth/sessions/:id", handlers.RevokeSession)
	// Role assignments live in user_roles. RequirePermission resolves that source
	// of truth, while the legacy User.Role field is intentionally not persisted.
	protected.Get("/integrations/google/status", handlers.RequirePermission("assignment.manage"), handlers.GoogleSheetsStatus)
	protected.Get("/integrations/google/authorize", handlers.RequirePermission("assignment.manage"), handlers.GoogleSheetsAuthorize)

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
	protected.Get("/reference/provinces", handlers.RequirePermission("city.read"), handlers.GetProvinces)
	protected.Get("/reference/cities", handlers.RequirePermission("city.read"), handlers.GetCitiesByProvince)

	// Members
	protected.Get("/members", handlers.RequirePermission("member.read"), handlers.GetMembers)
	protected.Get("/members/export", handlers.RequirePermission("member.export"), handlers.ExportMembers)
	protected.Post("/members/duplicates", handlers.RequirePermission("member.write"), handlers.CheckMemberDuplicates)
	protected.Post("/members", handlers.RequirePermission("member.write"), handlers.CreateMember)
	protected.Get("/members/:id", handlers.RequirePermission("member.read"), handlers.GetMember)
	protected.Get("/members/:id/history", handlers.RequirePermission("member.history.read"), handlers.GetMemberHistory)
	protected.Put("/members/:id", handlers.RequirePermission("member.write"), handlers.UpdateMember)
	protected.Post("/members/:id/archive", handlers.RequirePermission("member.archive"), handlers.ArchiveMember)

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
