package service

import (
	"backend/internal/models"
	"backend/internal/repository"
)

type cityService struct {
	repo repository.CityRepository
}

func NewCityService(repo repository.CityRepository) CityService {
	return &cityService{repo: repo}
}

func (s *cityService) GetAll() ([]models.City, error) {
	return s.repo.GetAll()
}

func (s *cityService) Create(city *models.City) error {
	return s.repo.Create(city)
}

func (s *cityService) Recalculate() error {
	return s.repo.RecalculateStats()
}
