package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"
	"time"

	"backend/internal/models"
	"backend/internal/repository"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type authService struct {
	repo repository.AuthRepository
}

func NewAuthService(repo repository.AuthRepository) AuthService {
	return &authService{repo: repo}
}

func (s *authService) Register(name string, email string, password string, role string, cityID string, cityName string) (*models.User, error) {
	name = strings.TrimSpace(name)
	email = strings.ToLower(strings.TrimSpace(email))
	role = strings.ToLower(strings.TrimSpace(role))

	if name == "" || email == "" || password == "" {
		return nil, errors.New("nama, email, dan password wajib diisi")
	}
	if len(password) < 8 {
		return nil, errors.New("password minimal 8 karakter")
	}
	if role != "admin" && role != "pekerja" && role != "jemaat" {
		return nil, errors.New("role tidak valid")
	}
	if _, err := s.repo.GetUserByEmail(email); err == nil {
		return nil, errors.New("email sudah terdaftar")
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := &models.User{
		ID:           "usr-" + uuid.NewString(),
		Name:         name,
		Email:        email,
		PasswordHash: string(hash),
		Role:         role,
		Status:       "pending",
		CityID:       cityID,
		CityName:     cityName,
		CreatedAt:    time.Now().Format(time.RFC3339),
	}

	if err := s.repo.CreateUser(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *authService) Login(email string, password string) (*models.AuthResponse, error) {
	user, err := s.repo.GetUserByEmail(strings.ToLower(strings.TrimSpace(email)))
	if err != nil {
		return nil, errors.New("email atau password belum sesuai")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, errors.New("email atau password belum sesuai")
	}
	if user.Status == "pending" {
		return nil, errors.New("akun belum diverifikasi admin")
	}
	if user.Status == "disabled" {
		return nil, errors.New("akun dinonaktifkan, silakan hubungi admin")
	}
	if user.Status != "active" {
		return nil, errors.New("status akun tidak valid")
	}

	token, err := generateToken()
	if err != nil {
		return nil, err
	}
	expiresAt := time.Now().Add(14 * 24 * time.Hour).Format(time.RFC3339)
	session := &models.AuthSession{
		Token:     token,
		UserID:    user.ID,
		ExpiresAt: expiresAt,
		CreatedAt: time.Now().Format(time.RFC3339),
	}
	if err := s.repo.CreateSession(session); err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, User: *user, ExpiresAt: expiresAt}, nil
}

func (s *authService) GetUserByToken(token string) (*models.User, error) {
	session, err := s.repo.GetSession(token)
	if err != nil {
		return nil, err
	}
	expiresAt, err := time.Parse(time.RFC3339, session.ExpiresAt)
	if err != nil || expiresAt.Before(time.Now()) {
		_ = s.repo.DeleteSession(token)
		return nil, errors.New("session sudah berakhir")
	}

	user, err := s.repo.GetUserByID(session.UserID)
	if err != nil {
		return nil, err
	}
	if user.Status != "active" {
		return nil, errors.New("akun tidak aktif")
	}
	return user, nil
}

func (s *authService) Logout(token string) error {
	return s.repo.DeleteSession(token)
}

func (s *authService) GetUsers() ([]models.User, error) {
	return s.repo.GetUsers()
}

func (s *authService) ApproveUser(id string) (*models.User, error) {
	user, err := s.repo.GetUserByID(id)
	if err != nil {
		return nil, err
	}
	user.Status = "active"
	user.ApprovedAt = time.Now().Format(time.RFC3339)
	if err := s.repo.UpdateUser(user); err != nil {
		return nil, err
	}
	return user, nil
}

func generateToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
