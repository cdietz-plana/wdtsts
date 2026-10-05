/**
 * Notification thresholds.
 *
 * The requirements ask twice for "selected thresholds can send notification",
 * once for tables and once for players, and say nothing about who sets them,
 * where, or what a notification is on a device that may be in a pocket.
 *
 * ASSUMED, NOT SPECIFIED, and all three need a decision:
 *  1. The supervisor can see every rule and change the ones marked own.
 *     Property-owned rules are visible and locked, because a supervisor who
 *     cannot see the AML level cannot explain the alert they just received.
 *  2. On screen means the alert tree. On device means it survives the screen
 *     being asleep. Nothing here emails or pages anyone.
 *  3. Compliance rules (AML) are never editable from a tablet.
 *
 * @type {import("../types.js").Threshold[]}
 */
export const thresholds = [
  { id: "th1", scope: "Table", metric: "Win over", value: 1500000, step: 250000, notify: "screen", owner: "own" },
  { id: "th2", scope: "Table", metric: "Loss over", value: 1000000, step: 250000, notify: "both", owner: "own" },
  { id: "th3", scope: "Table", metric: "Chip tray variance over", value: 0, step: 500, notify: "both", owner: "property", note: "Any variance at all. Locked by the property." },
  { id: "th4", scope: "Table", metric: "Idle for shoes", value: 3, step: 1, notify: "screen", owner: "own", unit: "shoes" },
  { id: "th5", scope: "Player", metric: "Win over", value: 750000, step: 50000, notify: "screen", owner: "own" },
  { id: "th6", scope: "Player", metric: "Loss over", value: 1000000, step: 50000, notify: "screen", owner: "own" },
  { id: "th7", scope: "Player", metric: "Cumulative buy-in", value: 500000, step: 0, notify: "both", owner: "compliance", note: "AML. Set by the regulator, not by the property." },
  { id: "th8", scope: "Player", metric: "Average bet over", value: 100000, step: 10000, notify: "screen", owner: "own" },
];
