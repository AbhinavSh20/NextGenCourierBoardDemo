export type TranscriptLine = { role: "agent" | "user"; content: string };

// Retell's `update` event carries the whole running transcript; keep only well-formed lines.
export function normalizeTranscript(payload: unknown): TranscriptLine[] {
  const lines = (payload as { transcript?: unknown } | null | undefined)?.transcript;
  if (!Array.isArray(lines)) return [];

  const out: TranscriptLine[] = [];
  for (const line of lines) {
    const { role, content } = (line ?? {}) as { role?: unknown; content?: unknown };
    if ((role !== "agent" && role !== "user") || typeof content !== "string") continue;
    const text = content.trim();
    if (text) out.push({ role, content: text });
  }
  return out;
}

export function formatDuration(totalSeconds: number): string {
  const s = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
