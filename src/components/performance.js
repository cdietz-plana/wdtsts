import { h } from "../lib/dom.js";
import { compact } from "../lib/format.js";
import {
  alertsForPod, closedPlayersList, everyoneInPod, findTable, openPlayers, playersForPod,
} from "../lib/selectors.js";
import { AREA_NAME } from "./topbar.js";

/**
 * The people panel.
 *
 * Review feedback replaced the ranking chips (winners, losers, buy-in and so
 * on) with two tabs: Open, the players in action now, and Closed, the players
 * who played in this section earlier today and have left. Both lead with the
 * biggest player win. The section totals that used to head this panel now
 * live in the KPI strip in the bar.
 *
 * The Performance view that used to own this panel is gone. Its figures are
 * on the floor, in the KPI strip and in the table peek.
 */
export function playersPanel(state, dispatch, scope, switchEl) {
  const open = openPlayers(scope.players);
  const closed = closedPlayersList(scope.players);
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
    const table = findTable(state.pods, p.tableId);
    const up = -p.winLoss; // player's result, the opposite sign to the house
    return h(
      "button.row",
      { style: { alignItems: "center" }, on: { click: () => dispatch({ type: "open-player", playerId: p.id }) } },
      h(
        "span",
        { style: { flex: "1", minWidth: "0" } },
        h("span", {
          text: p.name,
          style: { display: "block", fontSize: "var(--t-body)", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
        }),
        h("span", {
          text: p.closed ? `${table ? table.name : ""} · left ${p.left}` : `${table ? table.name : ""} · seat ${p.seat}`,
          style: { display: "block", fontSize: "var(--t-micro)", color: "var(--ink-3)" },
        })
      ),
      h(
        "span",
        { style: { textAlign: "right", flexShrink: "0" } },
        h("span.mono", {
          text: (up > 0 ? "+" : up < 0 ? "\u2212" : "") + compact(Math.abs(up)),
          style: { display: "block", fontSize: "var(--t-body)", fontWeight: "700", color: up > 0 ? "var(--critical-ink)" : "var(--ink-2)" },
        }),
        h("span", { text: `avg ${compact(p.avgBet)}`, style: { display: "block", fontSize: "var(--t-micro)", color: "var(--ink-3)" } })
      )
    );
  });

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", height: "100%", minHeight: "0" } },
    h(
      "div",
      { style: { padding: "14px 14px 10px", flexShrink: "0", display: "flex", flexDirection: "column", gap: "10px" } },
      switchEl || h("span.display", { text: scope.heading, style: { fontSize: "var(--t-title)", fontWeight: "600" } }),
      tabs,
      h(
        "div",
        { style: { display: "flex", justifyContent: "space-between", padding: "0 6px" } },
        h("span.micro", { text: "Player" }),
        h("span.micro", { text: "Player win" })
      )
    ),
    h(
      "div",
      { class: "player-list", style: { flex: "1", padding: "0 8px 10px", display: "flex", flexDirection: "column", minHeight: "0", overflow: "hidden" } },
      rows.length ? rows : h("div", { text: state.playerList === "closed" ? "Nobody has left yet." : "Nobody is seated.", style: { padding: "12px 6px", fontSize: "var(--t-body)", color: "var(--ink-3)" } })
    )
  );
}

/** Scope objects, so the section and the pod use one panel. */
export const sectionScope = (state) => ({ heading: AREA_NAME, players: state.players });

export const podScope = (state, pod) => ({ heading: `${pod.name} players`, players: everyoneInPod(state.players, pod) });

/**
 * Alerts or Players for the right rail, at the floor and inside a pod. Both
 * panels render this, which is why it never appears to move.
 */
export function panePodSwitch(state, dispatch, pod) {
  const counts = {
    alerts: pod ? alertsForPod(state.alerts, pod.id).length : state.alerts.length,
    players: pod ? playersForPod(state.players, pod).length : state.players.filter((p) => !p.closed).length,
  };
  return h(
    "div.segmented.segmented--sm",
    { role: "group", "aria-label": "What this panel shows" },
    [["alerts", "Actions & alerts"], ["players", "Players"]].map(([id, label]) =>
      h(
        "button",
        { "aria-pressed": String(state.podPane === id), on: { click: () => dispatch({ type: "pod-pane", pane: id }) } },
        label,
        counts[id] ? h("span.count-badge.count-badge--quiet", { text: String(counts[id]) }) : null
      )
    )
  );
}
