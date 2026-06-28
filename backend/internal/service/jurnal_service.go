package service

import (
	"backend/internal/models"
	"backend/internal/repository"
)

type jurnalService struct {
	jurnalRepo repository.JurnalRepository
	cityRepo   repository.CityRepository
}

func NewJurnalService(jurnalRepo repository.JurnalRepository, cityRepo repository.CityRepository) JurnalService {
	return &jurnalService{jurnalRepo: jurnalRepo, cityRepo: cityRepo}
}

func (s *jurnalService) GetAll() ([]models.JurnalPA, error) {
	return s.jurnalRepo.GetAll()
}

func (s *jurnalService) Create(jurnal *models.JurnalPA) error {
	if err := s.jurnalRepo.Create(jurnal); err != nil {
		return err
	}
	return s.cityRepo.RecalculateStats()
}

func (s *jurnalService) Delete(id string) error {
	if err := s.jurnalRepo.Delete(id); err != nil {
		return err
	}
	return s.cityRepo.RecalculateStats()
}
