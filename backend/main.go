package main

import (
	"context"
	"fmt"
	"log"

	"backend/config"
	"backend/internal/database"
	delivery "backend/internal/delivery/http"
	"backend/internal/monitoring"
	"backend/internal/objectstore"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

func main() {
	log.Println("Starting Sion Academy Backend...")

	// 1. Load config
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Invalid configuration: %v", err)
	}
	flushMonitoring, err := monitoring.Init(cfg.SentryDSN, cfg.AppEnv)
	if err != nil {
		log.Fatalf("Error monitoring initialization failed: %v", err)
	}
	defer flushMonitoring()

	// 2. Initialize PostgreSQL Database
	db, err := database.InitDatabase(cfg)
	if err != nil {
		log.Fatalf("Database initialization failed: %v", err)
	}

	// 3. Initialize Repositories
	cityRepo := repository.NewCityRepository(db)
	authRepo := repository.NewAuthRepository(db)
	memberRepo := repository.NewMemberRepository(db)
	beritaRepo := repository.NewBeritaRepository(db)
	jurnalRepo := repository.NewJurnalRepository(db)
	donationRepo := repository.NewDonationRepository(db)
	linkRepo := repository.NewLinkRepository(db)
	jobRepo := repository.NewJobRepository(db)
	moduleRepo := repository.NewModuleRepository(db)

	// 4. Initialize Services
	authService := service.NewAuthService(authRepo, cfg.SessionTTL)
	accessService := service.NewAccessService(db)
	if err := authService.EnsureBootstrapAdmin(cfg.BootstrapAdminEmail, cfg.BootstrapAdminPassword); err != nil {
		log.Fatalf("Administrator bootstrap failed: %v", err)
	}
	storage, err := objectstore.NewPresigner(context.Background(), cfg)
	if err != nil {
		log.Fatalf("Object storage initialization failed: %v", err)
	}
	cityService := service.NewCityService(cityRepo)
	memberService := service.NewMemberService(memberRepo, cityRepo)
	beritaService := service.NewBeritaService(beritaRepo, cityRepo)
	jurnalService := service.NewJurnalService(jurnalRepo, cityRepo)
	donationService := service.NewDonationService(donationRepo)
	linkService := service.NewLinkService(linkRepo)
	jobService := service.NewJobService(jobRepo)
	moduleService := service.NewModuleService(moduleRepo)
	aiService := service.NewAIService(cfg)
	syncService := service.NewSyncService(db, cityRepo, memberRepo, beritaRepo, jurnalRepo, linkRepo)

	services := &service.Service{
		Auth:     authService,
		City:     cityService,
		Member:   memberService,
		Berita:   beritaService,
		Jurnal:   jurnalService,
		Donation: donationService,
		Link:     linkService,
		Job:      jobService,
		Module:   moduleService,
		AI:       aiService,
		Sync:     syncService,
		Access:   accessService,
	}

	// 5. Initialize Handlers
	handlers := delivery.NewHandlers(services, storage)

	// 6. Setup Fiber Application
	app := fiber.New(fiber.Config{
		AppName:      "Sion Academy API Server",
		ErrorHandler: delivery.ErrorHandler,
	})

	// Setup routes
	delivery.SetupRouter(app, handlers, cfg)

	// 7. Serve Frontend static assets in Production
	if cfg.AppEnv == "production" {
		log.Println("Running in PRODUCTION mode. Serving static assets...")
		app.Static("/", "../frontend/dist")
		app.Get("/*", func(c *fiber.Ctx) error {
			return c.SendFile("../frontend/dist/index.html")
		})
	} else {
		log.Println("Running in DEVELOPMENT mode.")
	}

	// 8. Start Listener
	addr := fmt.Sprintf("0.0.0.0:%s", cfg.AppPort)
	log.Printf("Server listening on http://localhost:%s", cfg.AppPort)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
