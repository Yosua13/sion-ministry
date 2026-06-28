package http

import (
	"log"

	"backend/internal/models"
	"backend/internal/service"

	"github.com/gofiber/fiber/v2"
	"github.com/valyala/fasthttp"
)

type Handlers struct {
	services *service.Service
}

func NewHandlers(services *service.Service) *Handlers {
	return &Handlers{services: services}
}

// Health Check
func (h *Handlers) HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "ok",
		"time":   c.Context().ConnTime().String(),
	})
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
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(j)
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

// original lambda proxy handler (in case the frontend calls it)
func (h *Handlers) LambdaProxy(c *fiber.Ctx) error {
	lambdaURL := "https://uzepc6y2d76yrnmctvuc7j7mqe0xvbii.lambda-url.ap-southeast-3.on.aws/"
	
	// Create client request
	req := fasthttp.AcquireRequest()
	defer fasthttp.ReleaseRequest(req)
	
	resp := fasthttp.AcquireResponse()
	defer fasthttp.ReleaseResponse(resp)

	req.SetRequestURI(lambdaURL)
	req.Header.SetMethod(c.Method())
	req.Header.SetContentType("application/json")
	req.SetBody(c.Body())

	client := &fasthttp.Client{}
	if err := client.Do(req, resp); err != nil {
		log.Printf("Lambda proxy request failed, falling back to local: %v", err)
		return c.Status(fiber.StatusBadGateway).JSON(fiber.Map{
			"error":             "Gateway Timeout / Unreachable",
			"message":           err.Error(),
			"fallbackToOffline": true,
		})
	}

	c.Status(resp.StatusCode())
	return c.Send(resp.Body())
}
