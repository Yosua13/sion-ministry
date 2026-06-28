package repository

import (
	"backend/internal/models"
	"gorm.io/gorm"
)

type LinkRepository interface {
	GetAll() ([]models.DiscipleshipLink, error)
	GetByID(id string) (*models.DiscipleshipLink, error)
	Create(link *models.DiscipleshipLink) error
	Update(link *models.DiscipleshipLink) error
	Delete(id string) error
}

type linkRepository struct {
	db *gorm.DB
}

func NewLinkRepository(db *gorm.DB) LinkRepository {
	return &linkRepository{db: db}
}

func (r *linkRepository) GetAll() ([]models.DiscipleshipLink, error) {
	var links []models.DiscipleshipLink
	err := r.db.Find(&links).Error
	return links, err
}

func (r *linkRepository) GetByID(id string) (*models.DiscipleshipLink, error) {
	var link models.DiscipleshipLink
	err := r.db.First(&link, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &link, nil
}

func (r *linkRepository) Create(link *models.DiscipleshipLink) error {
	return r.db.Create(link).Error
}

func (r *linkRepository) Update(link *models.DiscipleshipLink) error {
	return r.db.Save(link).Error
}

func (r *linkRepository) Delete(id string) error {
	return r.db.Delete(&models.DiscipleshipLink{}, "id = ?", id).Error
}
