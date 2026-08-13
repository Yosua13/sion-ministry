package service

import (
	"backend/internal/models"
	"testing"
)

func TestMemberValidationRequiresActivationEmail(t *testing.T) {
	member := &models.Member{Name: "Maria Sion", Phone: "081234567890", CityID: "city-a", DiscipleshipStage: "Jemaat", JoinedDate: "2026-08-13", Status: "active"}
	err := validateAndNormalizeMember(member)
	validation, ok := err.(*MemberValidationError)
	if !ok || validation.Fields["email"] == "" {
		t.Fatalf("expected email validation error, got %v", err)
	}
}

func TestMemberValidationNormalizesPhoneAndEmail(t *testing.T) {
	member := &models.Member{Name: " Maria   Sion ", Email: "MARIA@example.test", Phone: "081234567890", CityID: "city-a", DiscipleshipStage: "Jemaat", JoinedDate: "2026-08-13", Status: "active"}
	if err := validateAndNormalizeMember(member); err != nil {
		t.Fatalf("validation failed: %v", err)
	}
	if member.Phone != "+6281234567890" || member.Email != "maria@example.test" {
		t.Fatalf("normalization failed: %#v", member)
	}
}
