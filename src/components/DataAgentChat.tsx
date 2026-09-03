"use client";

import { useEffect, useRef, useState } from "react";

import { askDataAgentAction } from "@/app/data-agents/actions";

/**
 * Chat surface for one Fabric data agent.
 *
 * First-party rather than a vendor widget: Fabric data agents ship no drop-in
 * web chat, they expose an MCP endpoint (CLAUDE.md §5 Tab 3).
 *
 * The transcript lives in component state for the length of the visit and is
 * never persisted. These questions can name communities, residents and
 * incidents, so keeping them out of any store is deliberate — and each call to
 * the agent is independent, so nothing is retained on the Fabric side either.
 */

type Turn =
  | { role: "user"; text: string }
  | { role: "agent"; text: string }
  | { role: "error"; text: string };

export function DataAgentChat({
  agentId,
  agentName,
  suggestions,
}: {
  agentId: string;
  agentName: string;
  suggestions: string[];
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const endRef = useRef<HTMLLIElement>(null);

  /*
   * A data agent can take minutes: it plans the question, writes SQL, runs it,
   * then summarises. A static "working…" for that long reads as a hang, so show
   * the clock — it is the difference between waiting and wondering.
   */
  useEffect(() => {
    if (!pending) return;
    const started = Date.now();
    const id = setInterval(
      () => setElapsed(Math.round((Date.now() - started) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [pending]);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    // Snapshot before appending: the agent needs what came *before* this
    // question. Error turns are excluded — they are our messages, not the
    // conversation.
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
    requestAnimationFrame(() =>
      endRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  return (
    <div className="card flex h-[68vh] flex-col overflow-hidden rounded-xl">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {turns.length === 0 ? (
          <div className="mx-auto max-w-lg pt-8 text-center">
            <p className="text-sm text-ink-muted">
              Ask {agentName} a question about your data.
            </p>
            {suggestions.length > 0 ? (
              <ul className="mt-5 flex flex-col gap-2">
                {suggestions.map((suggestion) => (
                  <li key={suggestion}>
                    <button
                      type="button"
                      onClick={() => ask(suggestion)}
                      className="w-full rounded-lg border border-hairline bg-surface-raised px-4 py-2.5 text-left text-sm text-ink-muted transition-colors hover:border-peak-300 hover:text-ink"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <ul className="mx-auto flex max-w-3xl flex-col gap-5">
            {turns.map((turn, i) => (
              <li
                key={`${turn.role}-${i}`}
                className={turn.role === "user" ? "flex justify-end" : ""}
              >
                {turn.role === "user" ? (
                  <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-peak-600 px-4 py-2.5 text-sm leading-relaxed text-white">
                    {turn.text}
                  </p>
                ) : turn.role === "agent" ? (
                  <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-surface-sunken px-4 py-3 text-sm leading-relaxed text-ink">
                    {turn.text}
                  </p>
                ) : (
                  <p className="max-w-[85%] rounded-2xl rounded-bl-sm border border-caution-border bg-surface px-4 py-3 text-sm leading-relaxed text-ink-muted">
                    {turn.text}
                  </p>
                )}
              </li>
            ))}
            {pending ? (
              <li className="flex items-center gap-2 text-sm text-ink-subtle">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-peak-400"
                />
                {agentName} is working through your data…
                {elapsed >= 5 ? ` ${elapsed}s` : ""}
                {elapsed >= 45 ? " — complex questions can take a few minutes." : ""}
              </li>
            ) : null}
            <li ref={endRef} />
          </ul>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
        className="flex items-end gap-3 border-t border-hairline bg-surface-raised px-6 py-4"
      >
        <label htmlFor="question" className="sr-only">
          Your question
        </label>
        <textarea
          id="question"
          rows={1}
          value={question}
          disabled={pending}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void ask(question);
            }
          }}
          placeholder={`Ask ${agentName}…`}
          className="max-h-40 min-h-[42px] flex-1 resize-y rounded-lg border border-hairline bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-subtle focus:border-peak-600 focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || !question.trim()}
          className="rounded-lg bg-peak-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-peak-700 disabled:opacity-40"
        >
          {pending ? "Asking…" : "Ask"}
        </button>
      </form>
    </div>
  );
}
