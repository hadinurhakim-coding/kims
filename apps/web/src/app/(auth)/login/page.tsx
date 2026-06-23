"use client";

import { Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGuestGuard } from "@/hooks/useGuestGuard";
import { validate } from "@/lib/validation";

type LoginField = "email" | "password";

function getInputClasses(isInvalid: boolean, isValid: boolean) {
  return [
    "h-11 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
    isInvalid
      ? "border-[var(--color-danger)]"
      : isValid
        ? "border-[var(--color-success)]"
        : "border-[var(--color-border)]",
  ].join(" ");
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <div
      id={id}
      role="alert"
      className="flex translate-y-0 animate-[pageEnter_150ms_ease-out_forwards] items-center gap-1 text-xs text-[var(--color-danger)]"
    >
      <XCircle className="h-3.5 w-3.5" />
      <span>{message}</span>
    </div>
  );
}

export default function LoginPage() {
  const { isChecking } = useGuestGuard();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<LoginField, boolean>>({
    email: false,
    password: false,
  });

  const emailValidation = validate.email(email);
  const passwordValidation = validate.password(password);
  const showEmailError =
    (touched.email || hasSubmitted) && !emailValidation.valid;
  const showPasswordError =
    (touched.password || hasSubmitted) && !passwordValidation.valid;

  function markTouched(field: LoginField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  async function handleSubmit() {
    setHasSubmitted(true);
    setTouched({ email: true, password: true });
    setError(null);

    if (!emailValidation.valid || !passwordValidation.valid) return;

    setIsLoading(true);

    try {
      await login({ email, password });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setIsLoading(false);
    }
  }

  if (isChecking) return null;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Welcome back
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Sign in to your KIMS account
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="email"
            className="text-sm font-semibold text-[var(--color-text-primary)]"
          >
            Email
          </label>
          <input
            id="email"
            aria-label="Email"
            aria-describedby={showEmailError ? "email-error" : undefined}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onBlur={() => markTouched("email")}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            className={getInputClasses(
              showEmailError,
              touched.email && emailValidation.valid,
            )}
          />
          {showEmailError && emailValidation.message ? (
            <FieldError id="email-error" message={emailValidation.message} />
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-[var(--color-text-primary)]"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              aria-label="Password"
              aria-describedby={
                showPasswordError ? "password-error" : undefined
              }
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onBlur={() => markTouched("password")}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              className={[
                getInputClasses(
                  showPasswordError,
                  touched.password && passwordValidation.valid,
                ),
                "pr-11",
              ].join(" ")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {showPasswordError && passwordValidation.message ? (
            <FieldError
              id="password-error"
              message={passwordValidation.message}
            />
          ) : null}

          <Link
            href="/forgot-password"
            className="self-end text-xs font-semibold text-[var(--color-accent-primary)] transition-colors hover:text-[color-mix(in_srgb,var(--color-accent-primary)_82%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            "Sign In"
          )}
        </button>

        {error ? (
          <p className="text-sm font-medium text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-text-muted)]">or</span>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <button
        type="button"
        className="flex h-11 w-full items-center justify-center gap-3 rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
      >
        <span className="font-bold text-[var(--color-accent-primary)]">G</span>
        <span>Continue with Google</span>
      </button>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-[var(--color-accent-primary)] transition-colors hover:text-[color-mix(in_srgb,var(--color-accent-primary)_82%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
