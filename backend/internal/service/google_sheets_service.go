package service

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
	"unicode/utf8"

	"backend/config"
	"backend/internal/models"
	"backend/internal/repository"

	"golang.org/x/oauth2"
)

var (
	ErrGoogleSheetsUnavailable  = errors.New("integrasi Google Sheet belum dikonfigurasi")
	ErrGoogleSheetsNotConnected = errors.New("Google Sheet belum dihubungkan oleh admin")
)

type PublicRegistrationInput struct {
	Name    string `json:"name"`
	Major   string `json:"major"`
	Campus  string `json:"campus"`
	Cohort  string `json:"cohort"`
	Website string `json:"website"`
}

type GoogleSheetsService interface {
	SubmitRegistration(ctx context.Context, input PublicRegistrationInput) error
	AuthorizationURL(state string) (string, error)
	CompleteAuthorization(ctx context.Context, code, actorID string) error
	Status() (configured bool, connected bool)
}

type googleSheetsService struct {
	repo        repository.GoogleSheetsRepository
	oauthConfig *oauth2.Config
	spreadsheet string
	sheetTab    string
	cipher      cipher.AEAD
	httpClient  *http.Client
}

func NewGoogleSheetsService(cfg *config.Config, repo repository.GoogleSheetsRepository) (GoogleSheetsService, error) {
	if !cfg.GoogleSheetsEnabled() {
		return &disabledGoogleSheetsService{}, nil
	}
	key, err := base64.StdEncoding.DecodeString(cfg.GoogleTokenEncryptionKey)
	if err != nil || len(key) != 32 {
		return nil, fmt.Errorf("GOOGLE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key")
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("initialize Google token encryption: %w", err)
	}
	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("initialize Google token encryption: %w", err)
	}
	return &googleSheetsService{
		repo: repo,
		oauthConfig: &oauth2.Config{
			ClientID:     cfg.GoogleOAuthClientID,
			ClientSecret: cfg.GoogleOAuthClientSecret,
			RedirectURL:  cfg.GoogleOAuthRedirectURL,
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://accounts.google.com/o/oauth2/auth",
				TokenURL: "https://oauth2.googleapis.com/token",
			},
			Scopes: []string{"https://www.googleapis.com/auth/spreadsheets"},
		},
		spreadsheet: cfg.GoogleSheetsSpreadsheetID,
		sheetTab:    cfg.GoogleSheetsTab,
		cipher:      aead,
		httpClient:  &http.Client{Timeout: 15 * time.Second},
	}, nil
}

func (s *googleSheetsService) Status() (bool, bool) {
	_, err := s.repo.GetCredential()
	return true, err == nil
}

func (s *googleSheetsService) AuthorizationURL(state string) (string, error) {
	if strings.TrimSpace(state) == "" {
		return "", errors.New("OAuth state wajib diisi")
	}
	return s.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce), nil
}

func (s *googleSheetsService) CompleteAuthorization(ctx context.Context, code, actorID string) error {
	if strings.TrimSpace(code) == "" {
		return errors.New("kode otorisasi Google tidak ditemukan")
	}
	token, err := s.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return fmt.Errorf("Google menolak otorisasi: %w", err)
	}
	if strings.TrimSpace(token.RefreshToken) == "" {
		return errors.New("Google tidak mengirim refresh token; cabut akses aplikasi Sion Ministry di Google lalu hubungkan kembali")
	}
	encrypted, err := s.encrypt(token.RefreshToken)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	return s.repo.SaveCredential(&models.GoogleSheetsCredential{
		EncryptedRefreshToken: encrypted,
		ConnectedBy:           stringPointer(actorID),
		ConnectedAt:           now,
		UpdatedAt:             now,
	})
}

func (s *googleSheetsService) SubmitRegistration(ctx context.Context, input PublicRegistrationInput) error {
	if err := validatePublicRegistration(&input); err != nil {
		return err
	}
	credential, err := s.repo.GetCredential()
	if err != nil {
		if errors.Is(err, repository.ErrGoogleSheetsCredentialNotFound) {
			return ErrGoogleSheetsNotConnected
		}
		return fmt.Errorf("membaca koneksi Google Sheet: %w", err)
	}
	refreshToken, err := s.decrypt(credential.EncryptedRefreshToken)
	if err != nil {
		return fmt.Errorf("membaca kredensial Google Sheet: %w", err)
	}
	token, err := s.oauthConfig.TokenSource(ctx, &oauth2.Token{RefreshToken: refreshToken}).Token()
	if err != nil {
		return fmt.Errorf("memperbarui akses Google Sheet: %w", err)
	}
	payload, err := json.Marshal(struct {
		Values [][]string `json:"values"`
	}{Values: [][]string{{"=ROW()-2", safeSheetValue(input.Name), safeSheetValue(input.Campus), safeSheetValue(input.Cohort), safeSheetValue(input.Major)}}})
	if err != nil {
		return fmt.Errorf("menyiapkan data pendaftaran: %w", err)
	}
	rangeName := fmt.Sprintf("%s!A:E", s.sheetTab)
	endpoint := fmt.Sprintf("https://sheets.googleapis.com/v4/spreadsheets/%s/values/%s:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS", url.PathEscape(s.spreadsheet), url.PathEscape(rangeName))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("menyiapkan request Google Sheet: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	req.Header.Set("Content-Type", "application/json")
	response, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("menghubungi Google Sheet: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode > 299 {
		body, _ := io.ReadAll(io.LimitReader(response.Body, 2048))
		return fmt.Errorf("Google Sheet menolak pendaftaran (status %d): %s", response.StatusCode, strings.TrimSpace(string(body)))
	}
	return nil
}

func (s *googleSheetsService) encrypt(plaintext string) (string, error) {
	nonce := make([]byte, s.cipher.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(append(nonce, s.cipher.Seal(nil, nonce, []byte(plaintext), nil)...)), nil
}

func (s *googleSheetsService) decrypt(ciphertext string) (string, error) {
	encoded, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil || len(encoded) < s.cipher.NonceSize() {
		return "", errors.New("token terenkripsi tidak valid")
	}
	plaintext, err := s.cipher.Open(nil, encoded[:s.cipher.NonceSize()], encoded[s.cipher.NonceSize():], nil)
	if err != nil {
		return "", errors.New("token terenkripsi tidak dapat dibuka")
	}
	return string(plaintext), nil
}

func validatePublicRegistration(input *PublicRegistrationInput) error {
	if strings.TrimSpace(input.Website) != "" {
		return errors.New("pendaftaran tidak dapat diproses")
	}
	for _, field := range []*string{&input.Name, &input.Major, &input.Campus, &input.Cohort} {
		*field = strings.Join(strings.Fields(strings.TrimSpace(*field)), " ")
	}
	if utf8.RuneCountInString(input.Name) < 2 || utf8.RuneCountInString(input.Name) > 100 {
		return errors.New("nama harus berisi 2 sampai 100 karakter")
	}
	if utf8.RuneCountInString(input.Major) < 2 || utf8.RuneCountInString(input.Major) > 120 {
		return errors.New("jurusan harus berisi 2 sampai 120 karakter")
	}
	if utf8.RuneCountInString(input.Campus) < 2 || utf8.RuneCountInString(input.Campus) > 120 {
		return errors.New("kampus harus berisi 2 sampai 120 karakter")
	}
	if utf8.RuneCountInString(input.Cohort) < 2 || utf8.RuneCountInString(input.Cohort) > 20 {
		return errors.New("angkatan harus berisi 2 sampai 20 karakter")
	}
	return nil
}

func safeSheetValue(value string) string {
	if value != "" && strings.ContainsAny(value[:1], "=+-@") {
		return "'" + value
	}
	return value
}

type disabledGoogleSheetsService struct{}

func (s *disabledGoogleSheetsService) SubmitRegistration(context.Context, PublicRegistrationInput) error {
	return ErrGoogleSheetsUnavailable
}
func (s *disabledGoogleSheetsService) AuthorizationURL(string) (string, error) {
	return "", ErrGoogleSheetsUnavailable
}
func (s *disabledGoogleSheetsService) CompleteAuthorization(context.Context, string, string) error {
	return ErrGoogleSheetsUnavailable
}
func (s *disabledGoogleSheetsService) Status() (bool, bool) { return false, false }
