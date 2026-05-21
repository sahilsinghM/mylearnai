"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Message, TutorSessionResult } from "@/types/tutor";

interface Props {
  weekTopic: string;
  weekNumber: number;
}

export function TutorChat({ weekTopic, weekNumber }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [result, setResult] = useState<TutorSessionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const didBootstrap = useRef(false);
  // Only fully-completed turns — used for API calls to avoid sending partial state
  const cleanHistory = useRef<Message[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Ask the mentor to open the session with their first question
  useEffect(() => {
    if (didBootstrap.current) return;
    didBootstrap.current = true;
    streamAssistant(cleanHistory.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function streamAssistant(history: Message[]) {
    setIsSending(true);
    setError(null);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...history, assistantMessage]);

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: history }),
      });

      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const chunk = line.slice(6);
          // Check for JSON error sentinel. SyntaxError means it's a normal text chunk.
          try {
            const evt = JSON.parse(chunk);
            if (evt?.error === true) {
              const msg = evt.code === "rate_limited"
                ? "Rate limit reached — try again in an hour"
                : evt.code === "no_active_plan"
                ? "No active plan found — generate your plan first"
                : "Session interrupted — try again";
              throw new Error(msg);
            }
          } catch (e) {
            if (!(e instanceof SyntaxError)) throw e;
          }
          accumulated += chunk.replace(/\\n/g, "\n");
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: accumulated };
            return updated;
          });
        }
      }

      if (!accumulated) throw new Error("Empty response from mentor");

      // Commit completed assistant turn to clean history — outside setState to avoid StrictMode double-invoke
      const completedMsg: Message = { role: "assistant", content: accumulated };
      cleanHistory.current = [...cleanHistory.current, completedMsg];
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      // Remove the incomplete assistant bubble; clean history is unaffected
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isSending || isEnding || result) return;

    const userMessage: Message = { role: "user", content: text };
    const nextClean = [...cleanHistory.current, userMessage];
    cleanHistory.current = nextClean;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    await streamAssistant(nextClean);
  }

  async function endSession() {
    if (isEnding || isSending || result) return;

    const userTurns = cleanHistory.current.filter((m) => m.role === "user");
    if (userTurns.length < 1) {
      setError("Have at least one exchange before ending the session.");
      return;
    }

    setIsEnding(true);
    setError(null);

    try {
      const res = await fetch("/api/tutor/close-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: cleanHistory.current }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't generate your project — try again");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't generate your project — try again");
    } finally {
      setIsEnding(false);
    }
  }

  const sessionDone = !!result;

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      {/* Message thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {m.content || (isSending && i === messages.length - 1 ? "▋" : "")}
            </div>
          </div>
        ))}

        {/* Project assignment card */}
        {result && (
          <div className="border border-border rounded-lg p-5 space-y-3 bg-card mt-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your project</p>
              <h2 className="text-base font-semibold">{result.projectAssignment.title}</h2>
              <p className="text-sm text-muted-foreground">{result.projectAssignment.description}</p>
            </div>
            {result.projectAssignment.acceptance_criteria.length > 0 && (
              <div className="border-t border-border pt-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Proof criteria</p>
                {result.projectAssignment.acceptance_criteria.map((c, i) => (
                  <p key={i} className="text-sm flex gap-2">
                    <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                    {c}
                  </p>
                ))}
              </div>
            )}
            {result.gaps.length > 0 && (
              <div className="space-y-1 border-t border-border pt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gaps identified</p>
                {result.gaps.map((g, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${
                      g.severity === "high" ? "bg-destructive/10 text-destructive" :
                      g.severity === "med" ? "bg-orange-100 text-orange-700" :
                      "bg-muted text-muted-foreground"
                    }`}>{g.severity}</span>
                    <span>{g.concept}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-border pt-3 flex gap-3">
              <Link
                href="/plan"
                className="text-sm text-primary underline underline-offset-2"
              >
                Back to plan
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Dashboard
              </Link>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error + retry */}
      {error && (
        <div className="px-6 pb-2 flex items-center gap-3">
          <p className="text-sm text-destructive flex-1">{error}</p>
          {!sessionDone && !isSending && cleanHistory.current.length > 0 && (
            <button
              onClick={() => streamAssistant(cleanHistory.current)}
              className="text-xs text-muted-foreground underline underline-offset-2 shrink-0"
            >
              retry
            </button>
          )}
        </div>
      )}

      {/* Input area */}
      {!sessionDone && (
        <div className="border-t border-border px-6 py-4 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            disabled={isSending || isEnding}
            placeholder="Your answer..."
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isSending || isEnding}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            Send
          </button>
          <button
            onClick={endSession}
            disabled={isEnding || isSending}
            className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {isEnding ? "Analyzing..." : "End Session"}
          </button>
        </div>
      )}
    </div>
  );
}
