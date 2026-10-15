/**
 * Open items across pod, table and person.
 *
 * Review feedback split these in two:
 *
 *   action  needs the supervisor now: connectivity, a customer dispute, a
 *           dealer calling, money that cannot move without a signature
 *   alert   worth knowing, nothing has stopped: thresholds, ratings, shoe
 *           changes, shuffles
 *
 * Which events land in which bucket is our proposal for WDTS to confirm.
 * Text is cut to the minimum a supervisor needs to act.
 *
 * Every count in the UI derives from this list.
 *
 * @type {import("../types.js").Alert[]}
 */
export const initialAlerts = [
  /* --- actions ------------------------------------------------------------ */
  {
    id: "a1", kind: "action", podId: "p1", tableId: "t4", severity: "critical", flags: ["blocks-roll"],
    title: "Table offline",
    detail: "No connection since 18:18.",
    ageSeconds: 252,
    actions: [{ label: "Open table", primary: true, intent: "open-table" }],
  },
  {
    id: "a13", kind: "action", podId: "p2", tableId: "t5",
    subject: { kind: "player", name: "M. Sio", seat: 6 },
    severity: "critical", flags: [],
    title: "Customer dispute",
    detail: "Payout on hand 41 questioned.",
    ageSeconds: 58,
    actions: [{ label: "Review hand", primary: true, intent: "open-games" }],
  },
  {
    id: "a8", kind: "action", podId: "p2", tableId: "t7",
    subject: { kind: "dealer", name: "Dealer 0742" },
    severity: "critical", flags: [],
    title: "Dealer needs assistance",
    detail: "Called from the table.",
    ageSeconds: 74,
    actions: [
      { label: "Acknowledge", intent: "dismiss" },
      { label: "Go to table", primary: true, intent: "open-table" },
    ],
  },
  {
    id: "a4", kind: "action", podId: "p4", tableId: "t14", severity: "critical", flags: ["blocks-roll", "needs-signature"],
    title: "Fill needs authorization",
    detail: "500,000 requested.",
    ageSeconds: 123,
    actions: [
      { label: "Reject", intent: "dismiss" },
      { label: "Authorize", primary: true, intent: "authorize-fill" },
    ],
  },
  {
    id: "a2", kind: "action", podId: "p1", tableId: "t3", severity: "critical", flags: ["blocks-roll"],
    title: "Chip tray short 1,000",
    detail: "Needs a reason code and second signature.",
    ageSeconds: 660,
    actions: [
      { label: "Re-scan", intent: "rescan" },
      { label: "Adjust", primary: true, intent: "adjust" },
    ],
  },

  /* --- alerts ------------------------------------------------------------- */
  {
    id: "a3", kind: "alert", podId: "p1", tableId: "t3",
    subject: { kind: "player", name: "K. Leung", seat: 4 },
    severity: "high", flags: [],
    title: "Buy-in threshold reached",
    detail: "500,000 cumulative. AML entry required.",
    ageSeconds: 120,
    actions: [{ label: "Review", primary: true, intent: "open-players" }],
  },
  {
    id: "a5", kind: "alert", podId: "p4", tableId: "t13",
    subject: { kind: "dealer", name: "Dealer 0418" },
    severity: "high", flags: [],
    title: "Dealer login failed",
    detail: "Card read failed three times.",
    ageSeconds: 410,
    actions: [{ label: "Resolve", primary: true, intent: "open-table" }],
  },
  {
    id: "a6", kind: "alert", podId: "p2", tableId: "t5",
    subject: { kind: "player", name: "W. Chan", seat: 3 },
    severity: "high", flags: ["needs-signature"],
    title: "Manual rating to approve",
    detail: "Submitted by Dealer 0631.",
    ageSeconds: 1560,
    actions: [
      { label: "Cancel", intent: "dismiss" },
      { label: "Approve", primary: true, intent: "approve-rating" },
    ],
  },
  {
    id: "a9", kind: "alert", podId: "p3", tableId: "t9", severity: "high", flags: ["blocks-roll"],
    title: "New shoe needed",
    detail: "Pod 3 is stopped until cards arrive.",
    ageSeconds: 96,
    actions: [{ label: "Cards on the way", primary: true, intent: "dismiss" }],
  },
  {
    id: "a10", kind: "alert", podId: "p3", tableId: "t10", severity: "low", flags: [],
    title: "Shuffling",
    detail: "Automatic shuffler running.",
    ageSeconds: 41,
    actions: [{ label: "Dismiss", primary: true, intent: "dismiss" }],
  },
  {
    id: "a11", kind: "alert", podId: "p4", tableId: "t13", severity: "high", flags: [],
    title: "Table win over threshold",
    detail: "1,642,000 against 1,500,000.",
    ageSeconds: 810,
    actions: [
      { label: "Thresholds", intent: "thresholds" },
      { label: "Open table", primary: true, intent: "open-table" },
    ],
  },
  {
    id: "a12", kind: "alert", podId: "p4", tableId: "t13",
    subject: { kind: "player", name: "H. Pang", seat: 2 },
    severity: "high", flags: [],
    title: "Player win over threshold",
    detail: "862,000 against 750,000.",
    ageSeconds: 465,
    actions: [
      { label: "Thresholds", intent: "thresholds" },
      { label: "Open player", primary: true, intent: "open-player" },
    ],
  },
];
