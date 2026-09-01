package service

import (
	"context"

	"backend/internal/models"
)

type CityService interface {
	GetAll() ([]models.City, error)
	Create(city *models.City) error
	Recalculate() error
}

type MemberService interface {
	List(query models.MemberListQuery) (*models.MemberListResult, error)
	GetByID(id string) (*models.Member, error)
	FindDuplicateCandidates(member *models.Member, excludeID string, cityIDs []string, allCities bool) ([]models.MemberDuplicateCandidate, error)
	Create(member *models.Member, actorID string, cityIDs []string, allCities bool) error
	Update(member *models.Member, actorID string, cityIDs []string, allCities bool) error
	Archive(member *models.Member, actorID, reason string) error
	GetHistory(memberID string) (*models.MemberHistoryResult, error)
	Export(query models.MemberListQuery) ([]models.Member, error)
}

type BeritaService interface {
	GetAll() ([]models.BeritaAcara, error)
	GetByID(id string) (*models.BeritaAcara, error)
	Create(berita *models.BeritaAcara) error
	Delete(id string) error
}

type JurnalService interface {
	GetAll() ([]models.JurnalPA, error)
	GetByID(id string) (*models.JurnalPA, error)
	Create(jurnal *models.JurnalPA) error
	Delete(id string) error
}

type DonationService interface {
	GetAllCampaigns() ([]models.DonationCampaign, error)
	CreateCampaign(campaign *models.DonationCampaign) error
	GetAllRecords() ([]models.DonationRecord, error)
	GetRecordByID(id string) (*models.DonationRecord, error)
	CreateRecord(record *models.DonationRecord) error
	VerifyRecord(id string, verifierID string) (*models.DonationRecord, error)
}

type LinkService interface {
	GetAll() ([]models.DiscipleshipLink, error)
	Create(link *models.DiscipleshipLink) error
	Update(link *models.DiscipleshipLink) error
	Delete(id string) error
}

type JobService interface {
	GetAllJobs() ([]models.JobOpportunity, error)
	CreateJob(job *models.JobOpportunity) error
	GetAllApplications() ([]models.JobApplication, error)
	CreateApplication(app *models.JobApplication) error
}

type ModuleService interface {
	GetAll() ([]models.DiscipleshipModule, error)
	Update(module *models.DiscipleshipModule) error
}

type AIService interface {
	GetAssistantResponse(prompt string, systemInstruction string) (string, error)
}

type SyncService interface {
	Sync(payload *models.SyncPayload, actorID string, cityIDs []string, allCities bool) error
}

type RegistrationService interface {
	SubmitRegistration(ctx context.Context, input PublicRegistrationInput) error
	AuthorizationURL(state string) (string, error)
	CompleteAuthorization(ctx context.Context, code, actorID string) error
	Status() (configured bool, connected bool)
}

type AuthService interface {
	Login(email string, password string, device ...string) (*models.AuthResponse, string, error)
	Activate(rawToken string, password string, device ...string) (*models.AuthResponse, string, error)
	InviteMember(member *models.Member, actorID string) error
	ResendInvitation(userID, actorID string) error
	GetUserByToken(token string) (*models.User, error)
	GetSession(token string) (*models.AuthSession, error)
	Logout(token, actorID string) error
	LogoutAll(userID, actorID string) error
	EnsureBootstrapAdmin(email string, password string) error
	GetUsers() ([]models.User, error)
}

type AccessService interface {
	Resolve(user *models.User) (*models.AccessContext, error)
	HasPermission(access *models.AccessContext, permission string) bool
	HasRole(access *models.AccessContext, role string) bool
	CanAccessCity(access *models.AccessContext, cityID string) bool
	CanCreateCity(access *models.AccessContext, city *models.City) bool
	CanManageUser(access *models.AccessContext, targetUserID string) bool
	CanAccessMember(access *models.AccessContext, user *models.User, member *models.Member, write bool) bool
	CanAccessJournal(access *models.AccessContext, user *models.User, journal *models.JurnalPA, write bool) bool
	CanAccessUpload(access *models.AccessContext, user *models.User, filename string) bool
	ValidateSync(access *models.AccessContext, user *models.User, payload *models.SyncPayload) error
	GetRoles(access *models.AccessContext) ([]models.UserRole, error)
	GrantRole(input *models.UserRole, actor *models.User) (*models.UserRole, error)
	RevokeRole(id string, actor *models.User) error
	AssignMentor(memberID, mentorUserID string, actor *models.User) error
	GetScopeCatalog(access *models.AccessContext) (*models.ScopeCatalog, error)
	GetAuditLogs(access *models.AccessContext, userID string) ([]models.AuditLog, error)
	GetSessions(access *models.AccessContext, actorID, targetUserID string) ([]models.AuthSession, error)
	RevokeSession(access *models.AccessContext, actorID, sessionID string) error
	GetAttendance(access *models.AccessContext) ([]models.AttendanceCheckIn, error)
	CheckIn(access *models.AccessContext, user *models.User, eventID, userID string) (*models.AttendanceCheckIn, error)
	RecordAudit(actorID, action, resourceType, resourceID, scopeType, scopeID, outcome, requestID, ip string, metadata map[string]any)
}

type Service struct {
	Auth         AuthService
	City         CityService
	Member       MemberService
	Berita       BeritaService
	Jurnal       JurnalService
	Donation     DonationService
	Link         LinkService
	Job          JobService
	Module       ModuleService
	AI           AIService
	Sync         SyncService
	Access       AccessService
	Location     LocationService
	Registration RegistrationService
}
