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
