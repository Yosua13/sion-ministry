package service

import (
	"backend/internal/models"
	"backend/internal/repository"
)

type moduleService struct {
	repo repository.ModuleRepository
}

func NewModuleService(repo repository.ModuleRepository) ModuleService {
	return &moduleService{repo: repo}
}

func (s *moduleService) GetAll() ([]models.DiscipleshipModule, error) {
	return s.repo.GetAll()
}

func (s *moduleService) Update(module *models.DiscipleshipModule) error {
	return s.repo.Update(module)
}
