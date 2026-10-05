"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { PhoneIcon } from "@/components/icons";
import { formatDuration } from "@/lib/callFormat";
import { useVoiceCall, type CallErrorKind } from "@/lib/useVoiceCall";

type Message = { role: "candidate" | "angie"; text: string };
type Step = "intro" | "call" | "chat" | "done";
type Outcome = "qualified" | "declined";
type Identity = { name: string; email: string };
type Reply = { reply: string; step?: number; total?: number; done?: boolean; outcome?: Outcome };

const DONE_HEADING: Record<Outcome | "neutral", string> = {
  qualified: "You're through to the next step",
  declined: "Thanks for your time",
  neutral: "Screening complete",
};

// Text chat is hidden until Angie is connected to it; flip to true to show it again.
const TEXT_CHAT_ENABLED = false;

const CALL_ERRORS: Record<CallErrorKind, string> = {
  unavailable: TEXT_CHAT_ENABLED
    ? "Voice interviews aren't available yet. Chat with Angie by text instead."
    : "Voice interviews aren't available yet. Please check back soon.",
  "mic-blocked": "Microphone access was blocked. Allow the microphone in your browser, then try again.",
  "rate-limited": "Too many call attempts. Please wait a few minutes and try again.",
  failed: "The call couldn't connect. Check your connection and try again.",
};

const EXPECTATIONS = [
  TEXT_CHAT_ENABLED ? "About 3 minutes, by voice or text" : "About 3 minutes, by voice",
  "Questions on your license, vehicle and availability",
  "We'll email you the result",
];

const fieldClass =
  "w-full rounded-lg border border-[var(--color-border)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition-shadow focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20";

function AngieAvatar({ large = false, online = false }: { large?: boolean; online?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] font-semibold text-white ${
        large ? "h-12 w-12 text-lg" : "h-8 w-8 text-sm"
      }`}
    >
      A
      {online && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-surface)] bg-emerald-500" />
      )}
    </span>
  );
}

function MicIcon({ off = false, className }: { off?: boolean; className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function stepLabel(step: Step, idle: string) {
  return step === "call" ? "Return to call" : step === "chat" ? "Resume screening" : step === "done" ? "View result" : idle;
}

export default function ScreeningPanel({
  jobId,
  jobTitle,
  jobSubtitle,
  variant,
}: {
  jobId: string;
  jobTitle: string;
  jobSubtitle: string;
  variant: "card" | "bar";
}) {
  const [open, setOpen] = useState(false);
  const call = useVoiceCall();
  const [rawStep, setStep] = useState<Step>("intro");
  // A finished call lands on the result screen without a separate state update.
  const step: Step = rawStep === "call" && call.state === "ended" ? "done" : rawStep;
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);
  const [progress, setProgress] = useState<{ step: number; total: number } | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const sessionId = useRef("");
  const lastAttempt = useRef<{ who: Identity; message: string; turn: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    // A live call is ended explicitly, never by a stray Escape or backdrop click.
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && step !== "call" && setOpen(false);
    const scrollLock = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = scrollLock;
      window.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [open, step]);

  useEffect(() => {
    if (open && step === "intro") nameRef.current?.focus();
  }, [open, step]);

  useEffect(() => {
    const el = listRef.current;
    // Only follow new text when already near the bottom, so reading back isn't yanked away.
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 80) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending, error, call.transcript]);

  useEffect(() => {
    if (open && step === "chat" && !sending && !error) inputRef.current?.focus();
  }, [open, step, sending, error]);

  async function send(who: Identity, message: string, turn: number) {
    lastAttempt.current = { who, message, turn };
    setSending(true);
    setError(false);
    try {
      const res = await fetch("/api/screening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, ...who, sessionId: sessionId.current, message, turn }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data: Reply = await res.json();
      setMessages((m) => [...m, { role: "angie", text: data.reply }]);
      if (data.step && data.total) setProgress({ step: data.step, total: data.total });
      if (data.done) {
        setOutcome(data.outcome ?? null);
        setStep("done");
      }
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  function readIdentity(form: HTMLFormElement): Identity {
    const data = new FormData(form);
    return { name: String(data.get("name")).trim(), email: String(data.get("email")).trim() };
  }

  function startVoice(form: HTMLFormElement) {
    if (!form.reportValidity()) return;
    const who = readIdentity(form);
    setIdentity(who);
    setStep("call");
    void call.start({ jobId, ...who });
  }

  function closePanel() {
    if (step === "call" && (call.state === "starting" || call.state === "live")) call.end();
    else setOpen(false);
  }

  function start(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const who = readIdentity(e.currentTarget);
    sessionId.current = crypto.randomUUID();
    setIdentity(who);
    setStep("chat");
    void send(who, "", 0);
  }

  function submitMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || !identity) return;
    const turn = messages.filter((m) => m.role === "candidate").length + 1;
    setMessages((m) => [...m, { role: "candidate", text }]);
    setInput("");
    void send(identity, text, turn);
  }

  const callBusy = call.state === "starting" || call.state === "live";
  const callStatus =
    call.state === "starting"
      ? "Connecting to Angie…"
      : call.state === "live"
        ? call.muted
          ? "You're muted"
          : call.agentSpeaking
            ? "Angie is speaking"
            : "Listening…"
        : "Call stopped";
  const lastAngie = [...messages].reverse().find((m) => m.role === "angie");
  const pct = progress ? Math.round((progress.step / progress.total) * 100) : 0;

  return (
    <>
      {variant === "card" ? (
        <div className="rounded-xl bg-violet-50 p-4 ring-1 ring-inset ring-violet-100">
          <div className="flex items-start gap-3">
            <AngieAvatar large />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-ink)]">Screen with Angie</p>
              <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
                {TEXT_CHAT_ENABLED ? "Talk to Angie or chat by text." : "Talk to Angie."} About 3 minutes, no login
                needed.
              </p>
            </div>
          </div>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 w-full rounded-lg bg-[var(--color-primary)] py-2.5 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)]"
          >
            {stepLabel(step, "Start screening")}
          </button>
        </div>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="block flex-1 rounded-lg bg-[var(--color-primary)] py-2.5 text-center text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)]"
        >
          {stepLabel(step, "Start screening · 3 min")}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          onClick={() => step !== "call" && setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Screening with Angie for ${jobTitle}`}
            onClick={(e) => e.stopPropagation()}
            className="fade-in-up flex h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-[var(--color-surface)] shadow-xl sm:h-[38rem] sm:rounded-2xl"
          >
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
              <AngieAvatar online />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight text-[var(--color-ink)]">Angie</p>
                <p className="truncate text-xs text-[var(--color-ink-soft)]">Screening · {jobTitle}</p>
              </div>
              <button
                type="button"
                onClick={closePanel}
                aria-label={callBusy ? "End call and close" : "Close"}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-ink-soft)] hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {step === "chat" && progress && (
              <div className="px-4 pt-2.5">
                <p className="text-xs font-medium text-[var(--color-ink-soft)]">
                  Question {progress.step} of {progress.total}
                </p>
                <div
                  role="progressbar"
                  aria-label="Screening progress"
                  aria-valuemin={0}
                  aria-valuemax={progress.total}
                  aria-valuenow={progress.step}
                  className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--color-border)]"
                >
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-300 ease-[var(--ease-out)]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            {step === "intro" && (
              <div className="flex flex-1 flex-col overflow-y-auto p-5">
                <h2 className="text-lg font-bold tracking-tight text-[var(--color-ink)]">Hi, I&apos;m Angie.</h2>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  I&apos;ll ask a few quick questions to see if this role is a good fit.
                </p>
                <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-[var(--color-ink-soft)]">
                  <span className="font-semibold text-[var(--color-ink)]">{jobTitle}</span> · {jobSubtitle}
                </p>

                <ul className="mt-4 flex flex-col gap-2">
                  {EXPECTATIONS.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[var(--color-primary-dark)]">
                        <CheckIcon className="h-3 w-3" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>

                <form
                  onSubmit={
                    TEXT_CHAT_ENABLED
                      ? start
                      : (e) => {
                          e.preventDefault();
                          void startVoice(e.currentTarget);
                        }
                  }
                  className="mt-5 flex flex-1 flex-col gap-3"
                >
                  <label className="flex flex-col gap-1 text-sm font-medium text-[var(--color-ink)]">
                    Full name
                    <input
                      ref={nameRef}
                      name="name"
                      required
                      maxLength={100}
                      autoComplete="name"
                      className={fieldClass}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm font-medium text-[var(--color-ink)]">
                    Email
                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={200}
                      autoComplete="email"
                      className={fieldClass}
                    />
                    <span className="text-xs font-normal text-[var(--color-ink-soft)]">
                      Only used to send you the result.
                    </span>
                  </label>
                  <div className="mt-auto flex flex-col gap-2">
                    <button
                      type={TEXT_CHAT_ENABLED ? "button" : "submit"}
                      onClick={TEXT_CHAT_ENABLED ? (e) => void startVoice(e.currentTarget.form!) : undefined}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-3 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
                    >
                      <PhoneIcon className="h-4 w-4" />
                      Talk to Angie
                    </button>
                    {TEXT_CHAT_ENABLED && (
                      <button
                        type="submit"
                        className="rounded-lg border border-[var(--color-border)] py-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-slate-50 disabled:opacity-60"
                      >
                        Chat by text
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {step === "call" && (
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex flex-col items-center bg-gradient-to-b from-violet-50 to-transparent px-5 pb-4 pt-8">
                  <div className="relative flex h-24 w-24 items-center justify-center">
                    <span
                      aria-hidden="true"
                      data-active={call.state === "live" && call.agentSpeaking && !call.muted}
                      className="voice-ring absolute inset-0 rounded-full"
                    />
                    <span
                      aria-hidden="true"
                      className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-primary)] text-3xl font-semibold text-white shadow-md transition-opacity ${
                        call.state === "starting" ? "animate-pulse" : ""
                      }`}
                    >
                      A
                    </span>
                  </div>
                  <p role="status" className="mt-4 text-base font-semibold text-[var(--color-ink)]">
                    {callStatus}
                  </p>
                  <div className="mt-1 flex h-5 items-center gap-3 text-xs tabular-nums text-[var(--color-ink-soft)]">
                    <span className={call.state === "live" ? "" : "invisible"}>{formatDuration(call.seconds)}</span>
                    <span
                      aria-hidden="true"
                      data-active={call.state === "live" && call.agentSpeaking && !call.muted}
                      className="voice-bars flex h-4 items-center gap-0.5"
                    >
                      <i /><i /><i /><i /><i />
                    </span>
                  </div>
                </div>

                <div ref={listRef} className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pb-2" aria-live="polite">
                  {call.transcript.length === 0 && call.state === "live" && (
                    <p className="m-auto text-center text-xs text-[var(--color-muted)]">
                      Your conversation will appear here.
                    </p>
                  )}
                  {call.transcript.map((line, i) => (
                    <p
                      key={i}
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                        line.role === "agent"
                          ? "self-start rounded-bl-md bg-slate-100 text-[var(--color-ink)]"
                          : "self-end rounded-br-md bg-[var(--color-primary)] text-white"
                      }`}
                    >
                      {line.content}
                    </p>
                  ))}
                </div>

                {call.state === "error" && call.errorKind && (
                  <p
                    role="alert"
                    className="mx-4 mb-2 rounded-lg bg-[var(--color-error-bg)] px-3 py-2 text-xs text-[var(--color-error-ink)]"
                  >
                    {CALL_ERRORS[call.errorKind]}
                  </p>
                )}

                <div className="flex items-center justify-center gap-4 border-t border-[var(--color-border)] p-4">
                  {callBusy ? (
                    <>
                      <button
                        type="button"
                        onClick={call.toggleMute}
                        disabled={call.state !== "live"}
                        aria-pressed={call.muted}
                        aria-label={call.muted ? "Unmute" : "Mute"}
                        className={`flex h-14 w-14 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
                          call.muted
                            ? "border-transparent bg-[var(--color-ink)] text-white"
                            : "border-[var(--color-border)] text-[var(--color-ink)] hover:bg-slate-50"
                        }`}
                      >
                        <MicIcon off={call.muted} className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={call.end}
                        aria-label="End call"
                        className="flex h-14 min-w-32 items-center justify-center gap-2 rounded-full bg-[var(--color-error-ink)] px-6 text-sm font-semibold text-white hover:opacity-90"
                      >
                        <PhoneIcon className="h-4 w-4 rotate-[135deg]" />
                        End call
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          call.reset();
                          setStep("intro");
                        }}
                        className="flex-1 rounded-full border border-[var(--color-border)] py-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-slate-50"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => identity && void call.start({ jobId, ...identity })}
                        className="flex-1 rounded-full bg-[var(--color-primary)] py-3 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)]"
                      >
                        Try again
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {step === "chat" && (
              <>
                <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
                  {messages.map((m, i) =>
                    m.role === "angie" ? (
                      <div key={i} className="fade-in-up flex max-w-[88%] items-end gap-2 self-start">
                        <AngieAvatar />
                        <p className="rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-2 text-sm text-[var(--color-ink)]">
                          {m.text}
                        </p>
                      </div>
                    ) : (
                      <p
                        key={i}
                        className="fade-in-up max-w-[80%] self-end rounded-2xl rounded-br-md bg-[var(--color-primary)] px-3.5 py-2 text-sm text-white"
                      >
                        {m.text}
                      </p>
                    ),
                  )}

                  {sending && (
                    <div className="flex items-end gap-2 self-start" aria-label="Angie is typing">
                      <AngieAvatar />
                      <span className="flex gap-1 rounded-2xl rounded-bl-md bg-slate-100 px-3.5 py-3">
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]" />
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]" />
                        <span className="typing-dot h-1.5 w-1.5 rounded-full bg-[var(--color-muted)]" />
                      </span>
                    </div>
                  )}

                  {error && (
                    <div
                      role="alert"
                      className="flex items-center justify-between gap-3 rounded-lg bg-[var(--color-error-bg)] px-3 py-2 text-xs text-[var(--color-error-ink)]"
                    >
                      Couldn&apos;t reach Angie. Check your connection.
                      <button
                        type="button"
                        className="shrink-0 font-semibold underline"
                        onClick={() => {
                          const a = lastAttempt.current;
                          if (a) void send(a.who, a.message, a.turn);
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>

                <form onSubmit={submitMessage} className="flex gap-2 border-t border-[var(--color-border)] p-3">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={1000}
                    placeholder="Type your answer"
                    aria-label="Your answer"
                    autoComplete="off"
                    className={fieldClass}
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    className="rounded-lg bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-opacity disabled:opacity-40"
                  >
                    Send
                  </button>
                </form>
              </>
            )}

            {step === "done" && (
              <div className="flex flex-1 flex-col items-center overflow-y-auto p-6 text-center">
                <span className="mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-bg)] text-[var(--color-success-ink)]">
                  <CheckIcon className="h-7 w-7" />
                </span>
                <h2 className="mt-4 text-lg font-bold tracking-tight text-[var(--color-ink)]">
                  {DONE_HEADING[outcome ?? "neutral"]}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {lastAngie ? lastAngie.text : "Thanks for speaking with Angie. We'll review your answers."}
                </p>
                {identity && (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-[var(--color-ink-soft)]">
                    We&apos;ll email your result to <span className="font-semibold text-[var(--color-ink)]">{identity.email}</span>
                  </p>
                )}
                <div className="mt-auto flex w-full flex-col gap-2 pt-6">
                  <Link
                    href="/jobs"
                    className="rounded-lg bg-[var(--color-primary)] py-3 text-sm font-semibold text-white transition-colors duration-150 ease-out hover:bg-[var(--color-primary-dark)]"
                  >
                    Browse more jobs
                  </Link>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-[var(--color-border)] py-3 text-sm font-semibold text-[var(--color-ink)] hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
