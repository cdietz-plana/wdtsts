/**
 * Everything the UI counts is derived here, never stored twice, so the KPI
 * strip, the tiles, the rail and the counts cannot drift apart.
 */

export const findTable = (tables, id) => tables.find((t) => t.id === id);

export const alertsForTable = (alerts, tableId) => alerts.filter((a) => a.tableId === tableId);

export const actionsOf = (alerts) => alerts.filter((a) => a.kind === "action");
export const alertsOnly = (alerts) => alerts.filter((a) => a.kind === "alert");
/** Receipts: things that already happened. Shown as Activity, never counted. */
export const receiptsOf = (alerts) => alerts.filter((a) => a.kind === "receipt");

/** The stages a fill moves through, in order. A fill is one item, not three. */
export const FILL_STAGES = {
  dealer: ["Requested", "Authorized", "Accepted", "Processed"],
  you: ["Sent", "Accepted", "Processed"],
};

/* --- people ----------------------------------------------------------------
 * Open players are in action now. Closed players played in this section
 * earlier today and have left; they keep the table they last played, but hold
 * no seat. Both lists lead with the biggest player win. `winLoss` is the
 * house result, so a player who is up is negative and sorts first ascending.
 */
export const playersForTable = (players, tableId) => players.filter((p) => p.tableId === tableId && !p.closed);
export const findPlayer = (players, id) => players.find((p) => p.id === id);
export const openPlayers = (players) => players.filter((p) => !p.closed).sort((a, b) => a.winLoss - b.winLoss);
export const closedPlayersList = (players) => players.filter((p) => p.closed).sort((a, b) => a.winLoss - b.winLoss);

export const playerTotals = (players) =>
  players.reduce(
    (acc, p) => ({ buyIn: acc.buyIn + (p.buyIn || 0), theo: acc.theo + (p.theoWin || 0), winLoss: acc.winLoss + (p.winLoss || 0) }),
    { buyIn: 0, theo: 0, winLoss: 0 }
  );

/* --- performance ----------------------------------------------------------- */
export function performance(tables) {
  const handle = tables.reduce((n, t) => n + t.handle, 0);
  const win = tables.reduce((n, t) => n + t.dayWin, 0);
  const drop = tables.reduce((n, t) => n + t.drop, 0);
  return { handle, win, drop, hold: drop ? win / drop : 0 };
}

/**
 * The top bar figures, in the Casino Manager set WDTS asked for. Utilization
 * and rated play are shares; the rest are amounts. Theo win is modeled at a
 * flat house edge until the real calculation is supplied.
 */
const EDGE = 0.0118;
export function barKpis(tables, players) {
  const live = tables.filter((t) => t.status !== "closed" && t.status !== "offline");
  const seats = live.reduce((n, t) => n + t.seats, 0);
  const seated = live.reduce((n, t) => n + t.seated, 0);
  const p = performance(tables);
  const open = players.filter((x) => !x.closed);
  const avgBet = open.length ? Math.round(open.reduce((n, x) => n + (x.avgBet || 0), 0) / open.length) : 0;
  const ph = open.reduce((n, x) => n + (x.handle || 0), 0);
  const rated = open.filter((x) => x.rated).reduce((n, x) => n + (x.handle || 0), 0);
  return {
    openTables: live.length, totalTables: tables.length,
    utilization: seats ? seated / seats : 0,
    winLoss: p.win, theo: Math.round(p.handle * EDGE), hold: p.hold, handle: p.handle,
    buyIn: p.drop, avgBet, ratedPlay: ph ? rated / ph : 0,
  };
}

export const limitsLabel = (t) =>
  `${t.limits.min.toLocaleString("en-US")} to ${t.limits.max.toLocaleString("en-US")}`;

/**
 * How many tiles a page holds, and how they are arranged. The manager picks
 * the density: four large, nine, or twelve compact.
 */
export const DENSITIES = { 4: { cols: 2, rows: 2 }, 9: { cols: 3, rows: 3 }, 12: { cols: 4, rows: 3 } };
export const pageOf = (tables, tableId, perPage) => Math.max(0, Math.floor(tables.findIndex((t) => t.id === tableId) / perPage));
