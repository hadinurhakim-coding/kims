package email

import (
	"bytes"
	"errors"
	"fmt"
	"html/template"
	"net/mail"
	"net/smtp"
	"os"
	"strconv"
)

type Service struct {
	host        string
	port        int
	user        string
	pass        string
	senderName  string
	senderEmail string
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
	port, _ := strconv.Atoi(os.Getenv("BREVO_SMTP_PORT"))
	if port == 0 {
		port = 587
	}

	return &Service{
		host:        os.Getenv("BREVO_SMTP_HOST"),
		port:        port,
		user:        os.Getenv("BREVO_SMTP_USER"),
		pass:        os.Getenv("BREVO_SMTP_PASS"),
		senderName:  os.Getenv("BREVO_SENDER_NAME"),
		senderEmail: os.Getenv("BREVO_SENDER_EMAIL"),
	}
}

func (s *Service) SendOTP(toEmail string, toName string, otpCode string) error {
	if err := s.validateConfig(); err != nil {
		return err
	}

	tmpl, err := template.New("otp").Parse(otpEmailTemplate)
	if err != nil {
		return fmt.Errorf("parse otp email template: %w", err)
	}

	var body bytes.Buffer
	if err := tmpl.Execute(&body, OTPEmailData{
		Name:      fallbackName(toName),
		OTPCode:   otpCode,
		ExpiryMin: 30,
	}); err != nil {
		return fmt.Errorf("execute otp email template: %w", err)
	}

	from := mail.Address{Name: s.senderName, Address: s.senderEmail}
	to := mail.Address{Name: toName, Address: toEmail}
	message := buildHTMLMessage(from, to, "Your KIMS password reset code", body.String())

	addr := fmt.Sprintf("%s:%d", s.host, s.port)
	auth := smtp.PlainAuth("", s.user, s.pass, s.host)
	if err := smtp.SendMail(addr, auth, s.senderEmail, []string{toEmail}, []byte(message)); err != nil {
		return fmt.Errorf("send otp email: %w", err)
	}

	return nil
}

func (s *Service) validateConfig() error {
	if s.host == "" ||
		s.user == "" ||
		s.pass == "" ||
		s.senderName == "" ||
		s.senderEmail == "" {
		return errors.New("email service is not configured")
	}

	return nil
}

func buildHTMLMessage(from mail.Address, to mail.Address, subject string, body string) string {
	var msg bytes.Buffer
	msg.WriteString("From: " + from.String() + "\r\n")
	msg.WriteString("To: " + to.String() + "\r\n")
	msg.WriteString("Subject: " + subject + "\r\n")
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString(`Content-Type: text/html; charset="UTF-8"` + "\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(body)

	return msg.String()
}

func fallbackName(name string) string {
	if name == "" {
		return "there"
	}

	return name
}
