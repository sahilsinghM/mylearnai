"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Zap, Send, Flag, Check, ShieldCheck, RefreshCw } from "lucide-react";
import type { Message, TutorSessionResult } from "@/types/tutor";
import { hasMasteryTooltipBeenSeen, markMasteryTooltipSeen } from "@/lib/tutor/masteryTooltip";
import { shouldEndSession } from "@/lib/tutor/sessionEnd";

interface Choice {
  text: string;
  isCorrect: boolean;
}

interface DisplayMessage extends Message {
  choices?: Choice[];
}

/** Normalize chip lengths so the correct answer isn't predictable by length alone.
 *  Truncates all choices to max 80 chars, then caps any choice that is > 1.5×
 *  the shortest choice length (after the first truncation pass).
 */
function normalizeChoiceLengths(choices: { text: string }[]): { text: string }[] {
  const truncated = choices.map((c) => ({ ...c, text: c.text.slice(0, 80).trimEnd() }));
  const shortest = Math.min(...truncated.map((c) => c.text.length));
  const maxAllowed = Math.ceil(shortest * 1.5);
  return truncated.map((c) => ({
    ...c,
    text: c.text.length > maxAllowed ? c.text.slice(0, maxAllowed).trimEnd() + "…" : c.text,
  }));
}

function shuffleChoices(raw: { text: string }[]): Choice[] {
  const normalized = normalizeChoiceLengths(raw);
  // tag correctness before shuffle — first in API array is always correct by system-prompt convention
  const tagged: Choice[] = normalized.map((c, i) => ({ text: c.text, isCorrect: i === 0 }));
  for (let i = tagged.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tagged[i], tagged[j]] = [tagged[j], tagged[i]];
  }
  return tagged;
}

interface Gap {
  concept: string;
  severity: "low" | "med" | "high";
  evidence: string;
}

interface Resource {
  id: string;
  title: string;
  url: string;
}

interface Props {
  weekTopic: string;
  weekNumber: number;
  activeNodeTitle?: string;
  resources?: Resource[];
}

// ---------- Gap rail ----------
function GapRail({ gaps }: { gaps: Gap[] }) {
  return (
    <div className="w-[300px] shrink-0 border-l border-[--border] bg-[--card] flex flex-col min-h-0 hidden lg:flex">
      <div className="px-6 pt-4 pb-3 border-b border-[--border]">
        <div className="flex items-center gap-2 text-[13px] font-semibold whitespace-nowrap">
          <span className="w-[7px] h-[7px] rounded-full bg-[--emerald] shrink-0 animate-dp-pulse" />
          Gap radar
        </div>
        <p className="text-[11.5px] text-[--muted-foreground] mt-[5px] leading-[1.45]">
          Concepts that wobbled this session. These become the proof at the end.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pt-[14px] pb-4 flex flex-col gap-[10px]">
        {gaps.length === 0 ? (
          <div className="text-[--muted-foreground] text-[12.5px] leading-[1.5] text-center pt-7">
            <div className="text-[oklch(0.32_0_0)] text-[30px] mb-2">◎</div>
            Nothing flagged yet.<br />Answer cleanly and it stays empty.
          </div>
        ) : (
          gaps.map((g, i) => (
            <div key={i} className="border border-[--border] rounded-[10px] p-[11px_12px] bg-[--card-2] animate-dp-pop">
              <div className="flex items-center gap-2">
                <span className={`font-mono text-[9.5px] tracking-[0.06em] uppercase font-semibold px-[6px] py-[2px] rounded-[5px]
                  ${g.severity === "high" ? "text-destructive bg-[color-mix(in_oklab,var(--destructive)_16%,transparent)]"
                  : g.severity === "med" ? "text-[--amber] bg-[color-mix(in_oklab,var(--amber)_16%,transparent)]"
                  : "text-[--muted-foreground] bg-[--muted]"}`}>
                  {g.severity}
                </span>
                <span className="text-[13px] font-medium">{g.concept}</span>
              </div>
              <p className="text-[11.5px] text-[--muted-foreground] mt-[6px] leading-[1.45] pl-[9px] border-l-2 border-[--border]">
                {g.evidence}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------- Analyzing inline ----------
const ANALYZE_STEPS = [
  "Re-reading the transcript",
  "Locating the gaps",
  "Compiling the proof",
];

function AnalyzingInline({ step }: { step: string }) {
  const activeIdx = ANALYZE_STEPS.indexOf(step);

  return (
    <div className="border-t border-[--border] px-4 sm:px-6 py-[14px]">
      <div className="max-w-[760px] mx-auto">
        <div className="bg-[--card] border border-[--border] rounded-[12px] p-[22px_22px_20px] shadow-[var(--shadow-hairline)]">
          <div className="flex items-center gap-[10px] mb-[14px]">
            <div className="w-4 h-4 rounded-full border-2 border-[color-mix(in_oklab,var(--primary)_30%,var(--border))] border-t-primary animate-dp-spin shrink-0" />
            <span className="font-mono text-[10px] tracking-[0.1em] uppercase text-[--muted-foreground]">
              analyzing session
            </span>
          </div>
          <div className="flex flex-col gap-[10px]">
            {ANALYZE_STEPS.map((s, i) => {
              const isDone = activeIdx > i;
              const isActive = activeIdx === i;
              return (
                <div
                  key={s}
                  className={`flex items-center gap-[10px] text-[13px] ${
                    isDone ? "text-[--muted-foreground]" : isActive ? "text-[--foreground]" : "text-[oklch(0.38_0_0)]"
                  }`}
                >
                  {isDone ? (
                    <svg className="w-[14px] h-[14px] shrink-0 text-[--emerald]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg className="w-[14px] h-[14px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  )}
                  {s}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Checklist ----------
function Checklist({ items }: { items: string[] }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  return (
    <div className="px-[22px] pb-[22px] pt-2 flex flex-col gap-0.5">
      {items.map((item, i) => (
        <div
          key={i}
          onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}
          className="flex gap-3 items-start py-[11px] border-b border-[--border] last:border-0 cursor-pointer"
        >
          <div className={`w-5 h-5 rounded-[6px] border-[1.5px] shrink-0 mt-0.5 flex items-center justify-center transition-all duration-150
            ${done[i] ? "bg-[--emerald] border-[--emerald] text-[--background]" : "bg-[--background] border-[--border] text-transparent"}`}>
            <Check size={13} strokeWidth={3} />
          </div>
          <span className={`text-[13px] leading-[1.55] ${done[i] ? "text-[--muted-foreground] line-through" : ""}`}>{item}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- Session complete (PROOF_REDIRECT phase placeholder) ----------
function SessionComplete({ result, weekTopic, weekNumber, onRestart }: {
  result: TutorSessionResult; weekTopic: string; weekNumber: number; onRestart: () => void;
}) {
  const { gaps, projectAssignment } = result;
  const hadGaps = gaps.length > 0;
  const criteria = [projectAssignment.acceptance_criteria[0] ?? projectAssignment.title, ...projectAssignment.acceptance_criteria.slice(1)];

  return (
    <div className="flex-1 overflow-y-auto bg-[--background]">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-[90px] md:pb-20">
        <div className="flex items-center gap-[13px] mb-[26px]">
          <div className="w-[46px] h-[46px] rounded-full shrink-0 flex items-center justify-center text-primary border-[1.5px] animate-dp-stamp"
            style={{ background: "color-mix(in oklab, var(--primary) 14%, transparent)", borderColor: "color-mix(in oklab, var(--primary) 45%, transparent)" }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="font-mono text-[11px] tracking-[0.14em] uppercase text-primary">Session complete</div>
            <div className="text-[13px] text-[--muted-foreground] font-medium mt-0.5 whitespace-nowrap">
              Week {weekNumber} · {weekTopic}
            </div>
          </div>
        </div>

        <p className="text-[19px] leading-[1.5] font-medium mb-2" style={{ letterSpacing: "-0.01em" }}>
          {hadGaps ? (
            <>You can <span className="text-primary">talk</span> about {weekTopic.toLowerCase()}. Here&apos;s the build that turns the wobble into proof.</>
          ) : (
            <>Clean session. Here&apos;s the build that keeps it honest under your own hands.</>
          )}
        </p>

        <div className="border border-[--border] rounded-[14px] bg-[--card] overflow-hidden mt-[22px]">
          <div className="px-[22px] py-5 border-b border-[--border]" style={{ background: "linear-gradient(180deg, var(--card-2), var(--card))" }}>
            <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-[--muted-foreground]">Your proof project</div>
            <div className="text-[19px] font-[650] mt-[7px] mb-2" style={{ letterSpacing: "-0.01em" }}>{projectAssignment.title}</div>
            <p className="text-[13.5px] text-[--muted-foreground] leading-[1.6] m-0">{projectAssignment.description}</p>
          </div>

          {hadGaps && (
            <>
              <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-[--muted-foreground] px-[22px] pt-[18px]">
                Where it wobbled → how you&apos;ll prove it
              </div>
              <div className="px-[22px] pt-[10px] pb-1 flex flex-col gap-[10px]">
                {gaps.slice(0, 2).map((g, i) => (
                  <div key={i} className="flex flex-col sm:grid items-start sm:items-center gap-2 sm:gap-3 animate-dp-rise" style={{ gridTemplateColumns: "1fr auto 1.3fr", animationDelay: `${0.08 * i}s` }}>
                    <div className="flex flex-col gap-1">
                      <span className={`self-start font-mono text-[9.5px] tracking-[0.06em] uppercase font-semibold px-[6px] py-[2px] rounded-[5px]
                        ${g.severity === "high" ? "text-destructive bg-[color-mix(in_oklab,var(--destructive)_16%,transparent)]"
                        : g.severity === "med" ? "text-[--amber] bg-[color-mix(in_oklab,var(--amber)_16%,transparent)]"
                        : "text-[--muted-foreground] bg-[--muted]"}`}>
                        {g.severity}
                      </span>
                      <span className="text-[13px] font-medium">{g.concept}</span>
                    </div>
                    <svg className="hidden sm:block w-4 h-4 text-[--muted-foreground]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    <div className="text-[12.5px] leading-[1.5] pl-[11px] border-l-2 border-primary">
                      {projectAssignment.acceptance_criteria[i] ?? g.evidence}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-[--muted-foreground] px-[22px] pt-[18px]">
            Acceptance criteria — unchecked until proven
          </div>
          <Checklist items={criteria} />
        </div>

        <div className="flex flex-wrap gap-3 mt-[26px] items-center">
          <button
            onClick={onRestart}
            className="bg-transparent border-0 text-[--muted-foreground] text-[13.5px] font-medium px-[6px] py-[11px] whitespace-nowrap hover:text-foreground"
          >
            Run another session
          </button>
          <span className="sm:ml-auto text-[11.5px] text-[--muted-foreground] font-mono whitespace-nowrap">Proof &gt; praise</span>
        </div>
      </div>
    </div>
  );
}

// ---------- PREP phase ----------
function PrepPhase({
  activeNodeTitle,
  resources,
  completedIds,
  onToggle,
  onStart,
  showConfirm,
  onConfirmStart,
  onCancelConfirm,
  isTransitioning,
}: {
  activeNodeTitle?: string;
  resources: Resource[];
  completedIds: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  onStart: () => void;
  showConfirm: boolean;
  onConfirmStart: () => void;
  onCancelConfirm: () => void;
  isTransitioning: boolean;
}) {
  if (isTransitioning) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-3 text-[--muted-foreground]">
          <div className="w-4 h-4 rounded-full border-2 border-[color-mix(in_oklab,var(--primary)_30%,var(--border))] border-t-primary animate-dp-spin shrink-0" />
          <span className="text-[13.5px]">Starting session…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-[80px]">
        {activeNodeTitle && (
          <div className="mb-6">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[--muted-foreground] mb-[6px]">
              Active node
            </div>
            <h2 className="text-[22px] font-[650] leading-[1.25]" style={{ letterSpacing: "-0.01em" }}>
              {activeNodeTitle}
            </h2>
          </div>
        )}

        {resources.length > 0 && (
          <div className="mb-7">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-[--muted-foreground] mb-[10px]">
              Before you start — mark what you&apos;ve reviewed
            </div>
            <div className="flex flex-col gap-[1px] border border-[--border] rounded-[12px] overflow-hidden">
              {resources.map((r, i) => {
                const checked = completedIds.has(r.id);
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-[13px] bg-[--card] transition-colors hover:bg-[--card-2] cursor-pointer
                      ${i < resources.length - 1 ? "border-b border-[--border]" : ""}`}
                    onClick={() => onToggle(r.id, !checked)}
                  >
                    <div
                      className={`w-[18px] h-[18px] rounded-[5px] border-[1.5px] shrink-0 flex items-center justify-center transition-all duration-150
                        ${checked ? "bg-[--emerald] border-[--emerald] text-[--background]" : "bg-[--background] border-[--border] text-transparent"}`}
                    >
                      <Check size={11} strokeWidth={3} />
                    </div>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={`flex-1 text-[13.5px] leading-[1.4] hover:text-primary transition-colors ${checked ? "text-[--muted-foreground] line-through" : ""}`}
                    >
                      {r.title}
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showConfirm ? (
          <div className="border border-[--border] rounded-[12px] bg-[--card] p-[18px_20px] mb-4 animate-dp-rise">
            <p className="text-[13.5px] leading-[1.5] mb-4 text-[--muted-foreground]">
              You haven&apos;t marked any resources as reviewed. Start the session anyway?
            </p>
            <div className="flex gap-3">
              <button
                onClick={onConfirmStart}
                className="px-[16px] py-[8px] rounded-[8px] bg-primary text-primary-foreground text-[13.5px] font-medium hover:brightness-110 transition-all"
              >
                Yes, start
              </button>
              <button
                onClick={onCancelConfirm}
                className="px-[16px] py-[8px] rounded-[8px] border border-[--border] text-[--muted-foreground] text-[13.5px] font-medium hover:text-foreground transition-colors"
              >
                Go back
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onStart}
            className="px-[20px] py-[10px] rounded-[9px] bg-primary text-primary-foreground text-[14px] font-medium hover:brightness-110 transition-all"
          >
            Start session
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Main TutorChat ----------
export function TutorChat({ weekTopic, weekNumber, activeNodeTitle, resources = [] }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [phase, setPhase] = useState<"PREP" | "CHAT" | "ANALYZING" | "PROOF_REDIRECT">("PREP");
  const [analyzeStep, setAnalyzeStep] = useState("");
  const [result, setResult] = useState<TutorSessionResult | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  // clean history only contains {role, content} — no choices — for API calls
  const cleanHistory = useRef<Message[]>([]);
  // stable UUID per session — prevents duplicate DB rows on retry
  const sessionId = useRef(crypto.randomUUID());
  const [showMasteryTooltip, setShowMasteryTooltip] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState<Choice | null>(null);
  // tracks correctness of chip answers only (free-text answers do not contribute)
  const [recentAnswers, setRecentAnswers] = useState<boolean[]>([]);

  // PREP phase state
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (!hasMasteryTooltipBeenSeen()) setShowMasteryTooltip(true);
  }, []);

  // On PREP mount: fetch existing resource completions from Supabase
  useEffect(() => {
    if (phase !== "PREP" || resources.length === 0) return;
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase
        .from("user_resource_completions")
        .select("resource_id")
        .in("resource_id", resources.map((r) => r.id))
        .then(({ data }) => {
          if (data) {
            setCompletedIds(new Set(data.map((row: { resource_id: string }) => row.resource_id)));
          }
        });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollDown = useCallback(() => {
    const el = threadRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, []);

  useEffect(() => { scrollDown(); }, [messages, isSending, phase, scrollDown]);

  // Bootstrap: if no resources, skip PREP and go straight to CHAT
  useEffect(() => {
    if (phase !== "PREP") return;
    if (resources.length === 0) {
      startSession();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForSession() {
    setMessages([]);
    setGaps([]);
    setInput("");
    setResult(null);
    setError(null);
    setRecentAnswers([]);
    cleanHistory.current = [];
    sessionId.current = crypto.randomUUID();
  }

  function startSession() {
    resetForSession();
    setPhase("CHAT");
    fetchAssistant([]);
  }

  function handleStartSessionClick() {
    if (completedIds.size === 0 && resources.length > 0) {
      setShowConfirm(true);
      return;
    }
    doTransitionToChat();
  }

  function doTransitionToChat() {
    setShowConfirm(false);
    setIsTransitioning(true);
    setTimeout(() => {
      setIsTransitioning(false);
      startSession();
    }, 600);
  }

  async function toggleResourceCompletion(id: string, checked: boolean) {
    // Optimistic update
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

    try {
      if (checked) {
        await fetch("/api/resources/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resourceId: id }),
        });
      } else {
        await fetch(`/api/resources/completions/${id}`, { method: "DELETE" });
      }
    } catch {
      // Revert on failure
      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (checked) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  }

  async function fetchAssistant(history: Message[]) {
    setIsSending(true);
    setError(null);
    // Show typing indicator
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: history, weekTopic }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Chat failed");
      }

      const { question, choices: rawChoices } = data as { question: string; choices?: { text: string }[] };
      const assistantMsg: DisplayMessage = {
        role: "assistant",
        content: question,
        choices: rawChoices?.length ? shuffleChoices(rawChoices) : undefined,
      };

      cleanHistory.current = [...history, { role: "assistant", content: question }];
      setMessages((prev) => [...prev.slice(0, -1), assistantMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  }

  async function sendUserMessage(text: string, chipCorrectness?: boolean) {
    if (!text || isSending || phase !== "CHAT") return;
    const userMessage: Message = { role: "user", content: text };
    const nextClean = [...cleanHistory.current, userMessage];
    cleanHistory.current = nextClean;
    // Remove choices from last assistant message (answered), add user message
    setMessages((prev) => {
      const updated = prev.map((m, i) =>
        i === prev.length - 1 && m.role === "assistant" ? { ...m, choices: undefined } : m
      );
      return [...updated, userMessage];
    });
    setInput("");

    // Update chip-answer correctness tracking
    let updatedAnswers = recentAnswers;
    if (chipCorrectness !== undefined) {
      updatedAnswers = [...recentAnswers, chipCorrectness];
      setRecentAnswers(updatedAnswers);
    }

    // Check if session should auto-end after this answer
    const questionCount = nextClean.filter((m) => m.role === "assistant").length;
    if (shouldEndSession(updatedAnswers, questionCount)) {
      await triggerEndSession(nextClean);
      return;
    }

    await fetchAssistant(nextClean);
  }

  async function triggerEndSession(history: Message[]) {
    setPhase("ANALYZING");
    setAnalyzeStep(ANALYZE_STEPS[0]);

    // Show analyzing overlay by briefly toggling analyzeStep through the steps
    const runSteps = async () => {
      for (const step of ANALYZE_STEPS) {
        setAnalyzeStep(step);
        await new Promise((r) => setTimeout(r, 620));
      }
    };

    try {
      const [res] = await Promise.all([
        fetch("/api/tutor/close-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationHistory: history, weekTopic, sessionId: sessionId.current }),
        }).then(async (r) => ({ ok: r.ok, data: await r.json() })),
        runSteps(),
      ]);

      if (!res.ok) {
        setError(res.data.error ?? "Couldn't generate your project — try again");
        return;
      }

      if (res.data.gaps) setGaps(res.data.gaps);
      setResult(res.data);
      setPhase("PROOF_REDIRECT");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setPhase("CHAT");
      setIsSending(false);
    } finally {
      setAnalyzeStep("");
    }
  }

  async function endSession() {
    if (isSending || phase !== "CHAT") return;
    const userTurns = cleanHistory.current.filter((m) => m.role === "user");
    if (userTurns.length < 1) { setError("Have at least one exchange before ending."); return; }
    await triggerEndSession(cleanHistory.current);
  }

  const questionCount = messages.filter((m) => m.role === "assistant" && m.content).length;
  const hasUserTurn = messages.some((m) => m.role === "user");
  const canEnd = hasUserTurn && phase === "CHAT" && !isSending;

  // Chips: only on the last assistant message when in CHAT and not sending
  const lastMsg = messages[messages.length - 1];
  const activeChoices =
    !isSending && phase === "CHAT" && lastMsg?.role === "assistant" && lastMsg.choices
      ? lastMsg.choices
      : null;

  const showAnalyzing = phase === "ANALYZING";

  // PREP phase
  if (phase === "PREP") {
    return (
      <div className="flex flex-1 min-h-0">
        <PrepPhase
          activeNodeTitle={activeNodeTitle}
          resources={resources}
          completedIds={completedIds}
          onToggle={toggleResourceCompletion}
          onStart={handleStartSessionClick}
          showConfirm={showConfirm}
          onConfirmStart={doTransitionToChat}
          onCancelConfirm={() => setShowConfirm(false)}
          isTransitioning={isTransitioning}
        />
      </div>
    );
  }

  // TODO: redirect to /proof/[sessionId] (Task #24)
  if (phase === "PROOF_REDIRECT" && result) {
    return (
      <div className="flex flex-1 min-h-0">
        <SessionComplete result={result} weekTopic={weekTopic} weekNumber={weekNumber} onRestart={() => setPhase("PREP")} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* Chat column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Week banner */}
        <div className="flex items-start gap-2 px-4 sm:px-6 py-[9px] text-primary text-[12px] border-b"
          style={{ background: "color-mix(in oklab, var(--primary) 6%, transparent)", borderColor: "color-mix(in oklab, var(--primary) 14%, transparent)" }}>
          <Zap size={13} className="shrink-0 mt-[1px]" />
          <span>
            {questionCount > 0 && <b className="mr-1">Q{questionCount} · </b>}
            <b>Week {weekNumber} — {weekTopic}.</b>
            {questionCount === 0 && " No formulas first. I want to hear how you actually think about it."}
          </span>
        </div>

        {/* Thread */}
        <div ref={threadRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-[760px] w-full mx-auto flex flex-col gap-[14px]">
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`flex animate-dp-rise ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" ? (
                  <div className="max-w-[85%]">
                    <div className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-[--muted-foreground] mb-[5px]">MENTOR · asks, doesn&apos;t answer</div>
                    <div className="rounded-[12px] rounded-bl-[3px] px-[14px] py-[12px] text-[13.5px] leading-[1.55] whitespace-pre-wrap break-words bg-[--card] border border-[--border] text-[oklch(0.82_0_0)]">
                      {m.content || (isSending && i === messages.length - 1 ? (
                        <span className="inline-flex gap-1 items-center py-0.5">
                          {[0, 1, 2].map((k) => (
                            <span key={k} className="w-[5px] h-[5px] rounded-full bg-[--muted-foreground] animate-dp-blink"
                              style={{ animationDelay: `${k * 0.2}s` }} />
                          ))}
                        </span>
                      ) : "")}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[85%]">
                    <div className="font-mono text-[9.5px] tracking-[0.08em] uppercase text-[--muted-foreground] mb-[5px] text-right">You</div>
                    <div className="rounded-[12px] rounded-br-[3px] px-[14px] py-[12px] text-[13.5px] leading-[1.55] whitespace-pre-wrap break-words bg-[color-mix(in_oklab,var(--primary)_10%,var(--card))] border border-[color-mix(in_oklab,var(--primary)_20%,var(--border))]">
                      {m.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 sm:px-6 pb-2 flex items-center gap-3 max-w-[760px] mx-auto w-full">
            <p className="text-sm text-destructive flex-1">{error}</p>
            {phase === "CHAT" && !isSending && cleanHistory.current.length > 0 && (
              <button onClick={() => fetchAssistant(cleanHistory.current)} className="text-xs text-[--muted-foreground] underline underline-offset-2 shrink-0 flex items-center gap-1">
                <RefreshCw size={11} /> retry
              </button>
            )}
          </div>
        )}

        {/* Analyzing inline state */}
        {showAnalyzing && <AnalyzingInline step={analyzeStep} />}

        {/* Composer */}
        {phase === "CHAT" && (
          <div className="border-t border-[--border] px-4 sm:px-6 py-[14px]">
            <div className="max-w-[760px] mx-auto flex flex-col gap-[10px]">
              {/* Answer chips */}
              {activeChoices && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-[--muted-foreground] font-mono tracking-[0.04em] uppercase">
                    Pick the answer closest to how you&apos;d put it
                  </p>
                  <div className="flex flex-col gap-[7px]">
                    {activeChoices.map((c, i) => {
                      const isPicked = pendingAnswer?.text === c.text;
                      const isRevealing = pendingAnswer !== null;
                      let stateClass = "border-[--border] bg-[--card] text-foreground hover:border-primary hover:bg-[color-mix(in_oklab,var(--primary)_5%,transparent)] active:scale-[0.99]";
                      if (isRevealing) {
                        if (c.isCorrect) {
                          stateClass = "border-emerald-500 bg-[color-mix(in_oklab,var(--emerald)_10%,transparent)] text-[--emerald]";
                        } else if (isPicked) {
                          stateClass = "border-amber-500 bg-[color-mix(in_oklab,var(--amber)_10%,transparent)] text-[--amber]";
                        } else {
                          stateClass = "border-[--border] bg-[--card] text-foreground opacity-40";
                        }
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (isRevealing || isSending) return;
                            setPendingAnswer(c);
                            setTimeout(() => {
                              setPendingAnswer(null);
                              sendUserMessage(c.text, c.isCorrect);
                            }, 1500);
                          }}
                          disabled={isRevealing || isSending}
                          className={`w-full text-left flex items-start gap-[10px] px-[13px] py-[10px] rounded-[9px] border text-[13.5px] leading-[1.5] transition-colors ${stateClass}`}
                        >
                          <span className="font-mono text-[11px] font-semibold tracking-[0.06em] shrink-0 mt-[2px] w-[16px] text-[--muted-foreground]">
                            {isRevealing && c.isCorrect ? "✓" : isRevealing && isPicked && !c.isCorrect ? "✗" : String.fromCharCode(65 + i)}
                          </span>
                          <span>{c.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Text input row */}
              <div className="flex flex-col gap-[8px]">
                <div className="flex gap-[9px] items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendUserMessage(input.trim()); } }}
                    disabled={isSending}
                    placeholder={activeChoices ? "…or type your own answer" : "Type your answer…"}
                    className="flex-1 min-w-0 bg-[--background] border border-[--input] text-foreground rounded-[8px] px-[13px] py-[9px] text-[14px] outline-none transition-[border-color,box-shadow] placeholder:text-[--muted-foreground] focus:border-primary focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_18%,transparent)] disabled:opacity-50"
                  />
                  <button
                    onClick={() => sendUserMessage(input.trim())}
                    disabled={!input.trim() || isSending}
                    className="shrink-0 inline-flex items-center justify-center gap-[7px] bg-primary text-primary-foreground border-0 rounded-[8px] px-[15px] py-[9px] text-[14px] font-medium transition-[filter,opacity] hover:brightness-110 disabled:opacity-45"
                  >
                    <Send size={15} /><span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                <div className="flex flex-col gap-[6px]">
                  <button
                    onClick={() => { setShowMasteryTooltip(false); markMasteryTooltipSeen(); endSession(); }}
                    disabled={!canEnd}
                    className="self-start bg-transparent border border-[--border] text-[--muted-foreground] rounded-[8px] px-[14px] py-[9px] text-[13px] font-medium whitespace-nowrap inline-flex items-center gap-[7px] transition-[color,border-color] hover:text-foreground hover:border-[color-mix(in_oklab,var(--primary)_50%,var(--border))] disabled:opacity-45"
                  >
                    <Flag size={14} />I think I get it
                  </button>
                  {showMasteryTooltip && (
                    <div className="text-[12px] text-[--muted-foreground] leading-[1.5] max-w-[280px]">
                      Tap when you feel confident about the concept. The tutor will move to the next one.{" "}
                      <button
                        onClick={() => { markMasteryTooltipSeen(); setShowMasteryTooltip(false); }}
                        className="text-primary text-[11px] font-medium hover:underline"
                      >
                        Got it
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gap rail */}
      <GapRail gaps={gaps} />
    </div>
  );
}
