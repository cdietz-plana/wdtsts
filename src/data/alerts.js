/**
 * Actions and Alerts, as WDTS defined them.
 *
 *   action   needs the supervisor now. `source` says who raised it:
 *            "dealer" (the Supervisor Requested button on the dealer display)
 *            or "system" (detected automatically).
 *   alert    worth a look; nothing has stopped. Counted.
 *   receipt  confirmation that something already happened. Never counted;
 *            lives in the Activity list and clears itself.
 *
 * Every manual request from the dealer arrives as one Action, Supervisor
 * Requested. The dealer gives no reason; the supervisor records one when
 * closing it, so the reasons are still captured.
 *
 * `intent` on the first action decides what its one-tap button does; see
 * onAlert() in app.js.
 */
export const initialAlerts = [
  /* --- actions: dealer ---------------------------------------------------- */
  {
    id: "a2", kind: "action", source: "dealer", tableId: "t3",
    title: "Supervisor requested",
    detail: "From the dealer display.",
    ageSeconds: 58,
    actions: [{ label: "On my way", primary: true, intent: "on-my-way" }],
  },
  {
    id: "a3", kind: "action", source: "dealer", tableId: "t11",
    title: "Supervisor requested",
    detail: "From the dealer display.",
    ageSeconds: 74,
    actions: [{ label: "On my way", primary: true, intent: "on-my-way" }],
  },
  {
    id: "a14", kind: "action", source: "dealer", tableId: "t153",
    title: "Supervisor requested",
    detail: "From the dealer display.",
    ageSeconds: 33,
    actions: [{ label: "On my way", primary: true, intent: "on-my-way" }],
  },

  /* --- actions: system ---------------------------------------------------- */
  {
    id: "a1", kind: "action", source: "system", tableId: "t7",
    title: "System down",
    detail: "No connection since 18:18.",
    ageSeconds: 252,
    actions: [{ label: "Open", primary: true, intent: "open-table" }],
  },
  {
    id: "a4", kind: "action", source: "system", tableId: "t15",
    title: "Fill request",
    detail: "250,000 requested by the dealer.",
    amount: 250000,
    ageSeconds: 123,
    actions: [{ label: "Authorize", primary: true, intent: "authorize-fill" }],
  },
  {
    id: "a5", kind: "action", source: "system", tableId: "t18",
    title: "New shoe",
    detail: "Cut card reached.",
    ageSeconds: 96,
    actions: [{ label: "Cards sent", primary: true, intent: "acknowledge", receipt: "Cards sent for a new shoe" }],
  },
  {
    id: "a6", kind: "action", source: "system", tableId: "t3",
    subject: { kind: "player", name: "K. Leung", seat: 4 },
    title: "AML alert",
    detail: "500,000 cumulative buy-in. Entry required.",
    ageSeconds: 120,
    actions: [{ label: "Review", primary: true, intent: "open-player" }],
  },
  {
    id: "a7", kind: "action", source: "system", tableId: "t13",
    subject: { kind: "player", name: "H. Pang", seat: 2 },
    title: "Progressive jackpot",
    detail: "Payout pending verification.",
    amount: 1850000,
    ageSeconds: 210,
    actions: [{ label: "Verify", primary: true, intent: "verify-jackpot" }],
  },
  {
    id: "a8", kind: "action", source: "system", tableId: "t12",
    title: "Shuffler malfunction",
    detail: "Shuffler stopped mid-cycle.",
    ageSeconds: 160,
    actions: [{ label: "Tech called", primary: true, intent: "acknowledge", receipt: "Technician called for the shuffler" }],
  },
  {
    id: "a13", kind: "action", source: "system", tableId: "t87",
    title: "System down",
    detail: "No connection since 18:11.",
    ageSeconds: 610,
    actions: [{ label: "Open", primary: true, intent: "open-table" }],
  },
  {
    id: "a15", kind: "action", source: "system", tableId: "t40",
    subject: { kind: "player", name: "R. Chao", seat: 5 },
    title: "Taxable jackpot",
    detail: "Payout over the reporting threshold.",
    amount: 620000,
    ageSeconds: 300,
    actions: [{ label: "Verify", primary: true, intent: "verify-jackpot" }],
  },

  /* --- alerts ------------------------------------------------------------- */
  {
    id: "b1", kind: "alert", tableId: "t21", severity: "high",
    title: "Chip tray variance",
    detail: "Tray is 1,000 short.",
    ageSeconds: 660,
    actions: [{ label: "Adjust", primary: true, intent: "adjust" }],
  },
  {
    id: "b3", kind: "alert", tableId: "t16", severity: "high",
    title: "Table loss",
    detail: "Table down 855,100. Threshold 750,000.",
    ageSeconds: 810,
    actions: [{ label: "Open", primary: true, intent: "open-table" }],
  },
  {
    id: "b4", kind: "alert", tableId: "t5", severity: "high",
    subject: { kind: "player", name: "W. Chan", seat: 3 },
    title: "Average bet",
    detail: "Average bet 85,000. Threshold 50,000.",
    ageSeconds: 1560,
    actions: [{ label: "Player", primary: true, intent: "open-player" }],
  },
  {
    id: "b5", kind: "alert", tableId: "t9", severity: "high",
    title: "Missing chip sighted",
    detail: "A 5,000 chip read off its bet spot.",
    ageSeconds: 140,
    actions: [{ label: "Review", primary: true, intent: "review-hand" }],
  },
  {
    id: "b6", kind: "alert", tableId: "t20", severity: "high",
    title: "Missing loser",
    detail: "A losing bet was not collected.",
    ageSeconds: 380,
    actions: [{ label: "Review", primary: true, intent: "review-hand" }],
  },
  {
    id: "b7", kind: "alert", tableId: "t22", severity: "high",
    title: "Shoe out of sync",
    detail: "Card count does not match the shoe.",
    ageSeconds: 220,
    actions: [{ label: "Open", primary: true, intent: "open-table" }],
  },
  {
    id: "b8", kind: "alert", tableId: "t6", severity: "high",
    title: "Game ended with errors",
    detail: "Last hand closed with an unsettled bet.",
    ageSeconds: 95,
    actions: [{ label: "Review", primary: true, intent: "review-hand" }],
  },
  {
    id: "b9", kind: "alert", tableId: "t10", severity: "high",
    title: "Card value changed",
    detail: "A card was corrected on the last hand.",
    ageSeconds: 510,
    actions: [{ label: "Review", primary: true, intent: "review-hand" }],
  },

  /* --- receipts: Activity, not counted ----------------------------------- */
  { id: "r1", kind: "receipt", tableId: "t8", title: "Variance adjusted", detail: "500 added, signed by Ana Lopes.", ageSeconds: 900, actions: [] },
  { id: "r2", kind: "receipt", tableId: "t2", title: "Fill processed", detail: "100,000 delivered.", ageSeconds: 1300, actions: [] },
  { id: "r3", kind: "receipt", tableId: "t14", title: "Game voided", detail: "Hand 31 voided by the dealer.", ageSeconds: 1500, actions: [] },
  { id: "r4", kind: "receipt", tableId: "t4", title: "Cards changed", detail: "Scheduled card change done.", ageSeconds: 2100, actions: [] },
];

/**
 * Times set by the property. Card Change and Roll Table run on a schedule,
 * so they show as a countdown rather than a stream of messages, and turn into
 * an Alert only when due.
 */
export const schedule = { cardChange: 18 * 3600 + 45 * 60, roll: 22 * 3600 };
