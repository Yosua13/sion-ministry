package service

import (
	"backend/internal/models"
	"backend/internal/repository"
)

type beritaService struct {
	beritaRepo repository.BeritaRepository
	cityRepo   repository.CityRepository
}

func NewBeritaService(beritaRepo repository.BeritaRepository, cityRepo repository.CityRepository) BeritaService {
	return &beritaService{beritaRepo: beritaRepo, cityRepo: cityRepo}
}

func (s *beritaService) GetAll() ([]models.BeritaAcara, error) {
	return s.beritaRepo.GetAll()
}

func (s *beritaService) Create(berita *models.BeritaAcara) error {
	if err := s.beritaRepo.Create(berita); err != nil {
		return err
	}
	return s.cityRepo.RecalculateStats()
}

func (s *beritaService) Delete(id string) error {
	if err := s.beritaRepo.Delete(id); err != nil {
		return err
	}
	return s.cityRepo.RecalculateStats()
}
