package repository

import (
	"backend/internal/models"
	"gorm.io/gorm"
)

type JurnalRepository interface {
	GetAll() ([]models.JurnalPA, error)
	GetByID(id string) (*models.JurnalPA, error)
	Create(jurnal *models.JurnalPA) error
	Update(jurnal *models.JurnalPA) error
	Delete(id string) error
}

type jurnalRepository struct {
	db *gorm.DB
}

func NewJurnalRepository(db *gorm.DB) JurnalRepository {
	return &jurnalRepository{db: db}
}

func (r *jurnalRepository) GetAll() ([]models.JurnalPA, error) {
	var jurnals []models.JurnalPA
	err := r.db.Find(&jurnals).Error
	return jurnals, err
}

func (r *jurnalRepository) GetByID(id string) (*models.JurnalPA, error) {
	var j models.JurnalPA
	err := r.db.First(&j, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &j, nil
}

func (r *jurnalRepository) Create(jurnal *models.JurnalPA) error {
	return r.db.Create(jurnal).Error
}

func (r *jurnalRepository) Update(jurnal *models.JurnalPA) error {
	return r.db.Save(jurnal).Error
}

func (r *jurnalRepository) Delete(id string) error {
	return r.db.Delete(&models.JurnalPA{}, "id = ?", id).Error
}
