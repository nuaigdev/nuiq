"use client";

import { MotionConfig, motion } from "framer-motion";
import { useEffect } from "react";

import { AgentChatProvider, useChat } from "./chat-store";
import { ChatPanel } from "./ChatPanel";
import { ContextPanel, MobileContextStrip, type AgentLink } from "./ContextPanel";

/**
 * The data agent workspace (CLAUDE.md §5 Tab 3).
 *
 * First-party rather than a vendor widget: Fabric data agents ship no drop-in
 * web chat, they expose an MCP endpoint, so the conversation surface is ours to
 * build.
 *
 * The whole route is locked to the viewport. Only the message list scrolls,
 * which means the input is reachable at every window size without scrolling
 * the page — the one thing a chat must never get wrong.
 */

type WorkspaceProps = {
  agentId: string;
  agentName: string;
  description?: string;
  suggestions: string[];
  agents: AgentLink[];
};

/** Locks the page for as long as this route is mounted, and no longer. */
function useViewportLock() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-app-lock", "viewport");
    return () => root.removeAttribute("data-app-lock");
  }, []);
}

function Workspace({
  agentId,
  description,
  suggestions,
  agents,
}: Omit<WorkspaceProps, "agentName">) {
  const { fullscreen } = useChat();
  useViewportLock();

  return (
    <div
      className={
        fullscreen
          ? "h-full bg-agent-ground"
          : // The conversation is a docked panel, not a stretched page: capped
            // in width, and given the majority of the space to its left.
            "grid h-full bg-agent-ground lg:grid-cols-[minmax(0,1fr)_minmax(420px,32rem)]"
      }
    >
      {fullscreen ? null : (
        <ContextPanel
          description={description}
          suggestions={suggestions}
          agents={agents}
          currentId={agentId}
        />
      )}

      <motion.div
        layout
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className={
          fullscreen
            ? "fixed inset-0 z-[60] flex flex-col bg-surface"
            : "flex min-h-0 flex-col border-agent-line bg-surface shadow-[-1px_0_0_0_var(--color-agent-line),-12px_0_28px_-24px_rgba(15,20,32,0.35)]"
        }
      >
        {fullscreen ? null : (
          <MobileContextStrip
            description={description}
            suggestions={suggestions}
            agents={agents}
            currentId={agentId}
          />
        )}
        <ChatPanel suggestions={suggestions} />
      </motion.div>
    </div>
  );
}

export function AgentWorkspace({ agentId, agentName, ...rest }: WorkspaceProps) {
  return (
    <AgentChatProvider agentId={agentId} agentName={agentName}>
      {/* reducedMotion="user" makes every animation below honour the setting. */}
      <MotionConfig reducedMotion="user">
        <Workspace agentId={agentId} {...rest} />
      </MotionConfig>
    </AgentChatProvider>
  );
}
