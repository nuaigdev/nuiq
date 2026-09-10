"use client";

import { MotionConfig, motion } from "framer-motion";

import { useViewportLock } from "@/lib/focus-mode";

import { AgentChatProvider, useChat, type AskTransport } from "./chat-store";
import { ChatPanel } from "./ChatPanel";
import {
  ContextPanel,
  MobileContextStrip,
  type AgentLink,
  type ContextProps,
} from "./ContextPanel";

/**
 * The conversation workspace, shared by both agent tabs.
 *
 * First-party rather than a vendor widget: neither a Fabric data agent (§5 Tab
 * 3) nor a Foundry agent (§5 Tab 4) ships a drop-in web chat, so the surface is
 * ours to build — and there is no reason for the two to look like different
 * products. Everything that differs between them arrives as a prop: what the
 * agent is called, where its answers come from, who they run as, and the
 * transport that actually asks the question.
 *
 * The whole route is locked to the viewport. Only the message list scrolls,
 * which means the input is reachable at every window size without scrolling
 * the page — the one thing a chat must never get wrong.
 */

export type WorkspaceProps = {
  agentName: string;
  /** Where a sent question keeps running — "Fabric", "Foundry". */
  platform: string;
  /** One line under the agent's name in the panel header. */
  subtitle: string;
  ask: AskTransport;
  suggestions: string[];
} & Omit<ContextProps, "suggestions">;

function Workspace({
  subtitle,
  suggestions,
  ...context
}: Omit<WorkspaceProps, "agentName" | "platform" | "ask">) {
  const { fullscreen } = useChat();
  useViewportLock();

  const contextProps = { ...context, suggestions };

  return (
    <div
      className={
        fullscreen
          ? "h-full bg-canvas-ground"
          : // The conversation is a docked panel, not a stretched page: capped
            // in width, and given the majority of the space to its left.
            "grid h-full bg-canvas-ground lg:grid-cols-[minmax(0,1fr)_minmax(420px,32rem)]"
      }
    >
      {fullscreen ? null : <ContextPanel {...contextProps} />}

      <motion.div
        layout
        transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
        className={
          fullscreen
            ? "fixed inset-0 z-[60] flex flex-col bg-surface"
            : "flex min-h-0 flex-col border-canvas-line bg-surface shadow-[-1px_0_0_0_var(--color-canvas-line),-12px_0_28px_-24px_rgba(15,20,32,0.35)]"
        }
      >
        {fullscreen ? null : <MobileContextStrip {...contextProps} />}
        <ChatPanel suggestions={suggestions} subtitle={subtitle} />
      </motion.div>
    </div>
  );
}

export function AgentWorkspace({
  agentName,
  platform,
  ask,
  ...rest
}: WorkspaceProps) {
  return (
    <AgentChatProvider agentName={agentName} platform={platform} ask={ask}>
      {/* reducedMotion="user" makes every animation below honour the setting. */}
      <MotionConfig reducedMotion="user">
        <Workspace {...rest} />
      </MotionConfig>
    </AgentChatProvider>
  );
}

export type { AgentLink };
