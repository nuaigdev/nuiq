"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Square } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

import { cn } from "@/lib/cn";

import { useChat } from "./chat-store";

/** One line to start, six before it scrolls internally. */
const MAX_INPUT_HEIGHT = 148;

export function Composer({ suggestions }: { suggestions: string[] }) {
  const {
    agentName,
    draft,
    setDraft,
    ask,
    interrupt,
    applySuggestion,
    pending,
    revealingId,
    turns,
    registerInput,
  } = useChat();

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = pending || Boolean(revealingId);
  const armed = draft.trim().length > 0;

  const attach = useCallback(
    (el: HTMLTextAreaElement | null) => {
      inputRef.current = el;
      registerInput(el);
    },
    [registerInput],
  );

  // Grow with the question. Reset first, or the box can only ever get taller.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT)}px`;
  }, [draft]);

  const submit = useCallback(() => {
    if (!armed || busy) return;
    ask(draft);
  }, [armed, busy, ask, draft]);

  return (
    <div className="shrink-0 border-t border-canvas-line bg-surface px-4 pb-4 pt-3 sm:px-5">
      {/*
       * Openers, only while there is nothing to read yet. Once someone has
       * asked their own question these have done their job, and bringing them
       * back would be telling an experienced user what to say.
       */}
      <AnimatePresence initial={false}>
        {turns.length === 0 ? (
          <motion.ul
            key="chips"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-wrap gap-1.5 overflow-hidden pb-3"
          >
            {suggestions.slice(0, 4).map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="rounded-full border border-canvas-line bg-canvas-raised px-3 py-1.5 text-left text-[12.5px] leading-snug text-ink-muted transition-colors hover:border-peak-300 hover:bg-peak-50 hover:text-peak-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <div
          className={cn(
            "flex items-end gap-2 rounded-2xl border bg-canvas-raised px-2 py-2 transition-[border-color,box-shadow] duration-150",
            "border-canvas-line",
            "focus-within:border-peak-400 focus-within:bg-surface focus-within:shadow-[0_0_0_3px_rgba(59,116,240,0.13)]",
          )}
        >
          <label htmlFor="agent-question" className="sr-only">
            Your question for {agentName}
          </label>
          <textarea
            id="agent-question"
            ref={attach}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder={`Ask ${agentName}…`}
            className="min-h-[24px] flex-1 resize-none bg-transparent px-2 py-1 text-[14.5px] leading-[1.55] text-ink placeholder:text-ink-subtle focus:outline-none"
            style={{ maxHeight: MAX_INPUT_HEIGHT }}
          />

          {busy ? (
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={interrupt}
              title={
                pending
                  ? "Stop waiting. The question keeps running in Fabric."
                  : "Show the rest of the answer"
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-canvas-line bg-surface text-ink-muted transition-colors hover:border-peak-300 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
            >
              <Square aria-hidden className="h-3.5 w-3.5 fill-current" />
              <span className="sr-only">
                {pending ? "Stop waiting" : "Show the rest of the answer"}
              </span>
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              disabled={!armed}
              whileTap={armed ? { scale: 0.92 } : undefined}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500",
                armed
                  ? "bg-peak-600 text-white hover:bg-peak-700"
                  : "bg-canvas-line text-ink-subtle",
              )}
            >
              <ArrowUp aria-hidden className="h-4 w-4" strokeWidth={2.4} />
              <span className="sr-only">Ask</span>
            </motion.button>
          )}
        </div>
      </form>

      <p className="mt-2 pr-1 text-right text-[11px] text-ink-subtle">
        <kbd className="font-sans font-medium">Enter</kbd> to send ·{" "}
        <kbd className="font-sans font-medium">Shift</kbd> +{" "}
        <kbd className="font-sans font-medium">Enter</kbd> for a new line
      </p>
    </div>
  );
}
