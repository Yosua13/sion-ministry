package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost                 string
	DBPort                 string
	DBUser                 string
	DBPassword             string
	DBName                 string
	GeminiAPIKey           string
	AppPort                string
	AppEnv                 string
	AllowedOrigins         []string
	SessionTTL             time.Duration
	UploadDir              string
	BootstrapAdminEmail    string
	BootstrapAdminPassword string
	SentryDSN              string
	S3Endpoint             string
	S3Region               string
	S3Bucket               string
	S3Prefix               string
	S3UsePathStyle         bool
	SignedURLTTL           time.Duration
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

	return &Config{
		DBHost:                 os.Getenv("DB_HOST"),
		DBPort:                 os.Getenv("DB_PORT"),
		DBUser:                 os.Getenv("DB_USER"),
		DBPassword:             os.Getenv("DB_PASSWORD"),
		DBName:                 os.Getenv("DB_NAME"),
		GeminiAPIKey:           os.Getenv("GEMINI_API_KEY"),
		AppPort:                getEnv("PORT", "3000"),
		AppEnv:                 appEnv,
		AllowedOrigins:         origins,
		SessionTTL:             sessionTTL,
		UploadDir:              getEnv("UPLOAD_DIR", "./uploads"),
		BootstrapAdminEmail:    strings.TrimSpace(os.Getenv("BOOTSTRAP_ADMIN_EMAIL")),
		BootstrapAdminPassword: os.Getenv("BOOTSTRAP_ADMIN_PASSWORD"),
		SentryDSN:              strings.TrimSpace(os.Getenv("SENTRY_DSN")),
		S3Endpoint:             strings.TrimSpace(os.Getenv("S3_ENDPOINT")),
		S3Region:               strings.TrimSpace(os.Getenv("S3_REGION")),
		S3Bucket:               s3Bucket,
		S3Prefix:               strings.Trim(strings.TrimSpace(getEnv("S3_PREFIX", "uploads")), "/"),
		S3UsePathStyle:         strings.EqualFold(getEnv("S3_USE_PATH_STYLE", "false"), "true"),
		SignedURLTTL:           signedURLTTL,
	}, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
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
