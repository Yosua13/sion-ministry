package models

import (
	"time"

	"github.com/lib/pq"
)

type User struct {
	ID                string     `gorm:"primaryKey" json:"id"`
	Name              string     `gorm:"column:full_name" json:"name"`
	Email             string     `json:"email"`
	PasswordHash      *string    `json:"-"`
	CityID            *string    `json:"cityId,omitempty"`
	CityName          string     `gorm:"column:city_name;->" json:"cityName,omitempty"`
	Phone             string     `gorm:"column:phone_e164" json:"phone,omitempty"`
	DiscipleshipStage string     `json:"discipleshipStage,omitempty"`
	MentorUserID      *string    `json:"mentorUserId,omitempty"`
	MentorName        string     `json:"mentorName,omitempty"`
	GroupName         string     `json:"groupName,omitempty"`
	JoinedOn          *time.Time `json:"joinedOn,omitempty"`
	MemberStatus      string     `json:"memberStatus,omitempty"`
	Status            string     `gorm:"column:account_status" json:"status"`
	IsMember          bool       `json:"isMember"`
	ProfileVersion    int        `json:"profileVersion,omitempty"`
	ArchivedAt        *time.Time `json:"archivedAt,omitempty"`
	ArchivedBy        *string    `json:"archivedBy,omitempty"`
	ArchiveReason     string     `json:"archiveReason,omitempty"`
	RetentionUntil    *time.Time `json:"retentionUntil,omitempty"`
	ActivatedAt       *time.Time `json:"activatedAt,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
	Role              string     `gorm:"-" json:"role"`
}

type AuthSession struct {
	ID           string     `json:"id"`
	TokenHash    string     `gorm:"column:token_hash" json:"-"`
	UserID       string     `json:"userId"`
	ExpiresAt    time.Time  `json:"expiresAt"`
	CreatedAt    time.Time  `json:"createdAt"`
	DeviceName   string     `json:"deviceName"`
	UserAgent    string     `json:"userAgent"`
	IPAddress    string     `gorm:"column:ip_address" json:"ipAddress"`
	LastSeenAt   *time.Time `json:"lastSeenAt,omitempty"`
	RevokedAt    *time.Time `json:"revokedAt,omitempty"`
	RevokedBy    *string    `json:"revokedBy,omitempty"`
	RevokeReason string     `json:"revokeReason,omitempty"`
}

func (AuthSession) TableName() string { return "auth_sessions" }

type AuthResponse struct {
	User      User      `json:"user"`
	ExpiresAt time.Time `json:"expiresAt"`
}

type AccountInvitation struct {
	ID        string     `gorm:"primaryKey" json:"id"`
	UserID    string     `json:"userId"`
	TokenHash string     `json:"-"`
	ExpiresAt time.Time  `json:"expiresAt"`
	SentAt    *time.Time `json:"sentAt,omitempty"`
	UsedAt    *time.Time `json:"usedAt,omitempty"`
	RevokedAt *time.Time `json:"revokedAt,omitempty"`
	CreatedBy *string    `json:"createdBy,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

type UserRole struct {
	ID        string     `gorm:"primaryKey" json:"id"`
	UserID    string     `json:"userId"`
	Role      string     `json:"role"`
	CityID    *string    `json:"cityId,omitempty"`
	GrantedBy *string    `json:"grantedBy,omitempty"`
	GrantedAt time.Time  `json:"grantedAt"`
	RevokedAt *time.Time `json:"revokedAt,omitempty"`
}

type City struct {
	ID            string `gorm:"primaryKey" json:"id"`
	Name          string `json:"name"`
	Region        string `json:"region"`
	ReachedDate   string `json:"reachedDate"`
	WorkersCount  int    `gorm:"column:workers_count;->" json:"workersCount"`
	MembersCount  int    `gorm:"column:members_count;->" json:"membersCount"`
	JournalsCount int    `gorm:"column:journals_count;->" json:"journalsCount"`
	BeritaCount   int    `gorm:"column:berita_count;->" json:"beritaCount"`
	JurnalPaCount int    `gorm:"column:jurnal_pa_count;->" json:"jurnalPaCount"`
}

type DiscipleshipModule struct {
	ID           string         `gorm:"primaryKey" json:"id"`
	Title        string         `json:"title"`
	Category     string         `json:"category"`
	Scripture    string         `json:"scripture"`
	Description  string         `json:"description"`
	Outline      pq.StringArray `gorm:"type:text[]" json:"outline"`
	Content      string         `json:"content"`
	ReadingTime  int            `json:"readingTime"`
	IsDownloaded bool           `json:"isDownloaded"`
	IsCompleted  bool           `json:"isCompleted"`
}

type Member struct {
	ID                       string         `gorm:"primaryKey" json:"id"`
	Name                     string         `gorm:"column:full_name" json:"name"`
	NormalizedName           string         `gorm:"-" json:"-"`
	Email                    string         `json:"email"`
	NormalizedEmail          string         `gorm:"-" json:"-"`
	Phone                    string         `gorm:"column:phone_e164" json:"phone"`
	NormalizedPhone          string         `gorm:"-" json:"-"`
	CityID                   string         `json:"cityId"`
	CityName                 string         `gorm:"column:city_name;->" json:"cityName"`
	PrimaryServicePointID    string         `gorm:"column:city_id" json:"primaryServicePointId"`
	DiscipleshipStage        string         `json:"discipleshipStage"`
	MentorName               string         `json:"mentorName"`
	MentorUserID             *string        `json:"mentorUserId,omitempty"`
	GroupName                string         `json:"groupName"`
	JoinedDate               string         `gorm:"-" json:"joinedDate"`
	JoinedOn                 time.Time      `gorm:"type:date" json:"joinedOn"`
	Status                   string         `gorm:"column:member_status" json:"status"`
	UserID                   *string        `gorm:"-" json:"userId,omitempty"`
	OwnerUserID              *string        `gorm:"-" json:"ownerUserId,omitempty"`
	Version                  int            `gorm:"column:profile_version" json:"version"`
	ConsentStatus            string         `gorm:"column:consent_status;->" json:"consentStatus"`
	ConsentSource            string         `gorm:"column:consent_source;->" json:"consentSource"`
	ConsentPurpose           string         `gorm:"column:consent_purpose;->" json:"consentPurpose"`
	ConsentRecordedAt        *time.Time     `gorm:"column:consent_recorded_at;->" json:"consentRecordedAt,omitempty"`
	CommunicationPreferences pq.StringArray `gorm:"column:communication_preferences;->;type:text[]" json:"communicationPreferences"`
	ArchivedAt               *time.Time     `json:"archivedAt,omitempty"`
	ArchivedBy               *string        `json:"archivedBy,omitempty"`
	ArchiveReason            string         `json:"archiveReason,omitempty"`
	RetentionUntil           *time.Time     `json:"retentionUntil,omitempty"`
	CreatedAt                time.Time      `json:"createdAt"`
	UpdatedAt                time.Time      `json:"updatedAt"`
	DuplicateOverrideReason  string         `gorm:"-" json:"duplicateOverrideReason,omitempty"`
	InviteRole               string         `gorm:"-" json:"inviteRole,omitempty"`
}

func (Member) TableName() string { return "users" }

type MemberHistory struct {
	ID          string    `gorm:"type:uuid;primaryKey" json:"id"`
	MemberID    string    `json:"memberId"`
	ActorUserID *string   `json:"actorUserId,omitempty"`
	ChangeType  string    `json:"changeType"`
	FieldName   string    `json:"fieldName"`
	OldValue    string    `json:"oldValue"`
	NewValue    string    `json:"newValue"`
	Reason      string    `json:"reason"`
	CreatedAt   time.Time `json:"createdAt"`
}

type MemberConsentHistory struct {
	ID                       string         `gorm:"type:uuid;primaryKey" json:"id"`
	MemberID                 string         `gorm:"column:user_id" json:"memberId"`
	ActorUserID              *string        `gorm:"column:recorded_by" json:"actorUserId,omitempty"`
	ConsentStatus            string         `gorm:"column:status" json:"consentStatus"`
	CommunicationPreferences pq.StringArray `gorm:"column:channels;type:text[]" json:"communicationPreferences"`
	Source                   string         `json:"source"`
	Purpose                  string         `json:"purpose"`
	RecordedAt               time.Time      `json:"recordedAt"`
	CreatedAt                time.Time      `json:"createdAt"`
}

func (MemberConsentHistory) TableName() string { return "consent_records" }

type MemberDuplicateReview struct {
	ID                string         `gorm:"type:uuid;primaryKey" json:"id"`
	MemberID          string         `json:"memberId"`
	CandidateMemberID string         `json:"candidateMemberId"`
	MatchReasons      pq.StringArray `gorm:"type:text[]" json:"matchReasons"`
	Score             int            `json:"score"`
	OverrideReason    string         `json:"overrideReason"`
	Status            string         `json:"status"`
	DecidedBy         *string        `json:"decidedBy,omitempty"`
	DecidedAt         *time.Time     `json:"decidedAt,omitempty"`
	DecisionNote      string         `json:"decisionNote"`
	CreatedAt         time.Time      `json:"createdAt"`
}

type MemberDuplicateCandidate struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	CityID       string   `json:"cityId"`
	CityName     string   `json:"cityName"`
	MaskedPhone  string   `json:"maskedPhone"`
	MaskedEmail  string   `json:"maskedEmail"`
	MatchReasons []string `json:"matchReasons"`
	Score        int      `json:"score"`
}

type MemberListQuery struct {
	Page            int
	PageSize        int
	Search          string
	CityID          string
	Status          string
	IncludeArchived bool
	CityIDs         []string
	AllCities       bool
	SelfUserID      string
}

type MemberListResult struct {
	Items      []Member `json:"items"`
	Page       int      `json:"page"`
	PageSize   int      `json:"pageSize"`
	Total      int64    `json:"total"`
	TotalPages int      `json:"totalPages"`
}

type MemberHistoryResult struct {
	Changes  []MemberHistory        `json:"changes"`
	Consents []MemberConsentHistory `json:"consents"`
}

type BeritaAcara struct {
	ID             string         `gorm:"primaryKey" json:"id"`
	CityID         string         `json:"cityId"`
	CityName       string         `json:"cityName"`
	Title          string         `json:"title"`
	Date           string         `json:"date"`
	WorkerName     string         `json:"workerName"`
	ActivityType   string         `json:"activityType"`
	AttendeesCount int            `json:"attendeesCount"`
	Description    string         `json:"description"`
	Images         pq.StringArray `gorm:"type:text[]" json:"images"`
	IsPublic       bool           `json:"isPublic"`
}

type JurnalPA struct {
	ID           string  `gorm:"primaryKey" json:"id"`
	CityID       string  `json:"cityId"`
	CityName     string  `json:"cityName"`
	Theme        string  `json:"theme"`
	Scripture    string  `json:"scripture"`
	Focus        string  `json:"focus"`
	Date         string  `json:"date"`
	MentorName   string  `json:"mentorName"`
	MenteeName   string  `json:"menteeName"`
	Notes        string  `json:"notes"`
	Image        string  `json:"image"`
	MenteeID     *string `json:"menteeId,omitempty"`
	MentorUserID *string `json:"mentorUserId,omitempty"`
}

type DonationCampaign struct {
	ID              string  `gorm:"primaryKey" json:"id"`
	Title           string  `json:"title"`
	Category        string  `json:"category"`
	TargetAmount    float64 `json:"targetAmount"`
	CollectedAmount float64 `json:"collectedAmount"`
	Description     string  `json:"description"`
	BannerUrl       string  `json:"bannerUrl"`
	BankName        string  `json:"bankName"`
	AccountNumber   string  `json:"accountNumber"`
	AccountName     string  `json:"accountName"`
	DonorsCount     int     `json:"donorsCount"`
	DaysRemaining   int     `json:"daysRemaining"`
}

type DonationRecord struct {
	ID            string  `gorm:"primaryKey" json:"id"`
	CampaignID    string  `json:"campaignId"`
	CampaignTitle string  `json:"campaignTitle"`
	DonorName     string  `json:"donorName"`
	Amount        float64 `json:"amount"`
	Message       string  `json:"message"`
	Date          string  `json:"date"`
	PaymentMethod string  `json:"paymentMethod"`
	CityID        *string `json:"cityId,omitempty"`
	UserID        *string `json:"userId,omitempty"`
	Status        string  `json:"status"`
	VerifiedBy    *string `json:"verifiedBy,omitempty"`
	VerifiedAt    string  `json:"verifiedAt,omitempty"`
}

type AttendanceCheckIn struct {
	ID              string    `gorm:"primaryKey" json:"id"`
	EventID         string    `json:"eventId"`
	UserID          string    `json:"userId"`
	CheckedInByUser string    `gorm:"column:checked_in_by_user_id" json:"checkedInByUser"`
	CheckedInAt     time.Time `json:"checkedInAt"`
}

func (AttendanceCheckIn) TableName() string { return "event_attendances" }

type DiscipleshipLink struct {
	ID          string `gorm:"primaryKey" json:"id"`
	Title       string `json:"title"`
	Url         string `json:"url"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

type JobOpportunity struct {
	ID               string         `gorm:"primaryKey" json:"id"`
	Title            string         `json:"title"`
	Company          string         `json:"company"`
	LogoUrl          string         `json:"logoUrl"`
	Location         string         `json:"location"`
	Salary           string         `json:"salary"`
	JobType          string         `json:"jobType"`
	Category         string         `json:"category"`
	Description      string         `json:"description"`
	Requirements     pq.StringArray `gorm:"type:text[]" json:"requirements"`
	Responsibilities pq.StringArray `gorm:"type:text[]" json:"responsibilities"`
	ContactInfo      string         `json:"contactInfo"`
	PostedDate       string         `json:"postedDate"`
	Status           string         `json:"status"`
	ApplicantsCount  int            `json:"applicantsCount"`
}

type JobApplication struct {
	ID              string  `gorm:"primaryKey" json:"id"`
	JobID           string  `json:"jobId"`
	ApplicantName   string  `json:"applicantName"`
	ApplicantPhone  string  `json:"applicantPhone"`
	ApplicantEmail  string  `json:"applicantEmail"`
	ApplicantResume string  `json:"applicantResume"`
	AppliedDate     string  `json:"appliedDate"`
	Notes           string  `json:"notes"`
	CityID          *string `json:"cityId,omitempty"`
	UserID          *string `json:"userId,omitempty"`
}

type AuditLog struct {
	ID           string         `gorm:"primaryKey" json:"id"`
	ActorUserID  *string        `json:"actorUserId,omitempty"`
	Action       string         `json:"action"`
	ResourceType string         `json:"resourceType"`
	ResourceID   *string        `json:"resourceId,omitempty"`
	ScopeType    *string        `json:"scopeType,omitempty"`
	ScopeID      *string        `json:"scopeId,omitempty"`
	Outcome      string         `json:"outcome"`
	RequestID    string         `json:"requestId,omitempty"`
	IPAddress    string         `json:"ipAddress,omitempty"`
	Metadata     map[string]any `gorm:"serializer:json" json:"metadata"`
	CreatedAt    string         `json:"createdAt"`
}

type AccessContext struct {
	UserID      string   `json:"userId"`
	Permissions []string `json:"permissions"`
	Roles       []string `json:"roles"`
	CityIDs     []string `json:"cityIds"`
	AllCities   bool     `json:"allCities"`
}

type ScopeCatalog struct {
	Cities []City `json:"cities"`
}

// Struct to parse the sync payloads from frontend
type SyncItem struct {
	ID       string `json:"id"`
	ItemType string `json:"itemType"` // "member" | "berita" | "jurnal_pa" | "link" | "job" | "application"
	Action   string `json:"action"`   // "create" | "update" | "delete"
	Data     any    `json:"data"`
}

type SyncPayload struct {
	PendingChanges []SyncItem `json:"pendingChanges"`
}
