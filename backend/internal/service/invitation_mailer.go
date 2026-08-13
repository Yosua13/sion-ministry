package service

import (
	"fmt"
	"log"
	"net/mail"
	"net/smtp"
	"net/url"
	"strings"

	"backend/config"
)

// InvitationMailer keeps the token delivery boundary outside the database. The
// database only stores a SHA-256 token hash; the raw token exists only while the
// message is being delivered.
type InvitationMailer interface {
	SendActivation(recipientName, recipientEmail, rawToken string) error
}

type invitationMailer struct {
	appPublicURL string
	smtpHost     string
	smtpPort     string
	smtpUsername string
	smtpPassword string
	smtpFrom     string
	production   bool
}

func NewInvitationMailer(cfg *config.Config) InvitationMailer {
	return &invitationMailer{
		appPublicURL: cfg.AppPublicURL,
		smtpHost:     cfg.SMTPHost, smtpPort: cfg.SMTPPort, smtpUsername: cfg.SMTPUsername,
		smtpPassword: cfg.SMTPPassword, smtpFrom: cfg.SMTPFrom, production: cfg.AppEnv == "production",
	}
}

func (m *invitationMailer) SendActivation(recipientName, recipientEmail, rawToken string) error {
	activationURL := m.appPublicURL + "/activate?token=" + url.QueryEscape(rawToken)
	noSMTPConfiguration := m.smtpHost == "" && m.smtpUsername == "" && m.smtpPassword == "" && m.smtpFrom == ""
	if noSMTPConfiguration {
		if m.production {
			return fmt.Errorf("SMTP_HOST and SMTP_FROM must be configured")
		}
		log.Printf("DEVELOPMENT activation link for %s: %s", recipientEmail, activationURL)
		return nil
	}
	if m.smtpHost == "" || m.smtpFrom == "" {
		return fmt.Errorf("SMTP configuration is incomplete: SMTP_HOST and SMTP_FROM must be set together")
	}
	if (m.smtpUsername == "") != (m.smtpPassword == "") {
		return fmt.Errorf("SMTP authentication is incomplete: username and password must be set together")
	}
	sender, err := mail.ParseAddress(m.smtpFrom)
	if err != nil || sender.Address == "" {
		return fmt.Errorf("SMTP_FROM must be a valid email address or display-name address")
	}

	subject := "Aktifkan Akun Sion Ministry Anda"
	boundary := "===SION_ACTIVATION_BOUNDARY_13579==="

	plainBody := strings.Join([]string{
		"Halo " + recipientName + ",",
		"",
		"Selamat datang di Sion Ministry! Akun Anda telah berhasil dibuat.",
		"",
		"Silakan klik tautan berikut untuk membuat kata sandi dan mengaktifkan akun Anda:",
		activationURL,
		"",
		"Tautan ini bersifat rahasia dan hanya dapat digunakan 1 kali.",
		"Jika Anda tidak mengharapkan email ini, silakan abaikan pesan ini.",
		"",
		"Salam hangat,",
		"Tim Sion Ministry",
	}, "\r\n")

	htmlBody := strings.Join([]string{
		`<!DOCTYPE html>`,
		`<html lang="id">`,
		`<head>`,
		`  <meta charset="UTF-8">`,
		`  <meta name="viewport" content="width=device-width, initial-scale=1.0">`,
		`  <title>Aktifkan Akun Sion Ministry</title>`,
		`</head>`,
		`<body style="margin:0; padding:0; background-color:#F1F5F9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#334155; -webkit-font-smoothing:antialiased;">`,
		`  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F1F5F9; padding:40px 16px;">`,
		`    <tr>`,
		`      <td align="center">`,
		`        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px; background-color:#FFFFFF; border-radius:16px; overflow:hidden; box-shadow:0 4px 12px rgba(0, 0, 0, 0.05); border:1px solid #E2E8F0;">`,
		`          <tr>`,
		`            <td style="background-color:#0F172A; padding:32px 32px 28px; text-align:center;">`,
		`              <div style="display:inline-block; background-color:rgba(37, 99, 235, 0.2); border:1px solid rgba(59, 130, 246, 0.4); border-radius:20px; padding:4px 14px; margin-bottom:12px;">`,
		`                <span style="color:#93C5FD; font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase;">Sion Ministry Platform</span>`,
		`              </div>`,
		`              <h1 style="margin:0; color:#FFFFFF; font-size:22px; font-weight:700; letter-spacing:-0.3px;">Aktivasi Akun Baru</h1>`,
		`            </td>`,
		`          </tr>`,
		`          <tr>`,
		`            <td style="padding:32px;">`,
		`              <p style="margin:0 0 16px; font-size:16px; font-weight:600; color:#0F172A;">`,
		`                Halo ` + recipientName + `,`,
		`              </p>`,
		`              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#475569;">`,
		`                Selamat datang di <strong>Sion Ministry</strong>! Akun Anda telah berhasil dibuat. Silakan klik tombol di bawah ini untuk membuat kata sandi dan mengaktifkan akun Anda:`,
		`              </p>`,
		`              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0; width:100%;">`,
		`                <tr>`,
		`                  <td align="center">`,
		`                    <a href="` + activationURL + `" target="_blank" style="display:inline-block; background-color:#2563EB; color:#FFFFFF; font-size:15px; font-weight:600; text-decoration:none; padding:14px 32px; border-radius:10px; box-shadow:0 2px 4px rgba(37, 99, 235, 0.2);">`,
		`                      Aktifkan Akun Saya &rarr;`,
		`                    </a>`,
		`                  </td>`,
		`                </tr>`,
		`              </table>`,
		`              <div style="background-color:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:16px; margin-top:24px;">`,
		`                <p style="margin:0 0 8px; font-size:13px; font-weight:500; color:#64748B;">`,
		`                  Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut ke browser Anda:`,
		`                </p>`,
		`                <p style="margin:0; font-size:13px; word-break:break-all; line-height:1.4;">`,
		`                  <a href="` + activationURL + `" style="color:#2563EB; text-decoration:underline;">` + activationURL + `</a>`,
		`                </p>`,
		`              </div>`,
		`              <p style="margin:24px 0 0; font-size:13px; line-height:1.5; color:#94A3B8; text-align:center;">`,
		`                Tautan ini bersifat rahasia dan hanya dapat digunakan 1 kali.<br>`,
		`                Jika Anda tidak mengharapkan email ini, silakan abaikan pesan ini.`,
		`              </p>`,
		`            </td>`,
		`          </tr>`,
		`          <tr>`,
		`            <td style="background-color:#F8FAFC; border-top:1px solid #E2E8F0; padding:20px 32px; text-align:center;">`,
		`              <p style="margin:0; font-size:12px; color:#94A3B8;">`,
		`                &copy; Sion Ministry — Platform Pelayanan &amp; Pemuridan Digital`,
		`              </p>`,
		`            </td>`,
		`          </tr>`,
		`        </table>`,
		`      </td>`,
		`    </tr>`,
		`  </table>`,
		`</body>`,
		`</html>`,
	}, "\r\n")

	messageParts := []string{
		"To: " + recipientEmail,
		"From: " + m.smtpFrom,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: multipart/alternative; boundary=\"" + boundary + "\"",
		"",
		"--" + boundary,
		"Content-Type: text/plain; charset=UTF-8",
		"Content-Transfer-Encoding: 8bit",
		"",
		plainBody,
		"",
		"--" + boundary,
		"Content-Type: text/html; charset=UTF-8",
		"Content-Transfer-Encoding: 8bit",
		"",
		htmlBody,
		"",
		"--" + boundary + "--",
	}
	message := strings.Join(messageParts, "\r\n")

	var auth smtp.Auth
	if m.smtpUsername != "" {
		auth = smtp.PlainAuth("", m.smtpUsername, m.smtpPassword, m.smtpHost)
	}
	return smtp.SendMail(m.smtpHost+":"+m.smtpPort, auth, sender.Address, []string{recipientEmail}, []byte(message))
}
