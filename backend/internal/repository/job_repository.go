package repository

import (
	"backend/internal/models"
	"gorm.io/gorm"
)

type JobRepository interface {
	GetAllJobs() ([]models.JobOpportunity, error)
	GetJobByID(id string) (*models.JobOpportunity, error)
	CreateJob(job *models.JobOpportunity) error
	UpdateJob(job *models.JobOpportunity) error
	GetAllApplications() ([]models.JobApplication, error)
	CreateApplication(app *models.JobApplication) error
}

type jobRepository struct {
	db *gorm.DB
}

func NewJobRepository(db *gorm.DB) JobRepository {
	return &jobRepository{db: db}
}

func (r *jobRepository) GetAllJobs() ([]models.JobOpportunity, error) {
	var jobs []models.JobOpportunity
	err := r.db.Find(&jobs).Error
	return jobs, err
}

func (r *jobRepository) GetJobByID(id string) (*models.JobOpportunity, error) {
	var job models.JobOpportunity
	err := r.db.First(&job, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &job, nil
}

func (r *jobRepository) CreateJob(job *models.JobOpportunity) error {
	return r.db.Create(job).Error
}

func (r *jobRepository) UpdateJob(job *models.JobOpportunity) error {
	return r.db.Save(job).Error
}

func (r *jobRepository) GetAllApplications() ([]models.JobApplication, error) {
	var apps []models.JobApplication
	err := r.db.Find(&apps).Error
	return apps, err
}

func (r *jobRepository) CreateApplication(app *models.JobApplication) error {
	// Execute inside a transaction to ensure atomic job applicants update
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Save application
		if err := tx.Create(app).Error; err != nil {
			return err
		}

		// Update Job stats
		var job models.JobOpportunity
		if err := tx.First(&job, "id = ?", app.JobID).Error; err == nil {
			job.ApplicantsCount += 1
			if err := tx.Save(&job).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
