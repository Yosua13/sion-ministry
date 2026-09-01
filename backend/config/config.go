package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost                    string
	DBPort                    string
	DBUser                    string
	DBPassword                string
	DBName                    string
	GeminiAPIKey              string
	AppPort                   string
	AppEnv                    string
	AllowedOrigins            []string
	SessionTTL                time.Duration
	UploadDir                 string
	BootstrapAdminEmail       string
	BootstrapAdminPassword    string
	SentryDSN                 string
	S3Endpoint                string
	S3Region                  string
	S3Bucket                  string
	S3Prefix                  string
	S3UsePathStyle            bool
	SignedURLTTL              time.Duration
	InvitationTTL             time.Duration
	AppPublicURL              string
	SMTPHost                  string
	SMTPPort                  string
	SMTPUsername              string
	SMTPPassword              string
	SMTPFrom                  string
	GoogleOAuthClientID       string
	GoogleOAuthClientSecret   string
	GoogleOAuthRedirectURL    string
	GoogleSheetsSpreadsheetID string
	GoogleSheetsTab           string
	GoogleTokenEncryptionKey  string
}

func LoadConfig() (*Config, error) {
	// Load .env from local directory
	_ = godotenv.Load(".env")

	appEnv := getEnv("APP_ENV", "development")
	if appEnv != "development" && appEnv != "test" && appEnv != "production" {
		return nil, fmt.Errorf("APP_ENV must be development, test, or production")
	}

	for _, key := range []string{"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME"} {
		if strings.TrimSpace(os.Getenv(key)) == "" {
			return nil, fmt.Errorf("%s must be set", key)
		}
	}

	origins := splitCSV(getEnv("CORS_ALLOWED_ORIGINS", "http://localhost:5173"))
	if appEnv == "production" && len(origins) == 0 {
		return nil, fmt.Errorf("CORS_ALLOWED_ORIGINS must be set in production")
	}
	for _, origin := range origins {
		if origin == "*" {
			return nil, fmt.Errorf("CORS_ALLOWED_ORIGINS must not contain *")
		}
	}

	sessionTTL, err := time.ParseDuration(getEnv("SESSION_TTL", "24h"))
	if err != nil || sessionTTL <= 0 || sessionTTL > 30*24*time.Hour {
		return nil, fmt.Errorf("SESSION_TTL must be between 1ns and 720h")
	}
	signedURLTTL, err := time.ParseDuration(getEnv("S3_SIGNED_URL_TTL", "15m"))
	if err != nil || signedURLTTL <= 0 || signedURLTTL > time.Hour {
		return nil, fmt.Errorf("S3_SIGNED_URL_TTL must be between 1ns and 1h")
	}
	s3Bucket := strings.TrimSpace(os.Getenv("S3_BUCKET"))
	if s3Bucket != "" && strings.TrimSpace(os.Getenv("S3_REGION")) == "" {
		return nil, fmt.Errorf("S3_REGION must be set when S3_BUCKET is configured")
	}
	invitationTTL, err := time.ParseDuration(getEnv("INVITATION_TTL", "72h"))
	if err != nil || invitationTTL <= 0 || invitationTTL > 14*24*time.Hour {
		return nil, fmt.Errorf("INVITATION_TTL must be between 1ns and 336h")
	}
	smtpHost := strings.TrimSpace(os.Getenv("SMTP_HOST"))
	smtpUsername := getEnvFirst("SMTP_USERNAME", "SMTP_USER")
	smtpPassword := getEnvFirst("SMTP_PASSWORD", "SMTP_PASS")
	smtpFrom := getEnvFirst("SMTP_FROM", "SMTP_SENDER")
	smtpConfigured := smtpHost != "" || smtpUsername != "" || smtpPassword != "" || smtpFrom != ""
	if smtpConfigured && (smtpHost == "" || smtpFrom == "") {
		return nil, fmt.Errorf("SMTP configuration is incomplete: SMTP_HOST and SMTP_FROM (or SMTP_SENDER) must be set together")
	}
	if (smtpUsername == "") != (smtpPassword == "") {
		return nil, fmt.Errorf("SMTP_USERNAME (or SMTP_USER) and SMTP_PASSWORD (or SMTP_PASS) must be set together")
	}
	if appEnv == "production" && !smtpConfigured {
		return nil, fmt.Errorf("SMTP_HOST and SMTP_FROM must be set in production")
	}
	googleClientID := strings.TrimSpace(os.Getenv("GOOGLE_OAUTH_CLIENT_ID"))
	googleClientSecret := strings.TrimSpace(os.Getenv("GOOGLE_OAUTH_CLIENT_SECRET"))
	googleRedirectURL := strings.TrimSpace(os.Getenv("GOOGLE_OAUTH_REDIRECT_URL"))
	googleSpreadsheetID := strings.TrimSpace(os.Getenv("GOOGLE_SHEETS_SPREADSHEET_ID"))
	googleTokenKey := strings.TrimSpace(os.Getenv("GOOGLE_TOKEN_ENCRYPTION_KEY"))
	googleValues := []string{googleClientID, googleClientSecret, googleRedirectURL, googleSpreadsheetID, googleTokenKey}
	googleConfigured := 0
	for _, value := range googleValues {
		if value != "" {
			googleConfigured++
		}
	}
	if googleConfigured > 0 && googleConfigured != len(googleValues) {
		return nil, fmt.Errorf("Google Sheets configuration is incomplete")
	}

	return &Config{
		DBHost:                    os.Getenv("DB_HOST"),
		DBPort:                    os.Getenv("DB_PORT"),
		DBUser:                    os.Getenv("DB_USER"),
		DBPassword:                os.Getenv("DB_PASSWORD"),
		DBName:                    os.Getenv("DB_NAME"),
		GeminiAPIKey:              os.Getenv("GEMINI_API_KEY"),
		AppPort:                   getEnv("PORT", "3000"),
		AppEnv:                    appEnv,
		AllowedOrigins:            origins,
		SessionTTL:                sessionTTL,
		UploadDir:                 getEnv("UPLOAD_DIR", "./uploads"),
		BootstrapAdminEmail:       strings.TrimSpace(os.Getenv("BOOTSTRAP_ADMIN_EMAIL")),
		BootstrapAdminPassword:    os.Getenv("BOOTSTRAP_ADMIN_PASSWORD"),
		SentryDSN:                 strings.TrimSpace(os.Getenv("SENTRY_DSN")),
		S3Endpoint:                strings.TrimSpace(os.Getenv("S3_ENDPOINT")),
		S3Region:                  strings.TrimSpace(os.Getenv("S3_REGION")),
		S3Bucket:                  s3Bucket,
		S3Prefix:                  strings.Trim(strings.TrimSpace(getEnv("S3_PREFIX", "uploads")), "/"),
		S3UsePathStyle:            strings.EqualFold(getEnv("S3_USE_PATH_STYLE", "false"), "true"),
		SignedURLTTL:              signedURLTTL,
		InvitationTTL:             invitationTTL,
		AppPublicURL:              strings.TrimRight(strings.TrimSpace(getEnv("APP_PUBLIC_URL", "http://localhost:5173")), "/"),
		SMTPHost:                  smtpHost,
		SMTPPort:                  getEnv("SMTP_PORT", "587"),
		SMTPUsername:              smtpUsername,
		SMTPPassword:              smtpPassword,
		SMTPFrom:                  smtpFrom,
		GoogleOAuthClientID:       googleClientID,
		GoogleOAuthClientSecret:   googleClientSecret,
		GoogleOAuthRedirectURL:    googleRedirectURL,
		GoogleSheetsSpreadsheetID: googleSpreadsheetID,
		GoogleSheetsTab:           strings.TrimSpace(getEnv("GOOGLE_SHEETS_TAB", "Registrasi OH 2026")),
		GoogleTokenEncryptionKey:  googleTokenKey,
	}, nil
}

func (c *Config) GoogleSheetsEnabled() bool {
	return c != nil && c.GoogleOAuthClientID != "" && c.GoogleOAuthClientSecret != "" &&
		c.GoogleOAuthRedirectURL != "" && c.GoogleSheetsSpreadsheetID != "" && c.GoogleTokenEncryptionKey != ""
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// getEnvFirst supports the documented SMTP names and the shorter aliases used
// by several SMTP providers/tutorials. The first non-empty value wins.
func getEnvFirst(keys ...string) string {
	for _, key := range keys {
		if value := strings.TrimSpace(os.Getenv(key)); value != "" {
			return value
		}
	}
	return ""
}

func splitCSV(value string) []string {
	var values []string
	for _, item := range strings.Split(value, ",") {
		if item = strings.TrimSpace(item); item != "" {
			values = append(values, item)
		}
	}
	return values
}
