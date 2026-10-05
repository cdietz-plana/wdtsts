/** Accounting style: negatives in parentheses, so a minus sign never gets lost. */
export function money(n) {
  if (n === null || n === undefined) return "—";
  const s = Math.abs(n).toLocaleString("en-US");
  return n < 0 ? `(${s})` : s;
}

/** Compact age for dense rows: 42s, 11m, 2h 04m. */
export function age(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`;
}

/** Long age for the alert detail row, where the seconds are the point. */
export function ageLong(seconds) {
  const m = Math.floor(seconds / 60);
  const r = seconds % 60;
  if (m < 1) return `${seconds}s`;
  if (m < 10) return `${m}m ${String(r).padStart(2, "0")}s`;
  return `${m}m`;
}

export const countdown = (seconds) => `0:${String(seconds).padStart(2, "0")}`;

export const rollIn = (minutes) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

/**
 * Compact money for scan-level surfaces: 41.2M, 612.4K.
 * Used on cards, never in a panel where the figure is the answer to a
 * question. A supervisor glancing at six pods needs the magnitude; a
 * supervisor reading the section total needs the number.
 */
export function compact(n) {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n);
  const sign = n < 0 ? "(" : "";
  const close = n < 0 ? ")" : "";
  const trim = (x) => x.replace(/\.0$/, "");
  if (abs >= 1e6) return `${sign}${trim((abs / 1e6).toFixed(1))}M${close}`;
  if (abs >= 1e3) return `${sign}${trim((abs / 1e3).toFixed(1))}K${close}`;
  return `${sign}${abs}${close}`;
}

/** Hold is win over drop, the figure an operator manages to. */
export const percent = (x) => `${(x * 100).toFixed(1)}%`;

/** 18:21 from seconds past midnight, so the whole prototype shares one clock. */
export function wallClock(secondsPastMidnight) {
  const m = Math.floor(secondsPastMidnight / 60);
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Limits, the way the pit says them out loud. 5,000 to 500,000 becomes
 * 5K to 500K, because on a card the magnitude is the message and the exact
 * figure belongs on the table screen.
 */
export const kShort = (n) => {
  if (n === null || n === undefined) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${String((abs / 1e6).toFixed(1)).replace(/\.0$/, "")}M`;
  if (abs >= 1e3) return `${String((abs / 1e3).toFixed(abs >= 1e4 ? 0 : 1)).replace(/\.0$/, "")}K`;
  return String(abs);
};

/** "5K → 500K". The arrow is the range; the words PT or ST sit outside this. */
export const limitShort = (limits) => `${kShort(limits.min)} → ${kShort(limits.max)}`;
