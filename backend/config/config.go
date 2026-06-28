package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	DBHost       string
	DBPort       string
	DBUser       string
	DBPassword   string
	DBName       string
	GeminiAPIKey string
	AppPort      string
	AppEnv       string
}

func LoadConfig() *Config {
	// Load .env from local directory
	_ = godotenv.Load(".env")

	return &Config{
		DBHost:       getEnv("DB_HOST", "localhost"),
		DBPort:       getEnv("DB_PORT", "5432"),
		DBUser:       getEnv("DB_USER", "postgres"),
		DBPassword:   getEnv("DB_PASSWORD", "postgres"),
		DBName:       getEnv("DB_NAME", "sion_ministry"),
		GeminiAPIKey: os.Getenv("GEMINI_API_KEY"),
		AppPort:      getEnv("PORT", "3000"),
		AppEnv:       getEnv("APP_ENV", "development"),
	}
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
