import { h } from "../lib/dom.js";
import { compact, money, percent } from "../lib/format.js";
import { alertsForTable, findPlayer, findTable, performance, playersForTable } from "../lib/selectors.js";
import { gamesFor } from "../data/games.js";
import { findOverride } from "./override.js";
import {
  iconCard, iconClose, iconFill, iconHistory, iconLimits, iconOpen, iconPower, iconScan, iconTick, iconUsers,
} from "./icons.js";

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

const FILL_AMOUNTS = [100000, 250000, 500000, 1000000];
const ADJUST_REASONS = ["Missing loser on the last hand", "Miscount at pay or take", "Chips in transit", "Other, add a note"];
const LIMIT_TEMPLATES = [
  { id: "std", label: "Standard", min: 1000, max: 100000 },
  { id: "prem", label: "Premium", min: 5000, max: 500000 },
  { id: "vip", label: "High limit", min: 10000, max: 1000000 },
];

const TITLES = {
  menu: null,
  fill: "Fill or credit",
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
      fig("Win", compact(perf.win), perf.win < 0 ? "var(--critical-ink)" : "var(--ok-ink)"),
      fig("Drop", compact(perf.drop)),
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
      quick(iconScan(20), state.scanning[table.id] ? "Scanning" : "Scan", () => onScan(table.id), { disabled: !open || table.status === "offline" }),
      quick(iconFill(20), "Fill / Credit", () => dispatch({ type: "expand-view", view: "fill" }), { disabled: !open }),
      quick(iconUsers(20), "Players", () => dispatch({ type: "expand-view", view: "players" })),
      quick(iconLimits(20), "Limits", () => dispatch({ type: "expand-view", view: "limits" })),
      quick(iconHistory(20), "Games", () => dispatch({ type: "expand-view", view: "games" })),
      quick(iconHistory(20), "Sessions", () => dispatch({ type: "expand-view", view: "sessions" })),
      quick(iconPower(20), open ? "Close table" : "Open table", () => dispatch({ type: "toast", message: `${table.name} ${open ? "close" : "open"} requested. Count runs first.` })),
      quick(iconOpen(20), "Full dashboard", () => dispatch({ type: "go-table", tableId: table.id }), { tone: "strong" })
    )
  );
}

/* -------------------------------------------------------------- fill/credit */

function fillView(state, dispatch, table, { onSendFill }) {
  const ex = state.expand;
  const mode = ex.mode || "fill";

  if (ex.step === 2) {
    return h(
      "div.xp__body",
      {},
      stepDone(mode === "fill" ? "Fill" : "Credit", `${money(ex.amount)} · ${table.name}`, () => dispatch({ type: "expand-set", patch: { step: 1 } })),
      h("span", { style: { flex: "1" } }),
      signStep(`${mode === "fill" ? "Fill" : "Credit"} request goes to the cage`, () => onSendFill(table.id, mode, ex.amount)),
      navRow(h("button.btn.btn--ghost.btn--big", { text: "Back", style: { flex: "1" }, on: { click: () => dispatch({ type: "expand-set", patch: { step: 1 } }) } }))
    );
  }

  return h(
    "div.xp__body",
    {},
    h(
      "div.segmented.segmented--fill",
      { role: "group", "aria-label": "Fill or credit" },
      [["fill", "Fill"], ["credit", "Credit"]].map(([id, label]) =>
        h("button", { text: label, "aria-pressed": String(mode === id), on: { click: () => dispatch({ type: "expand-set", patch: { mode: id } }) } })
      )
    ),
    h("div.micro", { text: mode === "fill" ? "Chips to the table" : "Chips back to the cage" }),
    h(
      "div.xp__amounts",
      {},
      FILL_AMOUNTS.map((n) =>
        h("button.option.xp__amount", { "aria-pressed": String(ex.amount === n), on: { click: () => dispatch({ type: "expand-set", patch: { amount: n } }) } },
          h("span.mono", { text: money(n) }))
      )
    ),
    h("span", { style: { flex: "1" } }),
    navRow(
      h("button.btn.btn--ghost.btn--big", { text: "Cancel", style: { flex: "1" }, on: { click: () => dispatch({ type: "collapse" }) } }),
      h("button.btn.btn--big", {
        text: ex.amount ? `${mode === "fill" ? "Request fill" : "Request credit"} · ${compact(ex.amount)}` : "Choose an amount",
        style: { flex: "2" },
        disabled: ex.amount ? null : "",
        on: { click: () => dispatch({ type: "expand-set", patch: { step: 2 } }) },
      })
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
    line("Tray now", money(table.actualInventory)),
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
      : navRow(h("button.btn.btn--ghost.btn--big", { text: "All games", style: { flex: "1" }, on: { click: () => dispatch({ type: "go-table", tableId: table.id, history: "games" }) } }))
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
    navRow(h("button.btn.btn--ghost.btn--big", { text: "All sessions", style: { flex: "1" }, on: { click: () => dispatch({ type: "go-table", tableId: table.id, history: "sessions" }) } }))
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

function limitsView(state, dispatch, table) {
  const ex = state.expand;
  const current = LIMIT_TEMPLATES.find((t) => t.min === table.limits.min) || null;
  const picked = ex.reason || (current && current.id);
  return h(
    "div.xp__body",
    {},
    h("div", { style: { display: "flex", flexDirection: "column", gap: "7px" } },
      LIMIT_TEMPLATES.map((t) =>
        h("button.option.option--tight", { "aria-pressed": String(picked === t.id), on: { click: () => dispatch({ type: "expand-set", patch: { reason: t.id } }) } },
          h("span", { text: t.label, style: { fontWeight: "600" } }),
          h("span.mono", { text: `  ${compact(t.min)} to ${compact(t.max)}`, style: { color: "var(--ink-3)" } })
        )
      )
    ),
    h("div.micro", { text: "Applies from the next hand" }),
    h("span", { style: { flex: "1" } }),
    navRow(
      h("button.btn.btn--ghost.btn--big", { text: "Cancel", style: { flex: "1" }, on: { click: () => dispatch({ type: "collapse" }) } }),
      h("button.btn.btn--big", {
        text: "Apply", style: { flex: "2" }, disabled: picked && (!current || picked !== current.id) ? null : "",
        on: { click: () => { dispatch({ type: "collapse" }); dispatch({ type: "toast", message: `${table.name} limits change from the next hand.` }); } },
      })
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
