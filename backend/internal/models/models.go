package models

import "github.com/lib/pq"

type City struct {
	ID            string `gorm:"primaryKey" json:"id"`
	Name          string `json:"name"`
	Region        string `json:"region"`
	ReachedDate   string `json:"reachedDate"`
	WorkersCount  int    `json:"workersCount"`
	MembersCount  int    `json:"membersCount"`
	JournalsCount int    `json:"journalsCount"`
	BeritaCount   int    `json:"beritaCount"`
	JurnalPaCount int    `json:"jurnalPaCount"`
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
	ID                string `gorm:"primaryKey" json:"id"`
	Name              string `json:"name"`
	CityID            string `json:"cityId"`
	CityName          string `json:"cityName"`
	Phone             string `json:"phone"`
	DiscipleshipStage string `json:"discipleshipStage"`
	MentorName        string `json:"mentorName"`
	JoinedDate        string `json:"joinedDate"`
	Status            string `json:"status"`
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
}

type JurnalPA struct {
	ID         string `gorm:"primaryKey" json:"id"`
	CityID     string `json:"cityId"`
	CityName   string `json:"cityName"`
	Theme      string `json:"theme"`
	Scripture  string `json:"scripture"`
	Focus      string `json:"focus"`
	Date       string `json:"date"`
	MentorName string `json:"mentorName"`
	MenteeName string `json:"menteeName"`
	Notes      string `json:"notes"`
	Image      string `json:"image"`
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
	ID              string `gorm:"primaryKey" json:"id"`
	JobID           string `json:"jobId"`
	ApplicantName   string `json:"applicantName"`
	ApplicantPhone  string `json:"applicantPhone"`
	ApplicantEmail  string `json:"applicantEmail"`
	ApplicantResume string `json:"applicantResume"`
	AppliedDate     string `json:"appliedDate"`
	Notes           string `json:"notes"`
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
