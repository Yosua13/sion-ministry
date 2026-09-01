package repository

import (
	"errors"

	"backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrGoogleSheetsCredentialNotFound = errors.New("Google Sheets belum dihubungkan")

type GoogleSheetsRepository interface {
	GetCredential() (*models.GoogleSheetsCredential, error)
	SaveCredential(credential *models.GoogleSheetsCredential) error
}

type googleSheetsRepository struct{ db *gorm.DB }

func NewGoogleSheetsRepository(db *gorm.DB) GoogleSheetsRepository {
	return &googleSheetsRepository{db: db}
}

func (r *googleSheetsRepository) GetCredential() (*models.GoogleSheetsCredential, error) {
	var credential models.GoogleSheetsCredential
	if err := r.db.First(&credential, 1).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrGoogleSheetsCredentialNotFound
		}
		return nil, err
	}
	return &credential, nil
}

func (r *googleSheetsRepository) SaveCredential(credential *models.GoogleSheetsCredential) error {
	credential.ID = 1
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoUpdates: clause.AssignmentColumns([]string{"encrypted_refresh_token", "connected_by", "connected_at", "updated_at"}),
	}).Create(credential).Error
}
