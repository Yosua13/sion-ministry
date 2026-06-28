package service

import (
	"backend/internal/models"
	"backend/internal/repository"
)

type donationService struct {
	repo repository.DonationRepository
}

func NewDonationService(repo repository.DonationRepository) DonationService {
	return &donationService{repo: repo}
}

func (s *donationService) GetAllCampaigns() ([]models.DonationCampaign, error) {
	return s.repo.GetAllCampaigns()
}

func (s *donationService) CreateCampaign(campaign *models.DonationCampaign) error {
	return s.repo.CreateCampaign(campaign)
}

func (s *donationService) GetAllRecords() ([]models.DonationRecord, error) {
	return s.repo.GetAllRecords()
}

func (s *donationService) CreateRecord(record *models.DonationRecord) error {
	return s.repo.CreateRecord(record)
}
