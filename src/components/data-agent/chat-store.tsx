"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { askDataAgentAction } from "@/app/data-agents/actions";
import { useFocusMode } from "@/lib/focus-mode";

import { playArrivalPing, unlockAudio } from "./ping";

/**
 * State for one data agent conversation.
 *
 * The transcript lives here for the length of the visit and is never persisted
 * (CLAUDE.md §5 Tab 3). These questions can name communities, residents and
 * incidents, so keeping them out of any store — server or browser — is
 * deliberate. The one thing that does persist is the fullscreen preference, in
 * sessionStorage: a refresh dropping someone out of focus mode is annoying
 * rather than sensitive.
 */

export type Turn =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "agent"; text: string }
  | { id: string; role: "error"; text: string };

type ChatContextValue = {
  agentName: string;
  turns: Turn[];
  /** Waiting on Fabric: the question is out, nothing has come back. */
  pending: boolean;
  /** Seconds since the current question was asked. */
  elapsed: number;
  /** The answer currently being revealed, if any. */
  revealingId: string | null;
  /** The answer that just landed, for its one arrival cue. */
  arrivedId: string | null;
  draft: string;
  setDraft: (value: string) => void;
  /** Puts an example prompt in the box without sending it. */
  applySuggestion: (text: string) => void;
  ask: (text: string) => void;
  /** Stop waiting, or skip to the end of a reveal — whichever is happening. */
  interrupt: () => void;
  finishReveal: (id: string) => void;
  soundOn: boolean;
  toggleSound: () => void;
  fullscreen: boolean;
  toggleFullscreen: () => void;
  /** Registered by the composer so a suggestion can hand focus to the input. */
  registerInput: (el: HTMLTextAreaElement | null) => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat() {
  const value = useContext(ChatContext);
  if (!value) throw new Error("useChat must be used inside AgentChatProvider");
  return value;
}

const FULLSCREEN_KEY = "nuiq:agent-focus";

let counter = 0;
function nextId() {
  counter += 1;
  return `turn-${counter}`;
}

export function AgentChatProvider({
  agentId,
  agentName,
  children,
}: {
  agentId: string;
  agentName: string;
  children: React.ReactNode;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [arrivedId, setArrivedId] = useState<string | null>(null);
  // On by default: a question can take minutes, and the whole point of the
  // cue is to be told when the answer lands without watching for it. The
  // toggle in the panel header turns it off.
  const [soundOn, setSoundOn] = useState(true);

  const { focus: fullscreen, toggleFocus: toggleFullscreen } =
    useFocusMode(FULLSCREEN_KEY);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const soundRef = useRef(true);

  /*
   * Bumped whenever a question is asked or abandoned. A reply whose ticket no
   * longer matches answers a question the user has walked away from, and is
   * dropped rather than appended under whatever they asked next.
   */
  const ticketRef = useRef(0);

  const registerInput = useCallback((el: HTMLTextAreaElement | null) => {
    inputRef.current = el;
  }, []);

  /* --- the elapsed counter ----------------------------------------------- */

  useEffect(() => {
    if (!pending) return;
    const started = Date.now();
    const id = window.setInterval(
      () => setElapsed(Math.round((Date.now() - started) / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [pending]);

  /* --- asking ------------------------------------------------------------ */

  const ask = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;

      // Browsers only let a page make sound after a real gesture. Sending a
      // question is the first one we can rely on, so unlock here.
      if (soundRef.current) unlockAudio();

      // Snapshot before appending: the agent needs what came *before* this
      // question. Error turns are ours, not part of the conversation.
      const history = turns
        .filter((turn) => turn.role !== "error")
        .map((turn) => ({ role: turn.role as "user" | "agent", text: turn.text }));

      ticketRef.current += 1;
      const ticket = ticketRef.current;

      setTurns((prev) => [...prev, { id: nextId(), role: "user", text: trimmed }]);
      setDraft("");
      setArrivedId(null);
      setElapsed(0);
      setPending(true);

      void askDataAgentAction(agentId, trimmed, history).then((result) => {
        if (ticket !== ticketRef.current) return;

        const id = nextId();
        setTurns((prev) => [
          ...prev,
          result.answer
            ? { id, role: "agent", text: result.answer }
            : { id, role: "error", text: result.error ?? "Something went wrong." },
        ]);
        // Only an answer is worth revealing gradually. An error should simply
        // be there, at once, so it can be read and acted on.
        if (result.answer) setRevealingId(id);
        else setArrivedId(id);
        setPending(false);
      });
    },
    [agentId, pending, turns],
  );

  /*
   * Stopping.
   *
   * A question already sent keeps running in Fabric — a server action cannot be
   * cancelled from the browser, and a control that implied otherwise would be
   * lying. What this does is stop *waiting* for it, which is the thing someone
   * actually wants three minutes into a question they have thought better of.
   * Mid-reveal it means something narrower and entirely honest: show the rest
   * of the answer now.
   */
  const interrupt = useCallback(() => {
    if (revealingId) {
      setArrivedId(revealingId);
      setRevealingId(null);
      return;
    }
    if (!pending) return;
    ticketRef.current += 1;
    setPending(false);
    inputRef.current?.focus();
  }, [pending, revealingId]);

  const finishReveal = useCallback((id: string) => {
    setRevealingId((current) => (current === id ? null : current));
    setArrivedId(id);
    if (soundRef.current) playArrivalPing();
  }, []);

  /* --- the title cue while the tab is in the background ------------------ */

  useEffect(() => {
    if (!arrivedId || !document.hidden) return;

    const original = document.title;
    document.title = `• New reply — ${original}`;

    function restore() {
      if (!document.hidden) document.title = original;
    }

    document.addEventListener("visibilitychange", restore);
    window.addEventListener("focus", restore);
    return () => {
      document.title = original;
      document.removeEventListener("visibilitychange", restore);
      window.removeEventListener("focus", restore);
    };
  }, [arrivedId]);

  /* --- sound ------------------------------------------------------------- */

  const toggleSound = useCallback(() => {
    setSoundOn((on) => {
      const next = !on;
      soundRef.current = next;
      // Turning it on is itself a gesture, so take the chance to unlock.
      if (next) unlockAudio();
      return next;
    });
  }, []);

  const applySuggestion = useCallback((text: string) => {
    setDraft(text);
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    // Caret at the end, so typing continues the prompt rather than prefixing it.
    requestAnimationFrame(() => input.setSelectionRange(text.length, text.length));
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      agentName,
      turns,
      pending,
      elapsed,
      revealingId,
      arrivedId,
      draft,
      setDraft,
      applySuggestion,
      ask,
      interrupt,
      finishReveal,
      soundOn,
      toggleSound,
      fullscreen,
      toggleFullscreen,
      registerInput,
    }),
    [
      agentName,
      turns,
      pending,
      elapsed,
      revealingId,
      arrivedId,
      draft,
      applySuggestion,
      ask,
      interrupt,
      finishReveal,
      soundOn,
      toggleSound,
      fullscreen,
      toggleFullscreen,
      registerInput,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
