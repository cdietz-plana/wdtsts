import { h } from "../lib/dom.js";
import { compact, money, percent } from "../lib/format.js";
import { alertsForTable, findPlayer, findTable, performance, playersForTable } from "../lib/selectors.js";
import { gamesFor } from "../data/games.js";
import { findOverride } from "./override.js";
import {
  iconBell, iconBox, iconCard, iconClose, iconFill, iconHistory, iconLimits, iconOpen, iconPower, iconScan, iconTick, iconUsers,
} from "./icons.js";
import { CHIP_SETS, FILL_DENOMS, inventoryFor, limitProfiles } from "../data/casino.js";
import { age } from "../lib/format.js";

/**
 * What an opened table tile shows.
 *
 * Todd's question: how does a box expand when the manager reaches for an
 * action like Fill/Credit? The answer here is one set of content that can be
 * shown two ways (see `expandStyle` in the store): grown over its neighbors
 * on the grid, or in a side panel with the grid still in view. The content
 * does not change between them, so the comparison is only about placement.
 *
 * Every view fits without scrolling. Anything longer than one view is split
 * into steps, and a finished step folds to a one-line summary.
 *
 * The less frequent functions, Games and Sessions among them, live in the
 * menu view rather than on every tile or in a tab bar.
 */

const ADJUST_REASONS = ["Missing loser on the last hand", "Miscount at pay or take", "Chips in transit", "Other, add a note"];

const TITLES = {
  menu: null,
  fill: "New request",
  inventory: "Inventory",
  alerts: "Alerts at this table",
  rate: "Rating",
  authorize: "Authorize fill",
  adjust: "Adjust chip tray",
  rating: "Approve rating",
  games: "Games",
  sessions: "Sessions",
  players: "Players",
  limits: "Limits",
  override: "Override",
  request: "Supervisor requested",
  jackpot: "Jackpot",
};

/**
 * Why the dealer called. The dealer presses one button and gives no reason;
 * the supervisor picks one here when closing it, so the reasons are still on
 * record. The list is WDTS's own list of manual dealer requests.
 */
const REQUEST_REASONS = ["Player dispute", "Dealer error", "Marker request", "Approval needed", "Dealer assistance", "Drop box full", "Other"];

const OVERRIDE_REASONS = ["Dealer error at pay or take", "Card misread by the table", "Player dispute, floor decision", "Other, add a note"];

export function expandContent(state, dispatch, handlers) {
  const ex = state.expand;
  const table = findTable(state.tables, ex.tableId);
  if (!table) return h("div");
  const perf = performance([table]);

  const head = h(
    "div.xp__head",
    {},
    h(
      "div",
      { style: { minWidth: "0" } },
      h("div.display.xp__name", { text: table.name }),
      h("div.xp__sub", { text: [TITLES[ex.view], table.dealer || "No dealer"].filter(Boolean).join(" · ") })
    ),
    h("span", { style: { flex: "1" } }),
    ex.view !== "menu" && ex.step === 1 && !ex.alertId
      ? h("button.btn.btn--ghost", { text: "All functions", on: { click: () => dispatch({ type: "expand-view", view: "menu" }) } })
      : null,
    h("button.icon-btn", { "aria-label": "Close", on: { click: () => dispatch({ type: "collapse" }) } }, iconClose())
  );

  let body;
  switch (ex.view) {
    case "fill": body = fillView(state, dispatch, table, handlers); break;
    case "authorize": body = authorizeView(state, dispatch, table, handlers); break;
    case "request": body = requestView(state, dispatch, table, handlers); break;
    case "jackpot": body = jackpotView(state, dispatch, table, handlers); break;
    case "adjust": body = adjustView(state, dispatch, table, handlers); break;
    case "rating": body = ratingView(state, dispatch, table, handlers); break;
    case "games": body = gamesView(state, dispatch, table, handlers); break;
    case "sessions": body = sessionsView(state, dispatch, table); break;
    case "players": body = playersView(state, dispatch, table); break;
    case "limits": body = limitsView(state, dispatch, table); break;
    case "inventory": body = inventoryView(state, dispatch, table, handlers); break;
    case "alerts": body = alertsView(state, dispatch, table, handlers); break;
    case "rate": body = rateView(state, dispatch, table); break;
    case "override": body = overrideView(state, dispatch, table); break;
    default: body = menuView(state, dispatch, table, perf, handlers);
  }

  return h("div.xp", { data: { view: ex.view } }, head, body);
}

/* ------------------------------------------------------------------ pieces */

const navRow = (...buttons) => h("div.xp__nav", {}, buttons);

const stepDone = (label, value, onEdit) =>
  h(
    "button.step-done",
    { on: { click: onEdit } },
    h("span", { style: { color: "var(--ok)", display: "flex" } }, iconTick()),
    h("span", { style: { flex: "1", minWidth: "0" } }, h("span.micro", { text: label, style: { display: "block" } }), h("span", { text: value, style: { display: "block", fontSize: "var(--t-body)", marginTop: "1px" } })),
    h("span", { text: "Edit", style: { fontSize: "var(--t-detail)", color: "var(--ink-2)" } })
  );

/** The second signature. One large target, because it is done standing up. */
const signStep = (label, onSigned) =>
  h(
    "div.xp__sign",
    {},
    h("button.login__tap.xp__tap", { on: { click: onSigned } },
      h("span.login__tapicon", {}, iconCard(24)),
      h("span", {}, h("span.login__taptitle", { text: "Tap your card to sign" }), h("span.login__taphint", { text: label }))
    )
  );

/* -------------------------------------------------------------------- menu */

function menuView(state, dispatch, table, perf, { onScan, onAlert }) {
  const fig = (label, value, color) => h("div.xp__fig", {}, h("span.micro", { text: label }), h("b.mono", { text: value, style: color ? { color } : {} }));
  const open = table.status !== "closed";
  const quick = (icon, label, onClick, opts = {}) =>
    h("button.xp__quick", { data: { tone: opts.tone || "" }, disabled: opts.disabled ? "" : null, on: { click: onClick } }, icon, h("span", { text: label }));

  const actions = alertsForTable(state.alerts, table.id).filter((a) => a.kind === "action");

  return h(
    "div.xp__body",
    {},
    h(
      "div.xp__figs",
      {},
      fig("Win / loss", compact(perf.win), perf.win < 0 ? "var(--critical-ink)" : "var(--ok-ink)"),
      fig("Buy in", compact(perf.drop)),
      fig("Hold", percent(perf.hold)),
      fig("Seated", `${table.seated}/${table.seats}`)
    ),
    actions.length
      ? h(
          "div.xp__action",
          {},
          h("span.dot", { style: { background: "var(--critical)" } }),
          h("span", { text: actions[0].title, style: { flex: "1", fontWeight: "600" } }),
          h("button.btn", { text: actions[0].enroute ? "Close" : actions[0].actions[0].label, on: { click: () => onAlert(actions[0]) } })
        )
      : null,
    h(
      "div.xp__grid",
      {},
      quick(iconBox(20), "Inventory", () => dispatch({ type: "expand-view", view: "inventory" })),
      quick(iconFill(20), "Fill / Credit", () => dispatch({ type: "expand-view", view: "fill" }), { disabled: !open }),
      quick(iconUsers(20), "Players", () => dispatch({ type: "expand-view", view: "players" })),
      quick(iconHistory(20), "History", () => dispatch({ type: "go-table", tableId: table.id, tab: "games" })),
      quick(iconLimits(20), "Limits", () => dispatch({ type: "expand-view", view: "limits" })),
      quick(iconBell(20), "Alerts", () => dispatch({ type: "expand-view", view: "alerts" })),
      quick(iconPower(20), open ? "Close table" : "Open table", () => dispatch({ type: "toast", message: `${table.name} ${open ? "close" : "open"} requested. Count runs first.` })),
      quick(iconOpen(20), "Full dashboard", () => dispatch({ type: "go-table", tableId: table.id }), { tone: "strong" })
    )
  );
}

/* -------------------------------------------------------------- fill/credit */

/**
 * New request, with the Table Dashboard's fields: Fill, Credit or Credit All;
 * Float; a chip set; then a count for each denomination with its value and
 * the grand total. Three short steps rather than one long form, and the
 * second signature last.
 */
const MODE_LABEL = { fill: "Fill", credit: "Credit", creditAll: "Credit All" };

function fillView(state, dispatch, table, { onSendFill }) {
  const ex = state.expand;
  const mode = ex.mode || "fill";
  const chipSet = ex.chipSet || "Cash";
  const counts = ex.counts || {};
  const inv = inventoryFor(table);
  const amount = mode === "creditAll" ? inv.actual : FILL_DENOMS.reduce((n, d) => n + d * (counts[d] || 0), 0);
  const pieces = mode === "creditAll" ? inv.count : FILL_DENOMS.reduce((n, d) => n + (counts[d] || 0), 0);
  const set = (patch) => dispatch({ type: "expand-set", patch });
  const back = (step) => navRow(h("button.btn.btn--ghost.btn--big", { text: "Back", style: { flex: "1" }, on: { click: () => set({ step }) } }));

  if (ex.step === 3) {
    return h(
      "div.xp__body",
      {},
      stepDone("Request", `${MODE_LABEL[mode]} · Float · ${chipSet}`, () => set({ step: 1 })),
      stepDone("Grand total", `${money(amount)} · ${pieces} chips`, () => set({ step: mode === "creditAll" ? 1 : 2 })),
      h("span", { style: { flex: "1" } }),
      signStep(`${MODE_LABEL[mode]} request goes to the cage`, () => onSendFill(table.id, mode === "fill" ? "fill" : "credit", amount)),
      back(mode === "creditAll" ? 1 : 2)
    );
  }

  if (ex.step === 2) {
    const step = (d, delta) => set({ counts: { ...counts, [d]: Math.max(0, (counts[d] || 0) + delta) } });
    return h(
      "div.xp__body",
      {},
      stepDone("Request", `${MODE_LABEL[mode]} · Float · ${chipSet}`, () => set({ step: 1 })),
      h("div.fx-head", {}, h("span.micro", { text: "Denoms" }), h("span.micro", { text: "Count" })),
      h(
        "div.fx-denoms",
        {},
        FILL_DENOMS.map((d) => {
          const n = counts[d] || 0;
          return h(
            "div.fx-denom",
            { data: { on: n > 0 } },
            h("span.fx-denom__v", {}, h("b.mono", { text: compact(d) }), h("span.fx-denom__val.mono", { text: n ? money(d * n) : "" })),
            h("button.fx-step", { text: "\u2212", "aria-label": `One less ${money(d)}`, disabled: n ? null : "", on: { click: () => step(d, -1) } }),
            h("b.mono.fx-n", { text: String(n) }),
            h("button.fx-step", { text: "+", "aria-label": `One more ${money(d)}`, on: { click: () => step(d, 1) } })
          );
        })
      ),
      h("div.fx-total", {}, h("span", { text: "Grand total" }), h("span.mono", { text: `${pieces} chips` }), h("b.mono", { text: money(amount) })),
      navRow(
        h("button.btn.btn--ghost.btn--big", { text: "Back", style: { flex: "1" }, on: { click: () => set({ step: 1 }) } }),
        h("button.btn.btn--big", { text: amount ? `Review · ${compact(amount)}` : "Add a count", style: { flex: "2" }, disabled: amount ? null : "", on: { click: () => set({ step: 3 }) } })
      )
    );
  }

  return h(
    "div.xp__body",
    {},
    h(
      "div.segmented.segmented--fill",
      { role: "group", "aria-label": "Request type" },
      [["fill", "Fill"], ["credit", "Credit"], ["creditAll", "Credit All"]].map(([id, label]) =>
        h("button", { text: label, "aria-pressed": String(mode === id), on: { click: () => set({ mode: id }) } })
      )
    ),
    h("button.option.option--tight.fx-float", { "aria-pressed": "true" }, h("span.fx-radio", { "aria-hidden": "true" }), "Float"),
    h("div.micro", { text: "Chip set" }),
    h(
      "div.fx-sets",
      {},
      CHIP_SETS.map((c) => h("button.option.option--tight", { text: c, "aria-pressed": String(chipSet === c), on: { click: () => set({ chipSet: c }) } }))
    ),
    mode === "creditAll" ? h("div.xp__note", { text: `Credits the whole tray back to the cage: ${money(inv.actual)} in ${inv.count} chips.` }) : null,
    h("span", { style: { flex: "1" } }),
    navRow(
      h("button.btn.btn--ghost.btn--big", { text: "Cancel", style: { flex: "1" }, on: { click: () => dispatch({ type: "collapse" }) } }),
      h("button.btn.btn--big", { text: mode === "creditAll" ? "Review" : "Count chips", style: { flex: "2" }, on: { click: () => set({ step: mode === "creditAll" ? 3 : 2 }) } })
    )
  );
}

/* --------------------------------------------------------------- authorize */

function authorizeView(state, dispatch, table, { onResolve, onAuthorizeFill }) {
  const ex = state.expand;
  const alert = state.alerts.find((a) => a.id === ex.alertId);
  const amount = alert ? alert.amount : 250000;

  if (ex.step === 2) {
    return h(
      "div.xp__body",
      {},
      stepDone("Fill", `${money(amount)} · ${table.name}`, () => dispatch({ type: "expand-set", patch: { step: 1 } })),
      h("span", { style: { flex: "1" } }),
      signStep("Authorizes the fill and prints the slip", () => onAuthorizeFill(ex.alertId, table.id)),
      navRow(h("button.btn.btn--ghost.btn--big", { text: "Back", style: { flex: "1" }, on: { click: () => dispatch({ type: "expand-set", patch: { step: 1 } }) } }))
    );
  }

  const line = (label, value) => h("div.xp__line", {}, h("span.micro", { text: label }), h("span", { text: value }));
  return h(
    "div.xp__body",
    {},
    h("div.xp__big.mono", { text: money(amount) }),
    line("Requested by", table.dealer || "Dealer"),
    line("Tray now", money(inventoryFor(table).actual)),
    line("Requested", "18:19"),
    h("span", { style: { flex: "1" } }),
    navRow(
      h("button.btn.btn--ghost.btn--big", { text: "Reject", style: { flex: "1" }, on: { click: () => { onResolve(ex.alertId, "Fill rejected. The dealer is told why.", { title: "Fill rejected", detail: money(amount) }); dispatch({ type: "fill-done", tableId: table.id }); } } }),
      h("button.btn.btn--big", { text: "Authorize", style: { flex: "2" }, on: { click: () => dispatch({ type: "expand-set", patch: { step: 2 } }) } })
    )
  );
}

/* ------------------------------------------------------------------ adjust */

function adjustView(state, dispatch, table, { onResolve }) {
  const ex = state.expand;
  if (ex.step === 2) {
    return h(
      "div.xp__body",
      {},
      stepDone("Reason", ex.reason, () => dispatch({ type: "expand-set", patch: { step: 1 } })),
      h("span", { style: { flex: "1" } }),
      signStep("Second signature for a 1,000 adjustment", () => onResolve(ex.alertId || "b1", `${table.name} tray adjusted and back in balance.`, { title: "Variance adjusted", detail: `${ex.reason} · signed by you` })),
      navRow(h("button.btn.btn--ghost.btn--big", { text: "Back", style: { flex: "1" }, on: { click: () => dispatch({ type: "expand-set", patch: { step: 1 } }) } }))
    );
  }
  return h(
    "div.xp__body",
    {},
    h("div.xp__line", {}, h("span.micro", { text: "Variance" }), h("b.mono", { text: money(table.variance || 0), style: { color: "var(--critical-ink)" } })),
    h("div", { style: { display: "flex", flexDirection: "column", gap: "7px" } },
      ADJUST_REASONS.map((r) => h("button.option.option--tight", { text: r, "aria-pressed": String(ex.reason === r), on: { click: () => dispatch({ type: "expand-set", patch: { reason: r } }) } }))
    ),
    h("span", { style: { flex: "1" } }),
    navRow(
      h("button.btn.btn--ghost.btn--big", { text: "Cancel", style: { flex: "1" }, on: { click: () => dispatch({ type: "collapse" }) } }),
      h("button.btn.btn--big", { text: "Continue", style: { flex: "2" }, disabled: ex.reason ? null : "", on: { click: () => dispatch({ type: "expand-set", patch: { step: 2 } }) } })
    )
  );
}

/* ------------------------------------------------------------------ rating */

function ratingView(state, dispatch, table, { onResolve }) {
  const ex = state.expand;
  const alert = state.alerts.find((a) => a.id === ex.alertId);
  const seat = alert && alert.subject ? alert.subject.seat : null;
  const p = playersForTable(state.players, table.id).find((x) => x.seat === seat);
  const line = (label, value) => h("div.xp__line", {}, h("span.micro", { text: label }), h("span", { text: value }));
  return h(
    "div.xp__body",
    {},
    h("div.xp__big", { text: p ? p.name : "Player" }),
    line("Seat", String(seat || "")),
    line("Average bet entered", p ? money(p.avgBet) : "—"),
    line("Time played", "2h 10m"),
    line("Entered by", table.dealer || "Dealer"),
    h("span", { style: { flex: "1" } }),
    navRow(
      h("button.btn.btn--ghost.btn--big", { text: "Cancel rating", style: { flex: "1" }, on: { click: () => onResolve(ex.alertId, "Rating cancelled.") } }),
      h("button.btn.btn--big", { text: "Approve", style: { flex: "2" }, on: { click: () => onResolve(ex.alertId, "Rating approved and sent to the player record.") } })
    )
  );
}

/* --------------------------------------------------- games, sessions, people */

function gamesView(state, dispatch, table, { onResolve }) {
  const ex = state.expand;
  // Opened from an Alert (missing loser, game ended with errors and so on):
  // the last hand is marked and the alert closes from here.
  const review = ex.alertId ? state.alerts.find((a) => a.id === ex.alertId) : null;
  const rows = gamesFor(table.id).slice(0, 6);
  return h(
    "div.xp__body",
    {},
    review ? h("div.xp__note", { text: `${review.title}. ${review.detail}` }) : null,
    h(
      "div.xp__list",
      {},
      rows.map((g, i) =>
        h(
          "div.xp__row",
          { data: { hot: !!review && i === 0 } },
          h("span.mono", { text: String(g.game), style: { width: "34px", fontWeight: "700", color: "var(--ink-3)" } }),
          h("span.mono", { text: g.at, style: { width: "48px", color: "var(--ink-3)" } }),
          h("span", { text: g.outcome, style: { flex: "1", fontWeight: "600" } }),
          h("span.mono", { text: compact(g.result), style: { color: g.result < 0 ? "var(--critical-ink)" : "var(--ok-ink)", fontWeight: "600" } })
        )
      ).slice(0, review ? 4 : 6)
    ),
    h("span", { style: { flex: "1" } }),
    review
      ? navRow(
          h("button.btn.btn--ghost.btn--big", { text: "Override", style: { flex: "1" }, on: { click: () => dispatch({ type: "go-table", tableId: table.id, tab: "override" }) } }),
          h("button.btn.btn--big", { text: "Mark reviewed", style: { flex: "2" }, on: { click: () => onResolve(review.id, `${review.title} reviewed.`, { title: `${review.title} reviewed`, detail: `Hand ${rows[0].game}` }) } })
        )
      : navRow(h("button.btn.btn--ghost.btn--big", { text: "All games", style: { flex: "1" }, on: { click: () => dispatch({ type: "go-table", tableId: table.id, tab: "games" }) } }))
  );
}

/**
 * Supervisor Requested, closing it.
 *
 * The context the dealer did not give: how long they have waited and what
 * just happened at this table. Then one tap on the reason, which closes the
 * request and records why it was raised.
 */
function requestView(state, dispatch, table, { onResolve }) {
  const ex = state.expand;
  const alert = state.alerts.find((a) => a.id === ex.alertId);
  const ctx = requestContext(state, table, alert);
  const line = (label, value, color) => h("div.xp__line", {}, h("span.micro", { text: label }), h("span", { text: value, style: color ? { color, fontWeight: "600" } : {} }));
  return h(
    "div.xp__body",
    {},
    h(
      "div.xp__ctx",
      {},
      line("Waiting", ctx.waiting),
      line("Last hand", ctx.lastHand, ctx.lastColor),
      line("Open at this table", ctx.open),
      line("Seated", ctx.seated)
    ),
    h("div.micro", { text: "Close with a reason" }),
    h(
      "div.xp__reasons",
      {},
      REQUEST_REASONS.map((r) =>
        h("button.option.option--tight.xp__reason", {
          text: r,
          on: {
            click: () => onResolve(ex.alertId, `Request closed: ${r.toLowerCase()}.`, { title: "Supervisor request closed", detail: r }),
          },
        })
      )
    )
  );
}

/** What the tablet can tell the supervisor about a request before they arrive. */
export function requestContext(state, table, alert) {
  const g = gamesFor(table.id)[0];
  const others = state.alerts.filter((a) => a.tableId === table.id && a.kind !== "receipt" && (!alert || a.id !== alert.id));
  const f = state.fills[table.id];
  const openBits = [...others.map((a) => a.title), f ? `${f.mode === "fill" ? "Fill" : "Credit"} in progress` : null].filter(Boolean);
  const secs = alert ? alert.ageSeconds : 0;
  return {
    waiting: secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${String(secs % 60).padStart(2, "0")}s`,
    lastHand: g ? `${g.outcome} · ${compact(g.result)}` : "None",
    lastColor: g && g.result < 0 ? "var(--critical-ink)" : null,
    open: openBits.length ? openBits.join(", ") : "Nothing else",
    seated: `${table.seated} of ${table.seats}`,
    short: [g ? `Last hand ${g.outcome}` : null, openBits.length ? `${openBits.length} open` : null, `${table.seated} seated`].filter(Boolean).join(" · "),
  };
}

/** Jackpot payouts: confirm the amount and the player, then sign. */
function jackpotView(state, dispatch, table, { onResolve }) {
  const ex = state.expand;
  const alert = state.alerts.find((a) => a.id === ex.alertId);
  if (!alert) return h("div.xp__body");
  const taxable = alert.title === "Taxable jackpot";
  const line = (label, value) => h("div.xp__line", {}, h("span.micro", { text: label }), h("span", { text: value }));
  if (ex.step === 2) {
    return h(
      "div.xp__body",
      {},
      stepDone("Payout", `${money(alert.amount)} · seat ${alert.subject.seat}`, () => dispatch({ type: "expand-set", patch: { step: 1 } })),
      h("span", { style: { flex: "1" } }),
      signStep(taxable ? "Releases the payout and records the tax form" : "Releases the payout", () =>
        onResolve(alert.id, "Jackpot verified and released.", { title: `${alert.title} paid`, detail: `${money(alert.amount)} · seat ${alert.subject.seat}` })
      ),
      navRow(h("button.btn.btn--ghost.btn--big", { text: "Back", style: { flex: "1" }, on: { click: () => dispatch({ type: "expand-set", patch: { step: 1 } }) } }))
    );
  }
  return h(
    "div.xp__body",
    {},
    h("div.xp__big.mono", { text: money(alert.amount) }),
    line("Player", `${alert.subject.name} · seat ${alert.subject.seat}`),
    line("Type", taxable ? "Taxable jackpot" : "Progressive jackpot"),
    taxable ? line("Before payout", "Tax form and ID check") : line("Hit", "Hand " + (gamesFor(table.id)[0] || {}).game),
    h("span", { style: { flex: "1" } }),
    navRow(
      h("button.btn.btn--ghost.btn--big", { text: "Hold", style: { flex: "1" }, on: { click: () => dispatch({ type: "collapse" }) } }),
      h("button.btn.btn--big", { text: "Verify", style: { flex: "2" }, on: { click: () => dispatch({ type: "expand-set", patch: { step: 2 } }) } })
    )
  );
}

function sessionsView(state, dispatch, table) {
  const people = playersForTable(state.players, table.id).slice(0, 6);
  return h(
    "div.xp__body",
    {},
    h(
      "div.xp__list",
      {},
      people.length
        ? people.map((p) =>
            h(
              "button.xp__row",
              { on: { click: () => dispatch({ type: "open-player", playerId: p.id }) } },
              h("span.mono", { text: String(p.seat), style: { width: "26px", fontWeight: "700", color: "var(--ink-3)" } }),
              h("span", { text: p.name, style: { flex: "1", fontWeight: "600" } }),
              h("span.mono", { text: p.sessions[0] ? `${p.sessions[0].from}` : "", style: { width: "48px", color: "var(--ink-3)" } }),
              h("span.mono", { text: `theo ${compact(p.theoWin)}`, style: { width: "88px", textAlign: "right", color: "var(--ink-2)" } })
            )
          )
        : h("div.rail-empty", { text: "No sessions open." })
    ),
    h("span", { style: { flex: "1" } }),
    navRow(h("button.btn.btn--ghost.btn--big", { text: "All sessions", style: { flex: "1" }, on: { click: () => dispatch({ type: "go-table", tableId: table.id, tab: "sessions" }) } }))
  );
}

function playersView(state, dispatch, table) {
  const people = playersForTable(state.players, table.id).slice(0, 6);
  return h(
    "div.xp__body",
    {},
    h(
      "div.xp__list",
      {},
      people.length
        ? people.map((p) => {
            const up = -p.winLoss;
            return h(
              "button.xp__row",
              { on: { click: () => dispatch({ type: "open-player", playerId: p.id }) } },
              h("span.mono", { text: String(p.seat), style: { width: "26px", fontWeight: "700", color: "var(--ink-3)" } }),
              h("span", { text: p.name, style: { flex: "1", fontWeight: "600" } }),
              h("span.mono", { text: `avg ${compact(p.avgBet)}`, style: { width: "74px", color: "var(--ink-3)" } }),
              h("span.mono", { text: (up > 0 ? "+" : up < 0 ? "−" : "") + compact(Math.abs(up)), style: { width: "64px", textAlign: "right", fontWeight: "700", color: up > 0 ? "var(--critical-ink)" : "var(--ink-2)" } })
            );
          })
        : h("div.rail-empty", { text: "Nobody seated." })
    ),
    h("span", { style: { flex: "1" } }),
    navRow(h("button.btn.btn--ghost.btn--big", { text: "Players tab", style: { flex: "1" }, on: { click: () => dispatch({ type: "go-table", tableId: table.id, tab: "players" }) } }))
  );
}

/**
 * Set Limit, with the Table Dashboard's fields. Pick a profile; its main bet
 * limits show first and every side bet's minimum and maximum below, scrolling
 * inside the panel so the buttons stay in reach.
 */
function limitsView(state, dispatch, table) {
  const ex = state.expand;
  const profiles = limitProfiles(table);
  const picked = profiles.find((p) => p.id === ex.reason) || profiles[0];
  const changed = !!ex.reason && ex.reason !== profiles[0].id;
  const row = (label, a, b) =>
    h("div.lx-row", {}, h("span.lx-label", { text: label }), a, b || h("span"));
  const val = (tag, v) => h("span.lx-val", {}, tag ? h("span.lx-tag", { text: tag }) : null, h("b.mono", { text: v }));
  return h(
    "div.xp__body",
    {},
    h(
      "div.lx-profiles",
      {},
      profiles.map((p) => h("button.option.option--tight.lx-profile", { text: p.name, "aria-pressed": String(picked.id === p.id), on: { click: () => dispatch({ type: "expand-set", patch: { reason: p.id } }) } }))
    ),
    h(
      "div.lx-scroll",
      {},
      row("Commission", val("", picked.commission)),
      row("Banker / Player", val("Min", money(picked.bpMin)), val("Differential", money(picked.differential))),
      row("Banker bet increment", val("", money(picked.bankerIncrement))),
      h("div.lx-sub", {}, h("span.micro", { text: "Side bets" }), h("span.micro", { text: "Min" }), h("span.micro", { text: "Max (table)" })),
      picked.side.map((x) => h("div.lx-side", {}, h("span", { text: x.label }), h("b.mono", { text: money(x.min) }), h("b.mono", { text: money(x.max) })))
    ),
    navRow(
      h("button.btn.btn--ghost.btn--big", { text: "Cancel", style: { flex: "1" }, on: { click: () => dispatch({ type: "collapse" }) } }),
      h("button.btn.btn--big", {
        text: "Apply", style: { flex: "2" }, disabled: changed ? null : "",
        on: { click: () => { dispatch({ type: "collapse" }); dispatch({ type: "toast", message: `${table.name} limits change from the next hand.` }); } },
      })
    )
  );
}

/** Inventory from a tile: the three figures, the tray, and Scan. */
function inventoryView(state, dispatch, table, { onScan }) {
  const inv = inventoryFor(table);
  const scanning = !!state.scanning[table.id];
  const fig = (label, value, color) => h("div.xp__fig", {}, h("span.micro", { text: label }), h("b.mono", { text: value, style: color ? { color } : {} }));
  return h(
    "div.xp__body",
    {},
    h("div.xp__figs", {}, fig("Actual", compact(inv.actual)), fig("Expected", compact(inv.expected)), fig("Variance", money(inv.variance), inv.variance ? "var(--critical-ink)" : null)),
    h("div.ix-tray", {}, inv.rows.map((r) => h("div.ix-den", {}, h("span.mono", { text: compact(r.value) }), h("b.mono", { text: String(r.count) })))),
    h("span", { style: { flex: "1" } }),
    navRow(
      h("button.btn.btn--ghost.btn--big", { style: { flex: "1" }, on: { click: () => dispatch({ type: "go-table", tableId: table.id, tab: "inventory" }) } }, "Full inventory"),
      h("button.btn.btn--big", { style: { flex: "1" }, disabled: scanning || table.status === "offline" ? "" : null, on: { click: () => onScan(table.id) } }, iconScan(18), scanning ? " Scanning" : " Scan")
    )
  );
}

/** Everything open at this one table, Actions first, each closable here. */
function alertsView(state, dispatch, table, { onAlert, onResolve }) {
  const items = alertsForTable(state.alerts, table.id).filter((a) => a.kind !== "receipt");
  const ordered = [...items.filter((a) => a.kind === "action"), ...items.filter((a) => a.kind !== "action")];
  return h(
    "div.xp__body",
    {},
    ordered.length
      ? h(
          "div.ax-list",
          {},
          ordered.map((a) =>
            h(
              "div.ax-row",
              { data: { kind: a.kind } },
              h("span", { style: { flex: "1", minWidth: "0" } }, h("span.ax-title", { text: a.title }), h("span.ax-sub", { text: [a.kind === "action" ? "Action" : "Alert", a.subject && a.subject.seat ? `seat ${a.subject.seat}` : null, age(a.ageSeconds)].filter(Boolean).join(" · ") })),
              a.actions[0] ? h("button.btn", { text: a.enroute ? "Close" : a.actions[0].label, on: { click: () => onAlert(a) } }) : null,
              h("button.icon-btn.ax-x", { "aria-label": `Close ${a.title}`, title: "Close", on: { click: () => onResolve(a.id, `${a.title} closed. It is in Activity.`, { title: `${a.title} closed`, detail: "by Ana Lopes" }) } }, iconClose(15))
            )
          )
        )
      : h("div.rail-clear", {}, h("span.display", { text: "Nothing open at this table" })),
    h("span", { style: { flex: "1" } }),
    navRow(h("button.btn.btn--ghost.btn--big", { text: "Done", style: { flex: "1" }, on: { click: () => dispatch({ type: "collapse" }) } }))
  );
}

/**
 * Enter a rating from a seat card, or a manual rating from Sessions. Pick
 * the seat if it is not already known, set the average bet, save.
 */
const RATE_PRESETS = [1000, 5000, 10000, 25000, 50000, 100000];
function rateView(state, dispatch, table) {
  const ex = state.expand;
  const seated = playersForTable(state.players, table.id);
  const p = seated.find((x) => x.id === ex.reason) || null;
  const avg = ex.amount || (p ? p.avgBet : 0);
  const set = (patch) => dispatch({ type: "expand-set", patch });
  return h(
    "div.xp__body",
    {},
    h("div.micro", { text: "Player" }),
    h(
      "div.rx-seats",
      {},
      seated.map((x) => h("button.option.option--tight", { "aria-pressed": String(p && p.id === x.id), on: { click: () => set({ reason: x.id, amount: x.avgBet }) } }, h("b", { text: `${x.seat}` }), ` ${x.name}`))
    ),
    h("div.micro", { text: "Average bet" }),
    h(
      "div.pa__stepper",
      {},
      h("button.btn.btn--ghost", { text: "\u2212", "aria-label": "Lower", on: { click: () => set({ amount: Math.max(table.limits.min, avg - table.limits.min) }) } }),
      h("b.mono", { text: money(avg) }),
      h("button.btn.btn--ghost", { text: "+", "aria-label": "Raise", on: { click: () => set({ amount: avg + table.limits.min }) } })
    ),
    h("div.pa__presets", {}, RATE_PRESETS.filter((v) => v >= table.limits.min && v <= table.limits.max).map((v) => h("button.chip", { text: compact(v), "aria-pressed": String(avg === v), on: { click: () => set({ amount: v }) } }))),
    p ? h("div.xp__line", {}, h("span.micro", { text: "Session" }), h("span", { text: `Seat ${p.seat} · since ${(p.sessions[0] || {}).from || "today"}` })) : null,
    h("span", { style: { flex: "1" } }),
    navRow(
      h("button.btn.btn--ghost.btn--big", { text: "Cancel", style: { flex: "1" }, on: { click: () => dispatch({ type: "collapse" }) } }),
      h("button.btn.btn--big", { text: "Save rating", style: { flex: "2" }, disabled: p && avg ? null : "", on: { click: () => { dispatch({ type: "collapse" }); dispatch({ type: "toast", message: `Rating saved for ${p.name}: average bet ${money(avg)}.` }); } } })
    )
  );
}

function overrideView(state, dispatch, table) {
  const ex = state.expand;
  const over = findOverride(ex.overrideId);
  const label = over ? over.label : "Override";
  if (ex.step === 2) {
    return h(
      "div.xp__body",
      {},
      stepDone(label, ex.reason, () => dispatch({ type: "expand-set", patch: { step: 1 } })),
      h("span", { style: { flex: "1" } }),
      signStep("Second signature goes on the audit trail", () => {
        dispatch({ type: "collapse" });
        dispatch({ type: "toast", message: `${label} recorded on ${table.name}.` });
      }),
      navRow(h("button.btn.btn--ghost.btn--big", { text: "Back", style: { flex: "1" }, on: { click: () => dispatch({ type: "expand-set", patch: { step: 1 } }) } }))
    );
  }
  return h(
    "div.xp__body",
    {},
    h("div.xp__big", { text: label }),
    h("div", { style: { display: "flex", flexDirection: "column", gap: "7px" } },
      OVERRIDE_REASONS.map((r) => h("button.option.option--tight", { text: r, "aria-pressed": String(ex.reason === r), on: { click: () => dispatch({ type: "expand-set", patch: { reason: r } }) } }))
    ),
    h("span", { style: { flex: "1" } }),
    navRow(
      h("button.btn.btn--ghost.btn--big", { text: "Cancel", style: { flex: "1" }, on: { click: () => dispatch({ type: "collapse" }) } }),
      h("button.btn.btn--big", { text: "Continue", style: { flex: "2" }, disabled: ex.reason ? null : "", on: { click: () => dispatch({ type: "expand-set", patch: { step: 2 } }) } })
    )
  );
}

export { findPlayer };
