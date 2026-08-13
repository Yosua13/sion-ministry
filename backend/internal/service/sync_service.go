package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"backend/internal/models"
	"backend/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type syncService struct {
	db *gorm.DB
}

func NewSyncService(db *gorm.DB) SyncService {
	return &syncService{db: db}
}

func decodeData[T any](data interface{}) (*T, error) {
	bytes, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}
	var target T
	if err := json.Unmarshal(bytes, &target); err != nil {
		return nil, err
	}
	return &target, nil
}

func (s *syncService) Sync(payload *models.SyncPayload, actorID string, cityIDs []string, allCities bool) error {
	if len(payload.PendingChanges) == 0 {
		return nil
	}

	return s.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range payload.PendingChanges {
			log.Printf("Syncing item ID: %s, Type: %s, Action: %s", item.ID, item.ItemType, item.Action)

			switch item.ItemType {
			case "member":
				member, err := decodeData[models.Member](item.Data)
				if err != nil {
					return fmt.Errorf("failed to decode member: %w", err)
				}
				if item.Action == "create" {
					if err := validateAndNormalizeMember(member); err != nil {
						return err
					}
					if member.ID == "" {
						member.ID = uuid.NewString()
					}
					now := time.Now().UTC()
					member.Version, member.OwnerUserID, member.CreatedAt, member.UpdatedAt = 1, pointer(actorID), now, now
					if member.ConsentRecordedAt == nil {
						member.ConsentRecordedAt = &now
					}
					var matches []models.Member
					duplicateQuery := tx.Where("status <> 'archived' AND ((normalized_phone <> '' AND normalized_phone = ?) OR (normalized_email <> '' AND normalized_email = ?) OR (normalized_name = ? AND primary_service_point_id = ?))", member.NormalizedPhone, member.NormalizedEmail, member.NormalizedName, member.PrimaryServicePointID)
					if !allCities {
						duplicateQuery = duplicateQuery.Where("primary_service_point_id IN ?", cityIDs)
					}
					if err := duplicateQuery.Limit(20).Find(&matches).Error; err != nil {
						return err
					}
					candidates := duplicateCandidates(member, matches)
					if err := duplicateGate(member, candidates); err != nil {
						return err
					}
					if err := tx.Create(member).Error; err != nil {
						return err
					}
					history := newMemberHistory(member.ID, actorID, "created", "member", "", member.Name, member.DuplicateOverrideReason)
					if err := tx.Create(&history).Error; err != nil {
						return err
					}
					if err := tx.Create(newConsentHistory(member, actorID, *member.ConsentRecordedAt)).Error; err != nil {
						return err
					}
					if reviews := reviewsFor(member.ID, member.DuplicateOverrideReason, candidates); len(reviews) > 0 {
						if err := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&reviews).Error; err != nil {
							return err
						}
					}
				} else if item.Action == "update" {
					var old models.Member
					if err := tx.First(&old, "id = ?", item.ID).Error; err != nil {
						return err
					}
					if member.Version != old.Version {
						return repository.ErrMemberVersionConflict
					}
					if err := validateAndNormalizeMember(member); err != nil {
						return err
					}
					member.ID, member.Version, member.CreatedAt, member.UpdatedAt = old.ID, old.Version+1, old.CreatedAt, time.Now().UTC()
					member.OwnerUserID, member.UserID = old.OwnerUserID, old.UserID
					var matches []models.Member
					duplicateQuery := tx.Where("id <> ? AND status <> 'archived' AND ((normalized_phone <> '' AND normalized_phone = ?) OR (normalized_email <> '' AND normalized_email = ?) OR (normalized_name = ? AND primary_service_point_id = ?))", member.ID, member.NormalizedPhone, member.NormalizedEmail, member.NormalizedName, member.PrimaryServicePointID)
					if !allCities {
						duplicateQuery = duplicateQuery.Where("primary_service_point_id IN ?", cityIDs)
					}
					if err := duplicateQuery.Limit(20).Find(&matches).Error; err != nil {
						return err
					}
					candidates := duplicateCandidates(member, matches)
					if err := duplicateGate(member, candidates); err != nil {
						return err
					}
					var consent *models.MemberConsentHistory
					if consentChanged(&old, member) {
						recorded := time.Now().UTC()
						member.ConsentRecordedAt = &recorded
						consent = newConsentHistory(member, actorID, recorded)
					} else {
						member.ConsentRecordedAt = old.ConsentRecordedAt
					}
					result := tx.Model(&models.Member{}).Where("id = ? AND version = ?", member.ID, old.Version).Select("*").Omit("id", "duplicate_override_reason", "archived_at", "archived_by", "archive_reason", "retention_until").Updates(member)
					if result.Error != nil {
						return result.Error
					}
					if result.RowsAffected != 1 {
						return repository.ErrMemberVersionConflict
					}
					if histories := changedHistory(member.ID, actorID, &old, member); len(histories) > 0 {
						if err := tx.Create(&histories).Error; err != nil {
							return err
						}
					}
					if consent != nil {
						if err := tx.Create(consent).Error; err != nil {
							return err
						}
					}
				} else if item.Action == "delete" {
					reason := strings.TrimSpace(member.ArchiveReason)
					if len([]rune(reason)) < 10 {
						return errors.New("archive member melalui sinkronisasi membutuhkan archiveReason minimal 10 karakter")
					}
					var old models.Member
					if err := tx.First(&old, "id = ?", item.ID).Error; err != nil {
						return err
					}
					if err := tx.Model(&models.Member{}).Where("id = ?", item.ID).Updates(map[string]any{"status": "archived", "archived_at": time.Now().UTC(), "archived_by": actorID, "archive_reason": reason, "retention_until": gorm.Expr("NOW() + INTERVAL '5 years'"), "version": gorm.Expr("version + 1"), "updated_at": time.Now().UTC()}).Error; err != nil {
						return err
					}
					history := newMemberHistory(item.ID, actorID, "archived", "status", old.Status, "archived", reason)
					if err := tx.Create(&history).Error; err != nil {
						return err
					}
				}

			case "berita":
				berita, err := decodeData[models.BeritaAcara](item.Data)
				if err != nil {
					return fmt.Errorf("failed to decode berita: %w", err)
				}
				if item.Action == "create" || item.Action == "update" {
					for i, img := range berita.Images {
						newPath, err := saveBase64Image(img, "berita")
						if err == nil {
							berita.Images[i] = newPath
						}
					}
					if err := tx.Save(berita).Error; err != nil {
						return err
					}
				} else if item.Action == "delete" {
					if err := tx.Delete(&models.BeritaAcara{}, "id = ?", item.ID).Error; err != nil {
						return err
					}
				}

			case "jurnal_pa":
				jurnal, err := decodeData[models.JurnalPA](item.Data)
				if err != nil {
					return fmt.Errorf("failed to decode jurnal_pa: %w", err)
				}
				if item.Action == "create" || item.Action == "update" {
					newPath, err := saveBase64Image(jurnal.Image, "jurnal")
					if err == nil {
						jurnal.Image = newPath
					}
					if err := tx.Save(jurnal).Error; err != nil {
						return err
					}
				} else if item.Action == "delete" {
					if err := tx.Delete(&models.JurnalPA{}, "id = ?", item.ID).Error; err != nil {
						return err
					}
				}

			case "link":
				link, err := decodeData[models.DiscipleshipLink](item.Data)
				if err != nil {
					return fmt.Errorf("failed to decode link: %w", err)
				}
				if item.Action == "create" || item.Action == "update" {
					if err := tx.Save(link).Error; err != nil {
						return err
					}
				} else if item.Action == "delete" {
					if err := tx.Delete(&models.DiscipleshipLink{}, "id = ?", item.ID).Error; err != nil {
						return err
					}
				}
			}
		}

		// Recalculate stats for cities after sync
		query := `
			UPDATE cities c
			SET 
				members_count = COALESCE((SELECT COUNT(*) FROM members m WHERE m.city_id = c.id AND m.status <> 'archived'), 0),
				berita_count = COALESCE((SELECT COUNT(*) FROM berita_acaras b WHERE b.city_id = c.id), 0),
				jurnal_pa_count = COALESCE((SELECT COUNT(*) FROM jurnal_pas j WHERE j.city_id = c.id), 0),
				journals_count = COALESCE((SELECT COUNT(*) FROM berita_acaras b WHERE b.city_id = c.id), 0) + 
				                 COALESCE((SELECT COUNT(*) FROM jurnal_pas j WHERE j.city_id = c.id), 0)
		`
		if err := tx.Exec(query).Error; err != nil {
			return fmt.Errorf("failed to recalculate city stats: %w", err)
		}

		return nil
	})
}
