import { h } from "../lib/dom.js";
import { compact, percent, wallClock } from "../lib/format.js";
import { actionsOf, alertsOnly, findPod, findTable, performance, podPerformance, sectionPerformance } from "../lib/selectors.js";
import { SUPERVISOR } from "../lib/supervisor.js";
import { iconBack, iconBell, iconChevron, iconGrid, iconHelp } from "./icons.js";
import { ICON } from "../assets.js";

/** Fixed so the whole prototype agrees on a date. A gaming day is not a calendar day. */
const GAMING_DAY = "Fri 25 Sep";

/** Review feedback: the section carries the supervisor's name, not "My Section". */
export const AREA_NAME = SUPERVISOR.name;

const MODES = [
  ["floor", "Floor", iconGrid],
  ["actions", "Actions", iconBell],
  ["alerts", "Alerts", iconBell],
];

/**
 * The KPI strip, following the Casino Manager pattern so the bar reads the
 * same as the rest of the WDTS suite. Four figures, one weight, scoped to
 * wherever you are standing: the whole section at the floor, the pod inside
 * a pod, the table when a table tab is open.
 *
 * PLACEHOLDER until we have the Casino Manager reference: the figures are the
 * four the PRD names for the first screen plus hold.
 */
function kpis(perf) {
  const k = (label, value, color) =>
    h("div.kpi", {}, h("span.kpi__label", { text: label }), h("b.kpi__value.mono", { text: value, style: color ? { color } : {} }));
  return h(
    "div.kpi-strip",
    { role: "group", "aria-label": "Key figures" },
    k("Drop", compact(perf.drop)),
    k("Win", compact(perf.win), perf.win < 0 ? "var(--critical-ink)" : "var(--ok-ink)"),
    k("Hold", percent(perf.hold)),
    k("Handle", compact(perf.handle))
  );
}

export function topBar(state, dispatch, onMode) {
  const pod = findPod(state.pods, state.podId);
  const table = findTable(state.pods, state.tableId);
  const onTable = state.level === "pod" && state.tab !== "overview" && table;

  const perf = onTable ? performance([table]) : state.level === "pod" && pod ? podPerformance(pod) : sectionPerformance(state.pods);

  const right = [
    kpis(perf),
    h(
      "div.clock.clock--quiet",
      {},
      h("span.micro", { text: GAMING_DAY }),
      h("b.mono", { text: wallClock(state.clockSeconds), data: { live: "clock" } })
    ),
    h("button.icon-btn", { "aria-label": "Help", on: { click: () => dispatch({ type: "sheet", sheet: "help" }) } }, iconHelp()),
    h(
      "button.icon-btn",
      { "aria-label": `${SUPERVISOR.name}, account`, on: { click: () => dispatch({ type: "sheet", sheet: "account" }) } },
      h("span.avatar", { text: SUPERVISOR.initials })
    ),
  ];

  if (state.level === "section") {
    const tables = state.pods.reduce((n, p) => n + p.tables.length, 0);
    const counts = { actions: actionsOf(state.alerts).length, alerts: alertsOnly(state.alerts).length };
    return h(
      "header.bar",
      {},
      h("div.mark", {}, h("img", { src: ICON, alt: "WDTS", width: "26", height: "26" })),
      h(
        "div",
        { style: { flexShrink: "0" } },
        h("div.display", { text: AREA_NAME, style: { fontSize: "var(--t-title)", fontWeight: "600", lineHeight: "1.2", whiteSpace: "nowrap" } }),
        h("div", {
          text: `${state.pods.length} pod${state.pods.length > 1 ? "s" : ""} · ${tables} tables`,
          style: { fontSize: "var(--t-detail)", color: "var(--ink-3)", whiteSpace: "nowrap" },
        })
      ),
      h("div", { style: { flex: "1" } }),
      h(
        "div.segmented.segmented--bar",
        { role: "group", "aria-label": "What the floor is showing" },
        MODES.map(([id, label, icon]) =>
          h(
            "button",
            { "aria-pressed": String(state.mode === id), on: { click: () => onMode(id) } },
            id === "floor" ? icon() : null,
            label,
            counts[id] ? h("span.count-badge", { text: String(counts[id]), data: { kind: id } }) : null
          )
        )
      ),
      h("div", { style: { flex: "1" } }),
      right
    );
  }

  const crumb = h("nav", { style: { display: "flex", alignItems: "center", gap: "8px", minWidth: "0" }, "aria-label": "Breadcrumb" });
  crumb.appendChild(h("button.crumb-link", { text: AREA_NAME, on: { click: () => dispatch({ type: "go-section" }) } }));
  crumb.appendChild(h("span", { style: { color: "var(--ink-3)", display: "flex" } }, iconChevron(12)));
  if (onTable) {
    crumb.appendChild(h("button.crumb-link", { text: pod.name, on: { click: () => dispatch({ type: "tab", tab: "overview" }) } }));
    crumb.appendChild(h("span", { style: { color: "var(--ink-3)", display: "flex" } }, iconChevron(12)));
    crumb.appendChild(h("span.crumb-current", { text: table.name }));
  } else {
    crumb.appendChild(h("span.crumb-current", { text: pod.name }));
  }

  return h(
    "header.bar",
    {},
    h("button.icon-btn", { "aria-label": "Back", on: { click: () => dispatch({ type: "go-section" }) } }, iconBack()),
    crumb,
    h("div", { style: { flex: "1" } }),
    right
  );
}
