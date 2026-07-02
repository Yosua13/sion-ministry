package database

import (
	"database/sql"
	"fmt"
	"log"

	"backend/config"

	_ "github.com/lib/pq"
	gormpostgres "gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func InitDatabase(cfg *config.Config) (*gorm.DB, error) {
	// 1. First, connect to default 'postgres' database to ensure the target DB exists
	adminDSN := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=postgres sslmode=disable",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword,
	)

	dbAdmin, err := sql.Open("postgres", adminDSN)
	if err != nil {
		return nil, fmt.Errorf("failed to open admin db connection: %w", err)
	}
	defer dbAdmin.Close()

	// Check if target database exists
	var exists bool
	query := fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = '%s')", cfg.DBName)
	err = dbAdmin.QueryRow(query).Scan(&exists)
	if err != nil {
		return nil, fmt.Errorf("failed to check if database exists: %w", err)
	}

	if !exists {
		log.Printf("Database %s does not exist. Creating database...", cfg.DBName)
		_, err = dbAdmin.Exec(fmt.Sprintf("CREATE DATABASE %s", cfg.DBName))
		if err != nil {
			return nil, fmt.Errorf("failed to create database: %w", err)
		}
		log.Printf("Database %s created successfully.", cfg.DBName)
	}

	// 2. Connect to the actual target database
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable TimeZone=Asia/Jakarta",
		cfg.DBHost, cfg.DBPort, cfg.DBUser, cfg.DBPassword, cfg.DBName,
	)

	gormConfig := &gorm.Config{}
	if cfg.AppEnv == "development" {
		gormConfig.Logger = logger.Default.LogMode(logger.Info)
	} else {
		gormConfig.Logger = logger.Default.LogMode(logger.Error)
	}

	db, err := gorm.Open(gormpostgres.Open(dsn), gormConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database %s: %w", cfg.DBName, err)
	}

	log.Printf("Connected to PostgreSQL database: %s", cfg.DBName)

	// 3. Run manual versioned SQL migrations
	if err := RunMigrations(db); err != nil {
		return nil, fmt.Errorf("failed to run manual database migrations: %w", err)
	}

	log.Println("Manual database migrations executed successfully.")

	return db, nil
}
