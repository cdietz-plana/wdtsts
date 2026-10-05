/**
 * Everything the UI counts is derived here, never stored twice.
 * That is why the floor cards, the tree, the filter chips and the
 * "blocking the roll" tally cannot drift apart.
 */

export const findPod = (pods, id) => pods.find((p) => p.id === id);

export function findTable(pods, id) {
  for (const p of pods) {
    const t = p.tables.find((x) => x.id === id);
    if (t) return t;
  }
  return undefined;
}

export const podOfTable = (pods, tableId) => pods.find((p) => p.tables.some((t) => t.id === tableId));

export const alertsForPod = (alerts, podId) => alerts.filter((a) => a.podId === podId);

export const alertsForTable = (alerts, tableId) => alerts.filter((a) => a.tableId === tableId);

export const withFlag = (alerts, flag) => alerts.filter((a) => a.flags.includes(flag));

/**
 * A parent row is tinted by its worst child, so pod severity is derived rather
 * than stored. Whether WDTS agrees is an open question for the requirements.
 */
export function worstSeverity(alerts) {
  if (alerts.some((a) => a.severity === "critical")) return "critical";
  if (alerts.some((a) => a.severity === "high")) return "high";
  return alerts.length ? "low" : "clear";
}

/** "2 tables · 1 person" — what a pod row says under its name. */
export function subjectSummary(alerts) {
  const tables = new Set(alerts.filter((a) => !a.subject).map((a) => a.tableId));
  const people = alerts.filter((a) => a.subject).length;
  const parts = [];
  if (tables.size) parts.push(`${tables.size} table${tables.size > 1 ? "s" : ""}`);
  if (people) parts.push(`${people} person${people > 1 ? "s" : ""}`);
  return parts.join(" · ");
}

export const seatedInPod = (pod) =>
  pod.tables.reduce((acc, t) => ({ seated: acc.seated + t.seated, capacity: acc.capacity + t.seats }), { seated: 0, capacity: 0 });

export const shoeWinLossForPod = (pod) => pod.tables.reduce((n, t) => n + t.shoeWinLoss, 0);

/** Short label for a Secondary inside its own pod: BA0101C -> "C". */
export const shortTableLabel = (table, pod) => table.name.replace(pod.tables[0].name, "") || "Primary";

/* --- people ---------------------------------------------------------------
 * Every player list in the product is a filter or a sort over one array.
 * "Top players in the section" and "top players in this pod" are the same
 * function with a different scope, which is why they can never disagree.
 */

export const playersForTable = (players, tableId) => players.filter((p) => p.tableId === tableId);

export const playersForPod = (players, pod) => players.filter((p) => pod.tables.some((t) => t.id === p.tableId));

export const findPlayer = (players, id) => players.find((p) => p.id === id);

/**
 * Ranked by theoretical win, not by what they are up or down.
 * A player losing heavily on small bets is not the one the section is built
 * around, and a supervisor asked "who is in your section" is being asked about
 * value, not luck.
 */
export const topPlayers = (players, limit = 5) => [...players].sort((a, b) => b.theoWin - a.theoWin).slice(0, limit);

/* --- ranking people -------------------------------------------------------
 * Review feedback: theoretical win is the wrong default. A supervisor asked
 * who to watch wants what is actually happening, and the answer changes by
 * the hour. So the ranking is a choice rather than a fixed sort.
 *
 * `winLoss` on a player is the HOUSE's result against that player. A player
 * who is up is therefore a negative figure, which is why the winners list
 * sorts ascending. Getting that backwards puts the quietest table at the top
 * of a list labelled "biggest winners", so it is worth being explicit.
 */

export const RANKINGS = [
  { id: "winners", label: "Top winners", note: "Players furthest ahead of the house",
    sort: (a, b) => a.winLoss - b.winLoss, value: (p) => -p.winLoss, signed: true },
  { id: "losers", label: "Top losers", note: "Players furthest behind",
    sort: (a, b) => b.winLoss - a.winLoss, value: (p) => p.winLoss, signed: true },
  { id: "buyin", label: "Biggest buy-ins", note: "Cumulative buy-in this gaming day",
    sort: (a, b) => b.buyIn - a.buyIn, value: (p) => p.buyIn, signed: false },
  { id: "handle", label: "Biggest handle", note: "Total wagered this gaming day",
    sort: (a, b) => b.handle - a.handle, value: (p) => p.handle, signed: false },
  { id: "theo", label: "Biggest theo", note: "Theoretical win, what the loyalty system rates on",
    sort: (a, b) => b.theoWin - a.theoWin, value: (p) => p.theoWin, signed: false },
];

export const ranking = (id) => RANKINGS.find((r) => r.id === id) || RANKINGS[0];

export const rankPlayers = (players, id, limit = 6) =>
  [...players].sort(ranking(id).sort).slice(0, limit);

/* --- performance ----------------------------------------------------------
 * Handle is everything wagered, Win is what the house kept, Drop is what came
 * across the table in cash and markers. Hold is Win over Drop, which is the
 * figure an operator actually manages to.
 */

export function performance(tables) {
  const handle = tables.reduce((n, t) => n + t.handle, 0);
  const win = tables.reduce((n, t) => n + t.dayWin, 0);
  const drop = tables.reduce((n, t) => n + t.drop, 0);
  return { handle, win, drop, hold: drop ? win / drop : 0 };
}

export const podPerformance = (pod) => performance(pod.tables);

export const sectionPerformance = (pods) => performance(pods.flatMap((p) => p.tables));

/**
 * Limits in full, for the table screen where the exact figure is the answer.
 * On cards use limitShort from format.js, which gives "5K to 500K".
 *
 * NOT WHAT THE PRODUCT DOES TODAY: the functional inventory describes limit
 * templates assigned to a table, previewable before they apply and effective
 * from the next game. Printing a min and a max as two fields is a
 * misrepresentation, and redrawing this as a named template is open work.
 */
export const limitsLabel = (t) =>
  `${t.limits.min.toLocaleString("en-US")} to ${t.limits.max.toLocaleString("en-US")}`;

/* --- money across people --------------------------------------------------
 * Buy-in and theo are properties of people, not of tables, so they are summed
 * from the player list rather than read off a table row. That is why the pod
 * header and the Players tab can never disagree about a buy-in total.
 */

export const playerTotals = (players) =>
  players.reduce(
    (acc, p) => ({
      buyIn: acc.buyIn + (p.buyIn || 0),
      theo: acc.theo + (p.theoWin || 0),
      winLoss: acc.winLoss + (p.winLoss || 0),
    }),
    { buyIn: 0, theo: 0, winLoss: 0 }
  );
