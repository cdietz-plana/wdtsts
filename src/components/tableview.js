import { h } from "../lib/dom.js";
import { chipTray } from "../data/pods.js";
import { age, money } from "../lib/format.js";
import { currentHand, gamesFor } from "../data/games.js";
import { alertsForTable, findPod, findTable, limitsLabel, playersForTable, shortTableLabel } from "../lib/selectors.js";
import { handView } from "./cards.js";
import { iconScan } from "./icons.js";
import { felt, seats } from "./seats.js";

/**
 * Six tabs, named for the task rather than the data. View Table becomes Live
 * and moves to the front, because on a walking device it substitutes for
 * standing at the table. Inventory becomes Chips. Game and Session keep their
 * jobs: one is the hands, the other is the people over time.
 */
const TABS = [
  ["live", "Live"], ["chips", "Chips"], ["players", "Players"],
  ["sessions", "Sessions"], ["games", "Games"], ["override", "Override"],
];

export function tableView(state, dispatch, { onScan, onAdjust, onOrderFill, onResolve }) {
  const table = findTable(state.pods, state.tableId);
  if (!table) return h("div");

  const tabs = h(
    "div.tabs",
    { role: "tablist" },
    TABS.map(([id, label]) =>
      h("button", { role: "tab", text: label, "aria-pressed": String(state.tab === id), on: { click: () => dispatch({ type: "tab", tab: id }) } })
    )
  );

  let body;
  if (state.tab === "chips") body = chipsTab(state, table, onScan, onAdjust, onOrderFill);
  else if (state.tab === "live") body = liveTab(state, table, dispatch);
  else if (state.tab === "players") body = playersTab(state, table, dispatch, onResolve);
  else if (state.tab === "sessions") body = sessionsTab(state, table, dispatch);
  else if (state.tab === "games") body = gamesTab(table);
  else body = stubTab(state.tab);

  const pod = findPod(state.pods, state.podId);
  // "Easy navigation from table to table": the other three are one tap away
  // and never more than one tap, because a supervisor comparing two tables in
  // a pod should not have to climb out and back in.
  const switcher = h(
    "div.segmented.segmented--sm",
    { role: "group", "aria-label": "Tables in this pod" },
    pod.tables.map((t) =>
      h("button", {
        text: shortTableLabel(t, pod) === "Primary" ? "PT" : shortTableLabel(t, pod),
        "aria-pressed": String(t.id === table.id),
        "aria-label": t.name,
        on: { click: () => dispatch({ type: "go-table", podId: pod.id, tableId: t.id }) },
      })
    )
  );

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "14px", flex: "1", minHeight: "0" } },
    h("div", { style: { display: "flex", alignItems: "center", gap: "12px", flexShrink: "0" } }, tabs, h("span", { style: { flex: "1" } }), switcher),
    body
  );
}

const stat = (label, value, alarming, live) =>
  h(
    "div.card",
    { style: { flex: "1", padding: "16px 18px", ...(alarming ? { borderColor: "var(--critical)", background: "var(--critical-wash)" } : {}) } },
    h(
      "div.micro",
      { style: alarming ? { color: "var(--critical)" } : {} },
      label,
      // The age ticks, so it is its own node and the label around it is not
      // rebuilt once a second.
      live ? h("span", { text: age(live.ageSeconds), data: { live: `age:${live.id}` } }) : null
    ),
    h("div.mono.display", { text: value, style: { fontSize: "var(--t-hero)", fontWeight: "700", marginTop: "4px", color: alarming ? "var(--critical)" : "" } })
  );

function chipsTab(state, table, onScan, onAdjust, onOrderFill) {
  const varianceAlert = alertsForTable(state.alerts, table.id).find((a) => a.title.includes("tray"));
  const totalChips = chipTray.reduce((n, d) => n + d.count, 0);

  const dial = h(
    "div.card",
    { style: { width: "300px", flexShrink: "0", padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px" } },
    h(
      "button.scan-dial",
      { data: { scanning: state.scanning }, "aria-label": "Scan the chip tray", on: { click: onScan } },
      iconScan(),
      state.scanning ? null : h("span.display", { text: "Scan", style: { fontSize: "var(--t-title)", fontWeight: "600" } })
    ),
    h(
      "div",
      { style: { textAlign: "center" } },
      h("div.micro", { text: "Last scan" }),
      h("div.mono", { text: "18:21 · 2 failed before", style: { fontSize: "var(--t-body)", color: "var(--ink-2)", marginTop: "2px" } })
    )
  );

  const denominations = h(
    "div",
    { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" } },
    chipTray.map((d) => {
      const moved = !!table.variance && d.denomination === "500";
      return h(
        "div.den",
        { style: moved ? { background: "var(--critical-wash)", border: "1px solid var(--critical-edge)" } : {} },
        h("span", { text: d.denomination, style: { color: moved ? "var(--critical)" : "var(--ink-2)", fontWeight: moved ? "600" : "400" } }),
        h("span.mono", { text: `${d.count}${moved ? " −2" : ""}`, style: { color: moved ? "var(--critical)" : "var(--ink)", fontWeight: moved ? "600" : "400" } })
      );
    })
  );

  const tray = h(
    "div.card",
    { style: { flex: "1", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px", minWidth: "0" } },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
      h("span.display", { text: "Chip tray · both trays", style: { fontSize: "var(--t-body)", fontWeight: "600" } }),
      h("span.tag", { text: `${totalChips} CHIPS`, style: { background: "var(--surface-soft)", color: "var(--ink-2)" } })
    ),
    denominations,
    h("div", {
      text: table.variance ? "Only the denomination that moved is called out. The rest stay quiet." : "Balanced. Nothing to chase.",
      style: { fontSize: "var(--t-micro)", color: "var(--ink-3)" },
    }),
    h(
      "div",
      { style: { display: "flex", gap: "9px", alignSelf: "flex-start", marginTop: "2px" } },
      table.variance
        ? h("button.btn.btn--big", { text: "Adjust the tray", on: { click: () => onAdjust(table.id) } })
        : null,
      // Review feedback: a supervisor could authorise a fill somebody else
      // asked for but had no way to raise one, which is the half of the job
      // they actually start.
      h("button.btn.btn--ghost.btn--big", {
        text: "Order a fill",
        on: { click: () => onOrderFill(table.id) },
      })
    )
  );

  return h(
    "div.fade-in",
    { style: { display: "flex", flexDirection: "column", gap: "14px", flex: "1", minHeight: "0" } },
    h(
      "div",
      { style: { display: "flex", gap: "14px" } },
      stat("Actual", money(table.actualInventory)),
      stat("Expected", money(table.expectedInventory)),
      stat(varianceAlert ? "Variance · open " : "Variance", money(table.variance), !!table.variance, varianceAlert)
    ),
    h("div", { style: { display: "flex", gap: "14px", flex: "1", minHeight: "0" } }, dial, tray)
  );
}

const big = (label, value) =>
  h("div", { style: { textAlign: "center" } }, h("div.micro", { text: label }), h("div.mono.display", { text: value, style: { fontSize: "var(--t-metric)", fontWeight: "700" } }));

function liveTab(state, table, dispatch) {
  if (table.status === "offline") {
    return h(
      "div.card.fade-in",
      { style: { flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "18px", padding: "24px", textAlign: "center" } },
      h("div.display", { text: "Table is dark", style: { fontSize: "var(--t-hero)", fontWeight: "700", color: "var(--critical)" } }),
      h("div", {
        text: `No live view while ${table.name} is offline. The pod is still dealing on the other three. Last good chip count was 18:04.`,
        style: { fontSize: "var(--t-action)", color: "var(--ink-2)", maxWidth: "420px", lineHeight: "1.5" },
      })
    );
  }

  const hand = currentHand(table.id);
  return h(
    "div.card.fade-in",
    { style: { flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "18px", padding: "24px" } },
    seats(table, playersForTable(state.players, table.id), {
      scale: 1.55,
      gap: 10,
      onPick: (player) => dispatch({ type: "open-player", playerId: player.id }),
    }),
    // Rank and suit, as asked. Up to now this drew four blank rectangles,
    // which told a supervisor that cards exist.
    felt(table, { width: 480, height: 168, children: handView(hand, { size: "lg" }) }),
    h(
      "div",
      { style: { display: "flex", gap: "28px" } },
      big("Shoe", String(hand.shoe)),
      big("Game", String(hand.game)),
      big("Seated", `${table.seated} / ${table.seats}`),
      big("Limits", limitsLabel(table))
    ),
    h("div", {
      text: "Tap a seat to open that player. ASSUMED: this is our drawing of the game, not the dealer display itself.",
      style: { fontSize: "var(--t-detail)", color: "var(--ink-3)" },
    })
  );
}

const seatChip = (n) =>
  h("span", {
    text: String(n),
    style: {
      width: "36px", height: "36px", borderRadius: "10px", background: "var(--surface-soft)",
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "var(--t-body)", flexShrink: "0",
    },
  });

/** Empty seats are a count, not rows. Fourteen rows to show four people is the
 *  scrolling problem the brief asks us to design out. */
const emptySeats = (table, seated) =>
  h(
    "div",
    { style: { fontSize: "var(--t-detail)", color: "var(--ink-3)", padding: "2px 4px" } },
    `${table.seats - seated} of ${table.seats} seats open`
  );

function playersTab(state, table, dispatch, onResolve) {
  const stillOpen = state.alerts.some((a) => a.id === "a3");
  const seated = playersForTable(state.players, table.id);

  const rows = seated.map((p) => {
    const flagged = p.buyIn >= 500000 && stillOpen && p.name === "K. Leung";
    return h(
      "div.card",
      { style: { display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px", ...(flagged ? { borderColor: "var(--high-edge)" } : {}) } },
      seatChip(p.seat),
      h(
        "div",
        { style: { flex: "1", minWidth: "0" } },
        h("div", { text: p.name, style: { fontSize: "var(--t-body)", fontWeight: "600" } }),
        h("div", { text: p.rated ? `${p.tier} · card ${p.card}` : "Anonymous · no card", style: { fontSize: "var(--t-detail)", color: "var(--ink-3)" } })
      ),
      figureCell("Buy-in today", money(p.buyIn), flagged ? "var(--high)" : ""),
      figureCell("Theo win", money(p.theoWin)),
      figureCell("Win / loss", money(p.winLoss), p.winLoss < 0 ? "var(--critical)" : "var(--ok)"),
      flagged ? h("span.tag", { text: "THRESHOLD", style: { background: "var(--high-wash)", color: "var(--high)" } }) : null,
      flagged ? h("button.btn", { text: "Log AML", on: { click: () => onResolve("a3", "AML entry logged against seat 4.") } }) : null,
      h("button.btn.btn--ghost", {
        text: p.rated ? "Record" : "Attach card",
        on: { click: () => dispatch({ type: "open-player", playerId: p.id }) },
      })
    );
  });

  return h(
    "div.fade-in",
    { style: { display: "flex", flexDirection: "column", gap: "10px", flex: "1", minHeight: "0" } },
    rows.length ? rows : h("div.card", { text: "Nobody seated.", style: { padding: "24px", textAlign: "center", color: "var(--ink-3)" } }),
    emptySeats(table, seated.length)
  );
}

const figureCell = (label, value, color) =>
  h(
    "div",
    { style: { textAlign: "right", flexShrink: "0", minWidth: "96px" } },
    h("div.micro", { text: label }),
    h("div.mono.display", { text: value, style: { fontSize: "var(--t-title)", fontWeight: "600", color: color || "", whiteSpace: "nowrap" } })
  );

/**
 * Session tab. The Player tab answers "who is in seat 4 right now"; this one
 * answers "what has this table been worth, and to whom". Same people, a
 * different question, which is why it is a tab and not a filter.
 */
function sessionsTab(state, table, dispatch) {
  const seated = playersForTable(state.players, table.id);
  const totals = seated.reduce(
    (acc, p) => ({ handle: acc.handle + p.handle, theo: acc.theo + p.theoWin, wl: acc.wl + p.winLoss }),
    { handle: 0, theo: 0, wl: 0 }
  );

  const header = h(
    "div.card",
    { style: { display: "flex", alignItems: "center", gap: "22px", padding: "14px 18px", flexShrink: "0" } },
    h("div", {}, h("div.micro", { text: "Rated sessions open" }), h("div.mono.display", { text: String(seated.filter((p) => p.rated).length), style: { fontSize: "var(--t-metric)", fontWeight: "700" } })),
    h("span", { style: { flex: "1" } }),
    figureCell("Table handle", money(totals.handle)),
    figureCell("Theoretical win", money(totals.theo)),
    figureCell("Player win / loss", money(totals.wl), totals.wl < 0 ? "var(--critical)" : "var(--ok)")
  );

  const rows = seated.flatMap((p) =>
    p.sessions.map((sx) =>
      h(
        "button.card",
        {
          style: { display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit", width: "100%" },
          on: { click: () => dispatch({ type: "open-player", playerId: p.id }) },
        },
        seatChip(p.seat),
        h(
          "div",
          { style: { flex: "1", minWidth: "0" } },
          h("div", { text: p.name, style: { fontSize: "var(--t-action)", fontWeight: "600" } }),
          h("div", { text: `${sx.day} · ${sx.from} to ${sx.to} · ${sx.table}`, style: { fontSize: "var(--t-detail)", color: "var(--ink-3)" } })
        ),
        figureCell("Handle", money(sx.handle)),
        figureCell("Theo", money(sx.theoWin)),
        figureCell("Win / loss", money(sx.winLoss), sx.winLoss < 0 ? "var(--critical)" : "var(--ok)")
      )
    )
  );

  return h(
    "div.fade-in",
    { style: { display: "flex", flexDirection: "column", gap: "10px", flex: "1", minHeight: "0" } },
    header,
    rows.length ? rows : h("div.card", { text: "No sessions on this table today.", style: { padding: "24px", textAlign: "center", color: "var(--ink-3)" } })
  );
}

/**
 * Game tab. Arrived at holding a game number or a time, never read in order,
 * so the corrected column is the one that matters: it is the only thing a
 * dispute turns on.
 */
function gamesTab(table) {
  const rows = gamesFor(table.id);

  const head = h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: "14px", padding: "0 16px", flexShrink: "0" } },
    h("span.micro", { text: "Shoe 9 · this gaming day", style: { flex: "1" } }),
    h("span.micro", { text: "Banker / Player" }),
    h("span.micro", { text: "Handle", style: { width: "96px", textAlign: "right" } }),
    h("span.micro", { text: "Result", style: { width: "96px", textAlign: "right" } })
  );

  return h(
    "div.fade-in",
    { style: { display: "flex", flexDirection: "column", gap: "7px", flex: "1", minHeight: "0" } },
    head,
    rows.flatMap((g, i) => {
      const boundary =
        i > 0 && rows[i - 1].shoe !== g.shoe
          ? h(
              "div",
              { style: { display: "flex", alignItems: "center", gap: "10px", padding: "6px 16px 2px" } },
              h("span.micro", { text: `Shoe ${g.shoe} ended · cards changed · pod stopped 1m 40s` }),
              h("span", { style: { flex: "1", height: "1px", background: "var(--line)" } })
            )
          : null;
      return [boundary, gameRow(g)];
    })
  );
}

function gameRow(g) {
  return h(
        "div.card",
        {
          style: {
            display: "flex", alignItems: "center", gap: "12px", padding: "8px 16px",
            ...(g.corrected ? { borderColor: "var(--high-edge)", background: "var(--high-wash)" } : {}),
          },
        },
        h("span.mono", { text: `${g.shoe}-${g.game}`, style: { width: "52px", fontSize: "var(--t-body)", fontWeight: "700", color: "var(--ink-3)" } }),
        h("span.mono", { text: g.at, style: { width: "54px", fontSize: "var(--t-body)", color: "var(--ink-3)" } }),
        h("span", { text: g.outcome, style: { width: "74px", fontSize: "var(--t-action)", fontWeight: "600" } }),
        g.corrected
          ? h("span.tag", { text: g.corrected.toUpperCase(), style: { background: "var(--high-wash)", color: "var(--high)" } })
          : h("span", { style: { flex: "1" } }),
        g.corrected ? h("span", { style: { flex: "1" } }) : null,
        h("span.mono", { text: `${g.banker} / ${g.player}`, style: { fontSize: "var(--t-body)", color: "var(--ink-2)" } }),
        h("span.mono", { text: money(g.handle), style: { width: "96px", textAlign: "right", fontSize: "var(--t-body)" } }),
        h("span.mono", {
          text: money(g.result),
          style: { width: "96px", textAlign: "right", fontSize: "var(--t-body)", fontWeight: "600", color: g.result < 0 ? "var(--critical)" : "var(--ok)" },
        })
      );
}

const STUB_COPY = {
  override: [
    "Override",
    "Void hand, cancel bets, settle, card buffer. Every control here is urgent and consequential, so it opens as a confirmed action rather than a flat form. On a Secondary this screen is visibly smaller: Card Buffer, Void Hand and Burn Cards belong to the Primary.",
  ],
};

function stubTab(tab) {
  const [title, body] = STUB_COPY[tab];
  return h(
    "div.card.fade-in",
    { style: { flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "30px", textAlign: "center" } },
    h("div.display", { text: title, style: { fontSize: "var(--t-metric)", fontWeight: "700" } }),
    h("div", { text: body, style: { fontSize: "var(--t-action)", color: "var(--ink-2)", maxWidth: "520px", lineHeight: "1.55" } }),
    h("div", { text: "Not built out in this prototype.", style: { fontSize: "var(--t-detail)", color: "var(--ink-3)" } })
  );
}
