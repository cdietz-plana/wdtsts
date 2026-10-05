import { h } from "../lib/dom.js";
import { alertsForPod, alertsForTable, findTable, seatedInPod, shortTableLabel, worstSeverity } from "../lib/selectors.js";
import { sevColor, sevEdge, sevInk, sevWash } from "../lib/severity.js";
import { felt, seats } from "./seats.js";

/**
 * All six pods, one card each, on an even three-column grid.
 *
 * An earlier version drew the room to scale, with a walkway and a "you are
 * here" dot. It was pretty and it cost something: unequal cards implied a
 * hierarchy that does not exist, and the supervisor already knows where they
 * are standing. A pod still draws literally — Primary over its three
 * Secondaries, seats occupied or not — so the card is a picture of the pod.
 * Only the room around it is gone.
 *
 * Numbers appear only where something is wrong. At this zoom the supervisor is
 * looking for trouble, not reading figures.
 */
export function floorPlan(state, dispatch) {
  const plan = h("div.plan", {}, state.pods.map((pod) => podCard(pod, state, dispatch)));

  const legend = h(
    "div.plan-legend",
    { style: { display: "flex", alignItems: "center", gap: "16px", fontSize: "14px" } },
    h("span", { style: { display: "flex", alignItems: "center", gap: "6px" } }, felt({ role: "PT", status: "dealing" }, { width: 20, height: 11 }), "Primary"),
    h("span", { style: { display: "flex", alignItems: "center", gap: "6px" } }, felt({ role: "ST", status: "playing" }, { width: 20, height: 11 }), "Secondary"),
    h("span", { style: { flex: "1" } }),
    h("span", { text: "Tap a pod to open it" })
  );

  return h("div", { style: { display: "flex", flexDirection: "column", gap: "11px", flex: "1", minHeight: "0" } }, plan, legend);
}

function podCard(pod, state, dispatch) {
  const alerts = alertsForPod(state.alerts, pod.id);
  const severity = worstSeverity(alerts);
  const [primary, ...secondaries] = pod.tables;
  const { seated } = seatedInPod(pod);

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
        { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
        h("span.display", { text: pod.name, style: { fontSize: "18px", fontWeight: "600" } }),
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
          seats(primary.seats, primary.seated, 10, 6),
          felt(primary, {
            width: 176,
            height: 50,
            children: h("span", { text: "PRIMARY", style: { fontSize: "14px", letterSpacing: "0.12em", color: "#fff", fontWeight: "700" } }),
          }),
          h("span.pod__name", { text: primary.name })
        ),
        h(
          "div",
          { style: { display: "flex", gap: "10px", alignItems: "flex-end" } },
          secondaries.map((t) => {
            const bad = alertsForTable(state.alerts, t.id).length > 0;
            return h(
              "div.pod__table",
              {},
              seats(t.seats, t.seated, 8, 3),
              felt(t, { hasAlert: bad, width: 80, height: 32 }),
              // The letter is the only way the footer line ("C · table offline")
              // can be traced back to a shape on the card.
              h("span.pod__name", { text: shortTableLabel(t, pod), style: bad ? { color: "var(--critical)", fontWeight: "600" } : {} })
            );
          })
        )
      ),
      h("div.pod__foot", { text: foot, style: { color: alerts.length ? sevInk(severity) : "var(--ink-3)", fontWeight: alerts.length ? "600" : "400" } })
    )
  );
}
