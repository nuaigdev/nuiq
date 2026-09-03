/**
 * The arrival ping.
 *
 * On by default, and deliberately not a notification "ding": a single soft
 * note with a fast attack and a long tail, low enough in level to sit under a
 * conversation in an open office. It is synthesised rather than shipped as an
 * audio file so the page carries no extra asset for a sound most people will
 * never switch on.
 */

let context: AudioContext | null = null;

/**
 * Browsers refuse to start audio without a user gesture. Call this from inside
 * one — sending the first question, or switching sound on — so the first ping
 * is not silently swallowed.
 */
export function unlockAudio() {
  try {
    if (!context) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      context = new Ctor();
    }
    if (context.state === "suspended") void context.resume();
  } catch {
    // No audio available. The visual arrival cue carries the same information.
  }
}

export function playArrivalPing() {
  try {
    if (!context || context.state !== "running") return;

    const now = context.currentTime;
    const gain = context.createGain();
    gain.connect(context.destination);

    // A fifth, struck together and decaying fast. Two partials read as a pop
    // rather than a beep; one alone sounds like an alarm.
    for (const [frequency, level] of [
      [660, 0.055],
      [990, 0.028],
    ] as const) {
      const osc = context.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency;

      const voice = context.createGain();
      voice.gain.setValueAtTime(0.0001, now);
      voice.gain.exponentialRampToValueAtTime(level, now + 0.012);
      voice.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);

      osc.connect(voice);
      voice.connect(gain);
      osc.start(now);
      osc.stop(now + 0.36);
    }
  } catch {
    // Never let a decorative sound break the conversation.
  }
}
