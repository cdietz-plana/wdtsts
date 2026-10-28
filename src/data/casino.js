/**
 * Fields from the WDTS Table Dashboard, as WDTS sent them: Sessions, Games,
 * Limits, Fill Request and Inventory. The look of these screens is ours to
 * change; the fields are not.
 *
 * Everything here is generated, deterministic from the table id, so the same
 * table always shows the same history. In the product it comes from the
 * table system.
 */
import { gamesFor } from "./games.js";
import { SUPERVISOR } from "../lib/supervisor.js";

const seed = (id) => {
  let n = 0;
  for (const c of String(id)) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
};
const pad = (n) => String(n).padStart(2, "0");
const hhmm = (mins) => `${pad(Math.floor(mins / 60) % 24)}:${pad(mins % 60)}`;

/** Wager types on a WDTS baccarat layout, in the order the seat cards list them. */
export const BET_TYPES = [
  { key: "P", label: "Player" },
  { key: "B", label: "Banker" },
  { key: "STG", label: "Small Tiger" },
  { key: "TIE", label: "Tie" },
  { key: "BTG", label: "Big Tiger" },
  { key: "GPB", label: "Golden Point Banker" },
  { key: "GPP", label: "Golden Point Player" },
  { key: "PRG", label: "Progressive" },
];

/** A player's member number, as the dashboard shows it after the name: (6003). */
export const memberNo = (p) => (p.rated ? 6000 + (seed(p.id) % 900) : null);
/** The rating number on a session. */
export const ratingNo = (p) => 40000000 + seed(p.id + "r") * 2771;

/** The current wager at each type for a seated player. Most are zero. */
export function wagers(table, p) {
  if (!p) return BET_TYPES.map((b) => ({ ...b, amount: 0 }));
  const s = seed(p.id + table.id);
  const unit = Math.max(table.limits.min, Math.round(((p.avgBet || table.limits.min) * (0.6 + (s % 80) / 100)) / 100) * 100);
  const main = s % 2 ? "B" : "P";
  return BET_TYPES.map((b) => {
    let amount = 0;
    if (b.key === main) amount = unit;
    if (b.key === "TIE" && s % 5 === 0) amount = Math.max(25, Math.round(unit * 0.05 / 25) * 25);
    if (b.key === "GPB" && s % 7 === 0) amount = Math.max(25, Math.round(unit * 0.04 / 25) * 25);
    if (b.key === "STG" && s % 6 === 1) amount = Math.max(25, Math.round(unit * 0.03 / 25) * 25);
    return { ...b, amount };
  });
}

/** Session KPIs for the back of a seat card. */
export function sessionKpis(table, p) {
  const s = seed(p.id);
  const start = 17 * 60 + 30 + (s % 50);
  return {
    sessionWL: -p.winLoss,
    cashHandle: p.handle,
    promoHandle: s % 4 === 0 ? Math.round(p.handle * 0.02 / 100) * 100 : 0,
    avgBet: p.avgBet,
    start: hhmm(start),
    buyIn: p.buyIn,
    chipsIn: Math.round(p.buyIn * (0.4 + (s % 30) / 100) / 100) * 100,
    mid: p.rated ? `M${String(100000 + (s * 37) % 899999)}` : "",
  };
}

/* ---------------------------------------------------------------- sessions */

/** One row per session on this table today, open first. */
export function sessionsFor(table, players) {
  const s = seed(table.id);
  const shoe = 2751000 + (s % 900);
  const rows = players.map((p, i) => {
    const k = sessionKpis(table, p);
    const open = !p.closed;
    const startM = Number(k.start.slice(0, 2)) * 60 + Number(k.start.slice(3));
    return {
      id: 2751400 + ((s + i * 17) % 99),
      status: open ? "open" : "closed",
      player: p.name,
      member: memberNo(p),
      rating: p.rated ? ratingNo(p) : null,
      shoe,
      start: k.start,
      end: open ? "" : hhmm(startM + 40 + (seed(p.id) % 50)),
      casinoWL: p.winLoss,
      avgBet: p.avgBet,
      cashHandle: k.cashHandle,
      promoHandle: k.promoHandle,
      buyIn: p.buyIn,
      seat: p.seat,
      mid: k.mid,
      notes: (p.notes || []).length,
      playerId: p.id,
    };
  });
  return rows.sort((a, b) => (a.status === b.status ? b.id - a.id : a.status === "open" ? -1 : 1));
}

/* ------------------------------------------------------------------- games */

const SIDE_HITS = ["", "", "", "/BTG", "", "/GPB", "", "/BTG/GPB"];

/** Games with the dashboard's columns and the per-position breakdown. */
export function gameRows(table, players, limitsName) {
  const s = seed(table.id);
  const shoe = 2751000 + (s % 900);
  return gamesFor(table.id).map((g, i) => {
    const start = Number(g.at.slice(0, 2)) * 60 + Number(g.at.slice(3));
    const seated = players.filter((p) => !p.closed);
    const lines = seated.slice(0, 3).flatMap((p, j) => {
      const amt = Math.max(table.limits.min, Math.round(((p.avgBet || table.limits.min) * (0.5 + ((s + i * 7 + j * 3) % 9) / 10)) / 100) * 100);
      const side = (s + i + j) % 4 === 0;
      const won = (g.outcome === "Banker" && j % 2 === 0) || (g.outcome === "Player" && j % 2 === 1);
      const main = { position: p.seat, player: p.name, member: memberNo(p), tip: 0, type: j % 2 ? "P" : "B", odds: j % 2 ? "" : "0.95:1", bet: amt, chipSet: "Cash", wl: g.outcome === "Tie" ? 0 : won ? -Math.round(amt * (j % 2 ? 1 : 0.95)) : amt };
      return side ? [main, { position: null, player: null, tip: null, type: "GPB", odds: "", bet: Math.round(amt * 0.1 / 25) * 25 || 25, chipSet: "Cash", wl: Math.round(amt * 0.1 / 25) * 25 || 25 }] : [main];
    });
    return {
      id: 2751500 + 99 - i - (s % 40),
      shoe,
      start: hhmm(start),
      end: hhmm(start + 1),
      limits: limitsName,
      supervisor: SUPERVISOR.name,
      dealer: table.dealer || "",
      handle: g.handle,
      casinoWL: g.result,
      bTotal: g.banker,
      pTotal: g.player,
      result: g.banker === g.player ? "TIE" : (g.banker > g.player ? "B" : "P") + SIDE_HITS[(s + i) % SIDE_HITS.length],
      corrected: g.corrected,
      game: g.game,
      lines,
    };
  });
}

/* ------------------------------------------------------------------ limits */

const SIDE_LIMITS = (max) => [
  { label: "Small Tiger", min: 25, max: 20000 },
  { label: "Tie", min: 25, max: 20000 },
  { label: "Big Tiger", min: 25, max: 20000 },
  { label: "Golden Point Banker", min: 25, max: 20000 },
  { label: "Progressive", min: 100, max: 1000 },
  { label: "Golden Point Player", min: 25, max: 20000 },
  { label: "Big Dragon", min: 25, max: 20000 },
  { label: "Small Dragon", min: 25, max: 20000 },
  { label: "Player Pair", min: 25, max: Math.min(20000, max) },
  { label: "Banker Pair", min: 25, max: Math.min(20000, max) },
];

/** Limit profiles a table can be set to. The name is the one the dashboard shows. */
export function limitProfiles(table) {
  const lo = table.limits.min;
  const hi = table.limits.max;
  const k = (n) => (n >= 1000 ? `${n / 1000}K` : String(n));
  return [
    { id: "com", name: `2026_296_COM_${lo}-${k(hi)}_MB-${k(hi / 2)}-Pos`, commission: "Yes", bpMin: lo, differential: hi, bankerIncrement: Math.max(25, lo / 10), side: SIDE_LIMITS(hi) },
    { id: "nocom", name: `2026_296_No COM_${lo}-${k(hi)}_MB-${k(hi / 2)}-Pos`, commission: "No", bpMin: lo, differential: hi, bankerIncrement: Math.max(25, lo / 10), side: SIDE_LIMITS(hi) },
  ];
}

/* --------------------------------------------------------------- inventory */

export const CHIP_SETS = ["NN", "Cash", "RFPC_1", "RFPC"];
export const FILL_DENOMS = [1000000, 100000, 25000, 10000, 5000, 1000, 500, 100, 25, 5];
const TRAY_DENOMS = [100000, 10000, 5000, 1000, 500, 100, 25, 5];

/** The tray, denomination by denomination, plus the balances around it. */
export function inventoryFor(table) {
  const s = seed(table.id);
  const rows = TRAY_DENOMS.map((v, i) => ({ value: v, count: 30 + ((s * (i + 3)) % 110) }));
  const actual = rows.reduce((n, r) => n + r.value * r.count, 0);
  const variance = table.variance || 0;
  return {
    rows,
    actual,
    expected: actual - variance,
    variance,
    rim: s % 3 === 0 ? 1000000 : 0,
    marker: s % 4 === 0 ? 200000 : 0,
    count: rows.reduce((n, r) => n + r.count, 0),
  };
}
