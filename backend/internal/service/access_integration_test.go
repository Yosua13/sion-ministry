package service_test

import (
	"os"
	"testing"
	"time"

	"backend/config"
	"backend/internal/database"
	"backend/internal/models"
	"backend/internal/service"

	"github.com/google/uuid"
)

func TestScopedAccessIntegration(t *testing.T) {
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
	cityA := models.City{ID: "city-a-" + suffix, Name: "Kota A", OrganizationID: "org-sion-ministry", MinistryUnitID: "unit-sion-academy", RegionID: "region-indonesia"}
	cityB := models.City{ID: "city-b-" + suffix, Name: "Kota B", OrganizationID: "org-sion-ministry", MinistryUnitID: "unit-sion-academy", RegionID: "region-indonesia"}
	if err := tx.Create(&cityA).Error; err != nil {
		t.Fatal(err)
	}
	if err := tx.Create(&cityB).Error; err != nil {
		t.Fatal(err)
	}

	worker := models.User{ID: "worker-" + suffix, Name: "Worker A", Email: "worker-" + suffix + "@example.test", PasswordHash: "unused", Role: "pekerja", Status: "active", CityID: &cityA.ID, CreatedAt: time.Now().Format(time.RFC3339)}
	memberUser := models.User{ID: "member-user-" + suffix, Name: "Member A", Email: "member-" + suffix + "@example.test", PasswordHash: "unused", Role: "jemaat", Status: "active", CityID: &cityA.ID, CreatedAt: time.Now().Format(time.RFC3339)}
	noAssignment := models.User{ID: "no-assignment-" + suffix, Name: "No Assignment", Email: "none-" + suffix + "@example.test", PasswordHash: "unused", Role: "pekerja", Status: "active", CityID: &cityA.ID, CreatedAt: time.Now().Format(time.RFC3339)}
	for _, user := range []*models.User{&worker, &memberUser, &noAssignment} {
		if err := tx.Create(user).Error; err != nil {
			t.Fatal(err)
		}
	}
	now := time.Now().Add(-time.Minute).Format(time.RFC3339)
	assignments := []models.RoleAssignment{
		{ID: "ra-worker-" + suffix, UserID: worker.ID, Role: "pekerja", ScopeType: "city", ScopeID: cityA.ID, Status: "active", ValidFrom: now, CreatedAt: now},
		{ID: "ra-member-" + suffix, UserID: memberUser.ID, Role: "jemaat", ScopeType: "self", ScopeID: memberUser.ID, Status: "active", ValidFrom: now, CreatedAt: now},
	}
	if err := tx.Create(&assignments).Error; err != nil {
		t.Fatal(err)
	}

	joinedOn := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	menteeA := models.Member{ID: "mentee-a-" + suffix, Name: "Mentee A", NormalizedName: "mentee a", NormalizedPhone: "", NormalizedEmail: "", CityID: cityA.ID, PrimaryServicePointID: cityA.ID, Status: "active", JoinedOn: joinedOn, Version: 1, ConsentStatus: "unknown", CommunicationPreferences: []string{}, UserID: testStringPointer(memberUser.ID), MentorUserID: testStringPointer(worker.ID)}
	menteeB := models.Member{ID: "mentee-b-" + suffix, Name: "Mentee B", NormalizedName: "mentee b", NormalizedPhone: "", NormalizedEmail: "", CityID: cityB.ID, PrimaryServicePointID: cityB.ID, Status: "active", JoinedOn: joinedOn, Version: 1, ConsentStatus: "unknown", CommunicationPreferences: []string{}}
	if err := tx.Create(&menteeA).Error; err != nil {
		t.Fatal(err)
	}
	if err := tx.Create(&menteeB).Error; err != nil {
		t.Fatal(err)
	}
	journalA := models.JurnalPA{ID: "journal-a-" + suffix, CityID: cityA.ID, Theme: "A", Date: "2026-01-01", MenteeID: testStringPointer(menteeA.ID), MentorUserID: testStringPointer(worker.ID)}
	journalB := models.JurnalPA{ID: "journal-b-" + suffix, CityID: cityB.ID, Theme: "B", Date: "2026-01-01", MenteeID: testStringPointer(menteeB.ID)}
	if err := tx.Create(&journalA).Error; err != nil {
		t.Fatal(err)
	}
	if err := tx.Create(&journalB).Error; err != nil {
		t.Fatal(err)
	}

	policy := service.NewAccessService(tx)
	workerAccess, err := policy.Resolve(&worker)
	if err != nil {
		t.Fatal(err)
	}
	if !policy.CanAccessMember(workerAccess, &worker, &menteeA, false) {
		t.Fatal("worker Kota A must read a member in Kota A")
	}
	if policy.CanAccessMember(workerAccess, &worker, &menteeB, false) {
		t.Fatal("worker Kota A must not read or guess a member in Kota B")
	}
	crossCitySync := &models.SyncPayload{PendingChanges: []models.SyncItem{{
		ID: menteeB.ID, ItemType: "member", Action: "update", Data: models.Member{
			ID: menteeB.ID, Name: "Forged update", CityID: cityA.ID, PrimaryServicePointID: cityA.ID,
			NormalizedName: "forged update", NormalizedPhone: "", NormalizedEmail: "", JoinedOn: joinedOn,
			Status: "active", Version: 1, ConsentStatus: "unknown", CommunicationPreferences: []string{},
		},
	}}}
	if err := policy.ValidateSync(workerAccess, &worker, crossCitySync); err == nil {
		t.Fatal("worker Kota A must not update a Kota B member by forging the payload city")
	}
	if !policy.CanAccessJournal(workerAccess, &worker, &journalA, false) {
		t.Fatal("assigned mentor must read the active mentee journal")
	}
	if policy.CanAccessJournal(workerAccess, &worker, &journalB, false) {
		t.Fatal("mentor must not read an unassigned journal")
	}

	memberAccess, err := policy.Resolve(&memberUser)
	if err != nil {
		t.Fatal(err)
	}
	if !policy.CanAccessJournal(memberAccess, &memberUser, &journalA, false) {
		t.Fatal("member must read their own journal")
	}
	if policy.CanAccessJournal(memberAccess, &memberUser, &journalB, false) {
		t.Fatal("member must not read another member journal")
	}
	if _, err := policy.Resolve(&noAssignment); err == nil {
		t.Fatal("active user without assignment must be denied by default")
	}
}

func testStringPointer(value string) *string { return &value }
