import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service - KIMS",
  description:
    "Rules for using KIMS, including account use, music licenses, content limits, and service disclaimers.",
};

const sections = [
  {
    title: "Using KIMS",
    body: [
      "KIMS, Kim's Music Station, provides music and sound assets for creators. You may browse, play, save, organize, and download available tracks according to the license shown for each track.",
      "You are responsible for checking the license label and any attribution requirements before using a track in your project.",
    ],
  },
  {
    title: "Accounts",
    body: [
      "You must provide accurate account information and keep your login credentials secure.",
      "You are responsible for activity under your account, including favorites, playlists, playback history, and admin actions if your account has admin access.",
      "KIMS may restrict or remove access if an account is used for abuse, unauthorized access, scraping, spam, or behavior that harms the service.",
    ],
  },
  {
    title: "Music And Sound Licenses",
    body: [
      "Tracks can have different license labels, such as No Attribution, Commercial Use, or Attribution Required.",
      "A license label describes the intended usage permissions for that track, but it does not remove your responsibility to comply with the specific license terms shown or provided with the asset.",
      "Do not resell, repackage, or redistribute KIMS assets as a competing music or sound library unless the specific license clearly allows it.",
    ],
  },
  {
    title: "Content And Admin Tools",
    body: [
      "Admin content tools are only for authorized maintainers. Uploaded covers, audio files, metadata, and publish states must be accurate and suitable for distribution through KIMS.",
      "Do not upload content that you do not have rights to distribute, content that contains malware, or content that violates applicable laws.",
      "KIMS may remove or unpublish content if ownership, safety, quality, or licensing concerns are found.",
    ],
  },
  {
    title: "Prohibited Use",
    body: [
      "Do not attempt to bypass authentication, rate limits, admin restrictions, storage protections, or signed URL controls.",
      "Do not use automated requests in a way that overloads the API, disrupts other users, or attempts to scrape the full catalog outside normal product usage.",
      "Do not use KIMS to host, transmit, or promote illegal, harmful, or infringing material.",
    ],
  },
  {
    title: "Availability",
    body: [
      "KIMS is provided as-is and may change, pause, or become unavailable without notice.",
      "Tracks, metadata, storage URLs, playlists, history, recommendations, and account features may be updated as the product evolves.",
      "KIMS does not guarantee uninterrupted service, permanent asset availability, or error-free operation.",
    ],
  },
  {
    title: "Disclaimers",
    body: [
      "KIMS does not provide legal advice. If you are unsure whether a track license fits your project, you should get independent advice before publishing your work.",
      "To the extent allowed by law, KIMS is not liable for indirect, incidental, special, consequential, or lost-profit damages related to use of the service.",
    ],
  },
  {
    title: "Changes To These Terms",
    body: [
      "KIMS may update these terms as the service changes. The latest version will be posted on this page with an updated date.",
      "Continuing to use KIMS after changes are posted means you accept the updated terms.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--color-background)] px-4 py-10 text-[var(--color-text-primary)] md:px-6">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-semibold text-[var(--color-accent-primary)] transition-colors hover:text-[color-mix(in_srgb,var(--color-accent-primary)_82%,var(--color-text-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
        >
          Back to KIMS
        </Link>

        <header className="mt-8 border-b border-[var(--color-border)] pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Legal
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--color-text-primary)]">
            Terms of Service
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
            Last updated: June 29, 2026
          </p>
        </header>

        <div className="space-y-8 py-8">
          <section>
            <p className="text-base leading-7 text-[var(--color-text-muted)]">
              These terms explain the rules for using KIMS, including account
              access, music and sound licenses, content management, and service
              limitations.
            </p>
          </section>

          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-sm leading-6 text-[var(--color-text-muted)]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
