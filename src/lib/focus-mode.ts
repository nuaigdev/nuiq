"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * The two behaviours a workspace route needs from the app shell.
 *
 * Both the data agent conversation and a single dashboard are surfaces that own
 * the viewport: nothing on the page scrolls except the thing itself, and either
 * can expand to push the site chrome out of the way. The CSS that does it lives
 * in globals.css, keyed off attributes on <html>; these hooks are the only
 * things that set them.
 */

/**
 * Locks the page to the viewport for as long as the route is mounted, and no
 * longer. Every other page in the portal scrolls normally.
 */
export function useViewportLock() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-app-lock", "viewport");
    return () => root.removeAttribute("data-app-lock");
  }, []);
}

/*
 * The stored preference is read through useSyncExternalStore rather than in an
 * effect: it gives the server and the hydrating client the same answer (docked)
 * and then swaps to the stored one, instead of rendering one thing and
 * correcting it. Nothing outside this tab writes the key, so the subscription
 * has nothing to listen to.
 */
const noopSubscribe = () => () => {};

function reader(key: string) {
  return () => {
    try {
      return sessionStorage.getItem(key) === "1";
    } catch {
      // Storage blocked. Start docked; nothing is lost.
      return false;
    }
  };
}

/**
 * Focus mode: the site header and footer slide out and the surface fills the
 * viewport. Esc leaves, and the choice survives a refresh for the session —
 * being dropped out of focus by a reload is merely annoying rather than
 * sensitive, which is why sessionStorage is appropriate here and not for
 * anything else on these routes.
 */
export function useFocusMode(storageKey: string): {
  focus: boolean;
  toggleFocus: () => void;
} {
  const readStored = reader(storageKey);
  const stored = useSyncExternalStore(noopSubscribe, readStored, () => false);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const focus = chosen ?? stored;

  useEffect(() => {
    const root = document.documentElement;
    if (focus) root.setAttribute("data-app-focus", "on");
    else root.removeAttribute("data-app-focus");
    try {
      sessionStorage.setItem(storageKey, focus ? "1" : "0");
    } catch {
      // Not remembering the preference is not worth failing over.
    }
    return () => root.removeAttribute("data-app-focus");
  }, [focus, storageKey]);

  useEffect(() => {
    if (!focus) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setChosen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const toggleFocus = useCallback(
    () => setChosen((on) => !(on ?? readStored())),
    // readStored closes over storageKey only, and is rebuilt each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageKey],
  );

  return { focus, toggleFocus };
}
