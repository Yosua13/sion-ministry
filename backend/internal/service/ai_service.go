package service

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"backend/config"
)

type aiService struct {
	cfg *config.Config
}

func NewAIService(cfg *config.Config) AIService {
	return &aiService{cfg: cfg}
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiSystemInstruction struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiGenerationConfig struct {
	Temperature float64 `json:"temperature"`
}

type GeminiRequest struct {
	Contents          []GeminiContent          `json:"contents"`
	SystemInstruction *GeminiSystemInstruction `json:"systemInstruction,omitempty"`
	GenerationConfig  GeminiGenerationConfig   `json:"generationConfig"`
}

type GeminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
}

func (s *aiService) GetAssistantResponse(prompt string, systemInstruction string) (string, error) {
	if s.cfg.GeminiAPIKey == "" || s.cfg.GeminiAPIKey == "MY_GEMINI_API_KEY" {
		// Mock simulation fallback
		return "Sion AI Assistant sedang dalam Mode Simulasi (Kunci API Gemini tidak terkonfigurasi di Settings > Secrets). Silakan atur GEMINI_API_KEY Anda untuk mengaktifkan AI sepenuhnya!\n\nBerikut adalah respon simulasi pemuridan:\n\n*Amanat Agung (Matius 28:19-20)* adalah panggilan bagi kita semua pekerja Sion Ministry untuk memuridkan bangsa-bangsa. Dalam konteks pemuridan Anda saat ini, berfokuslah membangun kedekatan pribadi dengan jemaat dan mendampingi mereka mempelajari modul-modul dasar iman Kristen secara konsisten.", nil
	}

	if systemInstruction == "" {
		systemInstruction = "Anda adalah Asisten Pemuridan Digital Sion Academy yang ramah, bijaksana, dan alkitabiah. Bantu para pekerja Sion Ministry menjawab pertanyaan teologi praktis, menyusun rencana pelajaran, merangkum berita acara pemuridan, dan memikirkan strategi pelayanan berdasarkan Matius 28:19-20."
	}

	// Prepare Gemini Request
	reqPayload := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{Text: prompt},
				},
			},
		},
		SystemInstruction: &GeminiSystemInstruction{
			Parts: []GeminiPart{
				{Text: systemInstruction},
			},
		},
		GenerationConfig: GeminiGenerationConfig{
			Temperature: 0.7,
		},
	}

	reqBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return "", fmt.Errorf("failed to marshal request: %w", err)
	}

	apiURL := fmt.Sprintf(
		"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=%s",
		s.cfg.GeminiAPIKey,
	)

	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(reqBytes))
	if err != nil {
		return "", fmt.Errorf("failed to create http request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "aistudio-build")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to call gemini api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("gemini api returned status %d: %s", resp.StatusCode, string(respBytes))
	}

	var respPayload GeminiResponse
	if err := json.NewDecoder(resp.Body).Decode(&respPayload); err != nil {
		return "", fmt.Errorf("failed to decode response: %w", err)
	}

	if len(respPayload.Candidates) == 0 || len(respPayload.Candidates[0].Content.Parts) == 0 {
		return "Mohon maaf, saya mengalami kendala teknis saat merumuskan respon.", nil
	}

	return respPayload.Candidates[0].Content.Parts[0].Text, nil
}
