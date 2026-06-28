package repository

import (
	"backend/internal/models"
	"gorm.io/gorm"
)

type BeritaRepository interface {
	GetAll() ([]models.BeritaAcara, error)
	GetByID(id string) (*models.BeritaAcara, error)
	Create(berita *models.BeritaAcara) error
	Update(berita *models.BeritaAcara) error
	Delete(id string) error
}

type beritaRepository struct {
	db *gorm.DB
}

func NewBeritaRepository(db *gorm.DB) BeritaRepository {
	return &beritaRepository{db: db}
}

func (r *beritaRepository) GetAll() ([]models.BeritaAcara, error) {
	var berita []models.BeritaAcara
	err := r.db.Find(&berita).Error
	return berita, err
}

func (r *beritaRepository) GetByID(id string) (*models.BeritaAcara, error) {
	var b models.BeritaAcara
	err := r.db.First(&b, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *beritaRepository) Create(berita *models.BeritaAcara) error {
	return r.db.Create(berita).Error
}

func (r *beritaRepository) Update(berita *models.BeritaAcara) error {
	return r.db.Save(berita).Error
}

func (r *beritaRepository) Delete(id string) error {
	return r.db.Delete(&models.BeritaAcara{}, "id = ?", id).Error
}
