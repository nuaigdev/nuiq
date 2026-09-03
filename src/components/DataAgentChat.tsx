"use client";

import { useEffect, useRef, useState } from "react";

import { askDataAgentAction } from "@/app/data-agents/actions";
import { AgentFlowPanel } from "./AgentFlowPanel";
import { MarkdownAnswer } from "./MarkdownAnswer";

/**
 * The data agent workspace: conversation on one side, context on the other.
 *
 * First-party rather than a vendor widget — Fabric data agents ship no drop-in
 * web chat, they expose an MCP endpoint (CLAUDE.md §5 Tab 3).
 *
 * The transcript lives in component state for the length of the visit and is
 * never persisted. These questions can name communities, residents and
 * incidents, so keeping them out of any store is deliberate.
 */

type Turn =
  | { role: "user"; text: string }
  | { role: "agent"; text: string }
  | { role: "error"; text: string };

/**
 * What to say while waiting. A data agent takes a while, and naming the stage
 * it is plausibly at reads as progress rather than a hang. These are estimates
 * by design — the endpoint reports no real progress.
 */
const WAIT_STAGES = [
  { after: 0, label: "Reading your question" },
  { after: 6, label: "Planning a query over your data" },
  { after: 18, label: "Querying the warehouse" },
  { after: 40, label: "Still working — larger questions take longer" },
  { after: 90, label: "Assembling the answer" },
];

function stageFor(seconds: number): string {
  let label = WAIT_STAGES[0].label;
  for (const stage of WAIT_STAGES) {
    if (seconds >= stage.after) label = stage.label;
  }
  return label;
}

function Thinking({ seconds }: { seconds: number }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-peak-600/10">
        <span className="flex gap-[3px]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1 w-1 animate-bounce rounded-full bg-peak-500"
              style={{ animationDelay: `${i * 140}ms`, animationDuration: "1s" }}
            />
          ))}
        </span>
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[13px] text-ink-muted">{stageFor(seconds)}</p>
        <p className="mt-1 font-mono text-[11px] text-ink-subtle">{seconds}s</p>
      </div>
    </div>
  );
}

export function DataAgentChat({
  agentId,
  agentName,
  description,
  suggestions,
}: {
  agentId: string;
  agentName: string;
  description?: string;
  suggestions: string[];
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!pending) return;
    const started = Date.now();
    const id = setInterval(
      () => setElapsed(Math.round((Date.now() - started) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [pending]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, pending]);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    // Snapshot before appending: the agent needs what came *before* this
    // question. Error turns are ours, not part of the conversation.
    const history = turns
      .filter((turn) => turn.role !== "error")
      .map((turn) => ({ role: turn.role as "user" | "agent", text: turn.text }));

    setTurns((prev) => [...prev, { role: "user", text: trimmed }]);
    setQuestion("");
    setElapsed(0);
    setPending(true);

    const result = await askDataAgentAction(agentId, trimmed, history);

    setTurns((prev) => [
      ...prev,
      result.answer
        ? { role: "agent", text: result.answer }
        : { role: "error", text: result.error ?? "Something went wrong." },
    ]);
    setPending(false);
    inputRef.current?.focus();
  }

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-2">
      <section className="card flex h-[70vh] min-h-[520px] flex-col overflow-hidden rounded-2xl">
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {turns.length === 0 && !pending ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <span
                aria-hidden
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-peak-50 text-lg text-peak-600"
              >
                &#8253;
              </span>
              <p className="mt-4 text-sm font-medium text-ink">
                Ask {agentName} about your data
              </p>
              <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-ink-muted">
                Plain language works best. Pick one of the examples alongside, or
                type your own question below.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {turns.map((turn, i) =>
                turn.role === "user" ? (
                  <div key={i} className="flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-md bg-peak-600 px-4 py-2.5 text-[14px] leading-relaxed text-white">
                      {turn.text}
                    </p>
                  </div>
                ) : turn.role === "agent" ? (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-peak-600/10 text-[11px] font-semibold text-peak-700"
                    >
                      {agentName.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <MarkdownAnswer>{turn.text}</MarkdownAnswer>
                    </div>
                  </div>
                ) : (
                  <div
                    key={i}
                    className="rounded-xl border border-caution-border bg-surface-raised px-4 py-3 text-[13px] leading-relaxed text-ink-muted"
                  >
                    {turn.text}
                  </div>
                ),
              )}
              {pending ? <Thinking seconds={elapsed} /> : null}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void ask(question);
          }}
          className="border-t border-hairline bg-surface-raised p-3"
        >
          <div className="flex items-end gap-2 rounded-xl border border-hairline bg-surface p-2 transition-colors focus-within:border-peak-500">
            <label htmlFor="question" className="sr-only">
              Your question
            </label>
            <textarea
              id="question"
              ref={inputRef}
              rows={1}
              value={question}
              disabled={pending}
              onChange={(event) => {
                setQuestion(event.target.value);
                // Grow with the question, up to a point.
                event.target.style.height = "auto";
                event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void ask(question);
                }
              }}
              placeholder={`Ask ${agentName}…`}
              className="max-h-[140px] min-h-[38px] flex-1 resize-none bg-transparent px-2 py-2 text-[14px] leading-relaxed text-ink placeholder:text-ink-subtle focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={pending || !question.trim()}
              aria-label="Ask"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-peak-600 text-white transition-colors hover:bg-peak-700 disabled:opacity-30"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden>
                <path
                  d="M3 10h12M10 5l5 5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px] text-ink-subtle">
            Enter to send · Shift + Enter for a new line
          </p>
        </form>
      </section>

      <AgentFlowPanel
        agentName={agentName}
        description={description}
        suggestions={suggestions}
        onAsk={ask}
        busy={pending}
      />
    </div>
  );
}
