package service

import (
	"errors"
	"fmt"
	"net/mail"
	"regexp"
	"sort"
	"strings"
	"time"

	"backend/internal/models"
	"backend/internal/repository"

	"github.com/google/uuid"
)

var (
	memberSpaces = regexp.MustCompile(`\s+`)
	memberDigits = regexp.MustCompile(`[^0-9]`)
)

type MemberValidationError struct {
	Fields map[string]string
}

func (e *MemberValidationError) Error() string { return "data anggota belum valid" }

type MemberDuplicateConflictError struct {
	Candidates []models.MemberDuplicateCandidate
}

func (e *MemberDuplicateConflictError) Error() string { return "ditemukan kandidat anggota duplikat" }

type memberService struct {
	memberRepo repository.MemberRepository
	cityRepo   repository.CityRepository
}

func NewMemberService(memberRepo repository.MemberRepository, cityRepo repository.CityRepository) MemberService {
	return &memberService{memberRepo: memberRepo, cityRepo: cityRepo}
}

func (s *memberService) List(query models.MemberListQuery) (*models.MemberListResult, error) {
	return s.memberRepo.List(query)
}

func (s *memberService) GetByID(id string) (*models.Member, error) {
	return s.memberRepo.GetByID(strings.TrimSpace(id))
}

func normalizeMemberName(value string) string {
	return strings.ToLower(memberSpaces.ReplaceAllString(strings.TrimSpace(value), " "))
}

func normalizeMemberPhone(value string) string {
	digits := memberDigits.ReplaceAllString(value, "")
	if digits == "" {
		return ""
	}
	if strings.HasPrefix(digits, "0") {
		digits = "62" + strings.TrimPrefix(digits, "0")
	} else if !strings.HasPrefix(digits, "62") && !strings.HasPrefix(value, "+") {
		digits = "62" + digits
	}
	return "+" + digits
}

func normalizeMemberEmail(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}

func normalizePreferences(values []string) ([]string, bool) {
	allowed := map[string]bool{"whatsapp": true, "sms": true, "email": true, "phone": true, "none": true}
	seen := map[string]bool{}
	result := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.ToLower(strings.TrimSpace(value))
		if value == "" {
			continue
		}
		if !allowed[value] || seen[value] || (value == "none" && len(result) > 0) {
			return nil, false
		}
		if seen["none"] {
			return nil, false
		}
		seen[value] = true
		result = append(result, value)
	}
	sort.Strings(result)
	return result, true
}

func validateAndNormalizeMember(member *models.Member) error {
	errs := map[string]string{}
	member.Name = memberSpaces.ReplaceAllString(strings.TrimSpace(member.Name), " ")
	member.NormalizedName = normalizeMemberName(member.Name)
	if len([]rune(member.Name)) < 2 {
		errs["name"] = "Nama lengkap minimal 2 karakter."
	}
	member.NormalizedPhone = normalizeMemberPhone(member.Phone)
	member.Phone = member.NormalizedPhone
	phoneDigits := memberDigits.ReplaceAllString(member.NormalizedPhone, "")
	if len(phoneDigits) < 8 || len(phoneDigits) > 15 {
		errs["phone"] = "Nomor telepon wajib menggunakan format E.164 dengan 8-15 digit."
	}
	member.NormalizedEmail = normalizeMemberEmail(member.Email)
	member.Email = member.NormalizedEmail
	if member.Email != "" {
		parsed, err := mail.ParseAddress(member.Email)
		if err != nil || parsed.Address != member.Email {
			errs["email"] = "Format email tidak valid."
		}
	}
	if strings.TrimSpace(member.CityID) == "" {
		errs["cityId"] = "Primary service point wajib dipilih."
	}
	member.PrimaryServicePointID = strings.TrimSpace(member.CityID)
	validStatuses := map[string]bool{"guest": true, "prospect": true, "active": true, "inactive": true, "moved": true, "deceased": true}
	member.Status = strings.ToLower(strings.TrimSpace(member.Status))
	if !validStatuses[member.Status] {
		errs["status"] = "Lifecycle status tidak valid."
	}
	if member.DiscipleshipStage != "Pekerja" && member.DiscipleshipStage != "Jemaat" {
		errs["discipleshipStage"] = "Tahap pemuridan wajib dipilih."
	}
	joined := member.JoinedOn
	if member.JoinedDate != "" {
		parsed, err := time.Parse("2006-01-02", member.JoinedDate)
		if err != nil {
			errs["joinedDate"] = "Tanggal mulai binaan harus berformat YYYY-MM-DD."
		} else {
			joined = parsed
		}
	}
	if joined.IsZero() {
		errs["joinedDate"] = "Tanggal mulai binaan wajib diisi."
	} else {
		member.JoinedOn = joined
		member.JoinedDate = joined.Format("2006-01-02")
	}
	member.ConsentStatus = strings.ToLower(strings.TrimSpace(member.ConsentStatus))
	if member.ConsentStatus == "" {
		member.ConsentStatus = "unknown"
	}
	if member.ConsentStatus != "unknown" && member.ConsentStatus != "granted" && member.ConsentStatus != "revoked" {
		errs["consentStatus"] = "Status consent tidak valid."
	}
	prefs, valid := normalizePreferences(member.CommunicationPreferences)
	if !valid {
		errs["communicationPreferences"] = "Preferensi komunikasi tidak valid atau 'none' digabung pilihan lain."
	} else {
		member.CommunicationPreferences = prefs
	}
	member.ConsentSource = strings.TrimSpace(member.ConsentSource)
	member.ConsentPurpose = strings.TrimSpace(member.ConsentPurpose)
	if member.ConsentStatus == "granted" {
		if member.ConsentSource == "" {
			errs["consentSource"] = "Sumber consent wajib diisi saat consent diberikan."
		}
		if member.ConsentPurpose == "" {
			errs["consentPurpose"] = "Tujuan pemrosesan wajib diisi saat consent diberikan."
		}
		if len(member.CommunicationPreferences) == 0 {
			errs["communicationPreferences"] = "Pilih minimal satu preferensi komunikasi."
		}
	}
	if len(errs) > 0 {
		return &MemberValidationError{Fields: errs}
	}
	return nil
}

func duplicateCandidates(member *models.Member, matches []models.Member) []models.MemberDuplicateCandidate {
	result := make([]models.MemberDuplicateCandidate, 0, len(matches))
	for _, match := range matches {
		reasons := make([]string, 0, 3)
		score := 0
		if member.NormalizedPhone != "" && member.NormalizedPhone == match.NormalizedPhone {
			reasons = append(reasons, "phone")
			score = 100
		}
		if member.NormalizedEmail != "" && member.NormalizedEmail == match.NormalizedEmail {
			reasons = append(reasons, "email")
			score = 100
		}
		if member.NormalizedName == match.NormalizedName && member.PrimaryServicePointID == match.PrimaryServicePointID {
			reasons = append(reasons, "name_city")
			if score < 75 {
				score = 75
			}
		}
		result = append(result, models.MemberDuplicateCandidate{
			ID: match.ID, Name: match.Name, CityID: match.CityID, CityName: match.CityName,
			MaskedPhone: MaskPhone(match.Phone), MaskedEmail: MaskEmail(match.Email), MatchReasons: reasons, Score: score,
		})
	}
	sort.Slice(result, func(i, j int) bool { return result[i].Score > result[j].Score })
	return result
}

func (s *memberService) FindDuplicateCandidates(member *models.Member, excludeID string, cityIDs []string, allCities bool) ([]models.MemberDuplicateCandidate, error) {
	copy := *member
	if err := validateAndNormalizeMember(&copy); err != nil {
		return nil, err
	}
	matches, err := s.memberRepo.FindDuplicates(&copy, excludeID, cityIDs, allCities)
	if err != nil {
		return nil, err
	}
	return duplicateCandidates(&copy, matches), nil
}

func pointer(value string) *string { return &value }

func newMemberHistory(memberID, actorID, changeType, field, oldValue, newValue, reason string) models.MemberHistory {
	return models.MemberHistory{
		ID: uuid.NewString(), MemberID: memberID, ActorUserID: pointer(actorID), ChangeType: changeType,
		FieldName: field, OldValue: oldValue, NewValue: newValue, Reason: reason, CreatedAt: time.Now().UTC(),
	}
}

func newConsentHistory(member *models.Member, actorID string, recorded time.Time) *models.MemberConsentHistory {
	return &models.MemberConsentHistory{
		ID: uuid.NewString(), MemberID: member.ID, ActorUserID: pointer(actorID), ConsentStatus: member.ConsentStatus,
		CommunicationPreferences: member.CommunicationPreferences, Source: member.ConsentSource,
		Purpose: member.ConsentPurpose, RecordedAt: recorded, CreatedAt: time.Now().UTC(),
	}
}

func reviewsFor(memberID, reason string, candidates []models.MemberDuplicateCandidate) []models.MemberDuplicateReview {
	reviews := make([]models.MemberDuplicateReview, 0, len(candidates))
	for _, candidate := range candidates {
		reviews = append(reviews, models.MemberDuplicateReview{
			ID: uuid.NewString(), MemberID: memberID, CandidateMemberID: candidate.ID,
			MatchReasons: candidate.MatchReasons, Score: candidate.Score, OverrideReason: reason,
			Status: "pending", CreatedAt: time.Now().UTC(),
		})
	}
	return reviews
}

func duplicateGate(member *models.Member, candidates []models.MemberDuplicateCandidate) error {
	if len(candidates) == 0 {
		return nil
	}
	reason := strings.TrimSpace(member.DuplicateOverrideReason)
	if reason == "" {
		return &MemberDuplicateConflictError{Candidates: candidates}
	}
	if len([]rune(reason)) < 10 {
		return &MemberValidationError{Fields: map[string]string{"duplicateOverrideReason": "Alasan melanjutkan data duplikat minimal 10 karakter."}}
	}
	member.DuplicateOverrideReason = reason
	return nil
}

func (s *memberService) Create(member *models.Member, actorID string, cityIDs []string, allCities bool) error {
	if member == nil {
		return &MemberValidationError{Fields: map[string]string{"member": "Payload anggota wajib diisi."}}
	}
	if err := validateAndNormalizeMember(member); err != nil {
		return err
	}
	candidates, err := s.FindDuplicateCandidates(member, "", cityIDs, allCities)
	if err != nil {
		return err
	}
	if err := duplicateGate(member, candidates); err != nil {
		return err
	}
	now := time.Now().UTC()
	member.ID = uuid.NewString()
	member.Version = 1
	member.OwnerUserID = pointer(actorID)
	member.CreatedAt = now
	member.UpdatedAt = now
	if member.ConsentRecordedAt == nil {
		member.ConsentRecordedAt = &now
	}
	histories := []models.MemberHistory{newMemberHistory(member.ID, actorID, "created", "member", "", member.Name, member.DuplicateOverrideReason)}
	consent := newConsentHistory(member, actorID, *member.ConsentRecordedAt)
	if err := s.memberRepo.Create360(member, histories, consent, reviewsFor(member.ID, member.DuplicateOverrideReason, candidates)); err != nil {
		return err
	}
	return s.cityRepo.RecalculateStats()
}

func changedHistory(memberID, actorID string, old, next *models.Member) []models.MemberHistory {
	fields := []struct{ name, before, after string }{
		{"city", old.CityID, next.CityID}, {"mentor", valueOrEmpty(old.MentorUserID) + "|" + old.MentorName, valueOrEmpty(next.MentorUserID) + "|" + next.MentorName},
		{"group", old.GroupName, next.GroupName}, {"status", old.Status, next.Status},
	}
	result := make([]models.MemberHistory, 0, len(fields))
	for _, field := range fields {
		if field.before != field.after {
			result = append(result, newMemberHistory(memberID, actorID, "updated", field.name, field.before, field.after, next.DuplicateOverrideReason))
		}
	}
	return result
}

func valueOrEmpty(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func consentChanged(old, next *models.Member) bool {
	return old.ConsentStatus != next.ConsentStatus || old.ConsentSource != next.ConsentSource ||
		old.ConsentPurpose != next.ConsentPurpose || strings.Join(old.CommunicationPreferences, ",") != strings.Join(next.CommunicationPreferences, ",")
}

func (s *memberService) Update(member *models.Member, actorID string, cityIDs []string, allCities bool) error {
	if member == nil || strings.TrimSpace(member.ID) == "" {
		return &MemberValidationError{Fields: map[string]string{"id": "ID anggota wajib diisi."}}
	}
	old, err := s.memberRepo.GetByID(member.ID)
	if err != nil {
		return err
	}
	if old.Status == "archived" {
		return errors.New("anggota yang telah diarsipkan tidak dapat diubah")
	}
	expectedVersion := member.Version
	if expectedVersion < 1 {
		return &MemberValidationError{Fields: map[string]string{"version": "Version wajib dikirim untuk mencegah overwrite perubahan lain."}}
	}
	if err := validateAndNormalizeMember(member); err != nil {
		return err
	}
	candidates, err := s.FindDuplicateCandidates(member, member.ID, cityIDs, allCities)
	if err != nil {
		return err
	}
	if err := duplicateGate(member, candidates); err != nil {
		return err
	}
	member.Version = expectedVersion + 1
	member.CreatedAt = old.CreatedAt
	member.UpdatedAt = time.Now().UTC()
	member.ArchivedAt, member.ArchivedBy, member.ArchiveReason, member.RetentionUntil = old.ArchivedAt, old.ArchivedBy, old.ArchiveReason, old.RetentionUntil
	histories := changedHistory(member.ID, actorID, old, member)
	var consent *models.MemberConsentHistory
	if consentChanged(old, member) {
		recorded := time.Now().UTC()
		member.ConsentRecordedAt = &recorded
		consent = newConsentHistory(member, actorID, recorded)
		histories = append(histories, newMemberHistory(member.ID, actorID, "consent", "consent", old.ConsentStatus, member.ConsentStatus, member.ConsentPurpose))
	} else {
		member.ConsentRecordedAt = old.ConsentRecordedAt
	}
	if err := s.memberRepo.Update360(member, expectedVersion, histories, consent, reviewsFor(member.ID, member.DuplicateOverrideReason, candidates)); err != nil {
		if errors.Is(err, repository.ErrMemberVersionConflict) {
			return &MemberValidationError{Fields: map[string]string{"version": "Data telah berubah. Muat ulang profil sebelum menyimpan kembali."}}
		}
		return err
	}
	return s.cityRepo.RecalculateStats()
}

func (s *memberService) Archive(member *models.Member, actorID, reason string) error {
	reason = strings.TrimSpace(reason)
	if len([]rune(reason)) < 10 {
		return &MemberValidationError{Fields: map[string]string{"reason": "Alasan archive minimal 10 karakter."}}
	}
	history := newMemberHistory(member.ID, actorID, "archived", "status", member.Status, "archived", reason)
	if err := s.memberRepo.Archive(member.ID, member.Version, actorID, reason, &history); err != nil {
		return err
	}
	return s.cityRepo.RecalculateStats()
}

func (s *memberService) GetHistory(memberID string) (*models.MemberHistoryResult, error) {
	return s.memberRepo.GetHistory(memberID)
}

func (s *memberService) Export(query models.MemberListQuery) ([]models.Member, error) {
	return s.memberRepo.Export(query, 10000)
}

func (s *memberService) ListDuplicateReviews(status string, cityIDs []string, allCities bool) ([]models.MemberDuplicateReview, error) {
	status = strings.ToLower(strings.TrimSpace(status))
	if status != "" && status != "pending" && status != "merged" && status != "not_duplicate" {
		return nil, &MemberValidationError{Fields: map[string]string{"status": "Status duplicate review tidak valid."}}
	}
	return s.memberRepo.ListDuplicateReviews(status, cityIDs, allCities)
}

func (s *memberService) GetDuplicateReview(id string) (*models.MemberDuplicateReview, error) {
	return s.memberRepo.GetDuplicateReview(strings.TrimSpace(id))
}

func (s *memberService) DecideDuplicateReview(id, decision, note, actorID string) (*models.MemberDuplicateReview, error) {
	decision = strings.ToLower(strings.TrimSpace(decision))
	note = strings.TrimSpace(note)
	if decision != "merged" && decision != "not_duplicate" {
		return nil, &MemberValidationError{Fields: map[string]string{"decision": "Keputusan harus merged atau not_duplicate."}}
	}
	if len([]rune(note)) < 10 {
		return nil, &MemberValidationError{Fields: map[string]string{"note": "Catatan keputusan minimal 10 karakter."}}
	}
	return s.memberRepo.DecideDuplicateReview(strings.TrimSpace(id), decision, note, actorID)
}

func MaskPhone(value string) string {
	digits := memberDigits.ReplaceAllString(value, "")
	if len(digits) <= 4 {
		return "****"
	}
	return "+" + strings.Repeat("*", len(digits)-4) + digits[len(digits)-4:]
}

func MaskEmail(value string) string {
	parts := strings.Split(normalizeMemberEmail(value), "@")
	if len(parts) != 2 || parts[0] == "" {
		return ""
	}
	first := string([]rune(parts[0])[0])
	return fmt.Sprintf("%s***@%s", first, parts[1])
}

func MaskMemberSensitive(member models.Member) models.Member {
	member.Phone = MaskPhone(member.Phone)
	member.Email = MaskEmail(member.Email)
	member.ConsentSource = ""
	member.ConsentPurpose = ""
	member.OwnerUserID = nil
	return member
}
