"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleAlert, CircleCheck, Film, ImagePlus, LoaderCircle, Send, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type DragEvent, type FormEvent } from "react";
import { useGuestbook } from "@/components/guestbook/GuestbookProvider";
import { buttonClasses } from "@/components/ui/button-styles";
import { acceptAttribute, formatBytes, mediaTypeOf, mockDelay, uploadMedia, validateFile } from "@/lib/guestbook-upload";
import { cn } from "@/lib/utils";

const MAX_MESSAGE = 500;
/** How long the submit button celebrates before returning to its default state. */
const CELEBRATE_MS = 2500;

type Phase =
  | { kind: "idle" }
  /** `progress` is null for text-only wishes (no file to upload). */
  | { kind: "sending"; progress: number | null }
  | { kind: "success"; pending: boolean }
  | { kind: "error"; message: string };

interface Selected {
  file: File;
  previewUrl: string;
  type: "image" | "video";
}

// Semi-transparent fields so the glass card's blur shows through.
const inputClasses =
  "w-full rounded-xl border border-on-surface/10 bg-surface/60 px-4 py-3 text-on-surface placeholder:text-on-surface/40 backdrop-blur-sm transition focus:border-primary focus:bg-surface/80 focus:outline-none focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-red-500";

export function GuestbookForm({ onPosted }: { onPosted?: () => void }) {
  const { config, addEntry } = useGuestbook();
  const uid = useId();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; message?: string; file?: string }>({});
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [celebrating, setCelebrating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowsMedia = config.allowPhotos || config.allowVideos;
  const uploading = phase.kind === "sending";
  const mediaLabel = [config.allowPhotos && "photo", config.allowVideos && "video"].filter(Boolean).join(" or ");

  // Release the preview blob whenever the selection changes or the form unmounts.
  useEffect(() => () => {
    if (selected) URL.revokeObjectURL(selected.previewUrl);
  }, [selected]);
  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (!celebrating) return;
    const id = window.setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    return () => window.clearTimeout(id);
  }, [celebrating]);

  function selectFile(file: File | undefined) {
    if (!file) return;
    const error = validateFile(file, config);
    if (error) {
      setErrors((e) => ({ ...e, file: error }));
      return;
    }
    setErrors((e) => ({ ...e, file: undefined }));
    setSelected({ file, previewUrl: URL.createObjectURL(file), type: mediaTypeOf(file)! });
  }

  function clearFile() {
    setSelected(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    if (uploading) return;
    selectFile(event.dataTransfer.files[0]);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (name.trim().length < 2) nextErrors.name = "Please tell the couple who you are";
    if (message.trim().length < 2) nextErrors.message = "Please write a short wish";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    // Mock API call (~1.5 s). With a file, simulate its upload with progress;
    // text-only wishes still "send" so every submission feels the same.
    let mediaUrl: string | null = null;
    const controller = new AbortController();
    abortRef.current = controller;
    setCelebrating(false);
    setPhase({ kind: "sending", progress: selected ? 0 : null });
    try {
      if (selected) {
        ({ url: mediaUrl } = await uploadMedia(selected.file, {
          signal: controller.signal,
          onProgress: (progress) => setPhase({ kind: "sending", progress }),
        }));
      } else {
        await mockDelay(1500, controller.signal);
      }
    } catch (error) {
      const cancelled = error instanceof DOMException && error.name === "AbortError";
      setPhase(cancelled ? { kind: "idle" } : { kind: "error", message: "Sending failed — please try again." });
      return;
    } finally {
      abortRef.current = null;
    }

    const entry = addEntry({
      authorName: name.trim(),
      message: message.trim(),
      mediaType: selected && mediaUrl ? selected.type : "text",
      mediaUrl,
    });
    setName("");
    setMessage("");
    clearFile();
    setPhase({ kind: "success", pending: entry.status === "pending" });
    setCelebrating(true);
    onPosted?.();
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      // Glassmorphism card (theme-aware: surface tint instead of hard-coded white, so dark
      // presets get dark glass with readable text).
      className="relative rounded-3xl border border-white/40 bg-surface/40 p-6 text-on-surface shadow-[0_20px_60px_-25px_rgb(var(--color-primary-rgb)/0.45)] backdrop-blur-md sm:p-8"
    >
      <div className="space-y-5">
        <div>
          <label htmlFor={`${uid}-name`} className="mb-1.5 block text-sm font-medium">
            Your name
          </label>
          <input
            id={`${uid}-name`}
            value={name}
            maxLength={80}
            disabled={uploading}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${uid}-name-error` : undefined}
            autoComplete="name"
            placeholder="Aunt Mary"
            className={inputClasses}
          />
          {errors.name && (
            <p id={`${uid}-name-error`} role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor={`${uid}-message`} className="text-sm font-medium">
              Your wish
            </label>
            <span className={cn("text-xs", message.length > MAX_MESSAGE - 50 ? "text-accent" : "opacity-50")}>
              {message.length}/{MAX_MESSAGE}
            </span>
          </div>
          <textarea
            id={`${uid}-message`}
            value={message}
            rows={4}
            maxLength={MAX_MESSAGE}
            disabled={uploading}
            onChange={(e) => setMessage(e.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? `${uid}-message-error` : undefined}
            placeholder="Share a memory, some advice, or your warmest wishes…"
            className={cn(inputClasses, "resize-y")}
          />
          {errors.message && (
            <p id={`${uid}-message-error`} role="alert" className="mt-1.5 text-sm text-red-600">
              {errors.message}
            </p>
          )}
        </div>

        {allowsMedia && (
          <div>
            <p className="mb-1.5 text-sm font-medium">
              Add a {mediaLabel} <span className="font-normal opacity-60">(optional, max {config.maxFileSizeMB} MB)</span>
            </p>

            {selected ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden rounded-2xl ring-1 ring-on-surface/10"
              >
                <button
                  type="button"
                  onClick={clearFile}
                  disabled={uploading}
                  aria-label="Remove file"
                  className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-primary hover:text-on-primary disabled:opacity-40"
                >
                  <X className="h-4 w-4" />
                </button>
                {selected.type === "image" ? (
                  <Image
                    src={selected.previewUrl}
                    alt="Selected photo preview"
                    width={800}
                    height={600}
                    unoptimized
                    className="max-h-72 w-full object-cover"
                  />
                ) : (
                  <video src={selected.previewUrl} controls playsInline muted className="max-h-72 w-full bg-black" />
                )}
                <div className="flex items-center gap-3 bg-surface/70 px-4 py-3 text-sm backdrop-blur-sm">
                  {selected.type === "image" ? (
                    <ImagePlus className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  ) : (
                    <Film className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate">{selected.file.name}</span>
                  <span className="shrink-0 opacity-60">{formatBytes(selected.file.size)}</span>
                </div>
              </motion.div>
            ) : (
              <label
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={(e) => {
                  // Ignore dragleave events fired when moving over child elements.
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
                }}
                onDrop={onDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300",
                  "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30",
                  dragging
                    ? "scale-[1.02] border-primary bg-primary/10"
                    : "border-on-surface/20 bg-surface/30 hover:border-primary/60 hover:bg-primary/5",
                  errors.file && "border-red-400",
                )}
              >
                <motion.span animate={{ y: dragging ? -6 : 0 }} className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-accent">
                  <UploadCloud className="h-7 w-7" aria-hidden />
                </motion.span>
                <span className="mt-4 font-medium">{dragging ? "Drop it here!" : `Drag & drop a ${mediaLabel}`}</span>
                <span className="mt-1 text-sm opacity-60">
                  or <span className="font-semibold text-accent underline underline-offset-2">browse your device</span>
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptAttribute(config)}
                  onChange={(e) => selectFile(e.target.files?.[0])}
                  aria-invalid={Boolean(errors.file)}
                  aria-describedby={errors.file ? `${uid}-file-error` : undefined}
                  className="sr-only"
                />
              </label>
            )}
            {errors.file && (
              <p id={`${uid}-file-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-sm text-red-600">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {errors.file}
              </p>
            )}
          </div>
        )}

        <AnimatePresence>
          {phase.kind === "sending" && phase.progress !== null && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <LoaderCircle className="h-4 w-4 animate-spin text-accent" aria-hidden /> Uploading…
                </span>
                <span className="tabular-nums opacity-70">{phase.progress}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={phase.progress}
                className="mt-2 h-2 overflow-hidden rounded-full bg-primary/15"
              >
                <motion.div
                  className="h-full rounded-full bg-primary"
                  animate={{ width: `${phase.progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase.kind === "error" && (
          <p role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <CircleAlert className="h-4 w-4 shrink-0" aria-hidden /> {phase.message}
          </p>
        )}
        {phase.kind === "success" && (
          <p role="status" className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm text-accent">
            <CircleCheck className="h-4 w-4 shrink-0" aria-hidden />
            {phase.pending
              ? "Thank you! Your wish will appear on the wall once the couple approves it."
              : "Thank you! Your wish has been added to the wall."}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={uploading}
            aria-live="polite"
            className={buttonClasses("solid", "relative flex-1 overflow-hidden py-3.5 text-base disabled:opacity-90")}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={uploading ? "sending" : celebrating ? "sent" : "idle"}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> Sending vibes…
                  </>
                ) : celebrating ? (
                  <>
                    <motion.span
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="flex"
                    >
                      <Check className="h-5 w-5" aria-hidden />
                    </motion.span>
                    Sent with love!
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden /> Post my wish
                  </>
                )}
              </motion.span>
            </AnimatePresence>
          </button>
          {uploading && (
            <button type="button" onClick={() => abortRef.current?.abort()} className={buttonClasses("outline", "py-3.5")}>
              <X className="h-4 w-4" aria-hidden /> Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
