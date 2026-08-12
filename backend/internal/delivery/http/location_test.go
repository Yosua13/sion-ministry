package http_test

import (
	"testing"

	"backend/internal/repository"
	"backend/internal/service"
)

func TestLocationService_GetProvinces(t *testing.T) {
	repo := repository.NewLocationRepository()
	srv := service.NewLocationService(repo)

	// Test get all provinces
	provinces, err := srv.GetProvinces("")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(provinces) < 38 {
		t.Errorf("expected at least 38 provinces, got %d", len(provinces))
	}

	// Test search province with >= 3 chars
	filtered, err := srv.GetProvinces("jawa")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(filtered) == 0 {
		t.Errorf("expected matching provinces for 'jawa', got 0")
	}

	// Test specific province search
	jtim, err := srv.GetProvinces("jawa timur")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(jtim) != 1 || jtim[0].Name != "Jawa Timur" {
		t.Errorf("expected 1 match 'Jawa Timur', got %v", jtim)
	}
}

func TestLocationService_GetCitiesByProvince(t *testing.T) {
	repo := repository.NewLocationRepository()
	srv := service.NewLocationService(repo)

	// Test get cities by province
	cities, err := srv.GetCitiesByProvince("Jawa Timur", "")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(cities) == 0 {
		t.Fatalf("expected cities for Jawa Timur, got 0")
	}

	// Test search city with >= 3 chars in province
	surabaya, err := srv.GetCitiesByProvince("Jawa Timur", "sur")
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(surabaya) == 0 || surabaya[0].Name != "Kota Surabaya" {
		t.Errorf("expected 'Kota Surabaya', got %v", surabaya)
	}
}
