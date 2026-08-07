package models

import "github.com/lib/pq"

type User struct {
	ID           string  `gorm:"primaryKey" json:"id"`
	Name         string  `json:"name"`
	Email        string  `gorm:"uniqueIndex" json:"email"`
	PasswordHash string  `json:"-"`
	Role         string  `json:"role"`
	Status       string  `json:"status"`
	CityID       *string `json:"cityId,omitempty"`
	CityName     string  `json:"cityName"`
	CreatedAt    string  `json:"createdAt"`
	ApprovedAt   string  `json:"approvedAt"`
}

type AuthSession struct {
	Token      string `gorm:"primaryKey" json:"-"`
	ID         string `json:"id"`
	UserID     string `json:"userId"`
	ExpiresAt  string `json:"expiresAt"`
	CreatedAt  string `json:"createdAt"`
	DeviceName string `json:"deviceName"`
	UserAgent  string `json:"userAgent"`
	IPAddress  string `json:"ipAddress"`
	LastSeenAt string `json:"lastSeenAt"`
	RevokedAt  string `json:"revokedAt,omitempty"`
}

type AuthResponse struct {
	Token     string `json:"token"`
	User      User   `json:"user"`
	ExpiresAt string `json:"expiresAt"`
}

type City struct {
	ID             string `gorm:"primaryKey" json:"id"`
	Name           string `json:"name"`
	Region         string `json:"region"`
	ReachedDate    string `json:"reachedDate"`
	WorkersCount   int    `json:"workersCount"`
	MembersCount   int    `json:"membersCount"`
	JournalsCount  int    `json:"journalsCount"`
	BeritaCount    int    `json:"beritaCount"`
	JurnalPaCount  int    `json:"jurnalPaCount"`
	OrganizationID string `json:"organizationId"`
	MinistryUnitID string `json:"ministryUnitId"`
	RegionID       string `json:"regionId"`
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
	ID                string  `gorm:"primaryKey" json:"id"`
	Name              string  `json:"name"`
	CityID            string  `json:"cityId"`
	CityName          string  `json:"cityName"`
	Phone             string  `json:"phone"`
	DiscipleshipStage string  `json:"discipleshipStage"`
	MentorName        string  `json:"mentorName"`
	JoinedDate        string  `json:"joinedDate"`
	Status            string  `json:"status"`
	UserID            *string `json:"userId,omitempty"`
	MentorUserID      *string `json:"mentorUserId,omitempty"`
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
	ID          string `gorm:"primaryKey" json:"id"`
	EventID     string `json:"eventId"`
	MemberID    string `json:"memberId"`
	CityID      string `json:"cityId"`
	CheckedInBy string `json:"checkedInBy"`
	CheckedInAt string `json:"checkedInAt"`
}

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

type Organization struct {
	ID        string `gorm:"primaryKey" json:"id"`
	Name      string `json:"name"`
	Status    string `json:"status"`
	CreatedAt string `json:"createdAt"`
}

type MinistryUnit struct {
	ID             string `gorm:"primaryKey" json:"id"`
	OrganizationID string `json:"organizationId"`
	Name           string `json:"name"`
	Status         string `json:"status"`
	CreatedAt      string `json:"createdAt"`
}

type Region struct {
	ID             string `gorm:"primaryKey" json:"id"`
	MinistryUnitID string `json:"ministryUnitId"`
	Name           string `json:"name"`
	Status         string `json:"status"`
	CreatedAt      string `json:"createdAt"`
}

type RoleAssignment struct {
	ID         string  `gorm:"primaryKey" json:"id"`
	UserID     string  `json:"userId"`
	Role       string  `json:"role"`
	ScopeType  string  `json:"scopeType"`
	ScopeID    string  `json:"scopeId"`
	Status     string  `json:"status"`
	ValidFrom  string  `json:"validFrom"`
	ValidUntil *string `json:"validUntil,omitempty"`
	ApprovedBy *string `json:"approvedBy,omitempty"`
	ApprovedAt *string `json:"approvedAt,omitempty"`
	RevokedAt  *string `json:"revokedAt,omitempty"`
	CreatedAt  string  `json:"createdAt"`
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
	UserID      string           `json:"userId"`
	Permissions []string         `json:"permissions"`
	Roles       []string         `json:"roles"`
	CityIDs     []string         `json:"cityIds"`
	AllCities   bool             `json:"allCities"`
	Assignments []RoleAssignment `json:"assignments"`
}

type ScopeCatalog struct {
	Organizations []Organization `json:"organizations"`
	MinistryUnits []MinistryUnit `json:"ministryUnits"`
	Regions       []Region       `json:"regions"`
	Cities        []City         `json:"cities"`
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
