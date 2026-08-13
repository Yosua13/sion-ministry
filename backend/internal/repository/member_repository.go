package repository

import (
	"errors"
	"math"
	"strings"
	"time"

	"backend/internal/models"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var ErrMemberVersionConflict = errors.New("versi data anggota sudah berubah")

type MemberRepository interface {
	List(query models.MemberListQuery) (*models.MemberListResult, error)
	GetByID(id string) (*models.Member, error)
	FindDuplicates(member *models.Member, excludeID string, cityIDs []string, allCities bool) ([]models.Member, error)
	Create360(member *models.Member, histories []models.MemberHistory, consent *models.MemberConsentHistory, reviews []models.MemberDuplicateReview) error
	Update360(member *models.Member, expectedVersion int, histories []models.MemberHistory, consent *models.MemberConsentHistory, reviews []models.MemberDuplicateReview) error
	Archive(id string, expectedVersion int, actorID, reason string, history *models.MemberHistory) error
	GetHistory(memberID string) (*models.MemberHistoryResult, error)
	Export(query models.MemberListQuery, limit int) ([]models.Member, error)
	ListDuplicateReviews(status string, cityIDs []string, allCities bool) ([]models.MemberDuplicateReview, error)
	GetDuplicateReview(id string) (*models.MemberDuplicateReview, error)
	DecideDuplicateReview(id, decision, note, actorID string) (*models.MemberDuplicateReview, error)
}

type memberRepository struct {
	db *gorm.DB
}

func NewMemberRepository(db *gorm.DB) MemberRepository {
	return &memberRepository{db: db}
}

func memberScopedQuery(db *gorm.DB, query models.MemberListQuery) *gorm.DB {
	if query.SelfUserID != "" {
		db = db.Where("user_id = ?", query.SelfUserID)
	} else if !query.AllCities {
		if len(query.CityIDs) == 0 {
			return db.Where("1 = 0")
		}
		db = db.Where("primary_service_point_id IN ?", query.CityIDs)
	}
	if query.CityID != "" {
		db = db.Where("primary_service_point_id = ?", query.CityID)
	}
	if query.Status != "" {
		if query.Status == "archived" && !query.IncludeArchived {
			db = db.Where("1 = 0")
		} else {
			db = db.Where("status = ?", query.Status)
		}
	} else if !query.IncludeArchived {
		db = db.Where("status <> 'archived'")
	}
	if search := strings.TrimSpace(query.Search); search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		digits := strings.NewReplacer("+", "", "-", "", " ", "", "(", "", ")", "").Replace(search)
		phonePattern := "%" + digits + "%"
		db = db.Where("normalized_name LIKE ? OR normalized_email LIKE ? OR REPLACE(normalized_phone, '+', '') LIKE ?", pattern, pattern, phonePattern)
	}
	return db
}

func (r *memberRepository) List(query models.MemberListQuery) (*models.MemberListResult, error) {
	page := query.Page
	if page < 1 {
		page = 1
	}
	pageSize := query.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	base := memberScopedQuery(r.db.Model(&models.Member{}), query)
	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, err
	}
	var members []models.Member
	if err := base.Order("updated_at DESC, id ASC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&members).Error; err != nil {
		return nil, err
	}
	return &models.MemberListResult{
		Items: members, Page: page, PageSize: pageSize, Total: total,
		TotalPages: int(math.Ceil(float64(total) / float64(pageSize))),
	}, nil
}

func (r *memberRepository) GetByID(id string) (*models.Member, error) {
	var member models.Member
	err := r.db.First(&member, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *memberRepository) FindDuplicates(member *models.Member, excludeID string, cityIDs []string, allCities bool) ([]models.Member, error) {
	conditions := make([]string, 0, 3)
	args := make([]any, 0, 6)
	if member.NormalizedPhone != "" {
		conditions = append(conditions, "normalized_phone = ?")
		args = append(args, member.NormalizedPhone)
	}
	if member.NormalizedEmail != "" {
		conditions = append(conditions, "normalized_email = ?")
		args = append(args, member.NormalizedEmail)
	}
	if member.NormalizedName != "" && member.PrimaryServicePointID != "" {
		conditions = append(conditions, "(normalized_name = ? AND primary_service_point_id = ?)")
		args = append(args, member.NormalizedName, member.PrimaryServicePointID)
	}
	if len(conditions) == 0 {
		return []models.Member{}, nil
	}
	db := r.db.Where("("+strings.Join(conditions, " OR ")+")", args...).Where("status <> 'archived'")
	if excludeID != "" {
		db = db.Where("id <> ?", excludeID)
	}
	if !allCities {
		if len(cityIDs) == 0 {
			return []models.Member{}, nil
		}
		db = db.Where("primary_service_point_id IN ?", cityIDs)
	}
	var candidates []models.Member
	err := db.Order("updated_at DESC").Limit(20).Find(&candidates).Error
	return candidates, err
}

func (r *memberRepository) Create360(member *models.Member, histories []models.MemberHistory, consent *models.MemberConsentHistory, reviews []models.MemberDuplicateReview) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(member).Error; err != nil {
			return err
		}
		if len(histories) > 0 {
			if err := tx.Create(&histories).Error; err != nil {
				return err
			}
		}
		if consent != nil {
			if err := tx.Create(consent).Error; err != nil {
				return err
			}
		}
		if len(reviews) > 0 {
			return tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&reviews).Error
		}
		return nil
	})
}

func (r *memberRepository) Update360(member *models.Member, expectedVersion int, histories []models.MemberHistory, consent *models.MemberConsentHistory, reviews []models.MemberDuplicateReview) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&models.Member{}).Where("id = ? AND version = ?", member.ID, expectedVersion).
			Select("name", "normalized_name", "email", "normalized_email", "phone", "normalized_phone", "city_id", "city_name", "primary_service_point_id", "discipleship_stage", "mentor_name", "mentor_user_id", "group_name", "joined_date", "joined_on", "status", "user_id", "owner_user_id", "version", "consent_status", "consent_source", "consent_purpose", "consent_recorded_at", "communication_preferences", "updated_at").Updates(member)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return ErrMemberVersionConflict
		}
		if len(histories) > 0 {
			if err := tx.Create(&histories).Error; err != nil {
				return err
			}
		}
		if consent != nil {
			if err := tx.Create(consent).Error; err != nil {
				return err
			}
		}
		if len(reviews) > 0 {
			return tx.Clauses(clause.OnConflict{DoNothing: true}).Create(&reviews).Error
		}
		return nil
	})
}

func (r *memberRepository) Archive(id string, expectedVersion int, actorID, reason string, history *models.MemberHistory) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&models.Member{}).Where("id = ? AND version = ? AND status <> 'archived'", id, expectedVersion).Updates(map[string]any{
			"status": "archived", "archived_at": gorm.Expr("NOW()"), "archived_by": actorID,
			"archive_reason": reason, "retention_until": gorm.Expr("NOW() + INTERVAL '5 years'"),
			"updated_at": gorm.Expr("NOW()"), "version": gorm.Expr("version + 1"),
		})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return ErrMemberVersionConflict
		}
		return tx.Create(history).Error
	})
}

func (r *memberRepository) GetHistory(memberID string) (*models.MemberHistoryResult, error) {
	result := &models.MemberHistoryResult{Changes: []models.MemberHistory{}, Consents: []models.MemberConsentHistory{}}
	if err := r.db.Where("member_id = ?", memberID).Order("created_at DESC").Find(&result.Changes).Error; err != nil {
		return nil, err
	}
	if err := r.db.Where("member_id = ?", memberID).Order("recorded_at DESC").Find(&result.Consents).Error; err != nil {
		return nil, err
	}
	return result, nil
}

func (r *memberRepository) Export(query models.MemberListQuery, limit int) ([]models.Member, error) {
	if limit < 1 || limit > 10000 {
		limit = 10000
	}
	var members []models.Member
	err := memberScopedQuery(r.db.Model(&models.Member{}), query).Order("updated_at DESC, id ASC").Limit(limit).Find(&members).Error
	return members, err
}

func (r *memberRepository) ListDuplicateReviews(status string, cityIDs []string, allCities bool) ([]models.MemberDuplicateReview, error) {
	db := r.db.Model(&models.MemberDuplicateReview{}).
		Joins("JOIN members review_member ON review_member.id = member_duplicate_reviews.member_id")
	if status != "" {
		db = db.Where("member_duplicate_reviews.status = ?", status)
	}
	if !allCities {
		if len(cityIDs) == 0 {
			return []models.MemberDuplicateReview{}, nil
		}
		db = db.Where("review_member.primary_service_point_id IN ?", cityIDs)
	}
	var reviews []models.MemberDuplicateReview
	err := db.Select("member_duplicate_reviews.*").Order("member_duplicate_reviews.score DESC, member_duplicate_reviews.created_at").Limit(1000).Find(&reviews).Error
	return reviews, err
}

func (r *memberRepository) GetDuplicateReview(id string) (*models.MemberDuplicateReview, error) {
	var review models.MemberDuplicateReview
	if err := r.db.First(&review, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &review, nil
}

func (r *memberRepository) DecideDuplicateReview(id, decision, note, actorID string) (*models.MemberDuplicateReview, error) {
	now := time.Now().UTC()
	result := r.db.Model(&models.MemberDuplicateReview{}).Where("id = ? AND status = 'pending'", id).Updates(map[string]any{
		"status": decision, "decision_note": note, "decided_by": actorID, "decided_at": now,
	})
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected != 1 {
		return nil, errors.New("duplicate review tidak ditemukan atau sudah diputuskan")
	}
	return r.GetDuplicateReview(id)
}
