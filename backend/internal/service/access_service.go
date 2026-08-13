package service

import (
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"backend/internal/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type accessService struct {
	db *gorm.DB
}

func NewAccessService(db *gorm.DB) AccessService {
	return &accessService{db: db}
}

func (s *accessService) Resolve(user *models.User) (*models.AccessContext, error) {
	if user == nil || user.Status != "active" {
		return nil, errors.New("akun tidak aktif")
	}
	now := time.Now().Format(time.RFC3339)
	if err := s.db.Model(&models.RoleAssignment{}).Where("status = 'active' AND valid_until IS NOT NULL AND valid_until <> '' AND valid_until <= ?", now).Update("status", "expired").Error; err != nil {
		return nil, err
	}
	var assignments []models.RoleAssignment
	if err := s.db.Where(
		"user_id = ? AND status = 'active' AND valid_from <= ? AND (valid_until IS NULL OR valid_until = '' OR valid_until > ?)",
		user.ID, now, now,
	).Order("created_at asc").Find(&assignments).Error; err != nil {
		return nil, err
	}
	if len(assignments) == 0 {
		return nil, errors.New("akun tidak memiliki role assignment aktif")
	}

	roleSet := map[string]bool{}
	for _, assignment := range assignments {
		roleSet[assignment.Role] = true
	}
	roles := mapKeys(roleSet)
	var permissions []string
	if err := s.db.Table("role_permissions").Distinct("permission_code").
		Where("role IN ?", roles).Pluck("permission_code", &permissions).Error; err != nil {
		return nil, err
	}

	citySet := map[string]bool{}
	allCities := false
	for _, assignment := range assignments {
		switch assignment.ScopeType {
		case "organization":
			var ids []string
			if err := s.db.Model(&models.City{}).Where("organization_id = ?", assignment.ScopeID).Pluck("id", &ids).Error; err != nil {
				return nil, err
			}
			for _, id := range ids {
				citySet[id] = true
			}
		case "ministry_unit":
			var ids []string
			if err := s.db.Model(&models.City{}).Where("ministry_unit_id = ?", assignment.ScopeID).Pluck("id", &ids).Error; err != nil {
				return nil, err
			}
			for _, id := range ids {
				citySet[id] = true
			}
		case "region":
			var ids []string
			if err := s.db.Model(&models.City{}).Where("region_id = ?", assignment.ScopeID).Pluck("id", &ids).Error; err != nil {
				return nil, err
			}
			for _, id := range ids {
				citySet[id] = true
			}
		case "city":
			citySet[assignment.ScopeID] = true
		case "self":
			if user.CityID != nil {
				citySet[*user.CityID] = true
			}
		}
	}

	sort.Strings(permissions)
	return &models.AccessContext{
		UserID: user.ID, Permissions: permissions, Roles: roles,
		CityIDs: mapKeys(citySet), AllCities: allCities, Assignments: assignments,
	}, nil
}

func (s *accessService) CanCreateCity(access *models.AccessContext, city *models.City) bool {
	if access == nil || city == nil {
		return false
	}
	for _, assignment := range access.Assignments {
		switch assignment.ScopeType {
		case "organization":
			if assignment.ScopeID == city.OrganizationID {
				return true
			}
		case "ministry_unit":
			if assignment.ScopeID == city.MinistryUnitID {
				return true
			}
		case "region":
			if assignment.ScopeID == city.RegionID {
				return true
			}
		}
	}
	return false
}

func (s *accessService) CanManageUser(access *models.AccessContext, targetUserID string) bool {
	if access == nil || targetUserID == "" {
		return false
	}
	if targetUserID == access.UserID {
		return true
	}
	var target models.User
	if err := s.db.First(&target, "id = ?", targetUserID).Error; err != nil {
		return false
	}
	if target.CityID != nil {
		return s.CanAccessCity(access, *target.CityID)
	}
	return hasScopeType(access, "organization")
}

func mapKeys(values map[string]bool) []string {
	result := make([]string, 0, len(values))
	for value := range values {
		result = append(result, value)
	}
	sort.Strings(result)
	return result
}

func (s *accessService) HasPermission(access *models.AccessContext, permission string) bool {
	if access == nil {
		return false
	}
	for _, value := range access.Permissions {
		if value == permission {
			return true
		}
	}
	return false
}

func (s *accessService) HasRole(access *models.AccessContext, role string) bool {
	if access == nil {
		return false
	}
	for _, value := range access.Roles {
		if value == role {
			return true
		}
	}
	return false
}

func (s *accessService) CanAccessCity(access *models.AccessContext, cityID string) bool {
	if access == nil || strings.TrimSpace(cityID) == "" {
		return false
	}
	if access.AllCities {
		return true
	}
	for _, value := range access.CityIDs {
		if value == cityID {
			return true
		}
	}
	return false
}

func (s *accessService) CanAccessMember(access *models.AccessContext, user *models.User, member *models.Member, write bool) bool {
	if access == nil || user == nil || member == nil {
		return false
	}
	if member.UserID != nil && *member.UserID == user.ID && !write {
		return true
	}
	if write && !s.HasPermission(access, "member.write") {
		return false
	}
	if !write && !s.HasPermission(access, "member.read") {
		return false
	}
	return s.CanAccessCity(access, member.CityID) && !s.HasRole(access, "jemaat")
}

func (s *accessService) CanAccessJournal(access *models.AccessContext, user *models.User, journal *models.JurnalPA, write bool) bool {
	if access == nil || user == nil || journal == nil {
		return false
	}
	permission := "journal.sensitive.read"
	if write {
		permission = "journal.write"
	}
	if !s.HasPermission(access, permission) {
		return false
	}
	if s.HasRole(access, "admin") {
		return s.CanAccessCity(access, journal.CityID)
	}
	if journal.MenteeID != nil {
		var member models.Member
		if err := s.db.First(&member, "id = ?", *journal.MenteeID).Error; err != nil {
			return false
		}
		if member.Status != "active" {
			return false
		}
		if member.UserID != nil && *member.UserID == user.ID && !write {
			return true
		}
		if member.MentorUserID != nil && journal.MentorUserID != nil && *member.MentorUserID == user.ID && *journal.MentorUserID == user.ID {
			return s.CanAccessCity(access, member.CityID)
		}
	}
	return false
}

func (s *accessService) CanAccessUpload(access *models.AccessContext, user *models.User, filename string) bool {
	path := "/api/uploads/" + strings.TrimSpace(filename)
	var journal models.JurnalPA
	if err := s.db.First(&journal, "image = ?", path).Error; err == nil {
		return s.CanAccessJournal(access, user, &journal, false)
	}
	var event models.BeritaAcara
	if err := s.db.Where("? = ANY(images)", path).First(&event).Error; err == nil {
		if s.HasRole(access, "jemaat") {
			return event.IsPublic
		}
		return s.CanAccessCity(access, event.CityID)
	}
	var campaign models.DonationCampaign
	if err := s.db.First(&campaign, "banner_url = ?", path).Error; err == nil {
		return s.HasPermission(access, "content.read") || s.HasPermission(access, "donation.read")
	}
	return false
}

func (s *accessService) ValidateSync(access *models.AccessContext, user *models.User, payload *models.SyncPayload) error {
	if access == nil || user == nil || payload == nil {
		return errors.New("context sinkronisasi tidak valid")
	}
	for index := range payload.PendingChanges {
		item := &payload.PendingChanges[index]
		if item.Action != "create" && item.Action != "update" && item.Action != "delete" {
			return fmt.Errorf("aksi sinkronisasi %q tidak diizinkan", item.Action)
		}
		switch item.ItemType {
		case "member":
			if !s.HasPermission(access, "member.write") {
				return errors.New("tidak memiliki izin menulis anggota")
			}
			if item.Action == "delete" {
				if !s.HasPermission(access, "member.archive") {
					return errors.New("tidak memiliki izin mengarsipkan anggota")
				}
				var existing models.Member
				if err := s.db.First(&existing, "id = ?", item.ID).Error; err != nil || !s.CanAccessMember(access, user, &existing, true) {
					return errors.New("anggota berada di luar scope sinkronisasi")
				}
				member, err := decodeData[models.Member](item.Data)
				if err != nil || len([]rune(strings.TrimSpace(member.ArchiveReason))) < 10 {
					return errors.New("archive member membutuhkan archiveReason minimal 10 karakter")
				}
				item.Data = member
				continue
			}
			member, err := decodeData[models.Member](item.Data)
			if err != nil || !s.CanAccessCity(access, member.CityID) {
				return errors.New("kota anggota berada di luar scope sinkronisasi")
			}
			if item.Action == "update" {
				var existing models.Member
				if err := s.db.First(&existing, "id = ?", item.ID).Error; err != nil || !s.CanAccessMember(access, user, &existing, true) {
					return errors.New("anggota berada di luar scope sinkronisasi")
				}
				member.ID = item.ID
				if !s.HasRole(access, "admin") {
					member.UserID = existing.UserID
					member.MentorUserID = existing.MentorUserID
					member.MentorName = existing.MentorName
				}
			} else if !s.HasRole(access, "admin") {
				member.UserID = nil
				member.MentorUserID = stringPointer(user.ID)
			}
			item.Data = member
		case "berita":
			if !s.HasPermission(access, "event.manage") {
				return errors.New("tidak memiliki izin mengelola berita acara")
			}
			if item.Action == "delete" {
				var existing models.BeritaAcara
				if err := s.db.First(&existing, "id = ?", item.ID).Error; err != nil || !s.CanAccessCity(access, existing.CityID) {
					return errors.New("berita acara berada di luar scope sinkronisasi")
				}
				continue
			}
			berita, err := decodeData[models.BeritaAcara](item.Data)
			if err != nil || !s.CanAccessCity(access, berita.CityID) {
				return errors.New("kota berita acara berada di luar scope sinkronisasi")
			}
			berita.IsPublic = true
			item.Data = berita
		case "jurnal_pa":
			if !s.HasPermission(access, "journal.write") {
				return errors.New("tidak memiliki izin menulis jurnal")
			}
			if item.Action == "delete" {
				var existing models.JurnalPA
				if err := s.db.First(&existing, "id = ?", item.ID).Error; err != nil || !s.CanAccessJournal(access, user, &existing, false) {
					return errors.New("jurnal berada di luar relasi mentor")
				}
				continue
			}
			journal, err := decodeData[models.JurnalPA](item.Data)
			if err != nil {
				return errors.New("payload jurnal tidak valid")
			}
			if !s.HasRole(access, "admin") {
				journal.MentorUserID = stringPointer(user.ID)
			}
			if !s.CanAccessJournal(access, user, journal, true) {
				return errors.New("jurnal bukan milik mentee aktif yang ditugaskan")
			}
			item.Data = journal
		case "link":
			if !s.HasPermission(access, "content.publish") {
				return errors.New("tidak memiliki izin menerbitkan konten")
			}
		default:
			return fmt.Errorf("tipe sinkronisasi %q tidak diizinkan", item.ItemType)
		}
	}
	return nil
}

func (s *accessService) GetAssignments(access *models.AccessContext) ([]models.RoleAssignment, error) {
	var assignments []models.RoleAssignment
	if err := s.db.Order("created_at desc").Find(&assignments).Error; err != nil {
		return nil, err
	}
	filtered := make([]models.RoleAssignment, 0, len(assignments))
	for _, assignment := range assignments {
		if s.scopeWithin(access, assignment.ScopeType, assignment.ScopeID, assignment.UserID) {
			filtered = append(filtered, assignment)
		}
	}
	return filtered, nil
}

func (s *accessService) CreateAssignment(input *models.RoleAssignment, actor *models.User) (*models.RoleAssignment, error) {
	if input == nil || actor == nil {
		return nil, errors.New("assignment tidak valid")
	}
	input.Role = strings.ToLower(strings.TrimSpace(input.Role))
	input.ScopeType = strings.ToLower(strings.TrimSpace(input.ScopeType))
	input.ScopeID = strings.TrimSpace(input.ScopeID)
	if input.UserID == "" || input.Role == "" || input.ScopeID == "" {
		return nil, errors.New("user, role, dan scope wajib diisi")
	}
	var count int64
	if err := s.db.Table("role_permissions").Where("role = ?", input.Role).Count(&count).Error; err != nil || count == 0 {
		return nil, errors.New("role tidak dikenal")
	}
	if err := s.validateScope(input.ScopeType, input.ScopeID, input.UserID); err != nil {
		return nil, err
	}
	actorAccess, err := s.Resolve(actor)
	if err != nil || !s.CanManageUser(actorAccess, input.UserID) || !s.scopeWithin(actorAccess, input.ScopeType, input.ScopeID, input.UserID) {
		return nil, errors.New("scope assignment berada di luar kewenangan actor")
	}
	now := time.Now().Format(time.RFC3339)
	input.ID = "ra-" + uuid.NewString()
	input.Status = "pending"
	input.ValidFrom = now
	input.ApprovedBy = nil
	input.ApprovedAt = nil
	input.RevokedAt = nil
	input.CreatedAt = now
	if input.ValidUntil != nil {
		until, err := time.Parse(time.RFC3339, *input.ValidUntil)
		if err != nil || !until.After(time.Now()) {
			return nil, errors.New("validUntil harus RFC3339 dan berada di masa depan")
		}
	}
	if err := s.db.Create(input).Error; err != nil {
		return nil, err
	}
	s.RecordAudit(actor.ID, "role_assignment.created", "role_assignment", input.ID, input.ScopeType, input.ScopeID, "success", "", "", map[string]any{"role": input.Role, "userId": input.UserID})
	return input, nil
}

func (s *accessService) ApproveAssignment(id string, actor *models.User) (*models.RoleAssignment, error) {
	var assignment models.RoleAssignment
	if err := s.db.First(&assignment, "id = ?", id).Error; err != nil {
		return nil, err
	}
	if assignment.Status != "pending" {
		return nil, errors.New("hanya assignment pending yang dapat disetujui")
	}
	actorAccess, err := s.Resolve(actor)
	if err != nil || !s.CanManageUser(actorAccess, assignment.UserID) || !s.scopeWithin(actorAccess, assignment.ScopeType, assignment.ScopeID, assignment.UserID) {
		return nil, errors.New("scope assignment berada di luar kewenangan actor")
	}
	now := time.Now().Format(time.RFC3339)
	assignment.Status = "active"
	assignment.ApprovedBy = stringPointer(actor.ID)
	assignment.ApprovedAt = &now
	if err := s.db.Save(&assignment).Error; err != nil {
		return nil, err
	}
	s.RecordAudit(actor.ID, "role_assignment.approved", "role_assignment", assignment.ID, assignment.ScopeType, assignment.ScopeID, "success", "", "", map[string]any{"role": assignment.Role, "userId": assignment.UserID})
	return &assignment, nil
}

func (s *accessService) RevokeAssignment(id string, actor *models.User) error {
	var assignment models.RoleAssignment
	if err := s.db.First(&assignment, "id = ?", id).Error; err != nil {
		return err
	}
	actorAccess, err := s.Resolve(actor)
	if err != nil || !s.CanManageUser(actorAccess, assignment.UserID) || !s.scopeWithin(actorAccess, assignment.ScopeType, assignment.ScopeID, assignment.UserID) {
		return errors.New("scope assignment berada di luar kewenangan actor")
	}
	now := time.Now().Format(time.RFC3339)
	assignment.Status = "revoked"
	assignment.RevokedAt = &now
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&assignment).Error; err != nil {
			return err
		}
		if err := tx.Delete(&models.AuthSession{}, "user_id = ?", assignment.UserID).Error; err != nil {
			return err
		}
		return tx.Create(newAuditLog(actor.ID, "role_assignment.revoked", "role_assignment", assignment.ID, assignment.ScopeType, assignment.ScopeID, "success", "", "", map[string]any{"role": assignment.Role, "userId": assignment.UserID, "sessionsRevoked": true})).Error
	})
}

func (s *accessService) AssignMentor(memberID, mentorUserID, memberUserID string, actor *models.User) error {
	var member models.Member
	if err := s.db.First(&member, "id = ?", memberID).Error; err != nil {
		return errors.New("anggota tidak ditemukan")
	}
	actorAccess, err := s.Resolve(actor)
	if err != nil || !s.CanAccessCity(actorAccess, member.CityID) {
		return errors.New("anggota berada di luar scope actor")
	}
	var mentor models.User
	if err := s.db.First(&mentor, "id = ? AND status = 'active'", mentorUserID).Error; err != nil {
		return errors.New("mentor aktif tidak ditemukan")
	}
	mentorAccess, err := s.Resolve(&mentor)
	if err != nil || (!s.HasRole(mentorAccess, "mentor") && !s.HasRole(mentorAccess, "pekerja") && !s.HasRole(mentorAccess, "admin")) || !s.CanAccessCity(mentorAccess, member.CityID) {
		return errors.New("mentor tidak memiliki assignment aktif pada kota anggota")
	}
	updates := map[string]any{"mentor_user_id": mentorUserID, "mentor_name": mentor.Name}
	if memberUserID != "" {
		if !s.CanManageUser(actorAccess, memberUserID) {
			return errors.New("akun anggota berada di luar scope actor")
		}
		var memberUser models.User
		if err := s.db.First(&memberUser, "id = ? AND status = 'active'", memberUserID).Error; err != nil {
			return errors.New("user anggota aktif tidak ditemukan")
		}
		updates["user_id"] = memberUserID
	}
	if member.Status == "archived" {
		return errors.New("anggota yang telah diarsipkan tidak dapat diubah")
	}
	updates["version"] = gorm.Expr("version + 1")
	updates["updated_at"] = gorm.Expr("NOW()")
	if err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.Member{}).Where("id = ?", memberID).Updates(updates).Error; err != nil {
			return err
		}
		histories := []models.MemberHistory{newMemberHistory(memberID, actor.ID, "updated", "mentor", valueOrEmpty(member.MentorUserID), mentorUserID, "Penugasan melalui Manajemen User")}
		if memberUserID != "" && valueOrEmpty(member.UserID) != memberUserID {
			histories = append(histories, newMemberHistory(memberID, actor.ID, "updated", "user", valueOrEmpty(member.UserID), memberUserID, "Penautan akun Member 360"))
		}
		return tx.Create(&histories).Error
	}); err != nil {
		return err
	}
	s.RecordAudit(actor.ID, "mentorship.assigned", "member", memberID, "city", member.CityID, "success", "", "", map[string]any{"mentorUserId": mentorUserID, "memberUserId": memberUserID})
	return nil
}

func (s *accessService) validateScope(scopeType, scopeID, userID string) error {
	var count int64
	var model any
	switch scopeType {
	case "organization":
		model = &models.Organization{}
	case "ministry_unit":
		model = &models.MinistryUnit{}
	case "region":
		model = &models.Region{}
	case "city":
		model = &models.City{}
	case "self":
		if scopeID != userID {
			return errors.New("scope self harus menunjuk user yang sama")
		}
		return nil
	default:
		return errors.New("scopeType tidak valid")
	}
	if err := s.db.Model(model).Where("id = ?", scopeID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		return errors.New("scope tidak ditemukan")
	}
	return nil
}

func (s *accessService) GetScopeCatalog(access *models.AccessContext) (*models.ScopeCatalog, error) {
	result := &models.ScopeCatalog{}
	if err := s.db.Order("name").Find(&result.Organizations).Error; err != nil {
		return nil, err
	}
	if err := s.db.Order("name").Find(&result.MinistryUnits).Error; err != nil {
		return nil, err
	}
	if err := s.db.Order("name").Find(&result.Regions).Error; err != nil {
		return nil, err
	}
	if err := s.db.Order("name").Find(&result.Cities).Error; err != nil {
		return nil, err
	}
	result.Cities = filterSlice(result.Cities, func(city models.City) bool { return s.CanAccessCity(access, city.ID) })
	result.Regions = filterSlice(result.Regions, func(region models.Region) bool { return s.scopeWithin(access, "region", region.ID, "") })
	result.MinistryUnits = filterSlice(result.MinistryUnits, func(unit models.MinistryUnit) bool { return s.scopeWithin(access, "ministry_unit", unit.ID, "") })
	result.Organizations = filterSlice(result.Organizations, func(org models.Organization) bool { return s.scopeWithin(access, "organization", org.ID, "") })
	return result, nil
}

func filterSlice[T any](items []T, keep func(T) bool) []T {
	filtered := make([]T, 0, len(items))
	for _, item := range items {
		if keep(item) {
			filtered = append(filtered, item)
		}
	}
	return filtered
}

func (s *accessService) scopeWithin(access *models.AccessContext, scopeType, scopeID, targetUserID string) bool {
	if access == nil {
		return false
	}
	switch scopeType {
	case "city":
		return s.CanAccessCity(access, scopeID)
	case "self":
		if targetUserID == access.UserID {
			return true
		}
		var target models.User
		if err := s.db.First(&target, "id = ?", targetUserID).Error; err != nil {
			return false
		}
		if target.CityID != nil {
			return s.CanAccessCity(access, *target.CityID)
		}
		for _, assignment := range access.Assignments {
			if assignment.ScopeType == "organization" {
				return true
			}
		}
		return false
	case "region":
		var cityCount, allowedCount int64
		s.db.Model(&models.City{}).Where("region_id = ?", scopeID).Count(&cityCount)
		if cityCount == 0 {
			return false
		}
		if access.AllCities {
			return true
		}
		s.db.Model(&models.City{}).Where("region_id = ? AND id IN ?", scopeID, access.CityIDs).Count(&allowedCount)
		return cityCount == allowedCount
	case "ministry_unit":
		var cityCount, allowedCount int64
		s.db.Model(&models.City{}).Where("ministry_unit_id = ?", scopeID).Count(&cityCount)
		if cityCount == 0 {
			return false
		}
		if access.AllCities {
			return true
		}
		s.db.Model(&models.City{}).Where("ministry_unit_id = ? AND id IN ?", scopeID, access.CityIDs).Count(&allowedCount)
		return cityCount == allowedCount
	case "organization":
		for _, assignment := range access.Assignments {
			if assignment.ScopeType == "organization" && assignment.ScopeID == scopeID {
				return true
			}
		}
	}
	return false
}

func (s *accessService) GetAuditLogs(access *models.AccessContext, userID string) ([]models.AuditLog, error) {
	var logs []models.AuditLog
	if access == nil {
		return nil, errors.New("scope akses tidak tersedia")
	}
	if err := s.db.Order("created_at desc").Limit(500).Find(&logs).Error; err != nil {
		return nil, err
	}
	filtered := make([]models.AuditLog, 0, len(logs))
	for _, entry := range logs {
		if entry.ActorUserID != nil && *entry.ActorUserID == userID {
			filtered = append(filtered, entry)
			continue
		}
		if entry.ScopeType != nil && entry.ScopeID != nil && s.scopeWithin(access, *entry.ScopeType, *entry.ScopeID, "") {
			filtered = append(filtered, entry)
			continue
		}
		if entry.ScopeType == nil && hasScopeType(access, "organization") {
			filtered = append(filtered, entry)
		}
	}
	return filtered, nil
}

func hasScopeType(access *models.AccessContext, scopeType string) bool {
	if access == nil {
		return false
	}
	for _, assignment := range access.Assignments {
		if assignment.ScopeType == scopeType {
			return true
		}
	}
	return false
}

func (s *accessService) GetSessions(access *models.AccessContext, actorID, targetUserID string) ([]models.AuthSession, error) {
	if targetUserID == "" {
		targetUserID = actorID
	}
	if targetUserID != actorID && (!s.HasPermission(access, "user.manage") || !s.CanManageUser(access, targetUserID)) {
		return nil, errors.New("tidak boleh melihat sesi user lain")
	}
	var sessions []models.AuthSession
	err := s.db.Where("user_id = ? AND (revoked_at IS NULL OR revoked_at = '')", targetUserID).Order("created_at desc").Find(&sessions).Error
	return sessions, err
}

func (s *accessService) RevokeSession(access *models.AccessContext, actorID, sessionID string) error {
	var session models.AuthSession
	if err := s.db.First(&session, "id = ?", sessionID).Error; err != nil {
		return err
	}
	if session.UserID != actorID && (!s.HasPermission(access, "user.manage") || !s.CanManageUser(access, session.UserID)) {
		return errors.New("tidak boleh mencabut sesi user lain")
	}
	if err := s.db.Delete(&models.AuthSession{}, "id = ?", sessionID).Error; err != nil {
		return err
	}
	s.RecordAudit(actorID, "session.revoked", "auth_session", sessionID, "self", session.UserID, "success", "", "", map[string]any{"targetUserId": session.UserID})
	return nil
}

func (s *accessService) GetAttendance(access *models.AccessContext) ([]models.AttendanceCheckIn, error) {
	if access == nil {
		return nil, errors.New("scope akses tidak tersedia")
	}
	var records []models.AttendanceCheckIn
	query := s.db.Order("checked_in_at desc")
	if !access.AllCities {
		query = query.Where("city_id IN ?", access.CityIDs)
	}
	err := query.Find(&records).Error
	return records, err
}

func (s *accessService) CheckIn(access *models.AccessContext, user *models.User, eventID, memberID string) (*models.AttendanceCheckIn, error) {
	var event models.BeritaAcara
	if err := s.db.First(&event, "id = ?", eventID).Error; err != nil {
		return nil, errors.New("kegiatan tidak ditemukan")
	}
	var member models.Member
	if err := s.db.First(&member, "id = ?", memberID).Error; err != nil {
		return nil, errors.New("anggota tidak ditemukan")
	}
	if member.Status != "active" || member.CityID != event.CityID || !s.CanAccessCity(access, event.CityID) {
		return nil, errors.New("anggota atau kegiatan berada di luar scope kota")
	}
	record := &models.AttendanceCheckIn{
		ID: "att-" + uuid.NewString(), EventID: eventID, MemberID: memberID, CityID: event.CityID,
		CheckedInBy: user.ID, CheckedInAt: time.Now().Format(time.RFC3339),
	}
	if err := s.db.Create(record).Error; err != nil {
		return nil, err
	}
	s.RecordAudit(user.ID, "attendance.checked_in", "event", eventID, "city", event.CityID, "success", "", "", map[string]any{"memberId": memberID})
	return record, nil
}

func (s *accessService) RecordAudit(actorID, action, resourceType, resourceID, scopeType, scopeID, outcome, requestID, ip string, metadata map[string]any) {
	if err := s.db.Create(newAuditLog(actorID, action, resourceType, resourceID, scopeType, scopeID, outcome, requestID, ip, metadata)).Error; err != nil {
		fmt.Printf("audit log failed: %v\n", err)
	}
}

func newAuditLog(actorID, action, resourceType, resourceID, scopeType, scopeID, outcome, requestID, ip string, metadata map[string]any) *models.AuditLog {
	if metadata == nil {
		metadata = map[string]any{}
	}
	return &models.AuditLog{
		ID: "audit-" + uuid.NewString(), ActorUserID: stringPointer(actorID), Action: action,
		ResourceType: resourceType, ResourceID: stringPointer(resourceID), ScopeType: stringPointer(scopeType), ScopeID: stringPointer(scopeID),
		Outcome: outcome, RequestID: requestID, IPAddress: ip, Metadata: metadata, CreatedAt: time.Now().Format(time.RFC3339),
	}
}

func stringPointer(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}
