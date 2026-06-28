package repository

import (
	"backend/internal/models"
	"gorm.io/gorm"
)

type MemberRepository interface {
	GetAll() ([]models.Member, error)
	GetByID(id string) (*models.Member, error)
	Create(member *models.Member) error
	Update(member *models.Member) error
	Delete(id string) error
}

type memberRepository struct {
	db *gorm.DB
}

func NewMemberRepository(db *gorm.DB) MemberRepository {
	return &memberRepository{db: db}
}

func (r *memberRepository) GetAll() ([]models.Member, error) {
	var members []models.Member
	err := r.db.Find(&members).Error
	return members, err
}

func (r *memberRepository) GetByID(id string) (*models.Member, error) {
	var member models.Member
	err := r.db.First(&member, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *memberRepository) Create(member *models.Member) error {
	return r.db.Create(member).Error
}

func (r *memberRepository) Update(member *models.Member) error {
	return r.db.Save(member).Error
}

func (r *memberRepository) Delete(id string) error {
	return r.db.Delete(&models.Member{}, "id = ?", id).Error
}
