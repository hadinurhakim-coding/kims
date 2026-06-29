"use client";

import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Save,
  ShieldAlert,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { PageHeader } from "@/components/catalog/PageHeader";
import { AppShell } from "@/components/shell/AppShell";
import { RightPanel } from "@/components/shell/RightPanel";
import { useAuth } from "@/context/AuthContext";
import type { Track } from "@/data/tracks";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiRequest, type APIListTracksResponse, type APITrack } from "@/lib/api";

type TrackFormState = {
  title: string;
  type: Track["type"];
  mood: string;
  sfxCategory: "" | NonNullable<Track["sfxCategory"]>;
  duration: string;
  licenseLabel: Track["licenseLabel"];
  coverUrl: string;
  audioUrl: string;
  isPublished: boolean;
};

type UploadResponse = {
  path: string;
  public_url?: string;
};

const trackTypes: Track["type"][] = ["Music", "SFX", "Lofi", "Cinematic"];
const licenseLabels: Track["licenseLabel"][] = [
  "No Attribution",
  "Commercial Use",
  "Attribution Required",
];
const sfxCategories: NonNullable<Track["sfxCategory"]>[] = [
  "Impact",
  "Ambient",
  "Foley",
  "UI",
  "Nature",
  "Transition",
];

const emptyForm: TrackFormState = {
  title: "",
  type: "Music",
  mood: "",
  sfxCategory: "",
  duration: "",
  licenseLabel: "No Attribution",
  coverUrl: "",
  audioUrl: "",
  isPublished: true,
};

const fieldClass =
  "h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]";

const buttonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-full)] px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50";

export default function AdminPage() {
  const { isChecking } = useAuthGuard();
  const { user } = useAuth();
  const [tracks, setTracks] = useState<APITrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TrackFormState>(emptyForm);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverPath, setCoverPath] = useState("");
  const [audioPath, setAudioPath] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.role === "admin";

  const publishedCount = useMemo(
    () => tracks.filter((track) => track.is_published !== false).length,
    [tracks],
  );

  useEffect(() => {
    if (isChecking || !isAdmin) return;
    void loadTracks();
  }, [isChecking, isAdmin]);

  async function loadTracks() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<APIListTracksResponse>(
        "/admin/tracks?limit=100&offset=0",
      );
      setTracks(response.tracks);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load tracks.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setCoverFile(null);
    setAudioFile(null);
    setCoverPath("");
    setAudioPath("");
    setStatus(null);
    setError(null);
  }

  function editTrack(track: APITrack) {
    setEditingId(track.id);
    setForm({
      title: track.title,
      type: track.type,
      mood: track.mood,
      sfxCategory: track.sfx_category ?? "",
      duration: track.duration,
      licenseLabel: track.license_label,
      coverUrl: track.cover_url,
      audioUrl: track.audio_url,
      isPublished: track.is_published !== false,
    });
    setCoverPath(track.cover_url);
    setAudioPath(track.audio_url);
    setStatus(null);
    setError(null);
  }

  async function uploadMedia(kind: "cover" | "audio") {
    const file = kind === "cover" ? coverFile : audioFile;
    const path = kind === "cover" ? coverPath : audioPath;

    if (!file || !path.trim()) {
      setError(`${kind === "cover" ? "Cover" : "Audio"} file and path are required.`);
      return;
    }

    setError(null);
    setStatus(null);

    const data = new FormData();
    data.set("kind", kind);
    data.set("path", path.trim());
    data.set("upsert", "true");
    data.set("file", file);

    const response = await apiRequest<UploadResponse>("/admin/uploads", {
      method: "POST",
      body: data,
    });

    setForm((current) => ({
      ...current,
      coverUrl: kind === "cover" ? response.path : current.coverUrl,
      audioUrl: kind === "audio" ? response.path : current.audioUrl,
    }));
    setStatus(`${kind === "cover" ? "Cover" : "Audio"} uploaded.`);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setStatus(null);

    const payload = {
      title: form.title,
      type: form.type,
      mood: form.mood,
      sfx_category: form.type === "SFX" && form.sfxCategory ? form.sfxCategory : null,
      duration: form.duration,
      license_label: form.licenseLabel,
      cover_url: form.coverUrl,
      audio_url: form.audioUrl,
      is_published: form.isPublished,
    };

    try {
      await apiRequest<APITrack>(
        editingId ? `/admin/tracks/${editingId}` : "/admin/tracks",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setStatus(editingId ? "Track updated." : "Track created.");
      resetForm();
      await loadTracks();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save track.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteTrack(track: APITrack) {
    const confirmed = window.confirm(`Delete "${track.title}"?`);
    if (!confirmed) return;

    setError(null);
    setStatus(null);

    try {
      await apiRequest(`/admin/tracks/${track.id}`, { method: "DELETE" });
      setStatus("Track deleted.");
      if (editingId === track.id) resetForm();
      await loadTracks();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to delete track.");
    }
  }

  if (isChecking) return null;

  if (!isAdmin) {
    return (
      <AppShell rightPanel={<RightPanel recentTracks={[]} />} bottomPlayer={null}>
        <div className="mx-auto flex min-h-[calc(100vh-136px)] w-full max-w-4xl flex-col items-center justify-center gap-4 px-4 text-center">
          <ShieldAlert className="h-14 w-14 text-[var(--color-danger)]" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Admin access required
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              This workspace is only available for admin accounts.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell rightPanel={<RightPanel recentTracks={[]} />} bottomPlayer={null}>
      <div className="mx-auto w-full max-w-7xl px-4 pb-8 pt-6 md:px-6 lg:px-8">
        <PageHeader
          title="Admin"
          trackCount={tracks.length}
          actions={
            <button
              type="button"
              onClick={resetForm}
              className={`${buttonClass} bg-[var(--color-accent-primary)] text-[var(--color-surface)] hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:ring-[var(--color-accent-primary)]`}
            >
              <Plus className="h-4 w-4" />
              <span>New Track</span>
            </button>
          }
        />

        <div className="mt-5 grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
          <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                  {editingId ? "Edit track" : "Create track"}
                </h2>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  {publishedCount} published / {tracks.length} total
                </p>
              </div>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-muted)]" />
              ) : null}
            </div>

            {status ? (
              <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--color-success)_40%,var(--color-border))] bg-[color-mix(in_srgb,var(--color-success)_8%,var(--color-surface))] px-3 py-2 text-sm text-[color-mix(in_srgb,var(--color-success)_72%,var(--color-text-primary))]">
                <CheckCircle2 className="h-4 w-4" />
                <span>{status}</span>
              </div>
            ) : null}

            {error ? (
              <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[color-mix(in_srgb,var(--color-danger)_8%,var(--color-surface))] px-3 py-2 text-sm text-[var(--color-danger)]">
                {error}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <LabeledField label="Title">
                <input
                  className={fieldClass}
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  required
                />
              </LabeledField>

              <div className="grid grid-cols-2 gap-3">
                <LabeledField label="Type">
                  <select
                    className={fieldClass}
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value as Track["type"],
                        sfxCategory:
                          event.target.value === "SFX" ? current.sfxCategory : "",
                      }))
                    }
                  >
                    {trackTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </LabeledField>
                <LabeledField label="Duration">
                  <input
                    className={fieldClass}
                    value={form.duration}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        duration: event.target.value,
                      }))
                    }
                    placeholder="02:30"
                    required
                  />
                </LabeledField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <LabeledField label="Mood">
                  <input
                    className={fieldClass}
                    value={form.mood}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, mood: event.target.value }))
                    }
                    required
                  />
                </LabeledField>
                <LabeledField label="SFX category">
                  <select
                    className={fieldClass}
                    value={form.sfxCategory}
                    disabled={form.type !== "SFX"}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sfxCategory: event.target.value as TrackFormState["sfxCategory"],
                      }))
                    }
                  >
                    <option value="">None</option>
                    {sfxCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </LabeledField>
              </div>

              <LabeledField label="License">
                <select
                  className={fieldClass}
                  value={form.licenseLabel}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      licenseLabel: event.target.value as Track["licenseLabel"],
                    }))
                  }
                >
                  {licenseLabels.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
              </LabeledField>

              <LabeledField label="Cover object path">
                <input
                  className={fieldClass}
                  value={form.coverUrl}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, coverUrl: event.target.value }))
                  }
                  placeholder="music/cover.png"
                  required
                />
              </LabeledField>

              <LabeledField label="Audio object path">
                <input
                  className={fieldClass}
                  value={form.audioUrl}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, audioUrl: event.target.value }))
                  }
                  placeholder="music/track.mp3"
                  required
                />
              </LabeledField>

              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isPublished: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[var(--color-accent-primary)]"
                />
                <span>Published</span>
              </label>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`${buttonClass} bg-[var(--color-accent-primary)] text-[var(--color-surface)] hover:bg-[color-mix(in_srgb,var(--color-accent-primary)_88%,var(--color-text-primary))] focus-visible:ring-[var(--color-accent-primary)]`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{editingId ? "Save Track" : "Create Track"}</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className={`${buttonClass} border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:bg-[var(--color-background)] focus-visible:ring-[var(--color-accent-primary)]`}
                >
                  Reset
                </button>
              </div>
            </form>

            <div className="mt-5 border-t border-[var(--color-border)] pt-4">
              <h3 className="mb-3 text-sm font-bold text-[var(--color-text-primary)]">
                Upload media
              </h3>
              <div className="space-y-3">
                <UploadRow
                  label="Cover"
                  path={coverPath}
                  accept="image/*"
                  onPathChange={setCoverPath}
                  onFileChange={setCoverFile}
                  onUpload={() => void uploadMedia("cover")}
                />
                <UploadRow
                  label="Audio"
                  path={audioPath}
                  accept="audio/*"
                  onPathChange={setAudioPath}
                  onFileChange={setAudioFile}
                  onUpload={() => void uploadMedia("audio")}
                />
              </div>
            </div>
          </section>

          <section className="min-w-0 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-text-muted)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Track</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">License</th>
                    <th className="px-4 py-3 font-semibold">State</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {tracks.map((track) => (
                    <tr key={track.id} className="align-middle">
                      <td className="max-w-[280px] px-4 py-3">
                        <div className="truncate font-semibold text-[var(--color-text-primary)]">
                          {track.title}
                        </div>
                        <div className="truncate text-xs text-[var(--color-text-muted)]">
                          {track.audio_url}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">
                        {track.type}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-muted)]">
                        {track.license_label}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            "rounded-[var(--radius-full)] px-2.5 py-1 text-xs font-semibold",
                            track.is_published === false
                              ? "bg-[var(--color-background)] text-[var(--color-text-muted)]"
                              : "bg-[color-mix(in_srgb,var(--color-success)_12%,var(--color-surface))] text-[color-mix(in_srgb,var(--color-success)_72%,var(--color-text-primary))]",
                          ].join(" ")}
                        >
                          {track.is_published === false ? "Draft" : "Published"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            aria-label={`Edit ${track.title}`}
                            onClick={() => editTrack(track)}
                            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-background)] hover:text-[var(--color-accent-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${track.title}`}
                            onClick={() => void deleteTrack(track)}
                            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-full)] text-[var(--color-text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--color-danger)_10%,var(--color-surface))] hover:text-[var(--color-danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-danger)]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!isLoading && tracks.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-[var(--color-text-muted)]">
                No tracks found
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function LabeledField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase text-[var(--color-text-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function UploadRow({
  label,
  path,
  accept,
  onPathChange,
  onFileChange,
  onUpload,
}: {
  label: string;
  path: string;
  accept: string;
  onPathChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          className={fieldClass}
          aria-label={`${label} object path`}
          value={path}
          onChange={(event) => onPathChange(event.target.value)}
          placeholder={label === "Cover" ? "music/cover.png" : "music/track.mp3"}
        />
        <button
          type="button"
          onClick={onUpload}
          className={`${buttonClass} bg-[var(--color-accent-teal)] text-[var(--color-surface)] hover:bg-[color-mix(in_srgb,var(--color-accent-teal)_85%,var(--color-text-primary))] focus-visible:ring-[var(--color-accent-teal)]`}
        >
          <Upload className="h-4 w-4" />
          <span>{label}</span>
        </button>
      </div>
      <input
        type="file"
        accept={accept}
        aria-label={`${label} file`}
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        className="block w-full text-xs text-[var(--color-text-muted)] file:mr-3 file:rounded-[var(--radius-full)] file:border-0 file:bg-[var(--color-background)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--color-text-primary)]"
      />
    </div>
  );
}
