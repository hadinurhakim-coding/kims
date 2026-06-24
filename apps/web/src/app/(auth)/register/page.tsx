"use client";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGuestGuard } from "@/hooks/useGuestGuard";
import { validate } from "@/lib/validation";

type RegisterField = "name" | "email" | "password" | "confirmPassword";

const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
const strengthColors = [
  "bg-[var(--color-border)]",
  "bg-[var(--color-danger)]",
  "bg-orange-400",
  "bg-yellow-400",
  "bg-[var(--color-success)]",
];

function getPasswordStrength(pwd: string): number {
  let score = 0;

  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  return score;
}

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
      className="flex animate-[pageEnter_150ms_ease-out_forwards] items-center gap-1 text-xs text-[var(--color-danger)]"
    >
      <XCircle className="h-3.5 w-3.5" />
      <span>{message}</span>
    </div>
  );
}

export default function RegisterPage() {
  const { isChecking } = useGuestGuard();
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<RegisterField, boolean>>({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const passwordStrength = getPasswordStrength(password);
  const validations = {
    name: validate.name(name),
    email: validate.email(email),
    password: validate.password(password),
    confirmPassword: validate.confirmPassword(confirmPassword, password),
  };
  const canSubmit =
    validations.name.valid &&
    validations.email.valid &&
    validations.password.valid &&
    validations.confirmPassword.valid &&
    termsAccepted &&
    !isLoading;

  function markTouched(field: RegisterField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function showError(field: RegisterField) {
    return (touched[field] || hasSubmitted) && !validations[field].valid;
  }

  function showValid(field: RegisterField) {
    return touched[field] && validations[field].valid;
  }

  async function handleSubmit() {
    console.debug("[debug][register][frontend] page:submit-clicked", {
      email,
      name,
      termsAccepted,
      canSubmit,
      validations: {
        name: validations.name.valid,
        email: validations.email.valid,
        password: validations.password.valid,
        confirmPassword: validations.confirmPassword.valid,
      },
    });

    setHasSubmitted(true);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    setError(null);

    if (!canSubmit) {
      console.debug("[debug][register][frontend] page:blocked-by-validation", {
        email,
        name,
        termsAccepted,
      });
      return;
    }

    setIsLoading(true);

    try {
      console.debug("[debug][register][frontend] page:register-call:start", {
        email,
        name,
      });
      await register({ name, email, password });
      console.debug("[debug][register][frontend] page:register-call:success", {
        email,
      });
      router.replace("/");
    } catch (err) {
      console.debug("[debug][register][frontend] page:register-call:error", {
        email,
        message: err instanceof Error ? err.message : "Unknown error",
      });
      setError(err instanceof Error ? err.message : "Unable to register.");
    } finally {
      console.debug("[debug][register][frontend] page:register-call:done", {
        email,
      });
      setIsLoading(false);
    }
  }

  if (isChecking) return null;

  return (
    <div className="flex w-full flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Create your account
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Join KIMS and start downloading free music
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="name"
            className="text-sm font-semibold text-[var(--color-text-primary)]"
          >
            Full Name
          </label>
          <input
            id="name"
            aria-label="Full Name"
            aria-describedby={showError("name") ? "name-error" : undefined}
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onBlur={() => markTouched("name")}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
            className={getInputClasses(showError("name"), showValid("name"))}
          />
          {showError("name") && validations.name.message ? (
            <FieldError id="name-error" message={validations.name.message} />
          ) : null}
        </div>

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
            aria-describedby={showError("email") ? "email-error" : undefined}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onBlur={() => markTouched("email")}
            onChange={(event) => {
              setEmail(event.target.value);
              setError(null);
            }}
            className={getInputClasses(showError("email"), showValid("email"))}
          />
          {showError("email") && validations.email.message ? (
            <FieldError id="email-error" message={validations.email.message} />
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
                showError("password") ? "password-error" : undefined
              }
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              value={password}
              onBlur={() => markTouched("password")}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(null);
              }}
              className={[
                getInputClasses(
                  showError("password"),
                  showValid("password"),
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
          {showError("password") && validations.password.message ? (
            <FieldError
              id="password-error"
              message={validations.password.message}
            />
          ) : null}

          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1">
              {Array.from({ length: 4 }, (_, index) => {
                const isFilled = index < passwordStrength;

                return (
                  <div
                    key={index}
                    className={[
                      "h-1 flex-1 rounded-[var(--radius-full)]",
                      isFilled
                        ? strengthColors[passwordStrength]
                        : "bg-[var(--color-border)]",
                    ].join(" ")}
                  />
                );
              })}
            </div>
            <span className="text-xs text-[var(--color-text-muted)]">
              {passwordStrength > 0
                ? strengthLabels[passwordStrength]
                : "Password strength"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="confirm-password"
            className="text-sm font-semibold text-[var(--color-text-primary)]"
          >
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              aria-label="Confirm Password"
              aria-describedby={
                showError("confirmPassword")
                  ? "confirm-password-error"
                  : undefined
              }
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onBlur={() => markTouched("confirmPassword")}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError(null);
              }}
              className={[
                getInputClasses(
                  showError("confirmPassword"),
                  showValid("confirmPassword"),
                ),
                "pr-11",
              ].join(" ")}
            />
            <button
              type="button"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              onClick={() => setShowConfirm((visible) => !visible)}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
            >
              {showConfirm ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {showError("confirmPassword") &&
          validations.confirmPassword.message ? (
            <FieldError
              id="confirm-password-error"
              message={validations.confirmPassword.message}
            />
          ) : null}

          {showValid("confirmPassword") ? (
            <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Passwords match</span>
            </div>
          ) : null}
        </div>

        <label className="flex items-start gap-2 text-xs leading-5 text-[var(--color-text-muted)]">
          <input
            aria-label="Accept Terms of Service and Privacy Policy"
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
          />
          <span>
            I agree to the{" "}
            <Link
              href="#"
              className="font-semibold text-[var(--color-accent-primary)]"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="#"
              className="font-semibold text-[var(--color-accent-primary)]"
            >
              Privacy Policy
            </Link>
          </span>
        </label>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            "Create Account"
          )}
        </button>

        {error ? (
          <p className="text-sm font-medium text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}
      </div>

      <p className="text-center text-sm text-[var(--color-text-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[var(--color-accent-primary)] transition-colors hover:text-[color-mix(in_srgb,var(--color-accent-primary)_82%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
