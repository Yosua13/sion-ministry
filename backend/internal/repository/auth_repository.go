package repository

import (
	"errors"
	"time"

	"backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrInvitationInvalid  = errors.New("undangan aktivasi tidak valid")
	ErrInvitationExpired  = errors.New("undangan aktivasi telah kedaluwarsa")
	ErrInvitationNotReady = errors.New("akun belum siap diaktivasi")
)

type AuthRepository interface {
	CreateUser(user *models.User) error
	CreateUserWithRole(user *models.User, role *models.UserRole) error
	CreateInvitedUser(user *models.User, role *models.UserRole, invitation *models.AccountInvitation, consent *models.MemberConsentHistory, audit *models.AuditLog) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	GetUsers() ([]models.User, error)
	UpdateUser(user *models.User) error
	CreateSession(session *models.AuthSession) error
	GetSession(tokenHash string) (*models.AuthSession, error)
	UpdateSession(session *models.AuthSession) error
	RevokeSession(tokenHash, actorID, reason string, at time.Time) error
	RevokeSessionsByUser(userID, actorID, reason string, at time.Time) error
	ActivateInvitation(tokenHash, passwordHash string, session *models.AuthSession, at time.Time) (*models.User, error)
	ReplaceInvitation(userID string, invitation *models.AccountInvitation, audit *models.AuditLog, at time.Time) error
	MarkInvitationSent(invitationID string, at time.Time) error
	CreateAuditLog(audit *models.AuditLog) error
}

type authRepository struct{ db *gorm.DB }

func NewAuthRepository(db *gorm.DB) AuthRepository { return &authRepository{db: db} }

func (r *authRepository) CreateUser(user *models.User) error { return r.db.Create(user).Error }

func (r *authRepository) CreateUserWithRole(user *models.User, role *models.UserRole) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		return tx.Create(role).Error
	})
}

func (r *authRepository) CreateInvitedUser(user *models.User, role *models.UserRole, invitation *models.AccountInvitation, consent *models.MemberConsentHistory, audit *models.AuditLog) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(user).Error; err != nil {
			return err
		}
		if err := tx.Create(role).Error; err != nil {
			return err
		}
		if err := tx.Create(invitation).Error; err != nil {
			return err
		}
		if consent != nil {
			if err := tx.Create(consent).Error; err != nil {
				return err
			}
		}
		return tx.Create(audit).Error
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
	err := r.db.Model(&models.User{}).
		Select("users.*, cities.name AS city_name").
		Joins("LEFT JOIN cities ON cities.id = users.city_id").
		Order("users.created_at desc").Find(&users).Error
	return users, err
}

func (r *authRepository) UpdateUser(user *models.User) error { return r.db.Save(user).Error }

func (r *authRepository) CreateSession(session *models.AuthSession) error {
	return r.db.Create(session).Error
}

func (r *authRepository) GetSession(tokenHash string) (*models.AuthSession, error) {
	var session models.AuthSession
	if err := r.db.First(&session, "token_hash = ?", tokenHash).Error; err != nil {
		return nil, err
	}
	return &session, nil
}

func (r *authRepository) UpdateSession(session *models.AuthSession) error {
	return r.db.Save(session).Error
}

func (r *authRepository) RevokeSession(tokenHash, actorID, reason string, at time.Time) error {
	return r.db.Model(&models.AuthSession{}).
		Where("token_hash = ? AND revoked_at IS NULL", tokenHash).
		Updates(map[string]any{"revoked_at": at, "revoked_by": nullable(actorID), "revoke_reason": reason}).Error
}

func (r *authRepository) RevokeSessionsByUser(userID, actorID, reason string, at time.Time) error {
	return r.db.Model(&models.AuthSession{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Updates(map[string]any{"revoked_at": at, "revoked_by": nullable(actorID), "revoke_reason": reason}).Error
}

func (r *authRepository) ActivateInvitation(tokenHash, passwordHash string, session *models.AuthSession, at time.Time) (*models.User, error) {
	var activated models.User
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var invitation models.AccountInvitation
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("token_hash = ? AND used_at IS NULL AND revoked_at IS NULL", tokenHash).
			First(&invitation).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrInvitationInvalid
			}
			return err
		}
		if !invitation.ExpiresAt.After(at) {
			return ErrInvitationExpired
		}
		var user models.User
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).First(&user, "id = ?", invitation.UserID).Error; err != nil {
			return err
		}
		if user.Status != "invited" {
			return ErrInvitationNotReady
		}
		session.UserID = user.ID
		if err := tx.Model(&models.User{}).Where("id = ?", user.ID).Updates(map[string]any{
			"password_hash": passwordHash, "account_status": "active", "activated_at": at, "updated_at": at,
		}).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.AccountInvitation{}).Where("id = ?", invitation.ID).Update("used_at", at).Error; err != nil {
			return err
		}
		if err := tx.Create(session).Error; err != nil {
			return err
		}
		if err := tx.Create(&models.AuditLog{ID: session.ID + "-audit", ActorUserID: nullable(user.ID), Action: "account.activated", ResourceType: "user", ResourceID: nullable(user.ID), Outcome: "success", Metadata: map[string]any{"invitationId": invitation.ID}, CreatedAt: at.Format(time.RFC3339)}).Error; err != nil {
			return err
		}
		user.PasswordHash = &passwordHash
		user.Status = "active"
		user.ActivatedAt = &at
		user.UpdatedAt = at
		activated = user
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &activated, nil
}

func (r *authRepository) ReplaceInvitation(userID string, invitation *models.AccountInvitation, audit *models.AuditLog, at time.Time) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var user models.User
		if err := tx.First(&user, "id = ?", userID).Error; err != nil {
			return err
		}
		if user.Status != "invited" {
			return ErrInvitationNotReady
		}
		if err := tx.Model(&models.AccountInvitation{}).
			Where("user_id = ? AND used_at IS NULL AND revoked_at IS NULL", userID).
			Update("revoked_at", at).Error; err != nil {
			return err
		}
		if err := tx.Create(invitation).Error; err != nil {
			return err
		}
		return tx.Create(audit).Error
	})
}

func (r *authRepository) MarkInvitationSent(invitationID string, at time.Time) error {
	return r.db.Model(&models.AccountInvitation{}).Where("id = ? AND sent_at IS NULL", invitationID).Update("sent_at", at).Error
}

func (r *authRepository) CreateAuditLog(audit *models.AuditLog) error {
	return r.db.Create(audit).Error
}

func nullable(value string) *string {
	if value == "" {
		return nil
	}
	return &value
}
