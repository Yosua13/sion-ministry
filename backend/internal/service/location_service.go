package service

import (
	"backend/internal/models"
	"backend/internal/repository"
)

type LocationService interface {
	GetProvinces(query string) ([]models.Province, error)
	GetCitiesByProvince(provinceNameOrID string, query string) ([]models.LocationCity, error)
}

type locationService struct {
	repo repository.LocationRepository
}

func NewLocationService(repo repository.LocationRepository) LocationService {
	return &locationService{repo: repo}
}

func (s *locationService) GetProvinces(query string) ([]models.Province, error) {
	return s.repo.GetProvinces(query)
}

func (s *locationService) GetCitiesByProvince(provinceNameOrID string, query string) ([]models.LocationCity, error) {
	return s.repo.GetCitiesByProvince(provinceNameOrID, query)
}
