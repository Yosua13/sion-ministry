package objectstore

import "testing"

func TestValidateInput(t *testing.T) {
	checksum := "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
	extension, err := ValidateInput(PresignInput{ContentType: "image/png", Size: 1024, SHA256: checksum, CityID: "city-1"})
	if err != nil {
		t.Fatal(err)
	}
	if extension != "png" {
		t.Fatalf("extension = %q, want png", extension)
	}

	invalidInputs := []PresignInput{
		{ContentType: "image/svg+xml", Size: 1024, SHA256: checksum, CityID: "city-1"},
		{ContentType: "image/png", Size: 0, SHA256: checksum, CityID: "city-1"},
		{ContentType: "image/jpeg", Size: 1024, SHA256: "not-a-checksum", CityID: "city-1"},
		{ContentType: "image/png", Size: 1024, SHA256: checksum},
	}
	for _, input := range invalidInputs {
		if _, err := ValidateInput(input); err == nil {
			t.Fatalf("input %#v should be rejected", input)
		}
	}
}

func TestCityIDFromKey(t *testing.T) {
	cityID, err := CityIDFromKey("uploads/city-surabaya/abc.png")
	if err != nil || cityID != "city-surabaya" {
		t.Fatalf("city scope = %q, err = %v", cityID, err)
	}
	if _, err := CityIDFromKey("abc.png"); err == nil {
		t.Fatal("object key without city scope must be rejected")
	}
}
