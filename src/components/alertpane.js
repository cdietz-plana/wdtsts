import { fragment, h } from "../lib/dom.js";
import { age, ageLong } from "../lib/format.js";
import { actionsOf, alertsForPod, alertsOnly, findPod, findTable, subjectSummary, worstSeverity } from "../lib/selectors.js";
import { sevColor, sevEdge, sevInk, sevOn, sevWash } from "../lib/severity.js";
import { iconChevron } from "./icons.js";
import { panePodSwitch } from "./performance.js";

/** The right-hand pane. Narrow it summarizes; wide it becomes the main canvas. */
export function alertPane(state, dispatch, wide, onAction, switchEl) {
  return wide ? wideTree(state, dispatch, onAction) : narrowList(state, dispatch, onAction, switchEl);
}

/** How many alerts the rail lists under the actions before it hands over to the Alerts view. */
const RAIL_ALERTS = 3;

/* -------------------------------------------------------------------------- */
/* Narrow: Actions first, always in full. Alerts underneath, the newest few.   */
/* -------------------------------------------------------------------------- */
function narrowList(state, dispatch, onAction, switchEl) {
  const scope = state.level === "section" ? state.alerts : alertsForPod(state.alerts, state.podId);
  const actions = actionsOf(scope);
  const alerts = alertsOnly(scope).sort((a, b) => a.ageSeconds - b.ageSeconds);
  const shown = alerts.slice(0, RAIL_ALERTS);
  const more = alerts.length - shown.length;

  const head = (label, count, kind) =>
    h(
      "div.rail-head",
      { data: { kind } },
      h("span.display", { text: label }),
      h("span.count-badge", { text: String(count), data: { kind, zero: count === 0 } })
    );

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", height: "100%", minHeight: "0" } },
    switchEl ? h("div", { style: { padding: "14px 14px 4px", flexShrink: "0" } }, switchEl) : null,
    h(
      "div",
      { style: { flex: "1", padding: "6px 8px 10px", display: "flex", flexDirection: "column", gap: "7px", minHeight: "0", overflow: "hidden" } },
      head("Actions", actions.length, "action"),
      actions.length
        ? actions.map((a) => miniRow(a, state, onAction))
        : h("div.rail-empty", { text: "Nothing needs you." }),
      h("div", { style: { height: "6px", flexShrink: "0" } }),
      head("Alerts", alerts.length, "alert"),
      shown.length ? shown.map((a) => miniRow(a, state, onAction)) : h("div.rail-empty", { text: "None." }),
      more > 0 && state.level === "section"
        ? h("button.rail-more", { text: `${more} more`, on: { click: () => dispatch({ type: "mode", mode: "alerts" }) } })
        : more > 0
          ? h("div.rail-empty", { text: `${more} more` })
          : null
    )
  );
}

function miniRow(alert, state, onAction) {
  const table = findTable(state.pods, alert.tableId);
  const primary = alert.actions.find((x) => x.primary) || alert.actions[0];
  const where = alert.subject
    ? `${table.name} · ${alert.subject.seat ? `seat ${alert.subject.seat}` : alert.subject.name}`
    : table.name;
  const isAction = alert.kind === "action";

  return h(
    "button.row.row--mini",
    { data: { kind: alert.kind }, on: { click: () => onAction(alert, primary) } },
    h("span.dot", { style: { background: isAction ? "var(--critical)" : sevColor(alert.severity) } }),
    h(
      "span",
      { style: { flex: "1", minWidth: "0" } },
      h("span", { text: alert.title, style: { display: "block", fontSize: "var(--t-body)", fontWeight: isAction ? "600" : "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }),
      h("span", { text: where, style: { display: "block", fontSize: "var(--t-micro)", color: "var(--ink-3)" } })
    ),
    h("span.mono", {
      text: age(alert.ageSeconds),
      data: { live: `age:${alert.id}` },
      style: { fontSize: "var(--t-body)", fontWeight: "600", color: isAction ? "var(--critical-ink)" : "var(--ink-2)" },
    })
  );
}

/* -------------------------------------------------------------------------- */
/* Wide: the full tree for one kind. Pod, then table, then person.            */
/* -------------------------------------------------------------------------- */
function wideTree(state, dispatch, onAction) {
  const kind = state.mode === "actions" ? "action" : "alert";
  const visible = kind === "action" ? actionsOf(state.alerts) : alertsOnly(state.alerts);

  const header = h(
    "div",
    { style: { display: "flex", alignItems: "baseline", gap: "12px", flexShrink: "0" } },
    h("span.display", {
      text: `${visible.length} ${kind === "action" ? (visible.length === 1 ? "action" : "actions") : visible.length === 1 ? "alert" : "alerts"}`,
      style: { fontSize: "var(--t-metric)", fontWeight: "700", color: kind === "action" && visible.length ? "var(--critical-ink)" : "" },
    }),
    h("span", { text: kind === "action" ? "Needs you now" : "For your attention", style: { fontSize: "var(--t-body)", color: "var(--ink-3)" } })
  );

  const empty = h(
    "div.card",
    { style: { padding: "30px", textAlign: "center" } },
    h("div.display", { text: "Nothing open", style: { fontSize: "var(--t-metric)", fontWeight: "600", color: "var(--ok)" } })
  );

  const groups = state.pods.map((pod) => {
    const alerts = visible.filter((a) => a.podId === pod.id);
    if (!alerts.length) return null;
    const severity = kind === "action" ? "critical" : worstSeverity(alerts);
    const open = state.expanded[pod.id] !== false;

    const podRow = h(
      "button.row",
      {
        "aria-expanded": String(open),
        style: { minHeight: "54px", background: sevWash(severity), borderColor: sevEdge(severity) },
        on: { click: () => dispatch({ type: "toggle-pod", podId: pod.id }) },
      },
      h("span", { style: { color: sevColor(severity), display: "flex" } }, iconChevron(15, open ? "down" : "right")),
      h("span.display", { text: pod.name, style: { fontSize: "var(--t-title)", fontWeight: "600" } }),
      h("span", { text: subjectSummary(alerts), style: { fontSize: "var(--t-body)", color: "var(--ink-2)" } }),
      h("span", { style: { flex: "1" } }),
      h("span.count-badge", { text: String(alerts.length), style: { background: sevColor(severity), color: sevOn(severity), minWidth: "26px", height: "26px" } })
    );

    if (!open) return podRow;

    // One card per item, with the table and the person on the card itself.
    // Separate table and person rows doubled the height of the tree.
    const tableBlocks = alerts.map((a) => fullRow(a, state, dispatch, onAction));

    return fragment(podRow, tableBlocks);
  });

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "12px", padding: "14px 16px 10px 14px", height: "100%", minHeight: "0" } },
    header,
    h("div", { class: "tree-scroll", style: { flex: "1", display: "flex", flexDirection: "column", gap: "7px", minHeight: "0", overflowY: "auto" } }, visible.length ? groups : empty)
  );
}

function fullRow(alert, state, dispatch, onAction) {
  const primary = alert.actions.find((x) => x.primary) || alert.actions[0];
  const isAction = alert.kind === "action";
  const sev = isAction ? "critical" : alert.severity;
  const table = findTable(state.pods, alert.tableId);
  const who = alert.subject ? (alert.subject.seat ? `Seat ${alert.subject.seat} · ${alert.subject.name}` : alert.subject.name) : null;

  return h(
    "div.alert-card",
    {
      role: "button",
      tabindex: "0",
      style: { paddingLeft: "18px", borderColor: sevEdge(sev), flexShrink: "0" },
      on: {
        click: () => onAction(alert, primary),
        keydown: (e) => e.key === "Enter" && onAction(alert, primary),
      },
    },
    h("span.alert-card__bar", { style: { background: sevColor(sev) } }),
    h(
      "button.alert-card__where",
      {
        on: {
          click: (e) => {
            e.stopPropagation();
            dispatch({ type: "go-table", podId: alert.podId, tableId: alert.tableId, tab: "live" });
          },
        },
      },
      h("span", { text: table.name, style: { display: "block", fontSize: "var(--t-body)", fontWeight: "700" } }),
      who ? h("span", { text: who, style: { display: "block", fontSize: "var(--t-micro)", color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" } }) : null
    ),
    h(
      "div",
      { style: { flex: "1", minWidth: "0" } },
      h("div", { text: alert.title, style: { fontSize: "var(--t-body)", fontWeight: "600" } }),
      h("div", { text: alert.detail, style: { fontSize: "var(--t-detail)", color: "var(--ink-2)", marginTop: "2px" } })
    ),
    h("div.mono.display", {
      text: ageLong(alert.ageSeconds),
      data: { live: `ageLong:${alert.id}` },
      style: { fontSize: "var(--t-title)", fontWeight: "600", flexShrink: "0", color: isAction ? "var(--critical-ink)" : "var(--ink-2)" },
    }),
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

export { sevInk };
