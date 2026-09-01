package service

import "testing"

func TestValidatePublicRegistrationNormalizesInput(t *testing.T) {
	input := PublicRegistrationInput{
		Name:   "  Maria   Natalia  ",
		Major:  " Teknik  Informatika ",
		Campus: " Universitas   Indonesia ",
		Cohort: " 2024 ",
	}
	if err := validatePublicRegistration(&input); err != nil {
		t.Fatalf("validatePublicRegistration() error = %v", err)
	}
	if input.Name != "Maria Natalia" || input.Major != "Teknik Informatika" || input.Campus != "Universitas Indonesia" || input.Cohort != "2024" {
		t.Fatalf("input was not normalized: %#v", input)
	}
}

func TestValidatePublicRegistrationRejectsHoneypot(t *testing.T) {
	input := PublicRegistrationInput{Name: "Maria", Major: "Hukum", Campus: "UI", Cohort: "2024", Website: "https://spam.invalid"}
	if err := validatePublicRegistration(&input); err == nil {
		t.Fatal("validatePublicRegistration() accepted a honeypot value")
	}
}

func TestSafeSheetValuePreventsFormulaInjection(t *testing.T) {
	for input, want := range map[string]string{
		"=IMPORTXML(\"https://invalid\")": "'=IMPORTXML(\"https://invalid\")",
		"+123":                            "'+123",
		"Maria":                           "Maria",
	} {
		if got := safeSheetValue(input); got != want {
			t.Errorf("safeSheetValue(%q) = %q, want %q", input, got, want)
		}
	}
}
