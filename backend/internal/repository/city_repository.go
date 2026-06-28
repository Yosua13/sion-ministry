package repository

import (
	"backend/internal/models"
	"gorm.io/gorm"
)

type CityRepository interface {
	GetAll() ([]models.City, error)
	GetByID(id string) (*models.City, error)
	Create(city *models.City) error
	Update(city *models.City) error
	Delete(id string) error
	RecalculateStats() error
}

type cityRepository struct {
	db *gorm.DB
}

func NewCityRepository(db *gorm.DB) CityRepository {
	return &cityRepository{db: db}
}

func (r *cityRepository) GetAll() ([]models.City, error) {
	var cities []models.City
	err := r.db.Find(&cities).Error
	return cities, err
}

func (r *cityRepository) GetByID(id string) (*models.City, error) {
	var city models.City
	err := r.db.First(&city, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &city, nil
}

func (r *cityRepository) Create(city *models.City) error {
	return r.db.Create(city).Error
}

func (r *cityRepository) Update(city *models.City) error {
	return r.db.Save(city).Error
}

func (r *cityRepository) Delete(id string) error {
	return r.db.Delete(&models.City{}, "id = ?", id).Error
}

func (r *cityRepository) RecalculateStats() error {
	query := `
		UPDATE cities c
		SET 
			members_count = COALESCE((SELECT COUNT(*) FROM members m WHERE m.city_id = c.id), 0),
			berita_count = COALESCE((SELECT COUNT(*) FROM berita_acaras b WHERE b.city_id = c.id), 0),
			jurnal_pa_count = COALESCE((SELECT COUNT(*) FROM jurnal_pas j WHERE j.city_id = c.id), 0),
			journals_count = COALESCE((SELECT COUNT(*) FROM berita_acaras b WHERE b.city_id = c.id), 0) + 
			                 COALESCE((SELECT COUNT(*) FROM jurnal_pas j WHERE j.city_id = c.id), 0)
	`
	return r.db.Exec(query).Error
}
