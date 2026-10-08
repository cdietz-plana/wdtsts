import { fragment, h } from "../lib/dom.js";
import { age, ageLong } from "../lib/format.js";
import { alertsForPod, alertsForTable, findPod, findTable, subjectSummary, withFlag, worstSeverity } from "../lib/selectors.js";
import { sevColor, sevEdge, sevInk, sevOn, sevWash } from "../lib/severity.js";
import { iconChevron, iconPerson } from "./icons.js";
import { panePodSwitch } from "./performance.js";
import { felt } from "./seats.js";

/** The right-hand pane. Narrow it summarizes; wide it becomes the main canvas. */
export function alertPane(state, dispatch, wide, onAction) {
  return wide ? wideTree(state, dispatch, onAction) : narrowList(state, dispatch, onAction);
}

/* -------------------------------------------------------------------------- */
/* Narrow: a summary rail. Pod rows with counts, expanding to one line each.   */
/* -------------------------------------------------------------------------- */
function narrowList(state, dispatch, onAction) {
  const scope =
    state.level === "section"
      ? state.alerts
      : state.level === "pod"
        ? alertsForPod(state.alerts, state.podId)
        : alertsForTable(state.alerts, state.tableId);

  const heading =
    state.level === "section" ? "Alerts" : state.level === "pod" ? `${findPod(state.pods, state.podId).name} alerts` : "This table";

  const body =
    state.level === "section"
      ? state.pods.map((pod) => {
          const alerts = alertsForPod(state.alerts, pod.id);
          if (!alerts.length) return null;
          const severity = worstSeverity(alerts);
          const open = !!state.expanded[pod.id];
          const row = h(
            "button.row",
            {
              "aria-expanded": String(open),
              style: { background: sevWash(severity), borderColor: sevEdge(severity) },
              on: { click: () => dispatch({ type: "toggle-pod", podId: pod.id }) },
            },
            h("span", { style: { color: sevColor(severity), display: "flex" } }, iconChevron(14, open ? "down" : "right")),
            h(
              "span",
              { style: { flex: "1", minWidth: "0" } },
              h("span", { text: pod.name, style: { display: "block", fontSize: "var(--t-action)", fontWeight: "600" } }),
              h("span", { text: subjectSummary(alerts), style: { display: "block", fontSize: "var(--t-micro)", color: "var(--ink-2)" } })
            ),
            h("span.count-badge", { text: String(alerts.length), style: { minWidth: "22px", height: "22px", fontSize: "var(--t-detail)", background: sevColor(severity), color: sevOn(severity) } })
          );
          return open ? fragment(row, alerts.map((a) => miniRow(a, state, onAction, true))) : row;
        })
      : scope.length
        ? scope.map((a) => miniRow(a, state, onAction, false))
        : h("div", { text: "Nothing open here.", style: { padding: "14px", fontSize: "var(--t-body)", color: "var(--ink-3)" } });

  const blocking = withFlag(state.alerts, "blocks-roll").length;

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", height: "100%", minHeight: "0" } },
    h(
      "div",
      { style: { padding: "14px 14px 10px", flexShrink: "0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" } },
      state.level === "pod"
        ? panePodSwitch(state, dispatch, findPod(state.pods, state.podId))
        : h("span.display", { text: heading, style: { fontSize: "var(--t-title)", fontWeight: "600" } }),
      h("span.count-badge", {
        text: String(scope.length),
        style: {
          minWidth: "26px", height: "26px", fontSize: "var(--t-body)",
          background: scope.length ? "var(--critical)" : "var(--surface-soft)",
          color: scope.length ? "var(--on-accent)" : "var(--ink-2)",
        },
      })
    ),
    h("div", { style: { flex: "1", padding: "0 8px 10px", display: "flex", flexDirection: "column", gap: "9px", minHeight: "0", overflow: "hidden" } }, body),
    h(
      "div",
      { style: { flexShrink: "0", borderTop: "1px solid var(--line)", padding: "11px 14px", display: "flex", alignItems: "center", gap: "9px" } },
      h("span.micro", { text: "Blocking the roll" }),
      h("span.mono.display", { text: String(blocking), style: { fontSize: "var(--t-title)", fontWeight: "600", color: blocking ? "var(--critical-ink)" : "var(--ok-ink)" } })
    )
  );
}

/**
 * What the three severities mean, in the one place they are all visible.
 *
 * Review question from WDTS: what are the critical alerts? That the question
 * had to be asked is the finding. The functional inventory names Critical,
 * High and Low but does not say which event is which, so the line below is
 * OUR reading of it and needs confirming. Writing it on the screen is how it
 * gets argued with instead of absorbed.
 */
function severityKey(verbose = false) {
  const item = (color, label, meaning) =>
    h(
      "span",
      { style: { display: "flex", alignItems: "center", gap: "5px", minWidth: "0" }, title: meaning },
      h("span.dot", { style: { background: color, flexShrink: "0" } }),
      h("span", { text: label, style: { fontSize: "var(--t-micro)", fontWeight: "700", color: "var(--ink-2)", flexShrink: "0" } }),
      verbose
        ? h("span", { text: meaning, style: { fontSize: "var(--t-micro)", color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } })
        : null
    );
  return h(
    "span",
    { style: { display: "flex", alignItems: "center", gap: "10px" } },
    item("var(--critical)", "Critical", "stops play or blocks the roll"),
    item("var(--high)", "High", "needs a supervisor before the shift ends"),
    item("var(--ink-3)", "Low", "information, nothing is wrong")
  );
}

function miniRow(alert, state, onAction, indent) {
  const table = findTable(state.pods, alert.tableId);
  const primary = alert.actions.find((x) => x.primary) || alert.actions[0];
  const where = alert.subject
    ? `${alert.subject.seat ? `Seat ${alert.subject.seat} · ` : ""}${alert.subject.name}`
    : table.name;

  return h(
    "button.row",
    { style: { paddingLeft: indent ? "30px" : "12px" }, on: { click: () => onAction(alert, primary) } },
    h("span.dot", { data: { severity: alert.severity }, style: { background: sevColor(alert.severity) } }),
    h(
      "span",
      { style: { flex: "1", minWidth: "0" } },
      h("span", { text: alert.title, style: { display: "block", fontSize: "var(--t-body)", fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }),
      h("span", { text: where + (alert.flags.includes("blocks-roll") ? " · blocks roll" : ""), style: { display: "block", fontSize: "var(--t-micro)", color: "var(--ink-3)" } })
    ),
    h("span.mono", { text: age(alert.ageSeconds), data: { live: `age:${alert.id}` }, style: { fontSize: "var(--t-body)", fontWeight: "600", // --critical is the fill red, for chips and dots. Text takes --critical-ink,
      // which each theme sets against its own surfaces.
      color: alert.severity === "critical" ? "var(--critical-ink)" : "var(--ink-2)" } })
  );
}

/* -------------------------------------------------------------------------- */
/* Wide: the full tree. Pod, then table, then person.                         */
/* -------------------------------------------------------------------------- */
const FILTERS = [
  { id: "all", label: (s) => `All ${s.alerts.length}` },
  { id: "critical", label: (s) => `Critical ${s.alerts.filter((a) => a.severity === "critical").length}` },
  { id: "blocks-roll", label: (s) => `Blocking roll ${withFlag(s.alerts, "blocks-roll").length}` },
  { id: "needs-signature", label: (s) => `Needs my signature ${withFlag(s.alerts, "needs-signature").length}` },
];

function applyFilter(alerts, filter) {
  if (filter === "critical") return alerts.filter((a) => a.severity === "critical");
  if (filter === "blocks-roll") return withFlag(alerts, "blocks-roll");
  if (filter === "needs-signature") return withFlag(alerts, "needs-signature");
  return alerts;
}

function wideTree(state, dispatch, onAction) {
  const visible = applyFilter(state.alerts, state.filter);

  const header = h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: "10px", flexShrink: "0", flexWrap: "wrap" } },
    h("span.display", { text: `${state.alerts.length} alerts`, style: { fontSize: "var(--t-metric)", fontWeight: "700" } }),
    h("span", { style: { flex: "1" } }),
    FILTERS.map((f) =>
      h(
        "button.chip",
        { "aria-pressed": String(state.filter === f.id), on: { click: () => dispatch({ type: "filter", filter: f.id }) } },
        f.id === "critical" ? h("span.dot", { style: { background: "var(--critical)" } }) : null,
        f.label(state)
      )
    )
  );

  // WDTS asked what the critical alerts are. The key answers it where the
  // severities are actually on screen, rather than in a document nobody has
  // open at the time.
  const key = h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: "16px", flexShrink: "0", paddingLeft: "2px" } },
    severityKey(true)
  );

  const empty = h(
    "div.card",
    { style: { padding: "30px", textAlign: "center", fontSize: "var(--t-body)", color: "var(--ink-2)" } },
    h("div.display", { text: "Nothing open", style: { fontSize: "var(--t-metric)", fontWeight: "600", color: "var(--ok)", marginBottom: "6px" } }),
    "An empty list is the win condition."
  );

  const groups = state.pods.map((pod) => {
    const alerts = visible.filter((a) => a.podId === pod.id);
    if (!alerts.length) return null;
    const severity = worstSeverity(alerts);
    const open = !!state.expanded[pod.id];

    const podRow = h(
      "button.row",
      {
        "aria-expanded": String(open),
        style: { minHeight: "58px", background: sevWash(severity), borderColor: sevEdge(severity) },
        on: { click: () => dispatch({ type: "toggle-pod", podId: pod.id }) },
      },
      h("span", { style: { color: sevColor(severity), display: "flex" } }, iconChevron(15, open ? "down" : "right")),
      h("span.display", { text: pod.name, style: { fontSize: "var(--t-title)", fontWeight: "600" } }),
      h("span", { text: subjectSummary(alerts), style: { fontSize: "var(--t-body)", color: "var(--ink-2)" } }),
      h("span", { style: { flex: "1" } }),
      h("span.tag", { text: `${alerts.length} OPEN`, style: { background: sevColor(severity), color: sevOn(severity) } })
    );

    if (!open) return podRow;

    const byTable = new Map();
    alerts.forEach((a) => byTable.set(a.tableId, [...(byTable.get(a.tableId) || []), a]));

    const tableBlocks = [...byTable.entries()].map(([tableId, list]) => {
      const table = findTable(state.pods, tableId);
      const tableRow = h(
        "button.row.row--table",
        { style: { background: "var(--surface-soft)" }, on: { click: () => dispatch({ type: "go-table", podId: pod.id, tableId, tab: "chips" }) } },
        felt(table, { hasAlert: true, width: 18, height: 11, chip: true }),
        h("span", { text: table.name, style: { fontSize: "var(--t-action)", fontWeight: "600" } }),
        h("span", {
          text: `${table.role === "PT" ? "Primary" : "Secondary"} · ${table.seated} of ${table.seats} seated`,
          style: { fontSize: "var(--t-detail)", color: "var(--ink-3)" },
        }),
        h("span", { style: { flex: "1" } }),
        h("span", { style: { color: "var(--ink-3)", display: "flex" } }, iconChevron(14, "down"))
      );

      const tableAlerts = list.filter((a) => !a.subject).map((a) => fullRow(a, 66, onAction));

      const personBlocks = list
        .filter((a) => a.subject)
        .map((a) =>
          fragment(
            h(
              "div.row.row--person",
              { style: { cursor: "default" } },
              h(
                "span",
                { style: { width: "22px", height: "22px", borderRadius: "50%", background: "var(--surface-sunken)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)" } },
                iconPerson()
              ),
              h("span", { text: `${a.subject.seat ? `Seat ${a.subject.seat} · ` : ""}${a.subject.name}`, style: { fontSize: "var(--t-body)", fontWeight: "600" } }),
              h("span", { text: `${a.subject.kind === "dealer" ? "Dealer" : "Rated player"} · person level`, style: { fontSize: "var(--t-detail)", color: "var(--ink-3)" } })
            ),
            fullRow(a, 92, onAction)
          )
        );

      return fragment(tableRow, tableAlerts, personBlocks);
    });

    return fragment(podRow, tableBlocks);
  });

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "10px", padding: "12px 16px 10px 14px", height: "100%", minHeight: "0" } },
    header,
    key,
    h("div", { style: { flex: "1", display: "flex", flexDirection: "column", gap: "7px", minHeight: "0", overflow: "hidden" } }, visible.length ? groups : empty)
  );
}

function fullRow(alert, indent, onAction) {
  const primary = alert.actions.find((x) => x.primary) || alert.actions[0];

  const tags = [h("span.tag", { text: alert.severity.toUpperCase(), style: { background: sevWash(alert.severity), color: sevInk(alert.severity) } })];
  if (alert.flags.includes("blocks-roll")) tags.push(h("span.tag", { text: "BLOCKS ROLL", style: { background: "var(--surface-soft)", color: "var(--ink-2)" } }));
  if (alert.flags.includes("needs-signature")) tags.push(h("span.tag", { text: "NEEDS SIGNATURE", style: { background: "var(--surface-soft)", color: "var(--ink-2)" } }));

  return h(
    "div.alert-card",
    {
      role: "button",
      tabindex: "0",
      style: { paddingLeft: `${indent}px`, borderColor: sevEdge(alert.severity) },
      on: {
        click: () => onAction(alert, primary),
        keydown: (e) => e.key === "Enter" && onAction(alert, primary),
      },
    },
    h("span.alert-card__bar", { style: { background: sevColor(alert.severity) } }),
    h(
      "div",
      { style: { flex: "1", minWidth: "0" } },
      h("div", { style: { display: "flex", alignItems: "center", gap: "9px", flexWrap: "wrap" } }, h("span", { text: alert.title, style: { fontSize: "var(--t-body)", fontWeight: "600" } }), tags),
      h("div", { text: alert.detail, style: { fontSize: "var(--t-detail)", color: "var(--ink-2)", marginTop: "3px" } })
    ),
    h(
      "div",
      { style: { textAlign: "right", flexShrink: "0" } },
      h("div.micro", { text: "Open" }),
      h("div.mono.display", { text: ageLong(alert.ageSeconds), data: { live: `ageLong:${alert.id}` }, style: { fontSize: "var(--t-title)", fontWeight: "600", color: alert.severity === "critical" ? "var(--critical-ink)" : "var(--ink)" } })
    ),
    h(
      "div",
      { style: { display: "flex", gap: "8px", flexShrink: "0" } },
      alert.actions.map((x) =>
        h("button", {
          class: x.primary ? "btn" : "btn btn--ghost",
          text: x.label,
          on: {
            click: (e) => {
              e.stopPropagation();
              onAction(alert, x);
            },
          },
        })
      )
    )
  );
}
