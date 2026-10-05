/**
 * Color has exactly one job in this system: needs attention.
 * Table identity and seat occupancy are carried by shape and fill weight.
 */
export const sevColor = (s) =>
  s === "critical" ? "var(--critical)" : s === "high" ? "var(--high)" : s === "low" ? "var(--ink-3)" : "var(--ok)";

/**
 * The same severity, for TEXT sitting on its own wash.
 *
 * A signal color is chosen to be seen against the page. Printed as type on a
 * tinted chip of itself it loses most of its contrast, which is why the alert
 * counts were the only thing in the product that could not reach AA. Dots,
 * bars and borders keep sevColor; words get this.
 */
export const sevInk = (s) =>
  s === "critical" ? "var(--critical-ink)" : s === "high" ? "var(--high-ink)" : s === "low" ? "var(--ink-3)" : "var(--ok-ink)";

export const sevWash = (s) =>
  s === "critical" ? "var(--critical-wash)" : s === "high" ? "var(--high-wash)" : s === "clear" ? "var(--ok-wash)" : "transparent";

export const sevEdge = (s) =>
  s === "critical" ? "var(--critical-edge)" : s === "high" ? "var(--high-edge)" : s === "clear" ? "var(--ok-edge)" : "var(--line)";

/**
 * Text reversed out of a FILLED severity chip.
 *
 * White works on crimson and on green, and fails on amber, because amber is a
 * mid-tone: white on it is 3.7:1 in the light theme. Amber therefore takes a
 * dark ink in both themes. This is the one place the two themes genuinely
 * disagree about a foreground, and it is a property of the hue, not of a
 * preference.
 */
export const sevOn = (s) => (s === "high" ? "var(--on-high)" : "var(--on-accent)");
