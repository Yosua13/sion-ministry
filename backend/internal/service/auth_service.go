package service

import (
	"crypto/rand"
	"crypto/sha256"
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
	repo       repository.AuthRepository
	sessionTTL time.Duration
}

func NewAuthService(repo repository.AuthRepository, sessionTTL time.Duration) AuthService {
	return &authService{repo: repo, sessionTTL: sessionTTL}
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
	if role == "admin" {
		return nil, errors.New("role admin tidak dapat dibuat melalui pendaftaran publik")
	}
	if role != "pekerja" && role != "jemaat" {
		return nil, errors.New("role tidak valid")
	}
	if role == "pekerja" && strings.TrimSpace(cityID) == "" {
		return nil, errors.New("pekerja wajib memilih kota pelayanan")
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
		CityID:       optionalString(cityID),
		CityName:     cityName,
		CreatedAt:    time.Now().Format(time.RFC3339),
	}

	if err := s.repo.CreateUser(user); err != nil {
		return nil, err
	}
	return user, nil
}

func (s *authService) Login(email string, password string, device ...string) (*models.AuthResponse, error) {
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
	expiresAt := time.Now().Add(s.sessionTTL).Format(time.RFC3339)
	session := &models.AuthSession{
		ID:         "ses-" + uuid.NewString(),
		Token:      hashSessionToken(token),
		UserID:     user.ID,
		ExpiresAt:  expiresAt,
		CreatedAt:  time.Now().Format(time.RFC3339),
		LastSeenAt: time.Now().Format(time.RFC3339),
	}
	if len(device) > 0 {
		session.DeviceName = strings.TrimSpace(device[0])
	}
	if len(device) > 1 {
		session.UserAgent = strings.TrimSpace(device[1])
	}
	if len(device) > 2 {
		session.IPAddress = strings.TrimSpace(device[2])
	}
	if err := s.repo.CreateSession(session); err != nil {
		return nil, err
	}

	return &models.AuthResponse{Token: token, User: *user, ExpiresAt: expiresAt}, nil
}

func (s *authService) GetUserByToken(token string) (*models.User, error) {
	session, err := s.repo.GetSession(hashSessionToken(token))
	if err != nil {
		return nil, err
	}
	expiresAt, err := time.Parse(time.RFC3339, session.ExpiresAt)
	if err != nil || expiresAt.Before(time.Now()) {
		_ = s.repo.DeleteSession(session.Token)
		return nil, errors.New("session sudah berakhir")
	}
	if session.RevokedAt != "" {
		return nil, errors.New("session sudah dicabut")
	}
	session.LastSeenAt = time.Now().Format(time.RFC3339)
	_ = s.repo.UpdateSession(session)

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
	hashed := hashSessionToken(token)
	session, _ := s.repo.GetSession(hashed)
	if err := s.repo.DeleteSession(hashed); err != nil {
		return err
	}
	if session != nil {
		return s.repo.CreateAuditLog(newAuditLog(session.UserID, "session.revoked", "auth_session", session.ID, "self", session.UserID, "success", "", "", map[string]any{"currentDevice": true}))
	}
	return nil
}

func (s *authService) LogoutAll(userID string) error {
	if err := s.repo.DeleteSessionsByUser(userID); err != nil {
		return err
	}
	return s.repo.CreateAuditLog(newAuditLog(userID, "session.revoked_all", "auth_session", "", "self", userID, "success", "", "", map[string]any{"allDevices": true}))
}

// EnsureBootstrapAdmin supports the one-time creation of the first administrator.
// Both values come exclusively from the runtime environment and must be removed after
// the administrator is created.
func (s *authService) EnsureBootstrapAdmin(email string, password string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" && password == "" {
		return nil
	}
	if email == "" || password == "" {
		return errors.New("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set together")
	}
	if len(password) < 12 {
		return errors.New("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters")
	}
	if _, err := s.repo.GetUserByEmail(email); err == nil {
		return nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	user := &models.User{
		ID:           "usr-" + uuid.NewString(),
		Name:         "Bootstrap Administrator",
		Email:        email,
		PasswordHash: string(hash),
		Role:         "admin",
		Status:       "active",
		CreatedAt:    time.Now().Format(time.RFC3339),
		ApprovedAt:   time.Now().Format(time.RFC3339),
	}
	now := time.Now().Format(time.RFC3339)
	assignment := &models.RoleAssignment{
		ID: "ra-" + uuid.NewString(), UserID: user.ID, Role: "admin", ScopeType: "organization",
		ScopeID: "org-sion-ministry", Status: "active", ValidFrom: now, ApprovedBy: stringPointer(user.ID), ApprovedAt: &now, CreatedAt: now,
	}
	return s.repo.CreateUserWithAssignment(user, assignment)
}

func (s *authService) GetUsers() ([]models.User, error) {
	return s.repo.GetUsers()
}

func (s *authService) ApproveUser(id string, actorIDs ...string) (*models.User, error) {
	user, err := s.repo.GetUserByID(id)
	if err != nil {
		return nil, err
	}
	if user.Status != "pending" {
		return nil, errors.New("hanya akun pending yang dapat disetujui")
	}
	user.Status = "active"
	now := time.Now().Format(time.RFC3339)
	user.ApprovedAt = now
	actorID := ""
	if len(actorIDs) > 0 {
		actorID = strings.TrimSpace(actorIDs[0])
	}
	scopeType, scopeID := "self", user.ID
	if user.Role == "admin" {
		scopeType, scopeID = "organization", "org-sion-ministry"
	} else if user.Role == "pekerja" {
		if user.CityID == nil || *user.CityID == "" {
			return nil, errors.New("pekerja belum memiliki kota pelayanan")
		}
		scopeType, scopeID = "city", *user.CityID
	}
	assignment := &models.RoleAssignment{
		ID: "ra-" + uuid.NewString(), UserID: user.ID, Role: user.Role, ScopeType: scopeType,
		ScopeID: scopeID, Status: "active", ValidFrom: now, ApprovedBy: stringPointer(actorID), ApprovedAt: &now, CreatedAt: now,
	}
	audit := newAuditLog(actorID, "user.approved", "user", user.ID, scopeType, scopeID, "success", "", "", map[string]any{"role": user.Role})
	if err := s.repo.ApproveUserWithAssignment(user, assignment, audit); err != nil {
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

func hashSessionToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func optionalString(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}
