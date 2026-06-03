"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Zap, Send, Flag, Check, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import type { Message, TutorSessionResult } from "@/types/tutor";
import { hasMasteryTooltipBeenSeen, markMasteryTooltipSeen } from "@/lib/tutor/masteryTooltip";

interface Choice {
  text: string;
}

interface DisplayMessage extends Message {
  choices?: Choice[];
}

interface Gap {
  concept: string;
  severity: "low" | "med" | "high";
  evidence: string;
}

interface Props {
  weekTopic: string;
  weekNumber: number;
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

// ---------- Analyzing overlay ----------
function AnalyzingOverlay({ step }: { step: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-30" style={{ background: "color-mix(in oklab, var(--background) 80%, transparent)", backdropFilter: "blur(6px)" }}>
      <div className="text-center">
        <div className="w-[54px] h-[54px] rounded-full border-2 border-[--border] border-t-primary mx-auto mb-4 animate-dp-spin" />
        <div className="text-[14px] font-semibold">Analysing your session</div>
        <div className="text-[12px] text-[--muted-foreground] mt-[6px] font-mono min-h-4">{step}</div>
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

// ---------- Proof reveal ----------
function ProofReveal({ result, weekTopic, weekNumber, onRestart }: {
  result: TutorSessionResult; weekTopic: string; weekNumber: number; onRestart: () => void;
}) {
  const { gaps, projectAssignment } = result;
  const hadGaps = gaps.length > 0;
  const criteria = [projectAssignment.acceptance_criteria[0] ?? projectAssignment.title, ...projectAssignment.acceptance_criteria.slice(1)];

  return (
    <div className="fixed inset-0 overflow-y-auto bg-[--background] z-[60] animate-dp-rev-up">
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
                    <ArrowRight size={16} className="hidden sm:block text-[--muted-foreground]" />
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
          <Link
            href="/proof"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground border-0 rounded-[9px] px-[18px] py-[11px] text-[14px] font-semibold whitespace-nowrap hover:brightness-110 transition-[filter]"
          >
            Start building <ArrowRight size={16} />
          </Link>
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

// ---------- Main TutorChat ----------
export function TutorChat({ weekTopic, weekNumber }: Props) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [phase, setPhase] = useState<"chatting" | "analyzing" | "revealed">("chatting");
  const [analyzeStep, setAnalyzeStep] = useState("");
  const [result, setResult] = useState<TutorSessionResult | null>(null);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  // clean history only contains {role, content} — no choices — for API calls
  const cleanHistory = useRef<Message[]>([]);
  const didBootstrap = useRef(false);
  // stable UUID per session — prevents duplicate DB rows on retry
  const sessionId = useRef(crypto.randomUUID());
  const [showMasteryTooltip, setShowMasteryTooltip] = useState(false);

  useEffect(() => {
    if (!hasMasteryTooltipBeenSeen()) setShowMasteryTooltip(true);
  }, []);

  const scrollDown = useCallback(() => {
    const el = threadRef.current;
    if (el) requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, []);

  useEffect(() => { scrollDown(); }, [messages, isSending, phase, scrollDown]);

  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    fetchAssistant(cleanHistory.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      const { question, choices } = data as { question: string; choices?: Choice[] };
      const assistantMsg: DisplayMessage = {
        role: "assistant",
        content: question,
        choices: choices?.length ? choices : undefined,
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

  async function sendUserMessage(text: string) {
    if (!text || isSending || phase !== "chatting") return;
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
    await fetchAssistant(nextClean);
  }

  async function endSession() {
    if (isSending || phase !== "chatting") return;
    const userTurns = cleanHistory.current.filter((m) => m.role === "user");
    if (userTurns.length < 1) { setError("Have at least one exchange before ending."); return; }

    setPhase("analyzing");
    const analyzeSteps = ["Re-reading the transcript…", "Locating the gaps…", "Compiling the proof…"];
    for (const step of analyzeSteps) {
      setAnalyzeStep(step);
      await new Promise((r) => setTimeout(r, 620));
    }

    try {
      const res = await fetch("/api/tutor/close-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: cleanHistory.current, weekTopic, sessionId: sessionId.current }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't generate your project — try again");

      if (data.gaps) setGaps(data.gaps);
      setResult(data);
      setPhase("revealed");
    } catch (err) {
      setPhase("chatting");
      setError(err instanceof Error ? err.message : "Couldn't generate your project — try again");
    }
  }

  function restart() {
    setMessages([]); setGaps([]); setInput(""); setResult(null); setError(null);
    setPhase("chatting"); cleanHistory.current = []; didBootstrap.current = false;
    sessionId.current = crypto.randomUUID();
    setTimeout(() => { didBootstrap.current = true; fetchAssistant([]); }, 60);
  }

  const canEnd = messages.some((m) => m.role === "user") && phase === "chatting" && !isSending;

  // Chips: only on the last assistant message when chatting and not sending
  const lastMsg = messages[messages.length - 1];
  const activeChoices =
    !isSending && phase === "chatting" && lastMsg?.role === "assistant" && lastMsg.choices
      ? lastMsg.choices
      : null;

  return (
    <div className="flex flex-1 min-h-0 relative">
      {/* Chat column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Week banner */}
        <div className="flex items-start gap-2 px-4 sm:px-6 py-[9px] text-primary text-[12px] border-b"
          style={{ background: "color-mix(in oklab, var(--primary) 6%, transparent)", borderColor: "color-mix(in oklab, var(--primary) 14%, transparent)" }}>
          <Zap size={13} className="shrink-0 mt-[1px]" />
          <span><b>Week {weekNumber} — {weekTopic}.</b> No formulas first. I want to hear how you actually think about it.</span>
        </div>

        {/* Thread */}
        <div ref={threadRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-[760px] w-full mx-auto flex flex-col gap-[14px]">
            {messages.map((m, i) => (
              <div key={`${m.role}-${i}`} className={`flex animate-dp-rise ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" ? (
                  <div className="max-w-[80%]">
                    <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-[--muted-foreground] mb-1">Mentor</div>
                    <div className="rounded-[12px] rounded-bl-[4px] px-[15px] py-[11px] text-[14px] leading-[1.55] whitespace-pre-wrap break-words bg-[--muted] border border-[--border]">
                      {m.content || (isSending && i === messages.length - 1 ? (
                        <span className="inline-flex gap-1 items-center py-0.5">
                          {[0, 1, 2].map((k) => (
                            <span key={k} className="w-[6px] h-[6px] rounded-full bg-[--muted-foreground] opacity-50 animate-dp-blink"
                              style={{ animationDelay: `${k * 0.2}s` }} />
                          ))}
                        </span>
                      ) : "")}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[80%] rounded-[12px] rounded-br-[4px] px-[15px] py-[11px] text-[14px] leading-[1.55] whitespace-pre-wrap break-words bg-primary text-primary-foreground">
                    {m.content}
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
            {phase === "chatting" && !isSending && cleanHistory.current.length > 0 && (
              <button onClick={() => fetchAssistant(cleanHistory.current)} className="text-xs text-[--muted-foreground] underline underline-offset-2 shrink-0 flex items-center gap-1">
                <RefreshCw size={11} /> retry
              </button>
            )}
          </div>
        )}

        {/* Composer */}
        {phase === "chatting" && (
          <div className="border-t border-[--border] px-4 sm:px-6 py-[14px]">
            <div className="max-w-[760px] mx-auto flex flex-col gap-[10px]">
              {/* Answer chips */}
              {activeChoices && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] text-[--muted-foreground] font-mono tracking-[0.04em] uppercase">
                    Pick the answer closest to how you&apos;d put it
                  </p>
                  <div className="flex flex-col gap-[7px]">
                    {activeChoices.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => sendUserMessage(c.text)}
                        className="w-full text-left flex items-start gap-[10px] px-[13px] py-[10px] rounded-[9px] border border-[--border] bg-[--card] text-[13.5px] leading-[1.5] text-foreground transition-colors hover:border-primary hover:bg-[color-mix(in_oklab,var(--primary)_5%,transparent)] active:scale-[0.99]"
                      >
                        <span className="font-mono text-[11px] font-semibold tracking-[0.06em] text-[--muted-foreground] shrink-0 mt-[2px] w-[16px]">
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{c.text}</span>
                      </button>
                    ))}
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
      {phase !== "revealed" && <GapRail gaps={gaps} />}

      {/* Analyzing overlay */}
      {phase === "analyzing" && <AnalyzingOverlay step={analyzeStep} />}

      {/* Proof reveal */}
      {phase === "revealed" && result && (
        <ProofReveal result={result} weekTopic={weekTopic} weekNumber={weekNumber} onRestart={restart} />
      )}
    </div>
  );
}
