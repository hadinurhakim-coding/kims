package middleware

import (
	"net/http"
	"os"
	"strings"
)

const (
	allowOriginHeader      = "Access-Control-Allow-Origin"
	allowMethodsHeader     = "Access-Control-Allow-Methods"
	allowHeadersHeader     = "Access-Control-Allow-Headers"
	allowCredentialsHeader = "Access-Control-Allow-Credentials"
	varyHeader             = "Vary"
)

func CORSFromEnv() func(http.Handler) http.Handler {
	allowedOrigins := allowedOriginsFromEnv()

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := strings.TrimSpace(r.Header.Get("Origin"))
			if origin == "" {
				next.ServeHTTP(w, r)
				return
			}

			if _, ok := allowedOrigins[origin]; !ok {
				writeJSON(w, http.StatusForbidden, map[string]string{
					"error": "origin not allowed",
				})
				return
			}

			addCORSHeaders(w, origin)

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func allowedOriginsFromEnv() map[string]struct{} {
	origins := map[string]struct{}{}

	addOrigins(origins, os.Getenv("WEB_ORIGINS"))
	addOrigins(origins, os.Getenv("WEB_ORIGIN"))

	if len(origins) == 0 && os.Getenv("APP_ENV") != "production" {
		addOrigins(origins, "http://localhost:3000,http://127.0.0.1:3000")
	}

	return origins
}

func addOrigins(allowedOrigins map[string]struct{}, value string) {
	for _, origin := range strings.Split(value, ",") {
		origin = strings.TrimSpace(origin)
		if origin == "" {
			continue
		}

		allowedOrigins[strings.TrimRight(origin, "/")] = struct{}{}
	}
}

func addCORSHeaders(w http.ResponseWriter, origin string) {
	header := w.Header()
	header.Set(allowOriginHeader, origin)
	header.Set(allowMethodsHeader, "GET,POST,PUT,PATCH,DELETE,OPTIONS")
	header.Set(allowHeadersHeader, "Authorization,Content-Type")
	header.Set(allowCredentialsHeader, "true")
	header.Add(varyHeader, "Origin")
}
