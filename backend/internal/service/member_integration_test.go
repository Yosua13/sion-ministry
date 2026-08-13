package service_test

import (
	"errors"
	"os"
	"testing"
	"time"

	"backend/config"
	"backend/internal/database"
	"backend/internal/models"
	"backend/internal/repository"
	"backend/internal/service"

	"github.com/google/uuid"
)

func TestMember360Integration(t *testing.T) {
	if os.Getenv("APP_ENV") != "test" {
		t.Skip("integration test requires APP_ENV=test and an isolated PostgreSQL database")
	}
	cfg, err := config.LoadConfig()
	if err != nil {
		t.Fatal(err)
	}
	db, err := database.InitDatabase(cfg)
	if err != nil {
		t.Fatal(err)
	}
	tx := db.Begin()
	defer tx.Rollback()

	suffix := uuid.NewString()
	cityA := models.City{ID: "member360-a-" + suffix, Name: "Kota Member A", OrganizationID: "org-sion-ministry", MinistryUnitID: "unit-sion-academy", RegionID: "region-indonesia"}
	cityB := models.City{ID: "member360-b-" + suffix, Name: "Kota Member B", OrganizationID: "org-sion-ministry", MinistryUnitID: "unit-sion-academy", RegionID: "region-indonesia"}
	if err := tx.Create(&[]models.City{cityA, cityB}).Error; err != nil {
		t.Fatal(err)
	}
	actor := models.User{ID: "member360-actor-" + suffix, Name: "Data Steward", Email: "steward-" + suffix + "@example.test", PasswordHash: "unused", Role: "admin", Status: "active", CreatedAt: time.Now().Format(time.RFC3339)}
	if err := tx.Create(&actor).Error; err != nil {
		t.Fatal(err)
	}

	members := service.NewMemberService(repository.NewMemberRepository(tx), repository.NewCityRepository(tx))
	first := validMember(cityA, "Maria Sion", "+62 812-3456-7890", "maria@example.test")
	if err := members.Create(&first, actor.ID, []string{cityA.ID}, false); err != nil {
		t.Fatal(err)
	}
	if _, err := uuid.Parse(first.ID); err != nil {
		t.Fatalf("new member ID must be UUID: %v", err)
	}
	if first.Phone != "+6281234567890" || first.Email != "maria@example.test" {
		t.Fatalf("phone/email were not normalized: %s %s", first.Phone, first.Email)
	}

	duplicate := validMember(cityA, "Maria Sion", "0812 3456 7890", "other@example.test")
	err = members.Create(&duplicate, actor.ID, []string{cityA.ID}, false)
	var duplicateConflict *service.MemberDuplicateConflictError
	if !errors.As(err, &duplicateConflict) || len(duplicateConflict.Candidates) != 1 {
		t.Fatalf("expected duplicate candidates, got %v", err)
	}
	if duplicateConflict.Candidates[0].MaskedPhone == first.Phone {
		t.Fatal("duplicate response must mask phone")
	}
	duplicate.DuplicateOverrideReason = "Orang berbeda telah diverifikasi data steward"
	if err := members.Create(&duplicate, actor.ID, []string{cityA.ID}, false); err != nil {
		t.Fatal(err)
	}
	var pendingReviews int64
	if err := tx.Model(&models.MemberDuplicateReview{}).Where("member_id = ? AND status = 'pending'", duplicate.ID).Count(&pendingReviews).Error; err != nil || pendingReviews != 1 {
		t.Fatalf("duplicate override must create pending review: count=%d err=%v", pendingReviews, err)
	}
	reviews, err := members.ListDuplicateReviews("pending", []string{cityA.ID}, false)
	if err != nil || len(reviews) != 1 {
		t.Fatalf("data steward report must list pending review: count=%d err=%v", len(reviews), err)
	}
	if _, err := members.DecideDuplicateReview(reviews[0].ID, "not_duplicate", "Identitas berbeda telah diverifikasi", actor.ID); err != nil {
		t.Fatal(err)
	}

	otherCity := validMember(cityB, "Yohanes Kota B", "+628555555555", "yohanes@example.test")
	if err := members.Create(&otherCity, actor.ID, []string{cityB.ID}, false); err != nil {
		t.Fatal(err)
	}
	page, err := members.List(models.MemberListQuery{Page: 1, PageSize: 10, CityIDs: []string{cityA.ID}})
	if err != nil {
		t.Fatal(err)
	}
	if page.Total != 2 {
		t.Fatalf("city-scoped list must return 2 members, got %d", page.Total)
	}

	first.CityID = cityB.ID
	first.CityName = cityB.Name
	first.Status = "inactive"
	first.GroupName = "Komsel Pengharapan"
	first.ConsentStatus = "revoked"
	first.ConsentSource = "Form digital"
	first.ConsentPurpose = "Komunikasi pembinaan"
	first.CommunicationPreferences = []string{"none"}
	first.DuplicateOverrideReason = "Perubahan profil telah diverifikasi data steward"
	if err := members.Update(&first, actor.ID, []string{cityA.ID, cityB.ID}, false); err != nil {
		t.Fatal(err)
	}
	history, err := members.GetHistory(first.ID)
	if err != nil {
		t.Fatal(err)
	}
	assertHistoryField(t, history, "city")
	assertHistoryField(t, history, "group")
	assertHistoryField(t, history, "status")
	if len(history.Consents) < 2 {
		t.Fatalf("consent changes must be append-only, got %d entries", len(history.Consents))
	}

	if err := members.Archive(&first, actor.ID, "Data testing selesai dan harus diretensi"); err != nil {
		t.Fatal(err)
	}
	activePage, err := members.List(models.MemberListQuery{Page: 1, PageSize: 10, CityIDs: []string{cityB.ID}})
	if err != nil {
		t.Fatal(err)
	}
	if activePage.Total != 1 || activePage.Items[0].ID != otherCity.ID {
		t.Fatal("archived member must be excluded from the default list")
	}
	archivedPage, err := members.List(models.MemberListQuery{Page: 1, PageSize: 10, CityIDs: []string{cityB.ID}, Status: "archived", IncludeArchived: true})
	if err != nil || archivedPage.Total != 1 {
		t.Fatalf("archived member must remain queryable for authorized review: total=%d err=%v", archivedPage.Total, err)
	}

	exported, err := members.Export(models.MemberListQuery{CityIDs: []string{cityA.ID}})
	if err != nil || len(exported) != 1 || exported[0].ID != duplicate.ID {
		t.Fatalf("scoped export mismatch: count=%d err=%v", len(exported), err)
	}
	masked := service.MaskMemberSensitive(exported[0])
	if masked.Phone == exported[0].Phone || masked.Email == exported[0].Email || masked.ConsentPurpose != "" {
		t.Fatal("sensitive fields must be masked/redacted")
	}
	pending, err := members.ListDuplicateReviews("pending", []string{cityA.ID, cityB.ID}, false)
	if err != nil {
		t.Fatal(err)
	}
	for _, review := range pending {
		if _, err := members.DecideDuplicateReview(review.ID, "not_duplicate", "Keputusan integration test terverifikasi", actor.ID); err != nil {
			t.Fatal(err)
		}
	}
	pending, err = members.ListDuplicateReviews("pending", []string{cityA.ID, cityB.ID}, false)
	if err != nil || len(pending) != 0 {
		t.Fatalf("migration gate requires zero pending decisions: count=%d err=%v", len(pending), err)
	}
}

func validMember(city models.City, name, phone, email string) models.Member {
	return models.Member{
		Name: name, Phone: phone, Email: email, CityID: city.ID, CityName: city.Name,
		DiscipleshipStage: "Jemaat", JoinedDate: "2026-08-12", Status: "active",
		ConsentStatus: "granted", ConsentSource: "Form digital", ConsentPurpose: "Komunikasi pembinaan",
		CommunicationPreferences: []string{"whatsapp"},
	}
}

func assertHistoryField(t *testing.T, history *models.MemberHistoryResult, field string) {
	t.Helper()
	for _, change := range history.Changes {
		if change.FieldName == field {
			if change.ActorUserID == nil || *change.ActorUserID == "" {
				t.Fatalf("history %s must retain actor", field)
			}
			return
		}
	}
	t.Fatalf("history field %s not found", field)
}
