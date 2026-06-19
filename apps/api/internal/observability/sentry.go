package observability

import (
	"net/http"
	"os"

	"github.com/getsentry/sentry-go"
	sentryhttp "github.com/getsentry/sentry-go/http"
)

func InitSentry() error {
	dsn := os.Getenv("SENTRY_DSN")
	if dsn == "" {
		return nil
	}

	environment := os.Getenv("APP_ENV")
	if environment == "" {
		environment = "development"
	}

	return sentry.Init(sentry.ClientOptions{
		Dsn:              dsn,
		Environment:      environment,
		TracesSampleRate: tracesSampleRate(environment),
		SendDefaultPII:   false,
	})
}

func SentryMiddleware(next http.Handler) http.Handler {
	if os.Getenv("SENTRY_DSN") == "" {
		return next
	}

	handler := sentryhttp.New(sentryhttp.Options{
		Repanic:         true,
		WaitForDelivery: true,
	})

	return handler.Handle(next)
}

func tracesSampleRate(environment string) float64 {
	if environment == "development" {
		return 1.0
	}

	return 0.05
}
