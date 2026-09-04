"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AgentGlyph } from "./AgentGlyph";
import { useChat } from "./chat-store";
import { FacetField } from "./FacetField";

/**
 * The half of the workspace that is not the conversation.
 *
 * A chat box on its own is a blank stare: nothing in it tells a first-time user
 * what this agent knows or what a good question looks like. This panel answers
 * both, in the order someone needs them — what it is, what to ask, and only
 * then something to rest the eye on. It also carries the route's navigation,
 * because the page itself has no room for a header (CLAUDE.md §5: the top nav
 * is still there above it, and is the only nav that matters).
 *
 * Everything here is monochrome. The accent belongs to the conversation.
 */

export type AgentLink = { id: string; name: string };

function PromptList({ suggestions }: { suggestions: string[] }) {
  const { applySuggestion } = useChat();

  return (
    <ul className="space-y-1.5">
      {suggestions.map((suggestion) => (
        <li key={suggestion}>
          <button
            type="button"
            onClick={() => applySuggestion(suggestion)}
            className="w-full rounded-lg border border-canvas-line bg-surface/70 px-3.5 py-2.5 text-left text-[13.5px] leading-snug text-ink-muted transition-colors hover:border-peak-300 hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
          >
            {suggestion}
          </button>
        </li>
      ))}
    </ul>
  );
}

function OtherAgents({
  agents,
  currentId,
}: {
  agents: AgentLink[];
  currentId: string;
}) {
  const others = agents.filter((agent) => agent.id !== currentId);
  if (others.length === 0) return null;

  return (
    <div className="mt-8 max-w-md">
      <p className="mb-2.5 text-[12px] font-medium text-ink-subtle">
        Other agents
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {others.map((agent) => (
          <li key={agent.id}>
            <Link
              href={`/data-agents/${agent.id}`}
              className="inline-flex items-center gap-2 rounded-full border border-canvas-line bg-surface/70 py-1.5 pl-1.5 pr-3 text-[12.5px] text-ink-muted transition-colors hover:border-peak-300 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500"
            >
              <AgentGlyph seed={agent.name} className="h-4 w-4" />
              {agent.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const PRIVACY_NOTE =
  "Questions run as you, so an answer never reaches past your own access. Nothing in this conversation is saved.";

const BACK_LINK_CLASS =
  "inline-flex items-center gap-1.5 text-[12.5px] text-ink-subtle transition-colors hover:text-peak-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500";

export function ContextPanel({
  description,
  suggestions,
  agents,
  currentId,
}: {
  description?: string;
  suggestions: string[];
  agents: AgentLink[];
  currentId: string;
}) {
  const { agentName } = useChat();

  return (
    <aside className="relative hidden min-h-0 flex-col overflow-hidden bg-canvas-ground lg:flex">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-8 py-7 xl:px-12">
        <Link href="/data-agents" className={BACK_LINK_CLASS}>
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          All data agents
        </Link>

        <p className="mt-7 text-[12px] font-medium text-peak-600">
          Fabric data agent
        </p>
        <h1 className="mt-2 max-w-[16ch] text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
          {agentName}
        </h1>
        {description ? (
          <p className="mt-3 max-w-[52ch] text-[14.5px] leading-[1.65] text-ink-muted">
            {description}
          </p>
        ) : null}

        <div className="mt-8 max-w-md">
          <p className="mb-2.5 text-[12px] font-medium text-ink-subtle">
            Questions to start with
          </p>
          <PromptList suggestions={suggestions} />
        </div>

        <OtherAgents agents={agents} currentId={currentId} />

        <p className="mt-8 max-w-[46ch] border-t border-canvas-line pt-5 text-[12.5px] leading-[1.65] text-ink-subtle">
          {PRIVACY_NOTE}
        </p>
      </div>

      {/* Anchored to the floor of the panel, behind the content, never in it. */}
      <FacetField className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] w-full opacity-70" />
    </aside>
  );
}

/**
 * The same context on a phone, where the conversation has to own the viewport.
 * Collapsed to one line by default and expandable in place, so it can be
 * consulted without ever pushing the input off-screen.
 */
export function MobileContextStrip({
  description,
  suggestions,
  agents,
  currentId,
}: {
  description?: string;
  suggestions: string[];
  agents: AgentLink[];
  currentId: string;
}) {
  const { agentName } = useChat();
  const [open, setOpen] = useState(false);

  return (
    <div className="shrink-0 border-b border-canvas-line bg-canvas-ground lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-peak-500"
      >
        <AgentGlyph seed={agentName} className="h-5 w-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium text-ink">
          {agentName}
        </span>
        <span className="shrink-0 text-[12px] text-ink-subtle">
          {open ? "Hide" : "About"}
        </span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="max-h-[45dvh] overflow-y-auto px-4 pb-4">
              {description ? (
                <p className="text-[13.5px] leading-[1.6] text-ink-muted">
                  {description}
                </p>
              ) : null}
              <div className="mt-3.5">
                <PromptList suggestions={suggestions} />
              </div>
              <OtherAgents agents={agents} currentId={currentId} />
              <p className="mt-4 text-[12px] leading-[1.6] text-ink-subtle">
                {PRIVACY_NOTE}
              </p>
              <Link href="/data-agents" className={`${BACK_LINK_CLASS} mt-4`}>
                <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
                All data agents
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
