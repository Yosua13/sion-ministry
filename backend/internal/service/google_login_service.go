package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"backend/config"
	"backend/internal/models"

	"golang.org/x/oauth2"
)

var ErrGoogleLoginUnavailable = errors.New("Google login belum dikonfigurasi")

type googleLoginService struct {
	oauthConfig *oauth2.Config
	auth        AuthService
	httpClient  *http.Client
}

func NewGoogleLoginService(cfg *config.Config, auth AuthService) GoogleLoginService {
	if !cfg.GoogleLoginEnabled() {
		return &disabledGoogleLoginService{}
	}
	return &googleLoginService{
		oauthConfig: &oauth2.Config{ClientID: cfg.GoogleLoginClientID, ClientSecret: cfg.GoogleLoginClientSecret, RedirectURL: cfg.GoogleLoginRedirectURL, Endpoint: oauth2.Endpoint{AuthURL: "https://accounts.google.com/o/oauth2/auth", TokenURL: "https://oauth2.googleapis.com/token"}, Scopes: []string{"openid", "email", "profile"}},
		auth:        auth, httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *googleLoginService) Enabled() bool { return true }
func (s *googleLoginService) AuthorizationURL(state string) (string, error) {
	if strings.TrimSpace(state) == "" {
		return "", errors.New("OAuth state wajib diisi")
	}
	return s.oauthConfig.AuthCodeURL(state, oauth2.AccessTypeOnline, oauth2.SetAuthURLParam("prompt", "select_account")), nil
}
func (s *googleLoginService) CompleteAuthorization(ctx context.Context, code string, device ...string) (*models.AuthResponse, string, error) {
	if strings.TrimSpace(code) == "" {
		return nil, "", errors.New("kode otorisasi Google tidak ditemukan")
	}
	token, err := s.oauthConfig.Exchange(ctx, code)
	if err != nil {
		return nil, "", fmt.Errorf("Google menolak otorisasi: %w", err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://openidconnect.googleapis.com/v1/userinfo", nil)
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)
	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("membaca profil Google: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, "", errors.New("Google tidak dapat memverifikasi profil akun")
	}
	var payload struct {
		Subject       string `json:"sub"`
		Email         string `json:"email"`
		Name          string `json:"name"`
		EmailVerified bool   `json:"email_verified"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, "", errors.New("profil Google tidak valid")
	}
	if !payload.EmailVerified {
		return nil, "", errors.New("email Google harus sudah terverifikasi")
	}
	return s.auth.LoginWithGoogle(models.GoogleIdentity{Subject: payload.Subject, Email: payload.Email, Name: payload.Name}, device...)
}

type disabledGoogleLoginService struct{}

func (s *disabledGoogleLoginService) Enabled() bool { return false }
func (s *disabledGoogleLoginService) AuthorizationURL(string) (string, error) {
	return "", ErrGoogleLoginUnavailable
}
func (s *disabledGoogleLoginService) CompleteAuthorization(context.Context, string, ...string) (*models.AuthResponse, string, error) {
	return nil, "", ErrGoogleLoginUnavailable
}
