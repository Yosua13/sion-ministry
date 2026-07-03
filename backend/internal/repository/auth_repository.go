package repository

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

type AuthRepository interface {
	CreateUser(user *models.User) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	GetUsers() ([]models.User, error)
	UpdateUser(user *models.User) error
	CreateSession(session *models.AuthSession) error
	GetSession(token string) (*models.AuthSession, error)
	DeleteSession(token string) error
}

type authRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &authRepository{db: db}
}

func (r *authRepository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *authRepository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, "email = ?", email).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *authRepository) GetUserByID(id string) (*models.User, error) {
	var user models.User
	if err := r.db.First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *authRepository) GetUsers() ([]models.User, error) {
	var users []models.User
	err := r.db.Order("created_at desc").Find(&users).Error
	return users, err
}

func (r *authRepository) UpdateUser(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *authRepository) CreateSession(session *models.AuthSession) error {
	return r.db.Create(session).Error
}

func (r *authRepository) GetSession(token string) (*models.AuthSession, error) {
	var session models.AuthSession
	if err := r.db.First(&session, "token = ?", token).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *authRepository) DeleteSession(token string) error {
	return r.db.Delete(&models.AuthSession{}, "token = ?", token).Error
}
