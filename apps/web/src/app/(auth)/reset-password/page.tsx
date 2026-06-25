"use client";

import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGuestGuard } from "@/hooks/useGuestGuard";
import { validate } from "@/lib/validation";

type ResetField = "password" | "confirmPassword";

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

function ResetPasswordForm() {
  const { isChecking } = useGuestGuard();
  const { resetPassword } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<ResetField, boolean>>({
    password: false,
    confirmPassword: false,
  });

  const validations = {
    password: validate.password(password),
    confirmPassword: validate.confirmPassword(confirmPassword, password),
  };
  const canSubmit =
    token !== "" &&
    validations.password.valid &&
    validations.confirmPassword.valid &&
    !isLoading;

  function markTouched(field: ResetField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function showError(field: ResetField) {
    return (touched[field] || hasSubmitted) && !validations[field].valid;
  }

  function showValid(field: ResetField) {
    return touched[field] && validations[field].valid;
  }

  async function handleSubmit() {
    setHasSubmitted(true);
    setTouched({ password: true, confirmPassword: true });
    setError(null);

    if (!canSubmit) return;

    setIsLoading(true);

    try {
      await resetPassword({ token, password });
      setIsComplete(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to reset password.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  if (isChecking) return null;

  if (isComplete) {
    return (
      <div className="flex w-full flex-col gap-7 text-center">
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="h-16 w-16 text-[var(--color-success)]" />
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Password updated
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              You can now sign in with your new password.
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="flex h-11 w-full items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-7">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Choose a new password
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Create a secure password for your KIMS account.
        </p>
      </div>

      {!token ? (
        <div
          role="alert"
          className="rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,var(--color-surface))] p-3 text-sm text-[var(--color-danger)]"
        >
          This reset link is missing a token. Please request a new password
          reset link.
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-[var(--color-text-primary)]"
          >
            New Password
          </label>
          <div className="relative">
            <input
              id="password"
              aria-label="New Password"
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
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            "Update Password"
          )}
        </button>

        {error ? (
          <p className="text-sm font-medium text-[var(--color-danger)]">
            {error}
          </p>
        ) : null}

        <Link
          href="/forgot-password"
          className="w-fit text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
        >
          Request a new link
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
