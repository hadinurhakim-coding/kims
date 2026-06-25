"use client";

import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGuestGuard } from "@/hooks/useGuestGuard";
import { validate } from "@/lib/validation";

type Step = 1 | 2 | 3;

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

function getInputClasses(isInvalid = false, isValid = false) {
  return [
    "h-11 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] px-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]",
    isInvalid
      ? "border-[var(--color-danger)]"
      : isValid
        ? "border-[var(--color-success)]"
        : "border-[var(--color-border)]",
  ].join(" ");
}

function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex animate-[pageEnter_150ms_ease-out_forwards] items-center gap-1 text-sm font-medium text-[var(--color-danger)]"
    >
      <XCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );
}

function SubmitButton({
  children,
  disabled,
  isLoading,
  loadingLabel,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  isLoading: boolean;
  loadingLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

function StepIndicator({ step }: { step: Step }) {
  return (
    <div
      aria-label={`Step ${step} of 3`}
      className="flex flex-col items-center gap-2"
    >
      <div className="flex items-center">
        {[1, 2, 3].map((item, index) => {
          const isComplete = item < step;
          const isActive = item === step;

          return (
            <div key={item} className="flex items-center">
              <span
                className={[
                  "h-2 w-2 rounded-full",
                  isComplete
                    ? "bg-[var(--color-success)]"
                    : isActive
                      ? "bg-[var(--color-accent-primary)]"
                      : "bg-[var(--color-border)]",
                ].join(" ")}
              />
              {index < 2 ? (
                <span className="mx-2 h-px w-8 bg-[var(--color-border)]" />
              ) : null}
            </div>
          );
        })}
      </div>
      <span className="text-xs text-[var(--color-text-muted)]">
        Step {step} of 3
      </span>
    </div>
  );
}

async function parseAPIMessage(response: Response, fallback: string) {
  try {
    const data = (await response.json()) as {
      error?: string;
      message?: string;
      valid?: boolean;
    };

    return {
      message: data.error ?? data.message ?? fallback,
      valid: data.valid,
    };
  } catch {
    return { message: fallback, valid: undefined };
  }
}

export default function ForgotPasswordPage() {
  const { isChecking } = useGuestGuard();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otpCode, setOTPCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const emailValidation = validate.email(email);
  const passwordValidation = validate.password(newPassword);
  const passwordsMatch =
    confirmPassword !== "" && newPassword === confirmPassword;
  const passwordStrength = getPasswordStrength(newPassword);

  async function handleRequestOTP() {
    setError(null);

    if (!emailValidation.valid) {
      setError(emailValidation.message ?? "Enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await parseAPIMessage(res, "Something went wrong");
        setError(data.message);
        return;
      }

      setStep(2);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOTP() {
    setError(null);

    if (otpCode.length < 8) {
      setError("Enter the 8-character reset code");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp_code: otpCode,
        }),
      });

      const data = await parseAPIMessage(res, "Invalid or expired code");
      if (!res.ok || !data.valid) {
        setError(data.message);
        return;
      }

      setStep(3);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetPassword() {
    setError(null);

    if (!passwordValidation.valid) {
      setError(passwordValidation.message ?? "Enter a valid password");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp_code: otpCode,
          new_password: newPassword,
        }),
      });

      if (!res.ok) {
        const data = await parseAPIMessage(res, "Failed to reset password");
        setError(data.message);
        return;
      }

      setIsComplete(true);
    } finally {
      setIsLoading(false);
    }
  }

  function handleResendCode() {
    setStep(1);
    setOTPCode("");
    setError(null);
  }

  if (isChecking) return null;

  if (isComplete) {
    return (
      <div className="flex w-full flex-col gap-7 text-center">
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="h-16 w-16 text-[var(--color-success)]" />
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Password reset!
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Your password has been updated successfully
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex h-11 w-full items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-7">
      <StepIndicator step={step} />

      {step === 1 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Forgot password
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Enter your email and we&apos;ll send you a reset code
            </p>
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
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setError(null);
              }}
              className={getInputClasses(Boolean(error), emailValidation.valid)}
            />
          </div>

          {error ? <FormError message={error} /> : null}

          <SubmitButton
            onClick={handleRequestOTP}
            disabled={email.trim() === "" || isLoading}
            isLoading={isLoading}
            loadingLabel="Sending..."
          >
            Send Reset Code
          </SubmitButton>

          <Link
            href="/login"
            className="w-fit text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
          >
            Back to Sign In
          </Link>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Check your email
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              We sent an 8-character code to{" "}
              <span className="inline-block max-w-full truncate align-bottom font-semibold text-[var(--color-accent-primary)]">
                {email}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="otp-code"
              className="text-sm font-semibold text-[var(--color-text-primary)]"
            >
              Reset Code
            </label>
            <input
              id="otp-code"
              aria-label="OTP code"
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              placeholder="Enter 8-character code"
              maxLength={8}
              value={otpCode}
              onChange={(event) => {
                setOTPCode(event.target.value.toUpperCase());
                setError(null);
              }}
              className={[
                getInputClasses(Boolean(error), otpCode.length === 8),
                "text-center font-mono text-2xl uppercase tracking-[4px]",
              ].join(" ")}
            />
          </div>

          {error ? <FormError message={error} /> : null}

          <SubmitButton
            onClick={handleVerifyOTP}
            disabled={otpCode.length < 8 || isLoading}
            isLoading={isLoading}
            loadingLabel="Verifying..."
          >
            Verify Code
          </SubmitButton>

          <button
            type="button"
            onClick={handleResendCode}
            className="mx-auto w-fit rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_8%,var(--color-background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
          >
            Didn&apos;t receive it? Resend code
          </button>

          <Link
            href="/login"
            className="w-fit text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
          >
            Back to Sign In
          </Link>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Create new password
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              Your new password must be at least 8 characters
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="new-password"
              className="text-sm font-semibold text-[var(--color-text-primary)]"
            >
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                aria-label="New Password"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="New password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                  setError(null);
                }}
                className={[
                  getInputClasses(
                    Boolean(error) && !passwordValidation.valid,
                    passwordValidation.valid,
                  ),
                  "pr-11",
                ].join(" ")}
              />
              <button
                type="button"
                aria-label={
                  showNewPassword ? "Hide password" : "Show password"
                }
                onClick={() => setShowNewPassword((visible) => !visible)}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

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
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => {
                  setConfirmPassword(event.target.value);
                  setError(null);
                }}
                className={[
                  getInputClasses(
                    Boolean(error) && !passwordsMatch,
                    passwordsMatch,
                  ),
                  "pr-11",
                ].join(" ")}
              />
              <button
                type="button"
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
                onClick={() => setShowConfirmPassword((visible) => !visible)}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>

            {passwordsMatch ? (
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-success)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Passwords match</span>
              </div>
            ) : null}
          </div>

          {error ? <FormError message={error} /> : null}

          <SubmitButton
            onClick={handleResetPassword}
            disabled={
              newPassword.length < 8 ||
              newPassword !== confirmPassword ||
              isLoading
            }
            isLoading={isLoading}
            loadingLabel="Resetting..."
          >
            Reset Password
          </SubmitButton>
        </div>
      ) : null}
    </div>
  );
}
