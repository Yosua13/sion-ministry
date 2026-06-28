package database

import (
	"embed"
	"fmt"
	"log"
	"sort"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

//go:embed migrations/*.sql
var migrationFiles embed.FS

type SchemaMigration struct {
	Version int `gorm:"primaryKey" json:"version"`
}

func RunMigrations(db *gorm.DB) error {
	// Ensure migration tracking table exists using GORM
	if err := db.AutoMigrate(&SchemaMigration{}); err != nil {
		return fmt.Errorf("failed to create migration table: %w", err)
	}

	// Get currently applied version
	var currentVersion SchemaMigration
	err := db.Order("version desc").First(&currentVersion).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return fmt.Errorf("failed to check current schema version: %w", err)
	}

	// Read migration files
	files, err := migrationFiles.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %w", err)
	}

	// Filter and sort .up.sql migrations
	type migrationStep struct {
		version int
		name    string
		sqlPath string
	}
	var steps []migrationStep

	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".up.sql") {
			continue
		}

		parts := strings.Split(file.Name(), "_")
		if len(parts) < 2 {
			continue
		}

		version, err := strconv.Atoi(parts[0])
		if err != nil {
			log.Printf("Warning: Skipping invalid migration filename: %s", file.Name())
			continue
		}

		steps = append(steps, migrationStep{
			version: version,
			name:    file.Name(),
			sqlPath: "migrations/" + file.Name(),
		})
	}

	// Sort steps by version ascending
	sort.Slice(steps, func(i, j int) bool {
		return steps[i].version < steps[j].version
	})

	// Run pending migrations
	for _, step := range steps {
		if step.version <= currentVersion.Version {
			continue
		}

		log.Printf("Running manual SQL migration: %s", step.name)
		sqlContent, err := migrationFiles.ReadFile(step.sqlPath)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %w", step.name, err)
		}

		err = db.Transaction(func(tx *gorm.DB) error {
			// Execute SQL
			if err := tx.Exec(string(sqlContent)).Error; err != nil {
				return err
			}
			// Update version
			return tx.Create(&SchemaMigration{Version: step.version}).Error
		})

		if err != nil {
			return fmt.Errorf("migration %s failed: %w", step.name, err)
		}
		log.Printf("Migration %s executed successfully.", step.name)
	}

	return nil
}
