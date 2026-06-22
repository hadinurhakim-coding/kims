"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useGuestGuard } from "@/hooks/useGuestGuard";
import { validate } from "@/lib/validation";

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

export default function ForgotPasswordPage() {
  const { isChecking } = useGuestGuard();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [touched, setTouched] = useState({ email: false });
  const emailValidation = validate.email(email);
  const showEmailError =
    (touched.email || hasSubmitted) && !emailValidation.valid;

  function handleSubmit() {
    setHasSubmitted(true);
    setTouched({ email: true });

    if (!emailValidation.valid || isLoading) return;

    setIsLoading(true);

    window.setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  }

  function handleTryAnotherEmail() {
    setEmail("");
    setIsSubmitted(false);
    setHasSubmitted(false);
    setTouched({ email: false });
  }

  if (isChecking) return null;

  if (isSubmitted) {
    return (
      <div className="flex w-full flex-col gap-7 text-center">
        <div className="flex flex-col items-center gap-4">
          <CheckCircle2 className="h-16 w-16 text-[var(--color-success)]" />
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Check your email
            </h1>
            <p className="text-sm text-[var(--color-text-muted)]">
              We&apos;ve sent a reset link to {email}
            </p>
            <p className="text-xs italic text-[var(--color-text-muted)]">
              Didn&apos;t receive it? Check your spam folder
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="flex h-11 w-full items-center justify-center rounded-[var(--radius-full)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
          >
            Back to Sign In
          </Link>

          <button
            type="button"
            onClick={handleTryAnotherEmail}
            className="mx-auto w-fit rounded-[var(--radius-full)] px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_8%,var(--color-background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
          >
            Try another email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Reset your password
        </h1>
        <p className="text-sm text-[var(--color-text-muted)]">
          Enter your email and we&apos;ll send you a reset link when email is
          ready
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
            onBlur={() => setTouched({ email: true })}
            onChange={(event) => setEmail(event.target.value)}
            className={getInputClasses(
              showEmailError,
              touched.email && emailValidation.valid,
            )}
          />
          {showEmailError && emailValidation.message ? (
            <FieldError id="email-error" message={emailValidation.message} />
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={email.trim() === "" || isLoading}
          className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-full)] bg-[var(--color-accent-primary)] text-sm font-semibold text-[var(--color-surface)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            "Send Reset Link"
          )}
        </button>

        <Link
          href="/login"
          className="w-fit text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
