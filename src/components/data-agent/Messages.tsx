"use client";

import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { useCallback } from "react";

import { cn } from "@/lib/cn";

import { AgentGlyph } from "./AgentGlyph";
import { AnswerMarkdown } from "./AnswerMarkdown";
import { useChat } from "./chat-store";
import { useProgressiveReveal, type PendingBlock } from "./useProgressiveReveal";

/** New turns arrive rather than appear. Short, flat, no bounce. */
const enter = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] as const },
};

/**
 * What to say while waiting.
 *
 * A data agent takes a while — it plans, writes SQL, queries the warehouse and
 * summarises — and naming the stage it is plausibly at reads as progress rather
 * than a hang. These are estimates by design: the endpoint reports no real
 * progress, so the wording never claims to know more than it does.
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

export function WaitingIndicator({
  seed,
  seconds,
}: {
  seed: string;
  seconds: number;
}) {
  return (
    <motion.div {...enter} className="flex items-start gap-3">
      <AgentGlyph seed={seed} className="mt-[3px] h-6 w-6 shrink-0" />
      <div className="min-w-0 pt-[3px]">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-[4px]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="agent-dot h-[5px] w-[5px] rounded-full bg-peak-500"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
          <span className="text-[13.5px] text-ink-muted">{stageFor(seconds)}</span>
        </div>
        <p className="mt-1 font-mono text-[11px] tabular-nums text-ink-subtle">
          {seconds}s
        </p>
      </div>
    </motion.div>
  );
}

/** A block that has not finished arriving. Only that block, never the message. */
function BlockSkeleton({ kind }: { kind: Exclude<PendingBlock, null> }) {
  if (kind === "code") {
    return (
      <div className="mt-1 overflow-hidden rounded-xl border border-peak-900 bg-peak-950">
        <div className="h-[29px] border-b border-white/[0.08]" />
        <div className="space-y-2 p-4">
          {[88, 64, 74].map((width) => (
            <div
              key={width}
              className="h-[9px] rounded bg-white/[0.07]"
              style={{ width: `${width}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1 overflow-hidden rounded-lg border border-agent-line">
      <div className="agent-shimmer h-8 border-b border-agent-line" />
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="agent-shimmer h-8 border-b border-agent-line last:border-0"
          style={{ animationDelay: `${row * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function AssistantAnswer({ id, text }: { id: string; text: string }) {
  const { agentName, revealingId, arrivedId, finishReveal } = useChat();
  const prefersReduced = useReducedMotion();

  const active = revealingId === id;
  const onComplete = useCallback(() => finishReveal(id), [finishReveal, id]);

  const { body, pending, revealing } = useProgressiveReveal({
    text,
    active,
    reducedMotion: Boolean(prefersReduced),
    onComplete,
  });

  return (
    <motion.div {...enter} className="flex items-start gap-3">
      <AgentGlyph seed={agentName} className="mt-[3px] h-6 w-6 shrink-0" />
      <div
        className={cn(
          // No bubble on an answer: a paragraph of prose in a balloon is
          // harder to read, and this is the half of the conversation people
          // actually sit and read.
          "min-w-0 flex-1 rounded-lg",
          revealing && "agent-revealing",
          arrivedId === id && !revealing && "agent-arrival",
        )}
      >
        {/* ~72 characters — long enough for a table row, short enough to read. */}
        <AnswerMarkdown className="max-w-[72ch]">{body}</AnswerMarkdown>
        {pending ? (
          <div className="max-w-[72ch]">
            <BlockSkeleton kind={pending} />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

export function UserMessage({ text }: { text: string }) {
  return (
    <motion.div {...enter} className="flex justify-end">
      <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-peak-600 px-3.5 py-2.5 text-[14.5px] leading-[1.6] text-white">
        {text}
      </p>
    </motion.div>
  );
}

export function ErrorMessage({ text }: { text: string }) {
  return (
    <motion.div
      {...enter}
      className="flex items-start gap-3 rounded-xl border border-caution-border bg-surface-raised px-4 py-3"
    >
      <AlertCircle aria-hidden className="mt-[2px] h-4 w-4 shrink-0 text-caution" />
      <p className="text-[13.5px] leading-[1.65] text-ink-muted">{text}</p>
    </motion.div>
  );
}
