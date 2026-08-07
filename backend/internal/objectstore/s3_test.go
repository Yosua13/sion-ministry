package objectstore

import "testing"

func TestValidateInput(t *testing.T) {
	checksum := "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
	extension, err := ValidateInput(PresignInput{ContentType: "image/png", Size: 1024, SHA256: checksum})
	if err != nil {
		t.Fatal(err)
	}
	if extension != "png" {
		t.Fatalf("extension = %q, want png", extension)
	}

	invalidInputs := []PresignInput{
		{ContentType: "image/svg+xml", Size: 1024, SHA256: checksum},
		{ContentType: "image/png", Size: 0, SHA256: checksum},
		{ContentType: "image/jpeg", Size: 1024, SHA256: "not-a-checksum"},
	}
	for _, input := range invalidInputs {
		if _, err := ValidateInput(input); err == nil {
			t.Fatalf("input %#v should be rejected", input)
		}
	}
}
