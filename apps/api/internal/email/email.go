package email

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"net/http"
	"os"
)

type Service struct {
	apiKey      string
	senderName  string
	senderEmail string
	httpClient  *http.Client
}

type brevoSender struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type brevoRecipient struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type brevoEmailRequest struct {
	Sender      brevoSender      `json:"sender"`
	To          []brevoRecipient `json:"to"`
	Subject     string           `json:"subject"`
	HTMLContent string           `json:"htmlContent"`
}

type OTPEmailData struct {
	Name      string
	OTPCode   string
	ExpiryMin int
}

const otpEmailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KIMS Password Reset</title>
</head>
<body style="margin:0;padding:0;background-color:#F8F9FB;font-family:Inter,Arial,sans-serif;">
  <div style="background:linear-gradient(135deg,#2563EB 0%,#0D9488 100%);padding:40px 32px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">KIMS</h1>
    <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Kim's Music Station</p>
  </div>

  <div style="max-width:480px;margin:0 auto;background:#ffffff;padding:40px 32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <h2 style="color:#111318;font-size:20px;font-weight:600;margin:0 0 8px;">Reset your password</h2>
    <p style="color:#7B8399;font-size:14px;margin:0 0 24px;">Hi {{.Name}}, use the code below to reset your KIMS password.</p>

    <div style="background:#F8F9FB;border:2px solid #E4E7EF;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <p style="color:#7B8399;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Your reset code</p>
      <p style="color:#111318;font-size:36px;font-weight:700;letter-spacing:8px;margin:0;font-family:monospace;">{{.OTPCode}}</p>
      <p style="color:#7B8399;font-size:12px;margin:12px 0 0;">Expires in {{.ExpiryMin}} minutes</p>
    </div>

    <div style="background:#FEF3C7;border-radius:8px;padding:12px 16px;margin:0 0 24px;">
      <p style="color:#92400E;font-size:13px;margin:0;">Never share this code with anyone. KIMS will never ask for your code.</p>
    </div>

    <p style="color:#7B8399;font-size:13px;margin:0;">If you did not request a password reset, you can safely ignore this email.</p>
  </div>

  <div style="text-align:center;padding:24px 32px;">
    <p style="color:#7B8399;font-size:12px;margin:0;">2026 KIMS - Kim's Music Station<br>Free music for every creator</p>
  </div>
</body>
</html>`

func NewService() *Service {
	return &Service{
		apiKey:      os.Getenv("BREVO_API_KEY"),
		senderName:  os.Getenv("BREVO_SENDER_NAME"),
		senderEmail: os.Getenv("BREVO_SENDER_EMAIL"),
		httpClient:  &http.Client{},
	}
}

func (s *Service) SendOTP(toEmail string, toName string, otpCode string) error {
	tmpl, err := template.New("otp").Parse(otpEmailTemplate)
	if err != nil {
		return fmt.Errorf("failed to parse template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, OTPEmailData{
		Name:      fallbackName(toName),
		OTPCode:   otpCode,
		ExpiryMin: 30,
	}); err != nil {
		return fmt.Errorf("failed to render template: %w", err)
	}

	payload := brevoEmailRequest{
		Sender: brevoSender{
			Name:  s.senderName,
			Email: s.senderEmail,
		},
		To: []brevoRecipient{
			{Name: fallbackName(toName), Email: toEmail},
		},
		Subject:     "Your KIMS password reset code",
		HTMLContent: buf.String(),
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest(
		http.MethodPost,
		"https://api.brevo.com/v3/smtp/email",
		bytes.NewReader(body),
	)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("api-key", s.apiKey)
	req.Header.Set("Accept", "application/json")

	res, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call Brevo API: %w", err)
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		var errBody map[string]any
		_ = json.NewDecoder(res.Body).Decode(&errBody)
		return fmt.Errorf("brevo API error status=%d body=%v", res.StatusCode, errBody)
	}

	return nil
}

func fallbackName(name string) string {
	if name == "" {
		return "there"
	}

	return name
}
