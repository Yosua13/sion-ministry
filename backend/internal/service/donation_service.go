package service

import (
	"backend/internal/models"
	"backend/internal/repository"
	"time"
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
	newPath, err := saveBase64Image(campaign.BannerUrl, "campaign")
	if err == nil {
		campaign.BannerUrl = newPath
	}
	return s.repo.CreateCampaign(campaign)
}

func (s *donationService) GetAllRecords() ([]models.DonationRecord, error) {
	return s.repo.GetAllRecords()
}

func (s *donationService) GetRecordByID(id string) (*models.DonationRecord, error) {
	return s.repo.GetRecordByID(id)
}

func (s *donationService) CreateRecord(record *models.DonationRecord) error {
	if record.Status == "" {
		record.Status = "pending"
	}
	return s.repo.CreateRecord(record)
}

func (s *donationService) VerifyRecord(id string, verifierID string) (*models.DonationRecord, error) {
	record, err := s.repo.GetRecordByID(id)
	if err != nil {
		return nil, err
	}
	record.Status = "verified"
	record.VerifiedBy = stringPointer(verifierID)
	record.VerifiedAt = time.Now().Format(time.RFC3339)
	if err := s.repo.UpdateRecord(record); err != nil {
		return nil, err
	}
	return record, nil
}
