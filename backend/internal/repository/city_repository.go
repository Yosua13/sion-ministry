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
	err := r.db.Raw(`
		SELECT c.*,
			(SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur
			 WHERE ur.city_id = c.id AND ur.revoked_at IS NULL
			   AND ur.role IN ('pekerja', 'mentor')) AS workers_count,
			(SELECT COUNT(*) FROM users u
			 WHERE u.city_id = c.id AND u.is_member = TRUE) AS members_count,
			(SELECT COUNT(*) FROM jurnal_pas j WHERE j.city_id = c.id) AS journals_count,
			(SELECT COUNT(*) FROM berita_acaras b WHERE b.city_id = c.id) AS berita_count,
			(SELECT COUNT(*) FROM jurnal_pas j WHERE j.city_id = c.id) AS jurnal_pa_count
		FROM cities c
		ORDER BY c.name`).Scan(&cities).Error
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
	// Counters were denormalized copies and are intentionally no longer persisted.
	// Dashboard queries operational records directly to avoid stale statistics.
	return nil
}
