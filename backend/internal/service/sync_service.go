package service

import (
	"encoding/json"
	"fmt"
	"log"

	"backend/internal/models"
	"backend/internal/repository"
	"gorm.io/gorm"
)

type syncService struct {
	db         *gorm.DB
	cityRepo   repository.CityRepository
	memberRepo repository.MemberRepository
	beritaRepo repository.BeritaRepository
	jurnalRepo repository.JurnalRepository
	linkRepo   repository.LinkRepository
}

func NewSyncService(
	db *gorm.DB,
	cityRepo repository.CityRepository,
	memberRepo repository.MemberRepository,
	beritaRepo repository.BeritaRepository,
	jurnalRepo repository.JurnalRepository,
	linkRepo repository.LinkRepository,
) SyncService {
	return &syncService{
		db:         db,
		cityRepo:   cityRepo,
		memberRepo: memberRepo,
		beritaRepo: beritaRepo,
		jurnalRepo: jurnalRepo,
		linkRepo:   linkRepo,
	}
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

func (s *syncService) Sync(payload *models.SyncPayload) error {
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
				if item.Action == "create" || item.Action == "update" {
					if err := tx.Save(member).Error; err != nil {
						return err
					}
				} else if item.Action == "delete" {
					if err := tx.Delete(&models.Member{}, "id = ?", item.ID).Error; err != nil {
						return err
					}
				}

			case "berita":
				berita, err := decodeData[models.BeritaAcara](item.Data)
				if err != nil {
					return fmt.Errorf("failed to decode berita: %w", err)
				}
				if item.Action == "create" || item.Action == "update" {
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
				members_count = COALESCE((SELECT COUNT(*) FROM members m WHERE m.city_id = c.id), 0),
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
