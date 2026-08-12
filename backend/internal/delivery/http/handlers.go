package http

import (
	"context"
	"errors"
	"log"
	"strings"

	"backend/internal/models"
	"backend/internal/objectstore"
	"backend/internal/service"

	"github.com/gofiber/fiber/v2"
)

type Handlers struct {
	services    *service.Service
	objectStore objectstore.Presigner
}

func NewHandlers(services *service.Service, objectStores ...objectstore.Presigner) *Handlers {
	var store objectstore.Presigner
	if len(objectStores) > 0 {
		store = objectStores[0]
	}
	return &Handlers{services: services, objectStore: store}
}

// Health Check
func (h *Handlers) HealthCheck(c *fiber.Ctx) error {
	return c.JSON(fiber.Map{
		"status": "ok",
		"time":   c.Context().ConnTime().String(),
	})
}

func getBearerToken(c *fiber.Ctx) string {
	authHeader := c.Get("Authorization")
	if authHeader == "" {
		return ""
	}
	return strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
}

func localStringPointer(value string) *string {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil
	}
	return &value
}

func (h *Handlers) Register(c *fiber.Ctx) error {
	var req struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
		CityID   string `json:"cityId"`
		CityName string `json:"cityName"`
	}
	if err := c.BodyParser(&req); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_request", "Payload pendaftaran tidak valid.")
	}
	user, err := h.services.Auth.Register(req.Name, req.Email, req.Password, req.Role, req.CityID, req.CityName)
	if err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "registration_failed", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(user)
}

func (h *Handlers) Login(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_request", "Payload login tidak valid.")
	}
	deviceName := strings.TrimSpace(c.Get("X-Device-Name"))
	if deviceName == "" {
		deviceName = "Browser"
	}
	session, err := h.services.Auth.Login(req.Email, req.Password, deviceName, c.Get("User-Agent"), c.IP())
	if err != nil {
		return WriteAPIError(c, fiber.StatusUnauthorized, "invalid_credentials", err.Error())
	}
	return c.JSON(session)
}

func (h *Handlers) Me(c *fiber.Ctx) error {
	token := getBearerToken(c)
	user, err := h.services.Auth.GetUserByToken(token)
	if err != nil {
		return WriteAPIError(c, fiber.StatusUnauthorized, "invalid_session", "Sesi tidak valid atau sudah berakhir.")
	}
	return c.JSON(user)
}

func (h *Handlers) GetAccessContext(c *fiber.Ctx) error {
	user, ok := c.Locals("user").(*models.User)
	if !ok || user == nil {
		return WriteAPIError(c, fiber.StatusUnauthorized, "missing_session", "Sesi tidak ditemukan.")
	}
	access, err := h.services.Access.Resolve(user)
	if err != nil {
		return WriteAPIError(c, fiber.StatusForbidden, "no_active_assignment", err.Error())
	}
	return c.JSON(access)
}

func (h *Handlers) Logout(c *fiber.Ctx) error {
	token := getBearerToken(c)
	if token != "" {
		_ = h.services.Auth.Logout(token)
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *Handlers) LogoutAll(c *fiber.Ctx) error {
	user, ok := c.Locals("user").(*models.User)
	if !ok || user == nil {
		return WriteAPIError(c, fiber.StatusUnauthorized, "missing_session", "Sesi tidak ditemukan.")
	}
	if err := h.services.Auth.LogoutAll(user.ID); err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "session_revocation_failed", "Gagal mencabut sesi.")
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *Handlers) PresignUpload(c *fiber.Ctx) error {
	if h.objectStore == nil {
		return WriteAPIError(c, fiber.StatusServiceUnavailable, "object_storage_unavailable", "Object storage belum dikonfigurasi.")
	}
	var input objectstore.PresignInput
	if err := c.BodyParser(&input); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_request", "Payload upload tidak valid.")
	}
	if _, err := objectstore.ValidateInput(input); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_upload", err.Error())
	}
	access, _ := c.Locals("access").(*models.AccessContext)
	if !h.services.Access.CanAccessCity(access, input.CityID) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Kota object storage berada di luar scope akun.")
	}
	request, err := h.objectStore.PresignUpload(context.Background(), input)
	if err != nil {
		return WriteAPIError(c, fiber.StatusBadGateway, "object_storage_error", "Gagal membuat signed URL upload.")
	}
	return c.Status(fiber.StatusCreated).JSON(request)
}

func (h *Handlers) PresignDownload(c *fiber.Ctx) error {
	if h.objectStore == nil {
		return WriteAPIError(c, fiber.StatusServiceUnavailable, "object_storage_unavailable", "Object storage belum dikonfigurasi.")
	}
	objectKey := c.Query("key")
	cityID, scopeErr := objectstore.CityIDFromKey(objectKey)
	access, _ := c.Locals("access").(*models.AccessContext)
	if scopeErr != nil || !h.services.Access.CanAccessCity(access, cityID) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Object berada di luar scope akun.")
	}
	request, err := h.objectStore.PresignDownload(context.Background(), objectKey)
	if err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_object_key", "Object key tidak valid.")
	}
	return c.JSON(request)
}

func (h *Handlers) GetUsers(c *fiber.Ctx) error {
	users, err := h.services.Auth.GetUsers()
	if err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "users_lookup_failed", "Gagal mengambil daftar pengguna.")
	}
	access, _ := c.Locals("access").(*models.AccessContext)
	hasOrganizationScope := false
	for _, assignment := range access.Assignments {
		if assignment.ScopeType == "organization" {
			hasOrganizationScope = true
			break
		}
	}
	filtered := make([]models.User, 0, len(users))
	for _, user := range users {
		if user.ID == access.UserID || (user.CityID != nil && h.services.Access.CanAccessCity(access, *user.CityID)) || (user.CityID == nil && hasOrganizationScope) {
			filtered = append(filtered, user)
		}
	}
	return c.JSON(filtered)
}

func (h *Handlers) ApproveUser(c *fiber.Ctx) error {
	actor, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	if !h.services.Access.CanManageUser(access, c.Params("id")) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Pengguna berada di luar scope akun.")
	}
	user, err := h.services.Auth.ApproveUser(c.Params("id"), actor.ID)
	if err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "user_approval_failed", "Gagal menyetujui pengguna.")
	}
	return c.JSON(user)
}

func (h *Handlers) GetRoleAssignments(c *fiber.Ctx) error {
	access, _ := c.Locals("access").(*models.AccessContext)
	assignments, err := h.services.Access.GetAssignments(access)
	if err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "assignments_lookup_failed", "Gagal mengambil role assignment.")
	}
	return c.JSON(assignments)
}

func (h *Handlers) CreateRoleAssignment(c *fiber.Ctx) error {
	actor, _ := c.Locals("user").(*models.User)
	var assignment models.RoleAssignment
	if err := c.BodyParser(&assignment); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_request", "Payload assignment tidak valid.")
	}
	created, err := h.services.Access.CreateAssignment(&assignment, actor)
	if err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "assignment_failed", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(created)
}

func (h *Handlers) ApproveRoleAssignment(c *fiber.Ctx) error {
	actor, _ := c.Locals("user").(*models.User)
	assignment, err := h.services.Access.ApproveAssignment(c.Params("id"), actor)
	if err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "assignment_approval_failed", err.Error())
	}
	return c.JSON(assignment)
}

func (h *Handlers) RevokeRoleAssignment(c *fiber.Ctx) error {
	actor, _ := c.Locals("user").(*models.User)
	if err := h.services.Access.RevokeAssignment(c.Params("id"), actor); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "assignment_revocation_failed", err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) AssignMentor(c *fiber.Ctx) error {
	actor, _ := c.Locals("user").(*models.User)
	var input struct {
		MemberID     string `json:"memberId"`
		MentorUserID string `json:"mentorUserId"`
		MemberUserID string `json:"memberUserId"`
	}
	if err := c.BodyParser(&input); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_request", "Payload mentorship tidak valid.")
	}
	if err := h.services.Access.AssignMentor(input.MemberID, input.MentorUserID, input.MemberUserID, actor); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "mentorship_assignment_failed", err.Error())
	}
	return c.JSON(fiber.Map{"success": true})
}

func (h *Handlers) GetScopeCatalog(c *fiber.Ctx) error {
	access, _ := c.Locals("access").(*models.AccessContext)
	catalog, err := h.services.Access.GetScopeCatalog(access)
	if err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "scope_lookup_failed", "Gagal mengambil katalog scope.")
	}
	return c.JSON(catalog)
}

func (h *Handlers) GetAuditLogs(c *fiber.Ctx) error {
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	logs, err := h.services.Access.GetAuditLogs(access, user.ID)
	if err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "audit_lookup_failed", "Gagal mengambil audit log.")
	}
	return c.JSON(logs)
}

func (h *Handlers) GetSessions(c *fiber.Ctx) error {
	user, _ := c.Locals("user").(*models.User)
	access, err := h.services.Access.Resolve(user)
	if err != nil {
		return WriteAPIError(c, fiber.StatusForbidden, "forbidden", err.Error())
	}
	sessions, err := h.services.Access.GetSessions(access, user.ID, c.Query("userId"))
	if err != nil {
		return WriteAPIError(c, fiber.StatusForbidden, "forbidden", err.Error())
	}
	return c.JSON(sessions)
}

func (h *Handlers) RevokeSession(c *fiber.Ctx) error {
	user, _ := c.Locals("user").(*models.User)
	access, err := h.services.Access.Resolve(user)
	if err != nil {
		return WriteAPIError(c, fiber.StatusForbidden, "forbidden", err.Error())
	}
	if err := h.services.Access.RevokeSession(access, user.ID, c.Params("id")); err != nil {
		return WriteAPIError(c, fiber.StatusForbidden, "session_revocation_failed", err.Error())
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Cities Handlers
func (h *Handlers) GetCities(c *fiber.Ctx) error {
	cities, err := h.services.City.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	access, _ := c.Locals("access").(*models.AccessContext)
	filtered := make([]models.City, 0, len(cities))
	for _, city := range cities {
		if h.services.Access.CanAccessCity(access, city.ID) {
			filtered = append(filtered, city)
		}
	}
	return c.JSON(filtered)
}

func (h *Handlers) CreateCity(c *fiber.Ctx) error {
	var city models.City
	if err := c.BodyParser(&city); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if city.OrganizationID == "" {
		city.OrganizationID = "org-sion-ministry"
	}
	if city.MinistryUnitID == "" {
		city.MinistryUnitID = "unit-sion-academy"
	}
	if city.RegionID == "" {
		city.RegionID = "region-indonesia"
	}
	access, _ := c.Locals("access").(*models.AccessContext)
	if !h.services.Access.CanCreateCity(access, &city) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Hierarchy kota berada di luar scope akun.")
	}
	if err := h.services.City.Create(&city); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(city)
}

// Location Reference Handlers
func (h *Handlers) GetProvinces(c *fiber.Ctx) error {
	query := c.Query("q")
	provinces, err := h.services.Location.GetProvinces(query)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(provinces)
}

func (h *Handlers) GetCitiesByProvince(c *fiber.Ctx) error {
	province := c.Query("province")
	query := c.Query("q")
	cities, err := h.services.Location.GetCitiesByProvince(province, query)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(cities)
}

// Members Handlers
func (h *Handlers) GetMembers(c *fiber.Ctx) error {
	members, err := h.services.Member.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	filtered := make([]models.Member, 0, len(members))
	for i := range members {
		if h.services.Access.CanAccessMember(access, user, &members[i], false) {
			filtered = append(filtered, members[i])
		}
	}
	return c.JSON(filtered)
}

func (h *Handlers) CreateMember(c *fiber.Ctx) error {
	var member models.Member
	if err := c.BodyParser(&member); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	if !h.services.Access.CanAccessCity(access, member.CityID) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Kota anggota berada di luar scope akun.")
	}
	if !h.services.Access.HasRole(access, "admin") {
		member.UserID = nil
		member.MentorUserID = localStringPointer(user.ID)
	}
	if err := h.services.Member.Create(&member); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(member)
}

func (h *Handlers) UpdateMember(c *fiber.Ctx) error {
	var member models.Member
	if err := c.BodyParser(&member); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	id := c.Params("id")
	existing, err := h.services.Member.GetByID(id)
	if err != nil {
		return WriteAPIError(c, fiber.StatusNotFound, "member_not_found", "Anggota tidak ditemukan.")
	}
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	if !h.services.Access.CanAccessMember(access, user, existing, true) || !h.services.Access.CanAccessCity(access, member.CityID) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Anggota berada di luar scope akun.")
	}
	if !h.services.Access.HasRole(access, "admin") {
		member.UserID = existing.UserID
		member.MentorUserID = localStringPointer(user.ID)
	}
	member.ID = id
	if err := h.services.Member.Update(&member); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(member)
}

func (h *Handlers) DeleteMember(c *fiber.Ctx) error {
	id := c.Params("id")
	existing, err := h.services.Member.GetByID(id)
	if err != nil {
		return WriteAPIError(c, fiber.StatusNotFound, "member_not_found", "Anggota tidak ditemukan.")
	}
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	if !h.services.Access.CanAccessMember(access, user, existing, true) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Anggota berada di luar scope akun.")
	}
	if err := h.services.Member.Delete(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// BeritaAcara Handlers
func (h *Handlers) GetBerita(c *fiber.Ctx) error {
	berita, err := h.services.Berita.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	access, _ := c.Locals("access").(*models.AccessContext)
	filtered := make([]models.BeritaAcara, 0, len(berita))
	for _, item := range berita {
		if h.services.Access.HasRole(access, "jemaat") {
			if item.IsPublic {
				filtered = append(filtered, item)
			}
		} else if h.services.Access.CanAccessCity(access, item.CityID) {
			filtered = append(filtered, item)
		}
	}
	return c.JSON(filtered)
}

func (h *Handlers) CreateBerita(c *fiber.Ctx) error {
	var b models.BeritaAcara
	if err := c.BodyParser(&b); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	access, _ := c.Locals("access").(*models.AccessContext)
	if !h.services.Access.CanAccessCity(access, b.CityID) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Kota berita acara berada di luar scope akun.")
	}
	b.IsPublic = true
	if err := h.services.Berita.Create(&b); err != nil {
		if isUploadValidationError(err) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": APIError{Code: "invalid_upload", Message: err.Error(), RequestID: requestID(c)}})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(b)
}

func (h *Handlers) DeleteBerita(c *fiber.Ctx) error {
	id := c.Params("id")
	existing, err := h.services.Berita.GetByID(id)
	if err != nil {
		return WriteAPIError(c, fiber.StatusNotFound, "event_not_found", "Berita acara tidak ditemukan.")
	}
	access, _ := c.Locals("access").(*models.AccessContext)
	if !h.services.Access.CanAccessCity(access, existing.CityID) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Berita acara berada di luar scope akun.")
	}
	if err := h.services.Berita.Delete(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

func (h *Handlers) GetAttendance(c *fiber.Ctx) error {
	access, _ := c.Locals("access").(*models.AccessContext)
	records, err := h.services.Access.GetAttendance(access)
	if err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "attendance_lookup_failed", "Gagal mengambil kehadiran.")
	}
	return c.JSON(records)
}

func (h *Handlers) CheckInAttendance(c *fiber.Ctx) error {
	var input struct {
		EventID  string `json:"eventId"`
		MemberID string `json:"memberId"`
	}
	if err := c.BodyParser(&input); err != nil {
		return WriteAPIError(c, fiber.StatusBadRequest, "invalid_request", "Payload check-in tidak valid.")
	}
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	record, err := h.services.Access.CheckIn(access, user, input.EventID, input.MemberID)
	if err != nil {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", err.Error())
	}
	return c.Status(fiber.StatusCreated).JSON(record)
}

// JurnalPA Handlers
func (h *Handlers) GetJurnalPA(c *fiber.Ctx) error {
	jurnals, err := h.services.Jurnal.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	filtered := make([]models.JurnalPA, 0, len(jurnals))
	for i := range jurnals {
		if h.services.Access.CanAccessJournal(access, user, &jurnals[i], false) {
			filtered = append(filtered, jurnals[i])
		}
	}
	return c.JSON(filtered)
}

func (h *Handlers) CreateJurnalPA(c *fiber.Ctx) error {
	var j models.JurnalPA
	if err := c.BodyParser(&j); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	if !h.services.Access.HasRole(access, "admin") {
		j.MentorUserID = localStringPointer(user.ID)
	}
	if !h.services.Access.CanAccessJournal(access, user, &j, true) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Jurnal hanya dapat dibuat untuk mentee aktif yang ditugaskan.")
	}
	if err := h.services.Jurnal.Create(&j); err != nil {
		if isUploadValidationError(err) {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": APIError{Code: "invalid_upload", Message: err.Error(), RequestID: requestID(c)}})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(j)
}

func isUploadValidationError(err error) bool {
	return errors.Is(err, service.ErrInvalidUpload)
}

func (h *Handlers) DeleteJurnalPA(c *fiber.Ctx) error {
	id := c.Params("id")
	existing, err := h.services.Jurnal.GetByID(id)
	if err != nil {
		return WriteAPIError(c, fiber.StatusNotFound, "journal_not_found", "Jurnal tidak ditemukan.")
	}
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	if !h.services.Access.CanAccessJournal(access, user, existing, false) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Jurnal berada di luar scope akun.")
	}
	if err := h.services.Jurnal.Delete(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Donations Handlers
func (h *Handlers) GetCampaigns(c *fiber.Ctx) error {
	campaigns, err := h.services.Donation.GetAllCampaigns()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(campaigns)
}

func (h *Handlers) CreateCampaign(c *fiber.Ctx) error {
	var campaign models.DonationCampaign
	if err := c.BodyParser(&campaign); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.Donation.CreateCampaign(&campaign); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(campaign)
}

func (h *Handlers) GetDonationRecords(c *fiber.Ctx) error {
	records, err := h.services.Donation.GetAllRecords()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	filtered := make([]models.DonationRecord, 0, len(records))
	for _, record := range records {
		if (record.UserID != nil && *record.UserID == user.ID) || (record.CityID != nil && h.services.Access.CanAccessCity(access, *record.CityID) && !h.services.Access.HasRole(access, "jemaat")) {
			filtered = append(filtered, record)
		}
	}
	return c.JSON(filtered)
}

func (h *Handlers) CreateDonationRecord(c *fiber.Ctx) error {
	var record models.DonationRecord
	if err := c.BodyParser(&record); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	user, _ := c.Locals("user").(*models.User)
	record.UserID = localStringPointer(user.ID)
	if user.CityID != nil {
		record.CityID = localStringPointer(*user.CityID)
	}
	if err := h.services.Donation.CreateRecord(&record); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(record)
}

func (h *Handlers) VerifyDonationRecord(c *fiber.Ctx) error {
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	existing, err := h.services.Donation.GetRecordByID(c.Params("id"))
	if err != nil {
		return WriteAPIError(c, fiber.StatusNotFound, "donation_not_found", "Donasi tidak ditemukan.")
	}
	if existing.CityID == nil || !h.services.Access.CanAccessCity(access, *existing.CityID) {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", "Donasi berada di luar scope akun.")
	}
	record, err := h.services.Donation.VerifyRecord(existing.ID, user.ID)
	if err != nil {
		return WriteAPIError(c, fiber.StatusInternalServerError, "donation_verification_failed", "Gagal memverifikasi donasi.")
	}
	h.services.Access.RecordAudit(user.ID, "donation.verified", "donation", record.ID, "city", *record.CityID, "success", requestID(c), c.IP(), nil)
	return c.JSON(record)
}

// Links Handlers
func (h *Handlers) GetLinks(c *fiber.Ctx) error {
	links, err := h.services.Link.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(links)
}

func (h *Handlers) CreateLink(c *fiber.Ctx) error {
	var link models.DiscipleshipLink
	if err := c.BodyParser(&link); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.Link.Create(&link); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(link)
}

func (h *Handlers) UpdateLink(c *fiber.Ctx) error {
	var link models.DiscipleshipLink
	if err := c.BodyParser(&link); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	id := c.Params("id")
	link.ID = id
	if err := h.services.Link.Update(&link); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(link)
}

func (h *Handlers) DeleteLink(c *fiber.Ctx) error {
	id := c.Params("id")
	if err := h.services.Link.Delete(id); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.SendStatus(fiber.StatusNoContent)
}

// Jobs Handlers
func (h *Handlers) GetJobs(c *fiber.Ctx) error {
	jobs, err := h.services.Job.GetAllJobs()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(jobs)
}

func (h *Handlers) CreateJob(c *fiber.Ctx) error {
	var job models.JobOpportunity
	if err := c.BodyParser(&job); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	if err := h.services.Job.CreateJob(&job); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(job)
}

func (h *Handlers) GetJobApplications(c *fiber.Ctx) error {
	apps, err := h.services.Job.GetAllApplications()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	filtered := make([]models.JobApplication, 0, len(apps))
	for _, application := range apps {
		if (application.UserID != nil && *application.UserID == user.ID) || (application.CityID != nil && h.services.Access.CanAccessCity(access, *application.CityID) && !h.services.Access.HasRole(access, "jemaat")) {
			filtered = append(filtered, application)
		}
	}
	return c.JSON(filtered)
}

func (h *Handlers) CreateJobApplication(c *fiber.Ctx) error {
	var app models.JobApplication
	if err := c.BodyParser(&app); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	user, _ := c.Locals("user").(*models.User)
	app.UserID = localStringPointer(user.ID)
	if user.CityID != nil {
		app.CityID = localStringPointer(*user.CityID)
	}
	if err := h.services.Job.CreateApplication(&app); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.Status(fiber.StatusCreated).JSON(app)
}

// Modules Handlers
func (h *Handlers) GetModules(c *fiber.Ctx) error {
	modules, err := h.services.Module.GetAll()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(modules)
}

func (h *Handlers) UpdateModule(c *fiber.Ctx) error {
	var module models.DiscipleshipModule
	if err := c.BodyParser(&module); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	id := c.Params("id")
	module.ID = id
	if err := h.services.Module.Update(&module); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}
	return c.JSON(module)
}

// AI Assistant Handler
func (h *Handlers) AiAssistant(c *fiber.Ctx) error {
	var req struct {
		Prompt            string `json:"prompt"`
		SystemInstruction string `json:"systemInstruction"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	response, err := h.services.AI.GetAssistantResponse(req.Prompt, req.SystemInstruction)
	if err != nil {
		log.Printf("Gemini API Error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"text": response})
}

// Sync/Proxy Handlers
func (h *Handlers) Sync(c *fiber.Ctx) error {
	var payload models.SyncPayload
	if err := c.BodyParser(&payload); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}
	user, _ := c.Locals("user").(*models.User)
	access, _ := c.Locals("access").(*models.AccessContext)
	if err := h.services.Access.ValidateSync(access, user, &payload); err != nil {
		return WriteAPIError(c, fiber.StatusForbidden, "scope_forbidden", err.Error())
	}

	if err := h.services.Sync.Sync(&payload); err != nil {
		log.Printf("Sync Error: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	return c.JSON(fiber.Map{"success": true})
}
