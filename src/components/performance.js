import { h } from "../lib/dom.js";
import { compact, money, percent } from "../lib/format.js";
import {
  alertsForPod, limitsLabel, playersForPod, podPerformance,
  seatedInPod, sectionPerformance, topPlayers, worstSeverity,
} from "../lib/selectors.js";
import { sevColor, sevEdge, sevInk, sevWash } from "../lib/severity.js";

/**
 * The Performance state of the floor.
 *
 * The PRD wants Handle, Win, Drop, table limits and the top players on the
 * first screen. The Floor state wants none of it, because its job is to let a
 * supervisor find trouble in one glance from across a pit, and five figures on
 * each of six cards destroys that glance.
 *
 * Both are right, so the toggle already in the bar carries the difference.
 * Same six cards, same grid, same positions: only what is printed on them
 * changes. Nothing has to be re-learned and the exception view stays clean.
 *
 * Figures here are compact (41.2M) because this is still a scan. The exact
 * number lives in the panel and on the table screen, where it is the answer to
 * a question rather than a shape.
 */

const tile = (label, value, color) =>
  h(
    "div",
    { style: { background: "var(--surface-soft)", borderRadius: "11px", padding: "10px 11px", minWidth: "0" } },
    h("div.micro", { text: label }),
    h("div.mono.display", {
      text: value,
      style: { fontSize: "24px", fontWeight: "700", color: color || "", whiteSpace: "nowrap", marginTop: "2px" },
    })
  );

const line = (label, value, color) =>
  h(
    "div",
    { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" } },
    h("span.micro", { text: label }),
    h("span.mono", { text: value, style: { fontSize: "15px", fontWeight: "600", color: color || "var(--ink-2)", whiteSpace: "nowrap" } })
  );

/** Six pod cards, same grid as the Floor state, carrying figures instead of a drawing. */
export function performanceCards(state, dispatch) {
  const cards = state.pods.map((pod) => {
    const alerts = alertsForPod(state.alerts, pod.id);
    const severity = worstSeverity(alerts);
    const perf = podPerformance(pod);
    const best = topPlayers(playersForPod(state.players, pod), 1)[0];
    const primary = pod.tables[0];
    const { seated, capacity } = seatedInPod(pod);
    const winColor = perf.win < 0 ? "var(--critical)" : "var(--ok)";

    return h(
      "button.pod",
      {
        "aria-label": `${pod.name}, win ${money(perf.win)}, ${alerts.length} open alerts`,
        on: { click: () => dispatch({ type: "go-pod", podId: pod.id }) },
      },
      h(
        "div",
        { class: `card pod__card${severity === "critical" ? " card--critical" : ""}` },
        h(
          "div",
          { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
          h("span.display", { text: pod.name, style: { fontSize: "18px", fontWeight: "600" } }),
          alerts.length
            ? h(
                "span.pill",
                { style: { background: sevWash(severity), borderColor: sevEdge(severity), color: sevInk(severity) } },
                h("span.dot", { style: { background: sevColor(severity) } }),
                `${alerts.length} alert${alerts.length > 1 ? "s" : ""}`
              )
            : h("span.micro", { text: `${pod.tables.length} tables` })
        ),
        h(
          "div",
          { style: { flex: "1", display: "flex", flexDirection: "column", gap: "12px", justifyContent: "center", padding: "12px 0" } },
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" } },
            tile("Win", compact(perf.win), winColor),
            tile("Drop", compact(perf.drop))
          ),
          h(
            "div",
            { style: { display: "flex", flexDirection: "column", gap: "7px" } },
            line("Handle", compact(perf.handle)),
            line("Hold", percent(perf.hold), perf.hold < 0 ? "var(--critical)" : "var(--ink-2)"),
            line("Seated", `${seated} of ${capacity}`),
            // Limits on the first screen, as the requirements ask. They belong
            // here rather than on the Floor card: a limit is a reference
            // figure, never an interruption.
            line("PT limits", limitsLabel(primary)),
            line("ST limits", limitsLabel(pod.tables[1]))
          )
        ),
        best
          ? h(
              "div.pod__foot",
              { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" } },
              h("span", { text: best.name, style: { fontSize: "15px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } }),
              h("span.mono", { text: `theo ${compact(best.theoWin)}`, style: { fontSize: "14px", color: "var(--ink-3)", whiteSpace: "nowrap" } })
            )
          : h("div.pod__foot", { text: "No rated players seated", style: { color: "var(--ink-3)" } })
      )
    );
  });

  const legend = h(
    "div.plan-legend",
    { style: { display: "flex", alignItems: "center", gap: "16px", fontSize: "14px" } },
    h("span", { text: "Gaming day to now. Hold is win over drop." }),
    h("span", { style: { flex: "1" } }),
    h("span", { text: "Tap a pod to open it" })
  );

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "11px", flex: "1", minHeight: "0" } },
    h("div.plan", {}, cards),
    legend
  );
}

/**
 * The panel beside it: section totals, then the people.
 *
 * Ranked by theoretical win rather than by what they are up or down. A
 * supervisor asked who is in their section is being asked about value, and a
 * player losing heavily on small bets is not the answer.
 */
export function playersPanel(state, dispatch, scope, switchEl) {
  const list = topPlayers(scope.players, 6);
  const perf = scope.performance;

  const totals = h(
    "div",
    { style: { padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: "7px", flexShrink: "0" } },
    line("Handle", money(perf.handle)),
    line("Win", money(perf.win), perf.win < 0 ? "var(--critical)" : "var(--ok)"),
    line("Drop", money(perf.drop)),
    line("Hold", percent(perf.hold))
  );

  const rows = list.map((p, i) =>
    h(
      "button.row",
      {
        style: { alignItems: "center" },
        on: { click: () => dispatch({ type: "open-player", playerId: p.id }) },
      },
      h("span.mono", {
        text: String(i + 1),
        style: { width: "18px", flexShrink: "0", fontSize: "15px", color: "var(--ink-3)", fontWeight: "600" },
      }),
      h(
        "span",
        { style: { flex: "1", minWidth: "0" } },
        h("span", {
          text: p.name,
          style: { display: "block", fontSize: "16px", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
        }),
        h("span", {
          text: p.rated ? `${p.tier} · seat ${p.seat}` : `Anonymous · seat ${p.seat}`,
          style: { display: "block", fontSize: "14px", color: "var(--ink-3)" },
        })
      ),
      h(
        "span",
        { style: { textAlign: "right", flexShrink: "0" } },
        h("span.mono", { text: compact(p.theoWin), style: { display: "block", fontSize: "16px", fontWeight: "700" } }),
        h("span", {
          text: `w/l ${compact(p.winLoss)}`,
          style: { display: "block", fontSize: "14px", color: p.winLoss < 0 ? "var(--critical)" : "var(--ok)" },
        })
      )
    )
  );

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", height: "100%", minHeight: "0" } },
    h(
      "div",
      { style: { padding: "14px 14px 10px", flexShrink: "0" } },
      switchEl || h("span.display", { text: scope.heading, style: { fontSize: "20px", fontWeight: "600" } })
    ),
    totals,
    h(
      "div",
      { style: { padding: "0 14px 8px", flexShrink: "0", borderTop: "1px solid var(--line)", paddingTop: "11px" } },
      h("span.micro", { text: "Top players, by theoretical win" })
    ),
    h(
      "div",
      { style: { flex: "1", padding: "0 8px 10px", display: "flex", flexDirection: "column", gap: "5px", minHeight: "0", overflow: "hidden" } },
      rows.length ? rows : h("div", { text: "Nobody rated is seated.", style: { padding: "12px 6px", fontSize: "16px", color: "var(--ink-3)" } })
    )
  );
}

/** Scope objects, so the section and the pod use one panel. */
export const sectionScope = (state) => ({
  heading: "Section 4",
  players: state.players,
  performance: sectionPerformance(state.pods),
});

export const podScope = (state, pod) => ({
  heading: `${pod.name} players`,
  players: playersForPod(state.players, pod),
  performance: podPerformance(pod),
});

/**
 * The pod level switch. At section level the bar carries the choice; inside a
 * pod the bar is a breadcrumb, so the choice lives in the panel it changes.
 * Both panels render this, which is why it never appears to move.
 */
export function panePodSwitch(state, dispatch, pod) {
  const counts = {
    alerts: alertsForPod(state.alerts, pod.id).length,
    players: playersForPod(state.players, pod).length,
  };
  return h(
    "div.segmented.segmented--sm",
    { role: "group", "aria-label": "What this panel shows" },
    [["alerts", "Alerts"], ["players", "Players"]].map(([id, label]) =>
      h(
        "button",
        { "aria-pressed": String(state.podPane === id), on: { click: () => dispatch({ type: "pod-pane", pane: id }) } },
        label,
        counts[id] ? h("span.count-badge", { text: String(counts[id]) }) : null
      )
    )
  );
}
