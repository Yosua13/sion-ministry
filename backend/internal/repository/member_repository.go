package repository

import (
	"encoding/json"
	"errors"
	"math"
	"strings"
	"time"

	"backend/internal/models"

	"gorm.io/gorm"
)

var ErrMemberVersionConflict = errors.New("versi profil anggota sudah berubah")

type MemberRepository interface {
	List(query models.MemberListQuery) (*models.MemberListResult, error)
	GetByID(id string) (*models.Member, error)
	FindDuplicates(member *models.Member, excludeID string, cityIDs []string, allCities bool) ([]models.Member, error)
	UpdateProfile(member *models.Member, expectedVersion int, histories []models.MemberHistory, consent *models.MemberConsentHistory) error
	Archive(id string, expectedVersion int, actorID, reason string, history *models.MemberHistory) error
	GetHistory(memberID string) (*models.MemberHistoryResult, error)
	Export(query models.MemberListQuery, limit int) ([]models.Member, error)
	CreateConsent(consent *models.MemberConsentHistory) error
}

type memberRepository struct{ db *gorm.DB }

func NewMemberRepository(db *gorm.DB) MemberRepository { return &memberRepository{db: db} }

func memberSelect(db *gorm.DB) *gorm.DB {
	return db.Select(`users.*, cities.name AS city_name,
		COALESCE(latest_consent.status, 'unknown') AS consent_status,
		COALESCE(latest_consent.source, '') AS consent_source,
		COALESCE(latest_consent.purpose, '') AS consent_purpose,
		latest_consent.recorded_at AS consent_recorded_at,
		COALESCE(latest_consent.channels, ARRAY[]::TEXT[]) AS communication_preferences`).
		Joins("JOIN cities ON cities.id = users.city_id").
		Joins(`LEFT JOIN LATERAL (
			SELECT status, source, purpose, recorded_at, channels
			FROM consent_records
			WHERE consent_records.user_id = users.id
			ORDER BY recorded_at DESC, created_at DESC
			LIMIT 1
		) latest_consent ON TRUE`)
}

func memberScopedQuery(db *gorm.DB, query models.MemberListQuery) *gorm.DB {
	db = db.Where("users.is_member = TRUE")
	if query.SelfUserID != "" {
		db = db.Where("users.id = ?", query.SelfUserID)
	} else if !query.AllCities {
		if len(query.CityIDs) == 0 {
			return db.Where("1 = 0")
		}
		db = db.Where("users.city_id IN ?", query.CityIDs)
	}
	if query.CityID != "" {
		db = db.Where("users.city_id = ?", query.CityID)
	}
	if query.Status != "" {
		if query.Status == "archived" && !query.IncludeArchived {
			db = db.Where("1 = 0")
		} else {
			db = db.Where("users.member_status = ?", query.Status)
		}
	} else if !query.IncludeArchived {
		db = db.Where("users.member_status <> 'archived'")
	}
	if search := strings.TrimSpace(query.Search); search != "" {
		pattern := "%" + strings.ToLower(search) + "%"
		digits := strings.NewReplacer("+", "", "-", "", " ", "", "(", "", ")", "").Replace(search)
		db = db.Where("LOWER(users.full_name) LIKE ? OR LOWER(users.email::TEXT) LIKE ? OR REPLACE(users.phone_e164, '+', '') LIKE ?", pattern, pattern, "%"+digits+"%")
	}
	return db
}

func (r *memberRepository) List(query models.MemberListQuery) (*models.MemberListResult, error) {
	page := max(query.Page, 1)
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
	if err := memberSelect(memberScopedQuery(r.db.Model(&models.Member{}), query)).
		Order("users.updated_at DESC, users.id ASC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&members).Error; err != nil {
		return nil, err
	}
	for i := range members {
		members[i].JoinedDate = members[i].JoinedOn.Format("2006-01-02")
		members[i].PrimaryServicePointID = members[i].CityID
	}
	return &models.MemberListResult{Items: members, Page: page, PageSize: pageSize, Total: total, TotalPages: int(math.Ceil(float64(total) / float64(pageSize)))}, nil
}

func (r *memberRepository) GetByID(id string) (*models.Member, error) {
	var member models.Member
	if err := memberSelect(r.db.Model(&models.Member{})).Where("users.id = ? AND users.is_member = TRUE", id).First(&member).Error; err != nil {
		return nil, err
	}
	member.JoinedDate = member.JoinedOn.Format("2006-01-02")
	member.PrimaryServicePointID = member.CityID
	return &member, nil
}

func (r *memberRepository) FindDuplicates(member *models.Member, excludeID string, cityIDs []string, allCities bool) ([]models.Member, error) {
	conditions := make([]string, 0, 3)
	args := make([]any, 0, 5)
	if member.NormalizedPhone != "" {
		conditions = append(conditions, "users.phone_e164 = ?")
		args = append(args, member.NormalizedPhone)
	}
	if member.NormalizedEmail != "" {
		conditions = append(conditions, "LOWER(users.email::TEXT) = ?")
		args = append(args, member.NormalizedEmail)
	}
	if member.NormalizedName != "" && member.CityID != "" {
		conditions = append(conditions, "(LOWER(BTRIM(users.full_name)) = ? AND users.city_id = ?)")
		args = append(args, member.NormalizedName, member.CityID)
	}
	if len(conditions) == 0 {
		return []models.Member{}, nil
	}
	db := r.db.Where("users.is_member = TRUE AND users.member_status <> 'archived' AND ("+strings.Join(conditions, " OR ")+")", args...)
	if excludeID != "" {
		db = db.Where("users.id <> ?", excludeID)
	}
	if !allCities {
		if len(cityIDs) == 0 {
			return []models.Member{}, nil
		}
		db = db.Where("users.city_id IN ?", cityIDs)
	}
	var candidates []models.Member
	if err := memberSelect(db.Model(&models.Member{})).Order("users.updated_at DESC").Limit(20).Find(&candidates).Error; err != nil {
		return nil, err
	}
	for i := range candidates {
		candidates[i].NormalizedPhone = candidates[i].Phone
		candidates[i].NormalizedEmail = strings.ToLower(candidates[i].Email)
		candidates[i].NormalizedName = strings.ToLower(strings.Join(strings.Fields(candidates[i].Name), " "))
		candidates[i].PrimaryServicePointID = candidates[i].CityID
	}
	return candidates, nil
}

func (r *memberRepository) UpdateProfile(member *models.Member, expectedVersion int, histories []models.MemberHistory, consent *models.MemberConsentHistory) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&models.Member{}).Where("id = ? AND is_member = TRUE AND profile_version = ?", member.ID, expectedVersion).Updates(map[string]any{
			"full_name": member.Name, "email": member.Email, "phone_e164": member.Phone, "city_id": member.CityID,
			"discipleship_stage": member.DiscipleshipStage, "mentor_name": member.MentorName, "mentor_user_id": member.MentorUserID,
			"group_name": member.GroupName, "joined_on": member.JoinedOn, "member_status": member.Status,
			"profile_version": member.Version, "updated_at": member.UpdatedAt,
		})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return ErrMemberVersionConflict
		}
		if err := createProfileAudits(tx, histories); err != nil {
			return err
		}
		if consent != nil {
			if err := tx.Create(consent).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *memberRepository) Archive(id string, expectedVersion int, actorID, reason string, history *models.MemberHistory) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		result := tx.Model(&models.Member{}).Where("id = ? AND is_member = TRUE AND profile_version = ? AND member_status <> 'archived'", id, expectedVersion).Updates(map[string]any{
			"member_status": "archived", "archived_at": gorm.Expr("NOW()"), "archived_by": actorID,
			"archive_reason": reason, "retention_until": gorm.Expr("NOW() + INTERVAL '5 years'"),
			"updated_at": gorm.Expr("NOW()"), "profile_version": gorm.Expr("profile_version + 1"),
		})
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected != 1 {
			return ErrMemberVersionConflict
		}
		return createProfileAudits(tx, []models.MemberHistory{*history})
	})
}

func (r *memberRepository) GetHistory(memberID string) (*models.MemberHistoryResult, error) {
	result := &models.MemberHistoryResult{Changes: []models.MemberHistory{}, Consents: []models.MemberConsentHistory{}}
	var audits []models.AuditLog
	if err := r.db.Where("resource_type = 'user' AND resource_id = ? AND action LIKE 'profile.%'", memberID).Order("created_at DESC").Find(&audits).Error; err != nil {
		return nil, err
	}
	for _, audit := range audits {
		metadata := audit.Metadata
		result.Changes = append(result.Changes, models.MemberHistory{
			ID: audit.ID, MemberID: memberID, ActorUserID: audit.ActorUserID, ChangeType: strings.TrimPrefix(audit.Action, "profile."),
			FieldName: metadataString(metadata, "field"), OldValue: metadataString(metadata, "oldValue"), NewValue: metadataString(metadata, "newValue"), Reason: metadataString(metadata, "reason"), CreatedAt: parseAuditTime(audit.CreatedAt),
		})
	}
	if err := r.db.Where("user_id = ?", memberID).Order("recorded_at DESC, created_at DESC").Find(&result.Consents).Error; err != nil {
		return nil, err
	}
	return result, nil
}

func (r *memberRepository) Export(query models.MemberListQuery, limit int) ([]models.Member, error) {
	if limit < 1 || limit > 10000 {
		limit = 10000
	}
	var members []models.Member
	if err := memberSelect(memberScopedQuery(r.db.Model(&models.Member{}), query)).Order("users.updated_at DESC, users.id ASC").Limit(limit).Find(&members).Error; err != nil {
		return nil, err
	}
	for i := range members {
		members[i].JoinedDate = members[i].JoinedOn.Format("2006-01-02")
	}
	return members, nil
}

func (r *memberRepository) CreateConsent(consent *models.MemberConsentHistory) error {
	if consent == nil {
		return nil
	}
	return r.db.Create(consent).Error
}

func createProfileAudits(tx *gorm.DB, histories []models.MemberHistory) error {
	for _, history := range histories {
		audit := &models.AuditLog{
			ID: "audit-profile-" + history.ID, ActorUserID: history.ActorUserID, Action: "profile." + history.ChangeType,
			ResourceType: "user", ResourceID: &history.MemberID, Outcome: "success",
			Metadata:  map[string]any{"field": history.FieldName, "oldValue": history.OldValue, "newValue": history.NewValue, "reason": history.Reason},
			CreatedAt: history.CreatedAt.UTC().Format(time.RFC3339),
		}
		if err := tx.Create(audit).Error; err != nil {
			return err
		}
	}
	return nil
}

func metadataString(metadata map[string]any, key string) string {
	if value, ok := metadata[key].(string); ok {
		return value
	}
	encoded, _ := json.Marshal(metadata[key])
	return strings.Trim(string(encoded), "\"")
}

func parseAuditTime(value string) time.Time {
	parsed, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return time.Time{}
	}
	return parsed
}
