package service

import (
	"encoding/json"
	"errors"
	"fmt"

	"backend/internal/models"

	"gorm.io/gorm"
)

type syncService struct{ db *gorm.DB }

func NewSyncService(db *gorm.DB) SyncService { return &syncService{db: db} }

func decodeData[T any](data any) (*T, error) {
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

// Member creation is deliberately excluded from offline sync: it is a transaction
// that must atomically create an invitation and send an activation link.
func (s *syncService) Sync(payload *models.SyncPayload, _ string, _ []string, _ bool) error {
	if payload == nil {
		return errors.New("payload sinkronisasi tidak valid")
	}
	return s.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range payload.PendingChanges {
			if item.ItemType == "member" {
				return errors.New("profil anggota harus dibuat online agar undangan aktivasi aman")
			}
			switch item.ItemType {
			case "berita":
				value, err := decodeData[models.BeritaAcara](item.Data)
				if err != nil {
					return fmt.Errorf("payload berita tidak valid: %w", err)
				}
				if item.Action == "delete" {
					if err := tx.Delete(&models.BeritaAcara{}, "id = ?", item.ID).Error; err != nil {
						return err
					}
				} else if item.Action == "create" || item.Action == "update" {
					if err := tx.Save(value).Error; err != nil {
						return err
					}
				}
			case "jurnal_pa":
				value, err := decodeData[models.JurnalPA](item.Data)
				if err != nil {
					return fmt.Errorf("payload jurnal tidak valid: %w", err)
				}
				if item.Action == "delete" {
					if err := tx.Delete(&models.JurnalPA{}, "id = ?", item.ID).Error; err != nil {
						return err
					}
				} else if item.Action == "create" || item.Action == "update" {
					if err := tx.Save(value).Error; err != nil {
						return err
					}
				}
			case "link":
				value, err := decodeData[models.DiscipleshipLink](item.Data)
				if err != nil {
					return fmt.Errorf("payload link tidak valid: %w", err)
				}
				if item.Action == "delete" {
					if err := tx.Delete(&models.DiscipleshipLink{}, "id = ?", item.ID).Error; err != nil {
						return err
					}
				} else if item.Action == "create" || item.Action == "update" {
					if err := tx.Save(value).Error; err != nil {
						return err
					}
				}
			default:
				return fmt.Errorf("tipe sinkronisasi %q tidak diizinkan", item.ItemType)
			}
		}
		return nil
	})
}
