/**
 * Twelve open alerts across three levels: pod, table and person.
 *
 * Every count in the UI derives from this list. Add an alert here and it
 * appears everywhere it belongs, with the totals still agreeing.
 *
 * NOT MODELLED YET, and undefined in the WDTS requirements: acknowledge,
 * escalate, auto-clear, expiry, and what happens to an alert nobody opens.
 * The tree cannot ship without those.
 *
 * @type {import("../types.js").Alert[]}
 */
export const initialAlerts = [
  {
    id: "a1", podId: "p1", tableId: "t4", severity: "critical", flags: ["blocks-roll"],
    title: "Table offline",
    detail: "Stopped responding at 18:18. Last good chip count 18:04.",
    ageSeconds: 252,
    actions: [
      { label: "Hold pod", intent: "hold-pod" },
      { label: "Diagnose", primary: true, intent: "open-table" },
    ],
  },
  {
    id: "a2", podId: "p1", tableId: "t3", severity: "critical", flags: ["blocks-roll"],
    title: "Chip tray short 1,000",
    detail: "Two failed counts. Needs a reason code and a second signature.",
    ageSeconds: 660,
    actions: [
      { label: "Re-scan", intent: "rescan" },
      { label: "Adjust", primary: true, intent: "adjust" },
    ],
  },
  {
    id: "a3", podId: "p1", tableId: "t3",
    subject: { kind: "player", name: "K. Leung", seat: 4 },
    severity: "high", flags: [],
    title: "Buy-in threshold reached",
    detail: "500,000 cumulative. AML entry required before the next buy-in.",
    ageSeconds: 120,
    actions: [{ label: "Review", primary: true, intent: "open-players" }],
  },
  {
    id: "a4", podId: "p4", tableId: "t14", severity: "critical", flags: ["blocks-roll", "needs-signature"],
    title: "Fill awaiting your authorisation",
    detail: "500,000 requested. Chips are delivered to NB0104, the Primary, not to the table that asked.",
    ageSeconds: 123,
    actions: [
      { label: "Reject", intent: "dismiss" },
      { label: "Authorise", primary: true, intent: "authorise-fill" },
    ],
  },
  {
    id: "a5", podId: "p4", tableId: "t13",
    subject: { kind: "dealer", name: "Dealer 0418" },
    severity: "high", flags: [],
    title: "Dealer login blocked",
    detail: "Card read failed three times. Manual login available.",
    ageSeconds: 410,
    actions: [{ label: "Resolve", primary: true, intent: "open-table" }],
  },
  {
    id: "a6", podId: "p2", tableId: "t5",
    subject: { kind: "player", name: "W. Chan", seat: 3 },
    severity: "high", flags: ["needs-signature"],
    title: "Manual rating over threshold",
    detail: "Submitted by Dealer 0631. Pending your approval.",
    ageSeconds: 1560,
    actions: [
      { label: "Cancel", intent: "dismiss" },
      { label: "Approve", primary: true, intent: "approve-rating" },
    ],
  },
  {
    id: "a7", podId: "p3", tableId: "t11", severity: "high", flags: [],
    title: "Secondary empty three shoes running",
    detail: "Not an alert condition. Flagged because it costs the pod capacity.",
    ageSeconds: 3060,
    actions: [{ label: "Look", primary: true, intent: "open-table" }],
  },

  /* --- the four message types the requirements name by hand ---------------
     Three of these are not faults. A dealer waving, a shuffle running and a
     shoe finishing are the normal rhythm of a pit, and a design that paints
     them the same crimson as a dark table has taught the supervisor to ignore
     crimson. They carry the same shape and a quieter weight. */
  {
    id: "a8", podId: "p2", tableId: "t7",
    subject: { kind: "dealer", name: "Dealer 0742" },
    severity: "high", flags: [],
    title: "Dealer needs assistance",
    detail: "Called from the table. No reason given, which is usually a payout query or a chip change.",
    ageSeconds: 74,
    actions: [
      { label: "Acknowledge", intent: "dismiss" },
      { label: "Go to table", primary: true, intent: "open-table" },
    ],
  },
  {
    id: "a9", podId: "p3", tableId: "t9", severity: "high", flags: ["blocks-roll"],
    title: "Shoe finished, cards needed",
    detail: "Cut card reached on the Primary. All four tables are stopped until the new shoe is loaded, because the pod shares one Shoe ID.",
    ageSeconds: 96,
    actions: [
      { label: "Hold pod", intent: "hold-pod" },
      { label: "Cards on the way", primary: true, intent: "dismiss" },
    ],
  },
  {
    id: "a10", podId: "p3", tableId: "t10", severity: "low", flags: [],
    title: "Shuffling",
    detail: "Automatic shuffler running. Nothing to do; it is here so an idle table is not read as a fault.",
    ageSeconds: 41,
    actions: [{ label: "Dismiss", primary: true, intent: "dismiss" }],
  },

  /* --- threshold alerts, table and player -------------------------------- */
  {
    id: "a11", podId: "p4", tableId: "t13", severity: "high", flags: [],
    title: "Table win over threshold",
    detail: "NB0104 is up 1,642,000 against a notify level of 1,500,000. Set on the thresholds screen.",
    ageSeconds: 810,
    actions: [
      { label: "Thresholds", intent: "thresholds" },
      { label: "Open table", primary: true, intent: "open-table" },
    ],
  },
  {
    id: "a12", podId: "p4", tableId: "t13",
    subject: { kind: "player", name: "H. Pang", seat: 2 },
    severity: "high", flags: [],
    title: "Player win over threshold",
    detail: "Up 862,000 against a notify level of 750,000. The host has two comps outstanding.",
    ageSeconds: 465,
    actions: [
      { label: "Thresholds", intent: "thresholds" },
      { label: "Open record", primary: true, intent: "open-player" },
    ],
  },
];
