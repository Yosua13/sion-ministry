package service

import (
	"backend/internal/models"
)

type CityService interface {
	GetAll() ([]models.City, error)
	Create(city *models.City) error
	Recalculate() error
}

type MemberService interface {
	GetAll() ([]models.Member, error)
	Create(member *models.Member) error
	Update(member *models.Member) error
	Delete(id string) error
}

type BeritaService interface {
	GetAll() ([]models.BeritaAcara, error)
	Create(berita *models.BeritaAcara) error
	Delete(id string) error
}

type JurnalService interface {
	GetAll() ([]models.JurnalPA, error)
	Create(jurnal *models.JurnalPA) error
	Delete(id string) error
}

type DonationService interface {
	GetAllCampaigns() ([]models.DonationCampaign, error)
	CreateCampaign(campaign *models.DonationCampaign) error
	GetAllRecords() ([]models.DonationRecord, error)
	CreateRecord(record *models.DonationRecord) error
}

type LinkService interface {
	GetAll() ([]models.DiscipleshipLink, error)
	Create(link *models.DiscipleshipLink) error
	Update(link *models.DiscipleshipLink) error
	Delete(id string) error
}

type JobService interface {
	GetAllJobs() ([]models.JobOpportunity, error)
	CreateJob(job *models.JobOpportunity) error
	GetAllApplications() ([]models.JobApplication, error)
	CreateApplication(app *models.JobApplication) error
}

type ModuleService interface {
	GetAll() ([]models.DiscipleshipModule, error)
	Update(module *models.DiscipleshipModule) error
}

type AIService interface {
	GetAssistantResponse(prompt string, systemInstruction string) (string, error)
}

type SyncService interface {
	Sync(payload *models.SyncPayload) error
}
type Service struct {
	City       CityService
	Member     MemberService
	Berita     BeritaService
	Jurnal     JurnalService
	Donation   DonationService
	Link       LinkService
	Job        JobService
	Module     ModuleService
	AI         AIService
	Sync       SyncService
}
