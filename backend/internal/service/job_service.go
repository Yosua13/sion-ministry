package service

import (
	"backend/internal/models"
	"backend/internal/repository"
)

type jobService struct {
	repo repository.JobRepository
}

func NewJobService(repo repository.JobRepository) JobService {
	return &jobService{repo: repo}
}

func (s *jobService) GetAllJobs() ([]models.JobOpportunity, error) {
	return s.repo.GetAllJobs()
}

func (s *jobService) CreateJob(job *models.JobOpportunity) error {
	return s.repo.CreateJob(job)
}

func (s *jobService) GetAllApplications() ([]models.JobApplication, error) {
	return s.repo.GetAllApplications()
}

func (s *jobService) CreateApplication(app *models.JobApplication) error {
	return s.repo.CreateApplication(app)
}
