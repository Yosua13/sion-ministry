package service

import (
	"backend/internal/models"
	"backend/internal/repository"
)

type memberService struct {
	memberRepo repository.MemberRepository
	cityRepo   repository.CityRepository
}

func NewMemberService(memberRepo repository.MemberRepository, cityRepo repository.CityRepository) MemberService {
	return &memberService{memberRepo: memberRepo, cityRepo: cityRepo}
}

func (s *memberService) GetAll() ([]models.Member, error) {
	return s.memberRepo.GetAll()
}

func (s *memberService) Create(member *models.Member) error {
	if err := s.memberRepo.Create(member); err != nil {
		return err
	}
	return s.cityRepo.RecalculateStats()
}

func (s *memberService) Update(member *models.Member) error {
	if err := s.memberRepo.Update(member); err != nil {
		return err
	}
	return s.cityRepo.RecalculateStats()
}

func (s *memberService) Delete(id string) error {
	if err := s.memberRepo.Delete(id); err != nil {
		return err
	}
	return s.cityRepo.RecalculateStats()
}
