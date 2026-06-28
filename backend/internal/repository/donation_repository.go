package repository

import (
	"backend/internal/models"
	"gorm.io/gorm"
)

type DonationRepository interface {
	GetAllCampaigns() ([]models.DonationCampaign, error)
	GetCampaignByID(id string) (*models.DonationCampaign, error)
	CreateCampaign(campaign *models.DonationCampaign) error
	UpdateCampaign(campaign *models.DonationCampaign) error
	GetAllRecords() ([]models.DonationRecord, error)
	CreateRecord(record *models.DonationRecord) error
}

type donationRepository struct {
	db *gorm.DB
}

func NewDonationRepository(db *gorm.DB) DonationRepository {
	return &donationRepository{db: db}
}

func (r *donationRepository) GetAllCampaigns() ([]models.DonationCampaign, error) {
	var campaigns []models.DonationCampaign
	err := r.db.Find(&campaigns).Error
	return campaigns, err
}

func (r *donationRepository) GetCampaignByID(id string) (*models.DonationCampaign, error) {
	var campaign models.DonationCampaign
	err := r.db.First(&campaign, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &campaign, nil
}

func (r *donationRepository) CreateCampaign(campaign *models.DonationCampaign) error {
	return r.db.Create(campaign).Error
}

func (r *donationRepository) UpdateCampaign(campaign *models.DonationCampaign) error {
	return r.db.Save(campaign).Error
}

func (r *donationRepository) GetAllRecords() ([]models.DonationRecord, error) {
	var records []models.DonationRecord
	err := r.db.Find(&records).Error
	return records, err
}

func (r *donationRepository) CreateRecord(record *models.DonationRecord) error {
	// Execute inside a transaction to ensure atomic campaign update
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Save donation record
		if err := tx.Create(record).Error; err != nil {
			return err
		}

		// Update Campaign stats
		var campaign models.DonationCampaign
		if err := tx.First(&campaign, "id = ?", record.CampaignID).Error; err == nil {
			campaign.CollectedAmount += record.Amount
			campaign.DonorsCount += 1
			if err := tx.Save(&campaign).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
