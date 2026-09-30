"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, CircleCheck, Film, ImagePlus, LoaderCircle, Send, Trash2, UploadCloud, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type DragEvent, type FormEvent } from "react";
import { useGuestbook } from "@/components/guestbook/GuestbookProvider";
import { buttonClasses } from "@/components/ui/button-styles";
import { acceptAttribute, formatBytes, mediaTypeOf, uploadMedia, validateFile } from "@/lib/guestbook-upload";
import { cn } from "@/lib/utils";

const MAX_MESSAGE = 500;

type Phase =
  | { kind: "idle" }
  | { kind: "uploading"; progress: number }
  | { kind: "success"; pending: boolean }
  | { kind: "error"; message: string };

interface Selected {
  file: File;
  previewUrl: string;
  type: "image" | "video";
}

const inputClasses =
  "w-full rounded-xl border border-on-surface/15 bg-surface px-4 py-3 text-on-surface placeholder:text-on-surface/40 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-red-500";

export function GuestbookForm({ onPosted }: { onPosted?: () => void }) {
  const { config, addEntry } = useGuestbook();
  const uid = useId();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Selected | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; message?: string; file?: string }>({});
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const abortRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowsMedia = config.allowPhotos || config.allowVideos;
  const uploading = phase.kind === "uploading";
  const mediaLabel = [config.allowPhotos && "photo", config.allowVideos && "video"].filter(Boolean).join(" or ");

  // Release the preview blob whenever the selection changes or the form unmounts.
  useEffect(() => () => {
    if (selected) URL.revokeObjectURL(selected.previewUrl);
  }, [selected]);
  useEffect(() => () => abortRef.current?.abort(), []);

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

    let mediaUrl: string | null = null;
    if (selected) {
      const controller = new AbortController();
      abortRef.current = controller;
      setPhase({ kind: "uploading", progress: 0 });
      try {
        ({ url: mediaUrl } = await uploadMedia(selected.file, {
          signal: controller.signal,
          onProgress: (progress) => setPhase({ kind: "uploading", progress }),
        }));
      } catch (error) {
        const cancelled = error instanceof DOMException && error.name === "AbortError";
        setPhase(cancelled ? { kind: "idle" } : { kind: "error", message: "Upload failed — please try again." });
        return;
      } finally {
        abortRef.current = null;
      }
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
    onPosted?.();
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      className="rounded-3xl bg-surface p-6 text-on-surface shadow-xl shadow-on-canvas/5 ring-1 ring-primary/10 sm:p-8"
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
              <div className="relative overflow-hidden rounded-2xl ring-1 ring-on-surface/10">
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
                <div className="flex items-center gap-3 bg-surface px-4 py-3 text-sm">
                  {selected.type === "image" ? (
                    <ImagePlus className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  ) : (
                    <Film className="h-4 w-4 shrink-0 text-accent" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate">{selected.file.name}</span>
                  <span className="shrink-0 opacity-60">{formatBytes(selected.file.size)}</span>
                  <button
                    type="button"
                    onClick={clearFile}
                    disabled={uploading}
                    aria-label="Remove file"
                    className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
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
                  dragging ? "scale-[1.02] border-primary bg-primary/10" : "border-on-surface/20 hover:border-primary/60 hover:bg-primary/5",
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
          {uploading && (
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
          <button type="submit" disabled={uploading} className={buttonClasses("solid", "flex-1 py-3.5 text-base")}>
            {uploading ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden /> Posting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" aria-hidden /> Post my wish
              </>
            )}
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
