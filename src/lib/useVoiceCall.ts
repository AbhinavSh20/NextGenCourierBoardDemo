"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeTranscript, type TranscriptLine } from "@/lib/callFormat";

export type CallState = "idle" | "starting" | "live" | "ended" | "error";
export type CallErrorKind = "unavailable" | "mic-blocked" | "rate-limited" | "failed";
export type CallPerson = { jobId: string; name: string; email: string };

// Minimal view of Retell's web client; it is imported lazily so the SDK never loads on the server.
type WebClient = {
  on(event: string, handler: (payload?: unknown) => void): unknown;
  startCall(config: { accessToken: string }): Promise<void>;
  stopCall(): void;
  mute(): void;
  unmute(): void;
};

export function useVoiceCall() {
  const [state, setState] = useState<CallState>("idle");
  const [errorKind, setErrorKind] = useState<CallErrorKind | null>(null);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [seconds, setSeconds] = useState(0);
  // True while the full transcript is fetched after the call ends; the live one shows meanwhile.
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  const clientRef = useRef<WebClient | null>(null);
  const callIdRef = useRef<string | null>(null);
  // Bumped on every start/end so a late event or response from an old call is ignored.
  const attempt = useRef(0);
  const mutedRef = useRef(false);
  // Retell fires stop/start talking on every pause; holding "speaking" briefly stops the UI flickering.
  const stopTalkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const teardown = useCallback(() => {
    attempt.current += 1;
    if (stopTalkTimer.current) clearTimeout(stopTalkTimer.current);
    clientRef.current?.stopCall();
    clientRef.current = null;
    mutedRef.current = false;
    setAgentSpeaking(false);
    setMuted(false);
    setLoadingTranscript(false);
  }, []);

  // Retell stores the transcript a moment after hang-up, so retry briefly. Any failure keeps the live one.
  const loadFullTranscript = useCallback(async (callId: string | null) => {
    if (!callId) return;
    const mine = attempt.current;
    setLoadingTranscript(true);
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      if (attempt.current !== mine) return;
      try {
        const res = await fetch(`/api/interview/transcript?callId=${encodeURIComponent(callId)}`);
        if (attempt.current !== mine) return;
        if (!res.ok) break;
        const data = await res.json();
        if (attempt.current !== mine) return;
        if (data?.ready) {
          const lines = normalizeTranscript(data);
          if (lines.length) setTranscript(lines);
          break;
        }
      } catch {
        break;
      }
    }
    if (attempt.current === mine) setLoadingTranscript(false);
  }, []);

  useEffect(() => {
    if (state !== "live") return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  useEffect(() => teardown, [teardown]);

  const fail = useCallback(
    (kind: CallErrorKind) => {
      teardown();
      setErrorKind(kind);
      setState("error");
    },
    [teardown],
  );

  const start = useCallback(
    async (person: CallPerson) => {
      teardown();
      const mine = attempt.current;
      callIdRef.current = null;
      setErrorKind(null);
      setTranscript([]);
      setSeconds(0);
      setState("starting");

      // Probe the mic first so a blocked permission gets a clear message, not a generic failure.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        if (attempt.current === mine) fail("mic-blocked");
        return;
      }
      if (attempt.current !== mine) return;

      let accessToken: string;
      try {
        const res = await fetch("/api/interview/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(person),
        });
        if (attempt.current !== mine) return;
        if (res.status === 501) return fail("unavailable");
        if (res.status === 429) return fail("rate-limited");
        const data = await res.json().catch(() => null);
        if (!res.ok || typeof data?.accessToken !== "string") return fail("failed");
        accessToken = data.accessToken;
        callIdRef.current = typeof data.callId === "string" ? data.callId : null;
      } catch {
        if (attempt.current === mine) fail("failed");
        return;
      }

      try {
        const { RetellWebClient } = await import("retell-client-js-sdk");
        if (attempt.current !== mine) return;

        const client = new RetellWebClient() as unknown as WebClient;
        clientRef.current = client;
        client.on("call_started", () => attempt.current === mine && setState("live"));
        client.on("call_ended", () => {
          if (attempt.current !== mine) return;
          teardown();
          setState("ended");
          void loadFullTranscript(callIdRef.current);
        });
        client.on("agent_start_talking", () => {
          if (attempt.current !== mine) return;
          if (stopTalkTimer.current) clearTimeout(stopTalkTimer.current);
          setAgentSpeaking(true);
        });
        client.on("agent_stop_talking", () => {
          if (attempt.current !== mine) return;
          stopTalkTimer.current = setTimeout(() => setAgentSpeaking(false), 400);
        });
        client.on("update", (payload) => {
          if (attempt.current !== mine) return;
          const lines = normalizeTranscript(payload);
          if (lines.length) setTranscript(lines);
        });
        client.on("error", () => attempt.current === mine && fail("failed"));

        await client.startCall({ accessToken });
      } catch {
        if (attempt.current === mine) fail("failed");
      }
    },
    [fail, teardown, loadFullTranscript],
  );

  const end = useCallback(() => {
    const wasActive = clientRef.current !== null;
    teardown();
    setState(wasActive ? "ended" : "idle");
    if (wasActive) void loadFullTranscript(callIdRef.current);
  }, [teardown, loadFullTranscript]);

  const toggleMute = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;
    // Not inside a state updater: React may run those twice in dev and mute/unmute would cancel out.
    if (mutedRef.current) client.unmute();
    else client.mute();
    mutedRef.current = !mutedRef.current;
    setMuted(mutedRef.current);
  }, []);

  const reset = useCallback(() => {
    teardown();
    setErrorKind(null);
    setTranscript([]);
    setSeconds(0);
    setState("idle");
  }, [teardown]);

  return { state, errorKind, agentSpeaking, muted, transcript, loadingTranscript, seconds, start, end, toggleMute, reset };
}
