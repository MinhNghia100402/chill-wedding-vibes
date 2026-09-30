"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { GuestbookConfig, GuestbookEntry } from "@/lib/types";

interface GuestbookContextValue {
  config: GuestbookConfig;
  /** Newest first. Includes the visitor's own pending wishes (flagged by `status`). */
  entries: GuestbookEntry[];
  addEntry: (entry: Omit<GuestbookEntry, "id" | "timestamp" | "status">) => GuestbookEntry;
  /** Id of the most recently added entry, so the wall can highlight it. */
  lastAddedId: string | null;
  /** Wishes this visitor has hearted (remembered per browser). */
  likedIds: ReadonlySet<string>;
  toggleLike: (id: string) => void;
}

const GuestbookContext = createContext<GuestbookContextValue | null>(null);

export function useGuestbook(): GuestbookContextValue {
  const ctx = useContext(GuestbookContext);
  if (!ctx) throw new Error("useGuestbook must be used inside <GuestbookProvider>");
  return ctx;
}

/** crypto.randomUUID is missing on insecure origins (e.g. http://<LAN-IP> on a phone). */
const localId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

const byNewest = (a: GuestbookEntry, b: GuestbookEntry) => b.timestamp.localeCompare(a.timestamp);

/**
 * Client-side store for the guestbook wall. Seeded with the couple's approved
 * entries from the server; new submissions are prepended locally (mock
 * backend), so they appear on screen the moment the upload finishes.
 */
export function GuestbookProvider({
  slug,
  config,
  initialEntries,
  children,
}: {
  /** Couple slug — namespaces this visitor's likes in localStorage. */
  slug: string;
  config: GuestbookConfig;
  initialEntries: GuestbookEntry[];
  children: ReactNode;
}) {
  const [entries, setEntries] = useState(() => [...initialEntries].sort(byNewest));
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<ReadonlySet<string>>(() => new Set());
  const objectUrls = useRef<string[]>([]);
  const storageKey = `guestbook-likes:${slug}`;

  // Likes are a per-visitor convenience (mock backend): restore them after mount so the
  // server render and first client render match. Storage may be unavailable (private mode).
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as unknown;
      if (Array.isArray(saved)) setLikedIds(new Set(saved.filter((id): id is string => typeof id === "string")));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const toggleLike = useCallback(
    (id: string) => {
      setLikedIds((current) => {
        const next = new Set(current);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        try {
          window.localStorage.setItem(storageKey, JSON.stringify([...next]));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [storageKey],
  );

  // Local previews are blob: URLs — release them when the page unmounts.
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addEntry = useCallback<GuestbookContextValue["addEntry"]>(
    (input) => {
      const entry: GuestbookEntry = {
        ...input,
        id: `local_${localId()}`,
        timestamp: new Date().toISOString(),
        status: config.requireApproval ? "pending" : "approved",
      };
      if (entry.mediaUrl?.startsWith("blob:")) objectUrls.current.push(entry.mediaUrl);
      setEntries((current) => [entry, ...current]);
      setLastAddedId(entry.id);
      return entry;
    },
    [config.requireApproval],
  );

  const value = useMemo(
    () => ({ config, entries, addEntry, lastAddedId, likedIds, toggleLike }),
    [config, entries, addEntry, lastAddedId, likedIds, toggleLike],
  );
  return <GuestbookContext.Provider value={value}>{children}</GuestbookContext.Provider>;
}
