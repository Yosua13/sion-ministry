package http

import (
	"context"
	"errors"
	"log"
	"strings"

	"backend/internal/models"
	"backend/internal/objectstore"
	"backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

type Handlers struct {
	services    *service.Service
	objectStore objectstore.Presigner
}

func NewHandlers(services *service.Service, objectStores ...objectstore.Presigner) *Handlers {
	var store objectstore.Presigner
	if len(objectStores) > 0 {
		store = objectStores[0]
	}
	return &Handlers{services: services, objectStore: store}
}

// Health Check
func (h *Handlers) HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "ok",
		"time":   c.Context().ConnTime().String(),
	})
}

func getBearerToken(c *fiber.Ctx) string {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
}

func (h *Handlers) Register(c *fiber.Ctx) error {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
		CityID   string `json:"cityId"`
		CityName string `json:"cityName"`
	}
	if err := c.BodyParser(&req); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_request", "Payload pendaftaran tidak valid.")
	}
	user, err := h.services.Auth.Register(req.Name, req.Email, req.Password, req.Role, req.CityID, req.CityName)
	if err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "registration_failed", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(user)
}

func (h *Handlers) Login(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_request", "Payload login tidak valid.")
	}
	session, err := h.services.Auth.Login(req.Email, req.Password)
	if err != nil {
		return WriteAPIError(c, fiber.StatusUnauthorized, "invalid_credentials", err.Error())
	}
	return c.JSON(session)
}

func (h *Handlers) Me(c *fiber.Ctx) error {
	token := getBearerToken(c)
	user, err := h.services.Auth.GetUserByToken(token)
	if err != nil {
		return WriteAPIError(c, fiber.StatusUnauthorized, "invalid_session", "Sesi tidak valid atau sudah berakhir.")
	}
	return c.JSON(user)
}

func (h *Handlers) Logout(c *fiber.Ctx) error {
	token := getBearerToken(c)
	if token != "" {
		_ = h.services.Auth.Logout(token)
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *Handlers) LogoutAll(c *fiber.Ctx) error {
	user, ok := c.Locals("user").(*models.User)
	if !ok || user == nil {
		return WriteAPIError(c, fiber.StatusUnauthorized, "missing_session", "Sesi tidak ditemukan.")
	}
	if err := h.services.Auth.LogoutAll(user.ID); err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "session_revocation_failed", "Gagal mencabut sesi.")
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *Handlers) PresignUpload(c *fiber.Ctx) error {
	if h.objectStore == nil {
		return WriteAPIError(c, fiber.StatusServiceUnavailable, "object_storage_unavailable", "Object storage belum dikonfigurasi.")
	}
	var input objectstore.PresignInput
	if err := c.BodyParser(&input); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_request", "Payload upload tidak valid.")
	}
	if _, err := objectstore.ValidateInput(input); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_upload", err.Error())
	}
	request, err := h.objectStore.PresignUpload(context.Background(), input)
	if err != nil {
		return WriteAPIError(c, fiber.StatusBadGateway, "object_storage_error", "Gagal membuat signed URL upload.")
	}
	return c.Status(fiber.StatusCreated).JSON(request)
}

func (h *Handlers) PresignDownload(c *fiber.Ctx) error {
	if h.objectStore == nil {
		return WriteAPIError(c, fiber.StatusServiceUnavailable, "object_storage_unavailable", "Object storage belum dikonfigurasi.")
	}
	request, err := h.objectStore.PresignDownload(context.Background(), c.Query("key"))
	if err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_object_key", "Object key tidak valid.")
	}
	return c.JSON(request)
}

func (h *Handlers) GetUsers(c *fiber.Ctx) error {
	users, err := h.services.Auth.GetUsers()
	if err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "users_lookup_failed", "Gagal mengambil daftar pengguna.")
	}
	return c.JSON(users)
}

func (h *Handlers) ApproveUser(c *fiber.Ctx) error {
	user, err := h.services.Auth.ApproveUser(c.Params("id"))
	if err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "user_approval_failed", "Gagal menyetujui pengguna.")
	}
	return c.JSON(user)
}

// Cities Handlers
func (h *Handlers) GetCities(c *fiber.Ctx) error {
	cities, err := h.services.City.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(cities)
}

func (h *Handlers) CreateCity(c *fiber.Ctx) error {
	var city models.City
	if err := c.BodyParser(&city); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.City.Create(&city); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(city)
}

// Members Handlers
func (h *Handlers) GetMembers(c *fiber.Ctx) error {
	members, err := h.services.Member.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(members)
}

func (h *Handlers) CreateMember(c *fiber.Ctx) error {
	var member models.Member
	if err := c.BodyParser(&member); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.Member.Create(&member); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(member)
}

func (h *Handlers) UpdateMember(c *fiber.Ctx) error {
	var member models.Member
	if err := c.BodyParser(&member); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	id := c.Params("id")
	member.ID = id
	if err := h.services.Member.Update(&member); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(member)
}

func (h *Handlers) DeleteMember(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.services.Member.Delete(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BeritaAcara Handlers
func (h *Handlers) GetBerita(c *fiber.Ctx) error {
	berita, err := h.services.Berita.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(berita)
}

func (h *Handlers) CreateBerita(c *fiber.Ctx) error {
	var b models.BeritaAcara
	if err := c.BodyParser(&b); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.Berita.Create(&b); err != nil {
		if isUploadValidationError(err) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": APIError{Code: "invalid_upload", Message: err.Error(), RequestID: requestID(c)}})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(b)
}

func (h *Handlers) DeleteBerita(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.services.Berita.Delete(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// JurnalPA Handlers
func (h *Handlers) GetJurnalPA(c *fiber.Ctx) error {
	jurnals, err := h.services.Jurnal.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(jurnals)
}

func (h *Handlers) CreateJurnalPA(c *fiber.Ctx) error {
	var j models.JurnalPA
	if err := c.BodyParser(&j); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.Jurnal.Create(&j); err != nil {
		if isUploadValidationError(err) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": APIError{Code: "invalid_upload", Message: err.Error(), RequestID: requestID(c)}})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(j)
}

func isUploadValidationError(err error) bool {
	return errors.Is(err, service.ErrInvalidUpload)
}

func (h *Handlers) DeleteJurnalPA(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.services.Jurnal.Delete(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Donations Handlers
func (h *Handlers) GetCampaigns(c *fiber.Ctx) error {
	campaigns, err := h.services.Donation.GetAllCampaigns()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(campaigns)
}

func (h *Handlers) CreateCampaign(c *fiber.Ctx) error {
	var campaign models.DonationCampaign
	if err := c.BodyParser(&campaign); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.Donation.CreateCampaign(&campaign); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(campaign)
}

func (h *Handlers) GetDonationRecords(c *fiber.Ctx) error {
	records, err := h.services.Donation.GetAllRecords()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(records)
}

func (h *Handlers) CreateDonationRecord(c *fiber.Ctx) error {
	var record models.DonationRecord
	if err := c.BodyParser(&record); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.Donation.CreateRecord(&record); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(record)
}

// Links Handlers
func (h *Handlers) GetLinks(c *fiber.Ctx) error {
	links, err := h.services.Link.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(links)
}

func (h *Handlers) CreateLink(c *fiber.Ctx) error {
	var link models.DiscipleshipLink
	if err := c.BodyParser(&link); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.Link.Create(&link); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(link)
}

func (h *Handlers) UpdateLink(c *fiber.Ctx) error {
	var link models.DiscipleshipLink
	if err := c.BodyParser(&link); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	id := c.Params("id")
	link.ID = id
	if err := h.services.Link.Update(&link); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(link)
}

func (h *Handlers) DeleteLink(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.services.Link.Delete(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Jobs Handlers
func (h *Handlers) GetJobs(c *fiber.Ctx) error {
	jobs, err := h.services.Job.GetAllJobs()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(jobs)
}

func (h *Handlers) CreateJob(c *fiber.Ctx) error {
	var job models.JobOpportunity
	if err := c.BodyParser(&job); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.Job.CreateJob(&job); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(job)
}

func (h *Handlers) GetJobApplications(c *fiber.Ctx) error {
	apps, err := h.services.Job.GetAllApplications()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(apps)
}

func (h *Handlers) CreateJobApplication(c *fiber.Ctx) error {
	var app models.JobApplication
	if err := c.BodyParser(&app); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.Job.CreateApplication(&app); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(app)
}

// Modules Handlers
func (h *Handlers) GetModules(c *fiber.Ctx) error {
	modules, err := h.services.Module.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(modules)
}

func (h *Handlers) UpdateModule(c *fiber.Ctx) error {
	var module models.DiscipleshipModule
	if err := c.BodyParser(&module); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	id := c.Params("id")
	module.ID = id
	if err := h.services.Module.Update(&module); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(module)
}

// AI Assistant Handler
func (h *Handlers) AiAssistant(c *fiber.Ctx) error {
	var req struct {
		Prompt            string `json:"prompt"`
		SystemInstruction string `json:"systemInstruction"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	response, err := h.services.AI.GetAssistantResponse(req.Prompt, req.SystemInstruction)
	if err != nil {
		log.Printf("Gemini API Error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"text": response})
}

// Sync/Proxy Handlers
func (h *Handlers) Sync(c *fiber.Ctx) error {
	var payload models.SyncPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	if err := h.services.Sync.Sync(&payload); err != nil {
		log.Printf("Sync Error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"success": true})
}
