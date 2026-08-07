package repository

import (
	"backend/internal/models"

	"gorm.io/gorm"
)

type AuthRepository interface {
	CreateUser(user *models.User) error
	CreateUserWithAssignment(user *models.User, assignment *models.RoleAssignment) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	GetUsers() ([]models.User, error)
	UpdateUser(user *models.User) error
	ApproveUserWithAssignment(user *models.User, assignment *models.RoleAssignment, audit *models.AuditLog) error
	CreateSession(session *models.AuthSession) error
	GetSession(token string) (*models.AuthSession, error)
	UpdateSession(session *models.AuthSession) error
	DeleteSession(token string) error
	DeleteSessionsByUser(userID string) error
	CreateAuditLog(audit *models.AuditLog) error
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

func (r *authRepository) CreateUserWithAssignment(user *models.User, assignment *models.RoleAssignment) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		return tx.Create(assignment).Error
	})
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

func (r *authRepository) ApproveUserWithAssignment(user *models.User, assignment *models.RoleAssignment, audit *models.AuditLog) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(user).Error; err != nil {
			return err
		}
		if err := tx.Create(assignment).Error; err != nil {
			return err
		}
		return tx.Create(audit).Error
	})
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

func (r *authRepository) UpdateSession(session *models.AuthSession) error {
	return r.db.Save(session).Error
}

func (r *authRepository) DeleteSession(token string) error {
	return r.db.Delete(&models.AuthSession{}, "token = ?", token).Error
}

func (r *authRepository) DeleteSessionsByUser(userID string) error {
	return r.db.Delete(&models.AuthSession{}, "user_id = ?", userID).Error
}

func (r *authRepository) CreateAuditLog(audit *models.AuditLog) error {
	return r.db.Create(audit).Error
}
