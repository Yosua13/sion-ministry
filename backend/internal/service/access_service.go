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

type accessService struct{ db *gorm.DB }

func NewAccessService(db *gorm.DB) AccessService { return &accessService{db: db} }

var permissionsByRole = map[string][]string{
	"admin":             {"user.manage", "user.invite", "assignment.manage", "audit.read", "city.read", "city.manage", "member.read", "member.write", "member.sensitive.read", "member.history.read", "member.archive", "member.export", "journal.sensitive.read", "journal.write", "journal.delete", "event.read", "event.manage", "event.delete", "attendance.check_in", "donation.read", "donation.create", "donation.verify", "content.read", "content.publish", "job.read", "job.apply", "application.read", "module.read", "module.publish", "upload.write", "ai.use", "sync.write"},
	"pekerja":           {"city.read", "member.read", "member.write", "member.sensitive.read", "member.history.read", "member.archive", "member.export", "journal.sensitive.read", "journal.write", "event.read", "event.manage", "attendance.check_in", "donation.read", "donation.verify", "content.read", "job.read", "application.read", "module.read", "upload.write", "ai.use", "sync.write"},
	"mentor":            {"city.read", "member.read", "journal.sensitive.read", "journal.write", "event.read", "content.read", "job.read", "module.read", "upload.write", "ai.use"},
	"jemaat":            {"city.read", "member.read", "journal.sensitive.read", "event.read", "donation.read", "donation.create", "content.read", "job.read", "job.apply", "application.read", "module.read", "ai.use"},
	"content_publisher": {"content.read", "content.publish", "event.read", "event.manage", "job.read", "module.read", "module.publish", "upload.write"},
	"auditor":           {"audit.read", "city.read", "member.read", "member.history.read", "member.export"},
	"donation_verifier": {"city.read", "donation.read", "donation.verify"},
}

func (s *accessService) Resolve(user *models.User) (*models.AccessContext, error) {
	if user == nil || user.Status != "active" {
		return nil, errors.New("akun tidak aktif")
	}
	var roles []models.UserRole
	if err := s.db.Where("user_id = ? AND revoked_at IS NULL", user.ID).Find(&roles).Error; err != nil {
		return nil, err
	}
	if len(roles) == 0 {
		return nil, errors.New("akun tidak memiliki role aktif")
	}
	roleSet, permissionSet, citySet := map[string]bool{}, map[string]bool{}, map[string]bool{}
	allCities := false
	for _, assignment := range roles {
		roleSet[assignment.Role] = true
		for _, permission := range permissionsByRole[assignment.Role] {
			permissionSet[permission] = true
		}
		if assignment.Role == "admin" && assignment.CityID == nil {
			allCities = true
		} else if assignment.CityID != nil {
			citySet[*assignment.CityID] = true
		}
	}
	if allCities {
		var cityIDs []string
		if err := s.db.Model(&models.City{}).Pluck("id", &cityIDs).Error; err != nil {
			return nil, err
		}
		for _, id := range cityIDs {
			citySet[id] = true
		}
	}
	return &models.AccessContext{UserID: user.ID, Permissions: sortedKeys(permissionSet), Roles: sortedKeys(roleSet), CityIDs: sortedKeys(citySet), AllCities: allCities}, nil
}

func sortedKeys(values map[string]bool) []string {
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
	for _, current := range access.Permissions {
		if current == permission {
			return true
		}
	}
	return false
}

func (s *accessService) HasRole(access *models.AccessContext, role string) bool {
	if access == nil {
		return false
	}
	for _, current := range access.Roles {
		if current == role {
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
	for _, allowed := range access.CityIDs {
		if allowed == cityID {
			return true
		}
	}
	return false
}

func (s *accessService) CanCreateCity(access *models.AccessContext, _ *models.City) bool {
	return s.HasRole(access, "admin") && access.AllCities
}

func (s *accessService) CanManageUser(access *models.AccessContext, targetUserID string) bool {
	if access == nil || targetUserID == "" {
		return false
	}
	return access.AllCities && s.HasPermission(access, "user.manage")
}

func (s *accessService) CanAccessMember(access *models.AccessContext, user *models.User, member *models.Member, write bool) bool {
	if access == nil || user == nil || member == nil {
		return false
	}
	if !write && member.ID == user.ID {
		return true
	}
	if write && !s.HasPermission(access, "member.write") {
		return false
	}
	if !write && !s.HasPermission(access, "member.read") {
		return false
	}
	return !s.HasRole(access, "jemaat") && s.CanAccessCity(access, member.CityID)
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
	if journal.MenteeID == nil {
		return false
	}
	var member models.User
	if err := s.db.First(&member, "id = ? AND is_member = TRUE", *journal.MenteeID).Error; err != nil {
		return false
	}
	if member.MemberStatus != "active" {
		return false
	}
	if !write && member.ID == user.ID {
		return true
	}
	if journal.MentorUserID != nil && member.MentorUserID != nil && *journal.MentorUserID == user.ID && *member.MentorUserID == user.ID {
		return s.CanAccessCity(access, stringValue(member.CityID))
	}
	return s.HasRole(access, "admin") && s.CanAccessCity(access, stringValue(member.CityID))
}

func (s *accessService) CanAccessUpload(access *models.AccessContext, user *models.User, filename string) bool {
	path := "/api/uploads/" + strings.TrimSpace(filename)
	var journal models.JurnalPA
	if err := s.db.First(&journal, "image = ?", path).Error; err == nil {
		return s.CanAccessJournal(access, user, &journal, false)
	}
	var event models.BeritaAcara
	if err := s.db.Where("? = ANY(images)", path).First(&event).Error; err == nil {
		return event.IsPublic || (!s.HasRole(access, "jemaat") && s.CanAccessCity(access, event.CityID))
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
	for _, item := range payload.PendingChanges {
		if item.ItemType == "member" {
			return errors.New("profil anggota hanya dapat dibuat saat online agar undangan aktivasi aman")
		}
		if item.ItemType != "berita" && item.ItemType != "jurnal_pa" && item.ItemType != "link" {
			return fmt.Errorf("tipe sinkronisasi %q tidak diizinkan", item.ItemType)
		}
	}
	return nil
}

func (s *accessService) GetRoles(access *models.AccessContext) ([]models.UserRole, error) {
	var roles []models.UserRole
	db := s.db.Where("revoked_at IS NULL").Order("granted_at desc")
	if access == nil {
		return nil, errors.New("scope akses tidak tersedia")
	}
	if !access.AllCities {
		db = db.Where("city_id IN ?", access.CityIDs)
	}
	err := db.Find(&roles).Error
	return roles, err
}

func (s *accessService) GrantRole(input *models.UserRole, actor *models.User) (*models.UserRole, error) {
	if input == nil || actor == nil {
		return nil, errors.New("role tidak valid")
	}
	actorAccess, err := s.Resolve(actor)
	if err != nil || !actorAccess.AllCities || !s.HasPermission(actorAccess, "assignment.manage") {
		return nil, errors.New("hanya admin global dapat mengelola role")
	}
	input.Role = strings.ToLower(strings.TrimSpace(input.Role))
	if _, ok := permissionsByRole[input.Role]; !ok {
		return nil, errors.New("role tidak dikenal")
	}
	if input.Role == "admin" && input.CityID != nil {
		return nil, errors.New("admin harus berscope global")
	}
	if input.Role != "admin" && (input.CityID == nil || *input.CityID == "") {
		return nil, errors.New("role non-admin wajib memilih kota")
	}
	if input.CityID != nil {
		var city models.City
		if err := s.db.First(&city, "id = ?", *input.CityID).Error; err != nil {
			return nil, errors.New("kota tidak ditemukan")
		}
	}
	input.ID = "urole-" + uuid.NewString()
	input.UserID = strings.TrimSpace(input.UserID)
	input.GrantedBy = stringPointer(actor.ID)
	input.GrantedAt = time.Now().UTC()
	input.RevokedAt = nil
	if input.UserID == "" {
		return nil, errors.New("user wajib diisi")
	}
	if err := s.db.Create(input).Error; err != nil {
		return nil, err
	}
	s.RecordAudit(actor.ID, "user_role.granted", "user_role", input.ID, "city", stringValue(input.CityID), "success", "", "", map[string]any{"role": input.Role, "userId": input.UserID})
	return input, nil
}

func (s *accessService) RevokeRole(id string, actor *models.User) error {
	actorAccess, err := s.Resolve(actor)
	if err != nil || !actorAccess.AllCities || !s.HasPermission(actorAccess, "assignment.manage") {
		return errors.New("hanya admin global dapat mengelola role")
	}
	var role models.UserRole
	if err := s.db.First(&role, "id = ? AND revoked_at IS NULL", id).Error; err != nil {
		return err
	}
	now := time.Now().UTC()
	return s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&models.UserRole{}).Where("id = ?", id).Update("revoked_at", now).Error; err != nil {
			return err
		}
		if err := tx.Model(&models.AuthSession{}).Where("user_id = ? AND revoked_at IS NULL", role.UserID).Updates(map[string]any{"revoked_at": now, "revoked_by": actor.ID, "revoke_reason": "role_revoked"}).Error; err != nil {
			return err
		}
		return tx.Create(newAuditLog(actor.ID, "user_role.revoked", "user_role", role.ID, "city", stringValue(role.CityID), "success", "", "", map[string]any{"userId": role.UserID, "role": role.Role})).Error
	})
}

func (s *accessService) AssignMentor(memberID, mentorUserID string, actor *models.User) error {
	actorAccess, err := s.Resolve(actor)
	if err != nil {
		return err
	}
	var member, mentor models.User
	if err := s.db.First(&member, "id = ? AND is_member = TRUE", memberID).Error; err != nil {
		return errors.New("anggota tidak ditemukan")
	}
	if !s.CanAccessCity(actorAccess, stringValue(member.CityID)) {
		return errors.New("anggota berada di luar scope actor")
	}
	if err := s.db.First(&mentor, "id = ? AND account_status = 'active'", mentorUserID).Error; err != nil {
		return errors.New("mentor aktif tidak ditemukan")
	}
	if err := s.db.Model(&models.User{}).Where("id = ?", member.ID).Updates(map[string]any{"mentor_user_id": mentor.ID, "mentor_name": mentor.Name, "profile_version": gorm.Expr("profile_version + 1"), "updated_at": time.Now().UTC()}).Error; err != nil {
		return err
	}
	s.RecordAudit(actor.ID, "mentorship.assigned", "user", member.ID, "city", stringValue(member.CityID), "success", "", "", map[string]any{"mentorUserId": mentor.ID})
	return nil
}

func (s *accessService) GetScopeCatalog(access *models.AccessContext) (*models.ScopeCatalog, error) {
	var cities []models.City
	db := s.db.Order("name")
	if access == nil {
		return nil, errors.New("scope akses tidak tersedia")
	}
	if !access.AllCities {
		db = db.Where("id IN ?", access.CityIDs)
	}
	if err := db.Find(&cities).Error; err != nil {
		return nil, err
	}
	return &models.ScopeCatalog{Cities: cities}, nil
}

func (s *accessService) GetAuditLogs(access *models.AccessContext, userID string) ([]models.AuditLog, error) {
	if access == nil {
		return nil, errors.New("scope akses tidak tersedia")
	}
	var logs []models.AuditLog
	// Keep the menu focused on changes even while a deployment is in progress
	// and before its cleanup migration has run on every environment.
	db := s.db.
		Where("action NOT LIKE ? AND action <> ?", "%.read", "access.allowed").
		Where("NOT (action = ? AND COALESCE(metadata ->> 'method', '') IN ?)", "access.denied", []string{"GET", "HEAD", "OPTIONS"}).
		Order("created_at desc").
		Limit(500)
	if !access.AllCities {
		db = db.Where("actor_user_id = ? OR (scope_type = 'city' AND scope_id IN ?)", userID, access.CityIDs)
	}
	if err := db.Find(&logs).Error; err != nil {
		return nil, err
	}
	return logs, nil
}

func (s *accessService) GetSessions(access *models.AccessContext, actorID, targetUserID string) ([]models.AuthSession, error) {
	if targetUserID == "" {
		targetUserID = actorID
	}
	if targetUserID != actorID && !s.CanManageUser(access, targetUserID) {
		return nil, errors.New("tidak boleh melihat sesi user lain")
	}
	var sessions []models.AuthSession
	err := s.db.Where("user_id = ? AND revoked_at IS NULL AND expires_at > NOW()", targetUserID).Order("created_at desc").Find(&sessions).Error
	return sessions, err
}

func (s *accessService) RevokeSession(access *models.AccessContext, actorID, sessionID string) error {
	var session models.AuthSession
	if err := s.db.First(&session, "id = ?", sessionID).Error; err != nil {
		return err
	}
	if session.UserID != actorID && !s.CanManageUser(access, session.UserID) {
		return errors.New("tidak boleh mencabut sesi user lain")
	}
	if err := s.db.Model(&models.AuthSession{}).Where("id = ? AND revoked_at IS NULL", sessionID).Updates(map[string]any{"revoked_at": time.Now().UTC(), "revoked_by": actorID, "revoke_reason": "manual_revoke"}).Error; err != nil {
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
	db := s.db.Model(&models.AttendanceCheckIn{}).Joins("JOIN berita_acaras ON berita_acaras.id = event_attendances.event_id").Order("event_attendances.checked_in_at desc")
	if !access.AllCities {
		db = db.Where("berita_acaras.city_id IN ?", access.CityIDs)
	}
	err := db.Find(&records).Error
	return records, err
}

func (s *accessService) CheckIn(access *models.AccessContext, user *models.User, eventID, userID string) (*models.AttendanceCheckIn, error) {
	var event models.BeritaAcara
	if err := s.db.First(&event, "id = ?", eventID).Error; err != nil {
		return nil, errors.New("kegiatan tidak ditemukan")
	}
	var member models.User
	if err := s.db.First(&member, "id = ? AND is_member = TRUE", userID).Error; err != nil {
		return nil, errors.New("anggota tidak ditemukan")
	}
	if member.MemberStatus != "active" || stringValue(member.CityID) != event.CityID || !s.CanAccessCity(access, event.CityID) {
		return nil, errors.New("anggota atau kegiatan berada di luar scope kota")
	}
	now := time.Now().UTC()
	record := &models.AttendanceCheckIn{ID: "att-" + uuid.NewString(), EventID: eventID, UserID: userID, CheckedInByUser: user.ID, CheckedInAt: now}
	if err := s.db.Create(record).Error; err != nil {
		return nil, err
	}
	s.RecordAudit(user.ID, "attendance.checked_in", "event", eventID, "city", event.CityID, "success", "", "", map[string]any{"userId": userID})
	return record, nil
}

// shouldStoreAuditAction excludes request-read telemetry. Audit logs are kept
// for data changes, sensitive business actions, and write-access denials so
// the audit table remains useful without growing for every page load.
func shouldStoreAuditAction(action string) bool {
	action = strings.ToLower(strings.TrimSpace(action))
	return action != "" && !strings.HasSuffix(action, ".read") && action != "access.allowed"
}

func (s *accessService) RecordAudit(actorID, action, resourceType, resourceID, scopeType, scopeID, outcome, requestID, ip string, metadata map[string]any) {
	if !shouldStoreAuditAction(action) {
		return
	}
	if metadata == nil {
		metadata = map[string]any{}
	}
	entry := &models.AuditLog{ID: "audit-" + uuid.NewString(), ActorUserID: stringPointer(actorID), Action: action, ResourceType: resourceType, ResourceID: stringPointer(resourceID), ScopeType: stringPointer(scopeType), ScopeID: stringPointer(scopeID), Outcome: outcome, RequestID: requestID, IPAddress: ip, Metadata: metadata, CreatedAt: time.Now().UTC().Format(time.RFC3339)}
	if err := s.db.Create(entry).Error; err != nil {
		fmt.Printf("audit log failed: %v\n", err)
	}
}
