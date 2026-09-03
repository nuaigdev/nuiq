"use client";

import { Maximize2, Minimize2, Volume2, VolumeX } from "lucide-react";

import { AgentGlyph } from "./AgentGlyph";
import { useChat } from "./chat-store";
import { Composer } from "./Composer";
import { MessageList } from "./MessageList";

const controlClass =
  "flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle transition-colors hover:bg-agent-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peak-500";

/**
 * The conversation itself: a fixed header, the message list — the only thing on
 * the route that scrolls — and an input bar pinned to the bottom of the panel.
 */
export function ChatPanel({ suggestions }: { suggestions: string[] }) {
  const { agentName, soundOn, toggleSound, fullscreen, toggleFullscreen } =
    useChat();

  return (
    <section
      aria-label={`Conversation with ${agentName}`}
      className="flex min-h-0 flex-1 flex-col bg-surface"
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b border-agent-line px-4 py-3 sm:px-5">
        <AgentGlyph seed={agentName} className="h-6 w-6 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium leading-tight text-ink">
            {agentName}
          </p>
          <p className="text-[11.5px] leading-tight text-ink-subtle">
            Answers from your Fabric warehouse
          </p>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            className={controlClass}
            title={soundOn ? "Sound on for new replies" : "Sound off"}
          >
            {soundOn ? (
              <Volume2 aria-hidden className="h-4 w-4" />
            ) : (
              <VolumeX aria-hidden className="h-4 w-4" />
            )}
            <span className="sr-only">
              {soundOn ? "Turn reply sound off" : "Turn reply sound on"}
            </span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-pressed={fullscreen}
            className={controlClass}
            title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          >
            {fullscreen ? (
              <Minimize2 aria-hidden className="h-4 w-4" />
            ) : (
              <Maximize2 aria-hidden className="h-4 w-4" />
            )}
            <span className="sr-only">
              {fullscreen ? "Exit fullscreen" : "Expand to fullscreen"}
            </span>
          </button>
        </div>
      </header>

      {/*
       * In fullscreen the panel is as wide as the display, which would stretch a
       * line of prose past the point anyone can track it. Cap the column and
       * centre it instead.
       */}
      <div
        className={
          fullscreen
            ? "mx-auto flex w-full min-h-0 max-w-3xl flex-1 flex-col"
            : "flex min-h-0 flex-1 flex-col"
        }
      >
        <MessageList />
        <Composer suggestions={suggestions} />
      </div>
    </section>
  );
}
