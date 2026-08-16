package service

import (
	"backend/internal/models"
	"testing"
)

func TestStaticPermissionsAreLeastPrivilege(t *testing.T) {
	service := &accessService{}
	jemaat := &models.AccessContext{Roles: []string{"jemaat"}, Permissions: permissionsByRole["jemaat"], CityIDs: []string{"city-a"}}
	if service.HasPermission(jemaat, "user.invite") {
		t.Fatal("jemaat must not be able to invite users")
	}
	if !service.HasPermission(jemaat, "member.read") {
		t.Fatal("jemaat needs self-profile read permission")
	}
	if service.CanAccessCity(jemaat, "city-b") {
		t.Fatal("city scope leaked")
	}
}

func TestShouldStoreAuditActionExcludesReadTelemetry(t *testing.T) {
	testCases := []struct {
		action string
		want   bool
	}{
		{action: "member.sensitive.read", want: false},
		{action: "member.history.read", want: false},
		{action: "access.allowed", want: false},
		{action: "member.created", want: true},
		{action: "member.updated", want: true},
		{action: "session.revoked", want: true},
		{action: "access.denied", want: true},
	}

	for _, testCase := range testCases {
		if got := shouldStoreAuditAction(testCase.action); got != testCase.want {
			t.Errorf("shouldStoreAuditAction(%q) = %t, want %t", testCase.action, got, testCase.want)
		}
	}
}
