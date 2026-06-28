package service

import (
	"backend/internal/models"
	"backend/internal/repository"
)

type linkService struct {
	repo repository.LinkRepository
}

func NewLinkService(repo repository.LinkRepository) LinkService {
	return &linkService{repo: repo}
}

func (s *linkService) GetAll() ([]models.DiscipleshipLink, error) {
	return s.repo.GetAll()
}

func (s *linkService) Create(link *models.DiscipleshipLink) error {
	return s.repo.Create(link)
}

func (s *linkService) Update(link *models.DiscipleshipLink) error {
	return s.repo.Update(link)
}

func (s *linkService) Delete(id string) error {
	return s.repo.Delete(id)
}
