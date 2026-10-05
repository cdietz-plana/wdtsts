import { h } from "../lib/dom.js";
import { compact, money, percent } from "../lib/format.js";
import {
  RANKINGS, alertsForPod, playerTotals, playersForPod, podPerformance, rankPlayers,
  ranking, seatedInPod, sectionPerformance, worstSeverity,
} from "../lib/selectors.js";
import { sevColor, sevEdge, sevInk, sevWash } from "../lib/severity.js";
import { AREA_NAME } from "./topbar.js";

/**
 * The Performance state of the floor.
 *
 * The requirements want Handle, Win, Drop and the top players on the first
 * screen. The Floor state wants none of it, because its job is to let a
 * supervisor find trouble in one glance from across a pit, and five figures on
 * each of six cards destroys that glance. Both are right, so the toggle in the
 * bar carries the difference: same cards, same grid, same positions, different
 * content.
 *
 * Review feedback rebuilt what is printed here. The card now carries four
 * figures at one weight (win, drop, handle, theo) instead of two big ones and
 * five small lines in three different sizes, which is what made it hard to
 * read. Limits came off entirely: at six pods a limit is reference material
 * nobody is acting on, and it was taking the space the figures needed. Limits
 * live at pod and table level, where a supervisor is close enough to care.
 */

/**
 * A figure on a pod card. Six characters of tabular mono at the metric size
 * is wider than half a card, so a long figure steps down one notch rather
 * than being truncated or allowed to spill. Optical fitting, not a different
 * level in the hierarchy.
 */
const tile = (label, value, color) =>
  h(
    "div",
    { style: { background: "var(--surface-soft)", borderRadius: "var(--r-md)", border: "1px solid var(--line-strong)", padding: "10px 11px", minWidth: "0" } },
    h("div.micro", { text: label }),
    h("div.mono.display", {
      text: value,
      style: {
        fontSize: value.length >= 6 ? "var(--t-stat-2)" : "var(--t-stat)",
        fontWeight: "700", color: color || "", whiteSpace: "nowrap", marginTop: "1px", lineHeight: "1.1",
        letterSpacing: "-0.01em",
      },
    })
  );

const line = (label, value, color) =>
  h(
    "div",
    { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" } },
    h("span.micro", { text: label }),
    h("span.mono", { text: value, style: { fontSize: "var(--t-detail)", fontWeight: "600", color: color || "var(--ink-2)", whiteSpace: "nowrap" } })
  );

/** Six pod cards, same grid as the Floor state, carrying figures instead of a drawing. */
export function performanceCards(state, dispatch) {
  const cards = state.pods.map((pod) => {
    const alerts = alertsForPod(state.alerts, pod.id);
    const severity = worstSeverity(alerts);
    const perf = podPerformance(pod);
    const people = playersForPod(state.players, pod);
    const totals = playerTotals(people);
    const best = rankPlayers(people, "theo", 1)[0];
    const { seated, capacity } = seatedInPod(pod);
    const winColor = perf.win < 0 ? "var(--critical-ink)" : "var(--ok-ink)";

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
          h("span.display", { text: pod.name, style: { fontSize: "var(--t-title)", fontWeight: "600" } }),
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
          { style: { flex: "1", display: "flex", flexDirection: "column", gap: "10px", justifyContent: "center", padding: "10px 0" } },
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } },
            tile("Win", compact(perf.win), winColor),
            tile("Drop", compact(perf.drop)),
            tile("Handle", compact(perf.handle)),
            // Theo moved up here from the footer. It is a figure of the same
            // kind as the other three and down there it read as a caption.
            tile("Theo", compact(totals.theo))
          ),
          h(
            "div",
            { style: { display: "flex", flexDirection: "column", gap: "6px" } },
            line("Hold", percent(perf.hold), perf.hold < 0 ? "var(--critical-ink)" : "var(--ink-2)"),
            line("Seated", `${seated} of ${capacity}`)
          )
        ),
        // Review feedback: a bare name here was read as the dealer. Every name
        // in the product now says what the person is.
        best
          ? h(
              "div.pod__foot",
              { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" } },
              h(
                "span",
                { style: { minWidth: "0", display: "flex", alignItems: "baseline", gap: "6px" } },
                h("span.micro", { text: "Top player" }),
                h("span", { text: best.name, style: { fontSize: "var(--t-detail)", fontWeight: "700", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } })
              ),
              h("span.mono", { text: compact(best.theoWin), style: { fontSize: "var(--t-detail)", color: "var(--ink-3)", whiteSpace: "nowrap" } })
            )
          : h("div.pod__foot", { text: "No rated players seated", style: { color: "var(--ink-3)" } })
      )
    );
  });

  const legend = h(
    "div.plan-legend",
    { style: { display: "flex", alignItems: "center", gap: "16px", fontSize: "var(--t-micro)" } },
    h("span", { text: "Gaming day to now. Hold is win over drop. Limits are on the pod and table screens." }),
    h("span", { style: { flex: "1" } }),
    h("span", { text: "Tap a pod to open it" })
  );

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "11px", flex: "1", minHeight: "0" } },
    h("div.plan", { data: { count: String(Math.min(6, state.pods.length)) } }, cards),
    legend
  );
}

/**
 * The panel beside it: totals, then the people.
 *
 * Review feedback replaced a fixed sort by theoretical win with a choice.
 * Theo is what the loyalty system rates on, but a supervisor asked who to
 * watch right now wants what actually happened, and which of those questions
 * they are asking changes through a shift. So the ranking is a control, and
 * it starts on actuals.
 */
export function playersPanel(state, dispatch, scope, switchEl) {
  const rank = ranking(state.playerRank);
  const list = rankPlayers(scope.players, state.playerRank, 6);
  const perf = scope.performance;
  const totals = playerTotals(scope.players);

  const figures = h(
    "div",
    { style: { padding: "0 14px 12px", display: "flex", flexDirection: "column", gap: "6px", flexShrink: "0" } },
    line("Handle", money(perf.handle)),
    line("Win", money(perf.win), perf.win < 0 ? "var(--critical-ink)" : "var(--ok-ink)"),
    line("Drop", money(perf.drop)),
    line("Buy-in", money(totals.buyIn)),
    line("Hold", percent(perf.hold))
  );

  const chips = h(
    "div",
    { role: "group", "aria-label": "Rank players by", style: { display: "flex", flexWrap: "wrap", gap: "5px" } },
    RANKINGS.map((r) =>
      h("button.rank-chip", {
        text: r.label.replace("Biggest ", "").replace("Top ", ""),
        title: r.note,
        "aria-pressed": String(state.playerRank === r.id),
        on: { click: () => dispatch({ type: "player-rank", rank: r.id }) },
      })
    )
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
        style: { width: "18px", flexShrink: "0", fontSize: "var(--t-detail)", color: "var(--ink-3)", fontWeight: "600" },
      }),
      h(
        "span",
        { style: { flex: "1", minWidth: "0" } },
        h("span", {
          text: p.name,
          style: { display: "block", fontSize: "var(--t-body)", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
        }),
        h("span", {
          text: p.rated ? `${p.tier} · seat ${p.seat}` : `Anonymous · seat ${p.seat}`,
          style: { display: "block", fontSize: "var(--t-micro)", color: "var(--ink-3)" },
        })
      ),
      h(
        "span",
        { style: { textAlign: "right", flexShrink: "0" } },
        h("span.mono", {
          text: compact(rank.value(p)),
          style: {
            display: "block", fontSize: "var(--t-body)", fontWeight: "700",
            color: rank.signed ? (rank.value(p) < 0 ? "var(--critical-ink)" : "var(--ok-ink)") : "",
          },
        }),
        h("span", {
          text: rank.id === "theo" ? `w/l ${compact(p.winLoss)}` : `theo ${compact(p.theoWin)}`,
          style: { display: "block", fontSize: "var(--t-micro)", color: "var(--ink-3)" },
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
      switchEl || h("span.display", { text: scope.heading, style: { fontSize: "var(--t-title)", fontWeight: "600" } })
    ),
    figures,
    h(
      "div",
      { style: { padding: "11px 14px 9px", flexShrink: "0", borderTop: "1px solid var(--line)", display: "flex", flexDirection: "column", gap: "7px" } },
      h("span.micro", { text: rank.note }),
      chips
    ),
    h(
      "div",
      { class: "player-list", style: { flex: "1", padding: "0 8px 10px", display: "flex", flexDirection: "column", minHeight: "0", overflow: "hidden" } },
      rows.length ? rows : h("div", { text: "Nobody is seated.", style: { padding: "12px 6px", fontSize: "var(--t-body)", color: "var(--ink-3)" } })
    )
  );
}

/** Scope objects, so the area and the pod use one panel. */
export const sectionScope = (state) => ({
  heading: AREA_NAME,
  players: state.players,
  performance: sectionPerformance(state.pods),
});

export const podScope = (state, pod) => ({
  heading: `${pod.name} players`,
  players: playersForPod(state.players, pod),
  performance: podPerformance(pod),
});

/**
 * The pod level switch. At area level the bar carries the choice; inside a
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
