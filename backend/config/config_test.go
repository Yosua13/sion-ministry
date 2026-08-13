package config

import "testing"

func TestLoadConfigSupportsSMTPAliases(t *testing.T) {
	for key, value := range map[string]string{
		"DB_HOST": "localhost", "DB_PORT": "5432", "DB_USER": "test", "DB_PASSWORD": "test", "DB_NAME": "test",
		"APP_ENV": "development", "SMTP_HOST": "smtp.example.test", "SMTP_PORT": "587",
		"SMTP_USERNAME": "", "SMTP_PASSWORD": "", "SMTP_FROM": "",
		"SMTP_USER": "mailer@example.test", "SMTP_PASS": "app-password", "SMTP_SENDER": "Sion Ministry <mailer@example.test>",
	} {
		t.Setenv(key, value)
	}

	cfg, err := LoadConfig()
	if err != nil {
		t.Fatalf("LoadConfig() error = %v", err)
	}
	if cfg.SMTPUsername != "mailer@example.test" || cfg.SMTPPassword != "app-password" || cfg.SMTPFrom != "Sion Ministry <mailer@example.test>" {
		t.Fatalf("SMTP aliases were not resolved: %#v", cfg)
	}
}

func TestLoadConfigRejectsPartialSMTPConfiguration(t *testing.T) {
	for key, value := range map[string]string{
		"DB_HOST": "localhost", "DB_PORT": "5432", "DB_USER": "test", "DB_PASSWORD": "test", "DB_NAME": "test",
		"APP_ENV": "development", "SMTP_HOST": "smtp.example.test", "SMTP_PORT": "587",
		"SMTP_USERNAME": "", "SMTP_PASSWORD": "", "SMTP_FROM": "", "SMTP_USER": "", "SMTP_PASS": "", "SMTP_SENDER": "",
	} {
		t.Setenv(key, value)
	}

	if _, err := LoadConfig(); err == nil {
		t.Fatal("LoadConfig() succeeded with partial SMTP configuration")
	}
}
