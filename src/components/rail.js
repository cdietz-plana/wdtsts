import { h } from "../lib/dom.js";
import { age, compact } from "../lib/format.js";
import { iconClose, iconTick } from "./icons.js";
import { actionsOf, alertsOnly, closedPlayersList, findTable, openPlayers, receiptsOf } from "../lib/selectors.js";
import { schedule } from "../data/alerts.js";
import { requestContext } from "./expand.js";

/**
 * The right rail. Three tabs, Actions first because that is the order of
 * urgency: Actions need the manager now, Alerts are worth knowing, Players
 * is who is in the section.
 *
 * Every Action row carries its own button, so the common answer (authorize,
 * on my way, review the hand) is one touch from anywhere.
 */
export function rail(state, dispatch, { onAlert, onResolve }, scopeTableId = null) {
  const scope = scopeTableId ? state.alerts.filter((a) => a.tableId === scopeTableId) : state.alerts;
  const actions = actionsOf(scope);
  const alerts = alertsOnly(scope).sort((a, b) => a.ageSeconds - b.ageSeconds);
  const people = scopeTableId ? state.players.filter((p) => p.tableId === scopeTableId) : state.players;

  const tabs = h(
    "div.segmented.segmented--sm.segmented--fill.rail-tabs",
    { role: "group", "aria-label": "Rail" },
    [
      ["actions", "Actions", actions.length, "action"],
      ["alerts", "Alerts", alerts.length, "alert"],
      ["players", "Players", null, null],
    ].map(([id, label, n, kind]) =>
      h(
        "button",
        { "aria-pressed": String(state.rail === id), on: { click: () => dispatch({ type: "rail", rail: id }) } },
        label,
        n ? h("span.count-badge", { text: String(n), data: { kind } }) : null
      )
    )
  );

  let body;
  if (state.rail === "players") body = playersList(state, dispatch, people);
  else if (state.rail === "alerts") {
    const receipts = receiptsOf(scope).sort((a, b) => a.ageSeconds - b.ageSeconds).slice(0, 8);
    body = [
      scheduleStrip(state),
      alerts.length ? alerts.map((a) => row(state, a, onAlert, onResolve)) : h("div.rail-clear", {}, h("span.display", { text: "No alerts" })),
      // Receipts: things that already happened. Never counted, never need a
      // tap, and they age out on their own.
      receipts.length ? h("div.rail-sub", { text: "Activity" }) : null,
      receipts.map((r) => activityRow(state, r)),
    ];
  } else {
    // Dealer requests first: a person is standing at a table waiting.
    const ordered = [...actions.filter((a) => a.source === "dealer"), ...actions.filter((a) => a.source !== "dealer")];
    body = ordered.length ? ordered.map((a) => row(state, a, onAlert, onResolve)) : h("div.rail-clear", {}, h("span.display", { text: "Nothing needs you" }));
  }

  return h(
    "div.rail",
    {},
    h("div", { style: { padding: "12px 12px 8px", flexShrink: "0" } }, tabs),
    h("div.rail__list", {}, body)
  );
}

function row(state, a, onAlert, onResolve) {
  const table = findTable(state.tables, a.tableId);
  const who = a.subject ? (a.subject.seat ? `seat ${a.subject.seat}` : a.subject.name) : null;
  const isAction = a.kind === "action";
  const primary = a.actions[0];
  const fromDealer = a.source === "dealer";
  // For a dealer request the tablet supplies the context the dealer did not.
  const context = fromDealer && table ? requestContext(state, table, a).short : null;
  return h(
    "div.rail-row",
    { data: { kind: a.kind, enroute: !!a.enroute } },
    h(
      "div",
      { style: { display: "flex", alignItems: "baseline", gap: "8px" } },
      h("span.rail-row__title", { text: a.title }),
      h("span", { style: { flex: "1" } }),
      h("span.mono.rail-row__age", { text: age(a.ageSeconds), data: { live: `age:${a.id}` } }),
      // Review feedback: any Action or Alert can be closed. It leaves a line in
      // Activity, so closing is never losing.
      h("button.rail-row__x", { "aria-label": `Close ${a.title}`, title: "Close", on: { click: () => onResolve(a.id, `${a.title} closed. It is in Activity.`, { title: `${a.title} closed`, detail: "by Ana Lopes" }) } }, iconClose(14))
    ),
    context ? h("div.rail-row__ctx", { text: a.enroute ? "On my way · dealer told" : context }) : null,
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" } },
      h("span.rail-row__where", { text: [table ? table.name : "", who].filter(Boolean).join(" · ") }),
      isAction ? h("span.rail-row__src", { text: fromDealer ? "Dealer" : "System" }) : null,
      h("span", { style: { flex: "1" } }),
      h(isAction ? "button.btn.rail-row__btn" : "button.btn.btn--ghost.rail-row__btn", { text: a.enroute ? "Close" : primary.label, on: { click: () => onAlert(a) } })
    )
  );
}

function activityRow(state, r) {
  const table = findTable(state.tables, r.tableId);
  return h(
    "div.activity-row",
    {},
    h("span.activity-row__tick", { "aria-hidden": "true" }),
    h(
      "span",
      { style: { flex: "1", minWidth: "0" } },
      h("span.activity-row__title", { text: r.title }),
      h("span.activity-row__sub", { text: [table ? table.name : "", r.detail].filter(Boolean).join(" · ") })
    ),
    h("span.mono.activity-row__age", { text: age(r.ageSeconds), data: { live: `age:${r.id}` } })
  );
}

/**
 * Card Change and Roll Table run on preset times, so they are a countdown at
 * the top of Alerts, not a stream of messages. Inside 15 minutes the line
 * turns amber and reads as due.
 */
function scheduleStrip(state) {
  const until = (t) => Math.max(0, t - state.clockSeconds);
  const fmt = (secs) => {
    const m = Math.ceil(secs / 60);
    return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m` : `${m}m`;
  };
  const item = (label, t) => {
    const left = until(t);
    return h("div.sched", { data: { due: left <= 15 * 60 } }, h("span.micro", { text: label }), h("b.mono", { text: left <= 0 ? "Now" : `in ${fmt(left)}`, data: { live: `until:${t}` } }));
  };
  return h("div.sched-strip", {}, item("Card change", schedule.cardChange), item("Roll table", schedule.roll));
}

function playersList(state, dispatch, people) {
  const open = openPlayers(people);
  const closed = closedPlayersList(people);
  const list = state.playerList === "closed" ? closed : open;

  const tabs = h(
    "div.segmented.segmented--sm.segmented--fill",
    { role: "group", "aria-label": "Which players" },
    [["open", "Open", open.length], ["closed", "Closed", closed.length]].map(([id, label, n]) =>
      h(
        "button",
        { "aria-pressed": String(state.playerList === id), on: { click: () => dispatch({ type: "player-list", list: id }) } },
        label,
        h("span.count-badge.count-badge--quiet", { text: String(n) })
      )
    )
  );

  const rows = list.slice(0, 9).map((p) => {
    const table = findTable(state.tables, p.tableId);
    const up = -p.winLoss;
    return h(
      "button.row",
      { style: { alignItems: "center", flexShrink: "0" }, on: { click: () => dispatch({ type: "open-player", playerId: p.id }) } },
      h(
        "span",
        { style: { flex: "1", minWidth: "0" } },
        h("span", { text: p.name, style: { display: "block", fontSize: "var(--t-body)", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }),
        h("span", { text: p.closed ? `${table ? table.name : ""} · left ${p.left}` : `${table ? table.name : ""} · seat ${p.seat}`, style: { display: "block", fontSize: "var(--t-micro)", color: "var(--ink-3)" } })
      ),
      h(
        "span",
        { style: { textAlign: "right", flexShrink: "0" } },
        h("span.mono", {
          text: (up > 0 ? "+" : up < 0 ? "−" : "") + compact(Math.abs(up)),
          style: { display: "block", fontSize: "var(--t-body)", fontWeight: "700", color: up > 0 ? "var(--critical-ink)" : "var(--ink-2)" },
        }),
        h("span", { text: `avg ${compact(p.avgBet)}`, style: { display: "block", fontSize: "var(--t-micro)", color: "var(--ink-3)" } })
      )
    );
  });

  return [
    playerAlertStrip(state, dispatch),
    h("div", { style: { padding: "0 4px 6px", flexShrink: "0" } }, tabs),
    h("div", { style: { display: "flex", justifyContent: "space-between", padding: "2px 12px 4px", flexShrink: "0" } }, h("span.micro", { text: "Player" }), h("span.micro", { text: "Player win" })),
    rows.length ? rows : h("div.rail-empty", { text: state.playerList === "closed" ? "Nobody has left yet." : "Nobody is seated." }),
  ];
}

/**
 * Player alerts, editable where they matter.
 *
 * "Tell me any time a player is up 50,000" is decided on the floor, in the
 * moment, so the rules sit at the top of the Players tab rather than in a
 * settings screen. A tap on a rule is the quick edit: preset amounts and a
 * stepper. The Alerts tab updates as soon as a value changes. Compliance
 * rules show but cannot be changed here.
 */
const RULES = [
  { id: "th5", label: "Win", long: "player win" },
  { id: "th6", label: "Loss", long: "player loss" },
  { id: "th8", label: "Avg bet", long: "average bet" },
  { id: "th7", label: "Buy-in", long: "cumulative buy-in" },
];

function playerAlertStrip(state, dispatch) {
  const rule = (r) => state.thresholds.find((t) => t.id === r.id);
  const editing = state.thresholdEdit;
  const chips = RULES.map((r) => {
    const t = rule(r);
    if (!t) return null;
    const locked = t.owner !== "own";
    return h(
      "button.pa__chip",
      {
        "aria-pressed": String(editing === r.id),
        data: { locked },
        on: { click: () => dispatch({ type: "threshold-edit", open: editing === r.id ? false : r.id }) },
      },
      h("span.micro", { text: r.label }),
      h("b.mono", { text: `${compact(t.value)}+` })
    );
  });

  const t = editing ? state.thresholds.find((x) => x.id === editing) : null;
  const r = t ? RULES.find((x) => x.id === t.id) : null;
  const editor = t
    ? h(
        "div.pa__edit",
        {},
        h(
          "div.pa__edit-head",
          {},
          h("span", { style: { flex: "1" } }, h("span.pa__edit-title", { text: `Alert me when ${r.long} is over` }), t.owner !== "own" ? h("span.pa__edit-note", { text: "Set by compliance. Shown, not editable." }) : null),
          h("button.icon-btn", { "aria-label": "Done", on: { click: () => dispatch({ type: "threshold-edit", open: false }) } }, iconTick(15))
        ),
        h(
          "div.pa__stepper",
          {},
          h("button.btn.btn--ghost", { text: "\u2212", "aria-label": "Lower", disabled: t.owner !== "own" ? "" : null, on: { click: () => dispatch({ type: "threshold", id: t.id, delta: -1 }) } }),
          h("b.mono", { text: t.value.toLocaleString("en-US") }),
          h("button.btn.btn--ghost", { text: "+", "aria-label": "Raise", disabled: t.owner !== "own" ? "" : null, on: { click: () => dispatch({ type: "threshold", id: t.id, delta: 1 }) } })
        ),
        t.presets && t.owner === "own"
          ? h(
              "div.pa__presets",
              {},
              t.presets.map((v) => h("button.chip", { text: compact(v), "aria-pressed": String(t.value === v), on: { click: () => dispatch({ type: "threshold-set", id: t.id, value: v }) } }))
            )
          : null,
        h("div.pa__hits", { text: hits(state, t.id) })
      )
    : null;

  return h("div.pa", {}, h("div.pa__head", {}, h("span.micro", { text: "Player alerts" })), h("div.pa__chips", {}, chips), editor);
}

/** How many seated players this rule catches right now, so the edit has a visible effect. */
function hits(state, id) {
  const n = state.alerts.filter((a) => a.gen === "player" && a.id.startsWith(id === "th5" ? "pw-" : id === "th6" ? "pl-" : "pa-")).length;
  if (id === "th7") return "Applies to every player. Raises an AML Action.";
  return n === 1 ? "1 player over this now. See Alerts." : `${n} players over this now.${n ? " See Alerts." : ""}`;
}
