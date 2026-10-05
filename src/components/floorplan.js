import { h } from "../lib/dom.js";
import { compact, rollIn } from "../lib/format.js";
import {
  alertsForPod, alertsForTable, findTable, playersForTable,
  podPerformance, seatedInPod, shortTableLabel, worstSeverity,
} from "../lib/selectors.js";
import { sevColor, sevEdge, sevInk, sevWash } from "../lib/severity.js";
import { currentHand } from "../data/games.js";
import { felt, seats, valueLegend } from "./seats.js";
import { handView } from "./cards.js";

/**
 * All of the supervisor's pods, one card each.
 *
 * An earlier version drew the room to scale, with a walkway and a "you are
 * here" dot. It was pretty and it cost something: unequal cards implied a
 * hierarchy that does not exist, and the supervisor already knows where they
 * are standing. A pod still draws literally, so the card is a picture of the
 * pod. Only the room around it is gone.
 *
 * Review feedback added the thing that makes this screen scale: an area is
 * not always six pods. With one pod the screen should BE that pod, not a
 * sixth of a grid with five empty cells. So the grid follows the area and the
 * cards spend the space they are given:
 *
 *   1 pod    full bleed, the live hand on the Primary with rank and suit
 *   2 pods   half each, figures on every table
 *   3-4 pods quarters, figures on the Primary
 *   5-6 pods the three-column grid, shapes and alerts only
 *
 * Nothing moves between layouts. The same card grows.
 */

/** How much room each density gives a card, as a multiplier on seat size. */
const DENSITY = {
  1: { scale: 2.1, felt: [470, 142], stFelt: [240, 92], gap: 11, figures: "all", hand: true },
  2: { scale: 1.12, felt: [268, 80], stFelt: [118, 46], gap: 6, figures: "all", hand: false },
  3: { scale: 1.05, felt: [240, 68], stFelt: [116, 44], gap: 6, figures: "primary", hand: false },
  4: { scale: 1.05, felt: [240, 68], stFelt: [116, 44], gap: 6, figures: "primary", hand: false },
  5: { scale: 0.72, felt: [176, 50], stFelt: [80, 32], gap: 5, figures: "none", hand: false },
  6: { scale: 0.72, felt: [176, 50], stFelt: [80, 32], gap: 5, figures: "none", hand: false },
};

export const densityFor = (count) => DENSITY[Math.min(6, Math.max(1, count))];

export function floorPlan(state, dispatch) {
  const count = state.pods.length;
  const d = densityFor(count);

  const plan = h(
    "div.plan",
    { data: { count: String(Math.min(6, count)) } },
    state.pods.map((pod) => podCard(pod, state, dispatch, d))
  );

  // Roll came off the top bar: it is a once-a-shift event, not a status line.
  // It sits with the floor it governs, next to the key for reading the floor.
  const legend = h(
    "div.plan-legend",
    { style: { display: "flex", alignItems: "center", gap: "14px", fontSize: "var(--t-micro)", flexWrap: "wrap" } },
    valueLegend(true),
    h("span", { style: { flex: "1" } }),
    h(
      "span",
      { style: { display: "flex", alignItems: "center", gap: "6px" } },
      h("span.micro", { text: "Roll in" }),
      h("b.mono", { text: rollIn(state.rollMinutes), data: { live: "roll" }, style: { fontSize: "var(--t-detail)", fontWeight: "700" } })
    ),
    h("span", { text: "Tap a pod to open it" })
  );

  return h("div", { style: { display: "flex", flexDirection: "column", gap: "11px", flex: "1", minHeight: "0" } }, plan, legend);
}

function podCard(pod, state, dispatch, d) {
  const alerts = alertsForPod(state.alerts, pod.id);
  const severity = worstSeverity(alerts);
  const [primary, ...secondaries] = pod.tables;
  const { seated } = seatedInPod(pod);
  const perf = podPerformance(pod);

  const openPlayer = (player) => dispatch({ type: "open-player", playerId: player.id });

  let foot;
  if (alerts.length) {
    const first = alerts[0];
    const table = findTable(state.pods, first.tableId);
    const label = table ? shortTableLabel(table, pod) : "";
    // The pill already carries the count, so the footer names the worst one only.
    foot = `${label} · ${first.title.toLowerCase()}`;
  } else {
    foot = `All four running · ${seated} seated`;
  }

  const tableFigures = (t) =>
    h(
      "div",
      { style: { display: "flex", gap: "10px", justifyContent: "center", marginTop: "3px" } },
      h("span.mono", { text: compact(t.dayWin), style: { fontSize: "var(--t-detail)", fontWeight: "700", color: t.dayWin < 0 ? "var(--critical-ink)" : "var(--ok-ink)" } }),
      h("span.mono", { text: compact(t.handle), style: { fontSize: "var(--t-detail)", color: "var(--ink-3)" } })
    );

  return h(
    "button.pod",
    {
      "aria-label": `${pod.name}, ${alerts.length} open alerts`,
      on: { click: () => dispatch({ type: "go-pod", podId: pod.id }) },
    },
    h(
      "div",
      { class: `card pod__card${severity === "critical" ? " card--critical" : ""}` },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" } },
        h("span.display", { text: pod.name, style: { fontSize: d.figures === "all" ? "var(--t-title)" : "var(--t-body)", fontWeight: "600" } }),
        d.figures !== "none"
          ? h(
              "span",
              { style: { display: "flex", alignItems: "baseline", gap: "8px" } },
              h("span.micro", { text: "Win" }),
              h("span.mono", {
                text: compact(perf.win),
                style: { fontSize: "var(--t-title)", fontWeight: "700", color: perf.win < 0 ? "var(--critical-ink)" : "var(--ok-ink)" },
              })
            )
          : null,
        h(
          "span.pill",
          { style: { background: sevWash(severity), borderColor: sevEdge(severity), color: sevInk(severity) } },
          h("span.dot", { data: { severity }, style: { background: sevColor(severity) } }),
          alerts.length ? `${alerts.length} alert${alerts.length > 1 ? "s" : ""}` : "Clear"
        )
      ),
      h(
        "div.pod__plan",
        {},
        h(
          "div.pod__table",
          {},
          seats(primary, playersForTable(state.players, primary.id), { scale: d.scale, gap: d.gap, onPick: openPlayer }),
          felt(primary, {
            width: d.felt[0],
            height: d.felt[1],
            children: d.hand
              ? handView(currentHand(primary.id), { size: "md" })
              : h("span", { text: "PRIMARY", style: { fontSize: "var(--t-micro)", letterSpacing: "0.12em", color: "#fff", fontWeight: "700" } }),
          }),
          h("span.pod__name", { text: `${primary.name} · ${primary.dealer || "unassigned"}` }),
          d.figures !== "none" ? tableFigures(primary) : null
        ),
        h(
          "div",
          { style: { display: "flex", gap: d.hand ? "30px" : d.figures === "all" ? "14px" : "10px", alignItems: "flex-end" } },
          secondaries.map((t) => {
            const bad = alertsForTable(state.alerts, t.id).length > 0;
            return h(
              "div.pod__table",
              {},
              seats(t, playersForTable(state.players, t.id), { scale: d.scale * 0.82, gap: Math.max(3, d.gap - 2), onPick: openPlayer }),
              felt(t, { hasAlert: bad, width: d.stFelt[0], height: d.stFelt[1] }),
              // The letter is the only way the footer line ("C · table offline")
              // can be traced back to a shape on the card.
              h("span.pod__name", { text: shortTableLabel(t, pod), style: bad ? { color: "var(--critical-ink)", fontWeight: "600" } : {} }),
              d.figures === "all" ? tableFigures(t) : null
            );
          })
        )
      ),
      h("div.pod__foot", { text: foot, style: { color: alerts.length ? sevInk(severity) : "var(--ink-3)", fontWeight: alerts.length ? "600" : "400" } })
    )
  );
}
