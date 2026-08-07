package service

import (
	"errors"
	"testing"
	"time"

	"backend/internal/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type memoryAuthRepository struct {
	users    map[string]*models.User
	sessions map[string]*models.AuthSession
}

func newMemoryAuthRepository() *memoryAuthRepository {
	return &memoryAuthRepository{users: map[string]*models.User{}, sessions: map[string]*models.AuthSession{}}
}

func (r *memoryAuthRepository) CreateUser(user *models.User) error {
	if _, found := r.users[user.Email]; found {
		return errors.New("duplicate user")
	}
	r.users[user.Email] = user
	return nil
}
func (r *memoryAuthRepository) CreateUserWithAssignment(user *models.User, _ *models.RoleAssignment) error {
	return r.CreateUser(user)
}
func (r *memoryAuthRepository) GetUserByEmail(email string) (*models.User, error) {
	if user, found := r.users[email]; found {
		return user, nil
	}
	return nil, gorm.ErrRecordNotFound
}
func (r *memoryAuthRepository) GetUserByID(id string) (*models.User, error) {
	for _, user := range r.users {
		if user.ID == id {
			return user, nil
		}
	}
	return nil, gorm.ErrRecordNotFound
}
func (r *memoryAuthRepository) GetUsers() ([]models.User, error) { return nil, nil }
func (r *memoryAuthRepository) UpdateUser(user *models.User) error {
	r.users[user.Email] = user
	return nil
}
func (r *memoryAuthRepository) ApproveUserWithAssignment(user *models.User, _ *models.RoleAssignment, _ *models.AuditLog) error {
	return r.UpdateUser(user)
}
func (r *memoryAuthRepository) CreateSession(session *models.AuthSession) error {
	r.sessions[session.Token] = session
	return nil
}
func (r *memoryAuthRepository) GetSession(token string) (*models.AuthSession, error) {
	if session, found := r.sessions[token]; found {
		return session, nil
	}
	return nil, gorm.ErrRecordNotFound
}
func (r *memoryAuthRepository) UpdateSession(session *models.AuthSession) error {
	r.sessions[session.Token] = session
	return nil
}
func (r *memoryAuthRepository) DeleteSession(token string) error {
	delete(r.sessions, token)
	return nil
}
func (r *memoryAuthRepository) DeleteSessionsByUser(userID string) error {
	for token, session := range r.sessions {
		if session.UserID == userID {
			delete(r.sessions, token)
		}
	}
	return nil
}
func (r *memoryAuthRepository) CreateAuditLog(_ *models.AuditLog) error { return nil }

func TestRegisterRejectsPublicAdminRole(t *testing.T) {
	service := NewAuthService(newMemoryAuthRepository(), time.Hour)
	if _, err := service.Register("Test", "test@example.com", "long-enough-password", "admin", "", ""); err == nil {
		t.Fatal("public registration for an administrator must be rejected")
	}
}

func TestRegisterApprovalAndLoginFlow(t *testing.T) {
	repo := newMemoryAuthRepository()
	service := NewAuthService(repo, time.Hour)
	user, err := service.Register("Member Test", "member@example.com", "long-enough-password", "jemaat", "city-1", "Jakarta")
	if err != nil {
		t.Fatal(err)
	}
	if user.Status != "pending" {
		t.Fatalf("new registration status = %q, want pending", user.Status)
	}
	if _, err := service.Login("member@example.com", "long-enough-password"); err == nil {
		t.Fatal("a pending account must not be able to log in")
	}
	if _, err := service.ApproveUser(user.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := service.Login("member@example.com", "long-enough-password"); err != nil {
		t.Fatalf("approved account should log in: %v", err)
	}
}

func TestLoginUsesConfiguredSessionExpiry(t *testing.T) {
	repo := newMemoryAuthRepository()
	hash, err := bcrypt.GenerateFromPassword([]byte("long-enough-password"), bcrypt.DefaultCost)
	if err != nil {
		t.Fatal(err)
	}
	repo.users["member@example.com"] = &models.User{ID: "user-1", Email: "member@example.com", PasswordHash: string(hash), Role: "jemaat", Status: "active"}
	service := NewAuthService(repo, 2*time.Hour)

	before := time.Now().Add(2*time.Hour - 2*time.Second)
	session, err := service.Login("member@example.com", "long-enough-password")
	if err != nil {
		t.Fatal(err)
	}
	if repo.sessions[session.Token] != nil || len(repo.sessions) != 1 {
		t.Fatal("the usable bearer token must not be persisted")
	}
	expiresAt, err := time.Parse(time.RFC3339, session.ExpiresAt)
	if err != nil {
		t.Fatal(err)
	}
	if expiresAt.Before(before) || expiresAt.After(time.Now().Add(2*time.Hour+2*time.Second)) {
		t.Fatalf("unexpected expiry %s", session.ExpiresAt)
	}
	if err := service.Logout(session.Token); err != nil {
		t.Fatal(err)
	}
	if _, err := service.GetUserByToken(session.Token); err == nil {
		t.Fatal("logged-out session must be revoked")
	}
}

func TestLogoutAllRevokesEveryDeviceSession(t *testing.T) {
	repo := newMemoryAuthRepository()
	repo.sessions["device-a"] = &models.AuthSession{Token: "device-a", UserID: "user-1"}
	repo.sessions["device-b"] = &models.AuthSession{Token: "device-b", UserID: "user-1"}
	repo.sessions["other-user"] = &models.AuthSession{Token: "other-user", UserID: "user-2"}
	service := NewAuthService(repo, time.Hour)
	if err := service.LogoutAll("user-1"); err != nil {
		t.Fatal(err)
	}
	if len(repo.sessions) != 1 || repo.sessions["other-user"] == nil {
		t.Fatal("all and only the target user's sessions must be revoked")
	}
}

func TestBootstrapAdminHasNoCityForeignKeyValue(t *testing.T) {
	repo := newMemoryAuthRepository()
	service := NewAuthService(repo, time.Hour)
	if err := service.EnsureBootstrapAdmin("admin@example.com", "a-secure-bootstrap-password"); err != nil {
		t.Fatal(err)
	}
	admin, err := repo.GetUserByEmail("admin@example.com")
	if err != nil {
		t.Fatal(err)
	}
	if admin.CityID != nil {
		t.Fatal("bootstrap admin city ID must be NULL, not an empty string")
	}
}
