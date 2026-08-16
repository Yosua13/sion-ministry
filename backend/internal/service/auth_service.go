package service

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/internal/models"
	"backend/internal/repository"

	"github.com/google/uuid"
	"golang.org/x/crypto/argon2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type authService struct {
	repo          repository.AuthRepository
	sessionTTL    time.Duration
	invitationTTL time.Duration
	mailer        InvitationMailer
}

func NewAuthService(repo repository.AuthRepository, sessionTTL, invitationTTL time.Duration, mailer InvitationMailer) AuthService {
	return &authService{repo: repo, sessionTTL: sessionTTL, invitationTTL: invitationTTL, mailer: mailer}
}

func (s *authService) Login(email, password string, device ...string) (*models.AuthResponse, string, error) {
	user, err := s.repo.GetUserByEmail(strings.ToLower(strings.TrimSpace(email)))
	if err != nil || user.PasswordHash == nil {
		return nil, "", errors.New("email atau password belum sesuai")
	}
	valid, legacy := verifyPassword(*user.PasswordHash, password)
	if !valid {
		return nil, "", errors.New("email atau password belum sesuai")
	}
	if user.Status != "active" {
		return nil, "", errors.New("akun belum aktif atau telah dinonaktifkan")
	}
	if legacy {
		upgraded, hashErr := hashPassword(password)
		if hashErr != nil {
			return nil, "", hashErr
		}
		user.PasswordHash = &upgraded
		if err := s.repo.UpdateUser(user); err != nil {
			return nil, "", err
		}
	}

	token, err := generateToken()
	if err != nil {
		return nil, "", err
	}
	now := time.Now().UTC()
	session := &models.AuthSession{
		ID: "ses-" + uuid.NewString(), TokenHash: hashSessionToken(token), UserID: user.ID,
		ExpiresAt: now.Add(s.sessionTTL), CreatedAt: now, LastSeenAt: &now,
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
	audit := newAuthAudit(user.ID, "session.created", "auth_session", session.ID, "self", user.ID, "success", map[string]any{"deviceName": session.DeviceName})
	audit.IPAddress = session.IPAddress
	if err := s.repo.CreateSessionWithAudit(session, audit); err != nil {
		return nil, "", err
	}
	return &models.AuthResponse{User: *user, ExpiresAt: session.ExpiresAt}, token, nil
}

func (s *authService) Activate(rawToken, password string, device ...string) (*models.AuthResponse, string, error) {
	if len([]rune(password)) < 12 {
		return nil, "", errors.New("password minimal 12 karakter")
	}
	passwordHash, err := hashPassword(password)
	if err != nil {
		return nil, "", err
	}
	token, err := generateToken()
	if err != nil {
		return nil, "", err
	}
	now := time.Now().UTC()
	session := &models.AuthSession{
		ID: "ses-" + uuid.NewString(), TokenHash: hashSessionToken(token), ExpiresAt: now.Add(s.sessionTTL), CreatedAt: now, LastSeenAt: &now,
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
	user, err := s.repo.ActivateInvitation(hashSessionToken(rawToken), passwordHash, session, now)
	if err != nil {
		return nil, "", err
	}
	return &models.AuthResponse{User: *user, ExpiresAt: session.ExpiresAt}, token, nil
}

func (s *authService) InviteMember(member *models.Member, actorID string) error {
	if member == nil {
		return errors.New("profil anggota wajib diisi")
	}
	role := strings.ToLower(strings.TrimSpace(member.InviteRole))
	if role == "" {
		role = "jemaat"
	}
	if role != "jemaat" && role != "pekerja" && role != "mentor" && role != "auditor" {
		return errors.New("role undangan tidak valid")
	}
	cityID := strings.TrimSpace(member.CityID)
	if cityID == "" {
		return errors.New("kota pelayanan wajib diisi")
	}
	now := time.Now().UTC()
	activationToken, err := generateToken()
	if err != nil {
		return err
	}
	user := &models.User{
		ID: member.ID, Name: member.Name, Email: strings.ToLower(strings.TrimSpace(member.Email)), CityID: &cityID,
		Phone: member.Phone, DiscipleshipStage: member.DiscipleshipStage, MentorUserID: member.MentorUserID,
		MentorName: member.MentorName, GroupName: member.GroupName, JoinedOn: &member.JoinedOn,
		MemberStatus: member.Status, Status: "invited", IsMember: true, ProfileVersion: 1,
		CreatedAt: now, UpdatedAt: now,
	}
	roleAssignment := &models.UserRole{ID: "urole-" + uuid.NewString(), UserID: user.ID, Role: role, CityID: &cityID, GrantedBy: stringPointer(actorID), GrantedAt: now}
	invitation := &models.AccountInvitation{ID: "invite-" + uuid.NewString(), UserID: user.ID, TokenHash: hashSessionToken(activationToken), ExpiresAt: now.Add(s.invitationTTL), CreatedBy: stringPointer(actorID), CreatedAt: now}
	var consent *models.MemberConsentHistory
	if member.ConsentStatus != "unknown" {
		consent = &models.MemberConsentHistory{
			ID: uuid.NewString(), MemberID: user.ID, ActorUserID: stringPointer(actorID),
			ConsentStatus: member.ConsentStatus, CommunicationPreferences: member.CommunicationPreferences,
			Source: member.ConsentSource, Purpose: member.ConsentPurpose, RecordedAt: now, CreatedAt: now,
		}
	}
	audit := newAuthAudit(actorID, "account.invited", "user", user.ID, "city", cityID, "success", map[string]any{"role": role})
	if err := s.repo.CreateInvitedUser(user, roleAssignment, invitation, consent, audit); err != nil {
		return err
	}
	if err := s.sendInvitation(user, invitation, activationToken); err != nil {
		_ = s.repo.CreateAuditLog(newAuthAudit(actorID, "account.invitation_delivery_failed", "user", user.ID, "city", cityID, "failure", map[string]any{"invitationId": invitation.ID}))
		return fmt.Errorf("akun telah dibuat, tetapi email aktivasi belum terkirim: %w", err)
	}
	return nil
}

func (s *authService) ResendInvitation(userID, actorID string) error {
	user, err := s.repo.GetUserByID(strings.TrimSpace(userID))
	if err != nil {
		return err
	}
	if user.Status != "invited" {
		return repository.ErrInvitationNotReady
	}
	now := time.Now().UTC()
	rawToken, err := generateToken()
	if err != nil {
		return err
	}
	invitation := &models.AccountInvitation{ID: "invite-" + uuid.NewString(), UserID: user.ID, TokenHash: hashSessionToken(rawToken), ExpiresAt: now.Add(s.invitationTTL), CreatedBy: stringPointer(actorID), CreatedAt: now}
	audit := newAuthAudit(actorID, "account.invitation_resent", "user", user.ID, "city", stringValue(user.CityID), "success", map[string]any{"invitationId": invitation.ID})
	if err := s.repo.ReplaceInvitation(user.ID, invitation, audit, now); err != nil {
		return err
	}
	if err := s.sendInvitation(user, invitation, rawToken); err != nil {
		_ = s.repo.CreateAuditLog(newAuthAudit(actorID, "account.invitation_delivery_failed", "user", user.ID, "city", stringValue(user.CityID), "failure", map[string]any{"invitationId": invitation.ID}))
		return fmt.Errorf("undangan baru sudah dibuat, tetapi email belum terkirim: %w", err)
	}
	return nil
}

func (s *authService) sendInvitation(user *models.User, invitation *models.AccountInvitation, rawToken string) error {
	if s.mailer == nil {
		return errors.New("layanan email aktivasi tidak tersedia")
	}
	if err := s.mailer.SendActivation(user.Name, user.Email, rawToken); err != nil {
		return err
	}
	return s.repo.MarkInvitationSent(invitation.ID, time.Now().UTC())
}

func (s *authService) GetUserByToken(token string) (*models.User, error) {
	if strings.TrimSpace(token) == "" {
		return nil, errors.New("session tidak ditemukan")
	}
	session, err := s.repo.GetSession(hashSessionToken(token))
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	if !session.ExpiresAt.After(now) {
		_ = s.repo.RevokeSession(session.TokenHash, "", "expired", now)
		return nil, errors.New("session sudah berakhir")
	}
	if session.RevokedAt != nil {
		return nil, errors.New("session sudah dicabut")
	}
	if session.LastSeenAt == nil || now.Sub(*session.LastSeenAt) > time.Minute {
		session.LastSeenAt = &now
		_ = s.repo.UpdateSession(session)
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

func (s *authService) GetSession(token string) (*models.AuthSession, error) {
	if strings.TrimSpace(token) == "" {
		return nil, errors.New("session tidak ditemukan")
	}
	return s.repo.GetSession(hashSessionToken(token))
}

func (s *authService) Logout(token string, actorID string) error {
	if strings.TrimSpace(token) == "" {
		return nil
	}
	session, err := s.repo.GetSession(hashSessionToken(token))
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	if session == nil {
		return nil
	}
	now := time.Now().UTC()
	if err := s.repo.RevokeSession(session.TokenHash, actorID, "logout", now); err != nil {
		return err
	}
	return s.repo.CreateAuditLog(newAuthAudit(session.UserID, "session.revoked", "auth_session", session.ID, "self", session.UserID, "success", map[string]any{"currentDevice": true}))
}

func (s *authService) LogoutAll(userID, actorID string) error {
	if err := s.repo.RevokeSessionsByUser(userID, actorID, "logout_all", time.Now().UTC()); err != nil {
		return err
	}
	return s.repo.CreateAuditLog(newAuthAudit(actorID, "session.revoked_all", "auth_session", "", "self", userID, "success", map[string]any{"allDevices": true}))
}

// EnsureBootstrapAdmin creates the one-time global administrator. It never assigns
// a synthetic city: a global admin is deliberately not a fake member record.
func (s *authService) EnsureBootstrapAdmin(email, password string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" && password == "" {
		return nil
	}
	if email == "" || password == "" {
		return errors.New("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set together")
	}
	if len([]rune(password)) < 12 {
		return errors.New("BOOTSTRAP_ADMIN_PASSWORD must contain at least 12 characters")
	}
	if _, err := s.repo.GetUserByEmail(email); err == nil {
		return nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	hash, err := hashPassword(password)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	user := &models.User{ID: uuid.NewString(), Name: "Bootstrap Administrator", Email: email, PasswordHash: &hash, Status: "active", IsMember: false, ProfileVersion: 1, CreatedAt: now, UpdatedAt: now, ActivatedAt: &now}
	role := &models.UserRole{ID: "urole-" + uuid.NewString(), UserID: user.ID, Role: "admin", GrantedBy: &user.ID, GrantedAt: now}
	return s.repo.CreateUserWithRole(user, role)
}

func (s *authService) GetUsers() ([]models.User, error) { return s.repo.GetUsers() }

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

func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	const memory uint32 = 19456
	const iterations uint32 = 2
	const parallelism uint8 = 1
	hash := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, 32)
	return fmt.Sprintf("$argon2id$v=19$m=%d,t=%d,p=%d$%s$%s", memory, iterations, parallelism, base64.RawStdEncoding.EncodeToString(salt), base64.RawStdEncoding.EncodeToString(hash)), nil
}

func verifyPassword(encoded, password string) (valid, legacy bool) {
	if strings.HasPrefix(encoded, "$2") {
		return bcrypt.CompareHashAndPassword([]byte(encoded), []byte(password)) == nil, true
	}
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" || parts[2] != "v=19" {
		return false, false
	}
	var memory, iterations uint32
	var parallelism uint8
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &memory, &iterations, &parallelism); err != nil || memory < 19456 || iterations < 2 || parallelism < 1 {
		return false, false
	}
	salt, err := base64.RawStdEncoding.DecodeString(parts[4])
	if err != nil {
		return false, false
	}
	expected, err := base64.RawStdEncoding.DecodeString(parts[5])
	if err != nil || len(expected) != 32 {
		return false, false
	}
	actual := argon2.IDKey([]byte(password), salt, iterations, memory, parallelism, uint32(len(expected)))
	return subtle.ConstantTimeCompare(actual, expected) == 1, false
}

func newAuthAudit(actorID, action, resourceType, resourceID, scopeType, scopeID, outcome string, metadata map[string]any) *models.AuditLog {
	if metadata == nil {
		metadata = map[string]any{}
	}
	return &models.AuditLog{ID: "audit-" + uuid.NewString(), ActorUserID: stringPointer(actorID), Action: action, ResourceType: resourceType, ResourceID: stringPointer(resourceID), ScopeType: stringPointer(scopeType), ScopeID: stringPointer(scopeID), Outcome: outcome, Metadata: metadata, CreatedAt: time.Now().UTC().Format(time.RFC3339)}
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func stringPointer(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}

func newAuditLog(actorID, action, resourceType, resourceID, scopeType, scopeID, outcome, requestID, ip string, metadata map[string]any) *models.AuditLog {
	audit := newAuthAudit(actorID, action, resourceType, resourceID, scopeType, scopeID, outcome, metadata)
	audit.RequestID = requestID
	audit.IPAddress = ip
	return audit
}
