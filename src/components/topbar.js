import { h } from "../lib/dom.js";
import { compact, wallClock } from "../lib/format.js";
import {
  alertsForPod, alertsForTable, findPod, findTable,
  performance, podPerformance, sectionPerformance,
} from "../lib/selectors.js";
import { iconBack, iconBars, iconBell, iconChevron, iconGrid, iconHelp } from "./icons.js";
import { ICON } from "../assets.js";

/** Fixed so the whole prototype agrees on a date. A gaming day is not a calendar day. */
const GAMING_DAY = "Fri 25 Sep";

/** The supervisor's own area. Not a fixed section: see the area control. */
export const AREA_NAME = "My whole area";

const MODES = [
  ["floor", "Floor", iconGrid],
  ["performance", "Performance", iconBars],
  ["alerts", "Alerts", iconBell],
];

/**
 * Status, identity, one mode control, and the two figures a supervisor is
 * asked for most.
 *
 * Review feedback reshaped this bar. Next game went: a countdown to the next
 * deal is the dealer's problem, it changes every second, and it pushed the
 * figures that matter off the bar. Roll in went too, not because it is
 * unimportant but because it does not belong at the top: it is a once-a-shift
 * event and it now sits with the floor it governs.
 *
 * What replaced them is Handle and Win, scoped to wherever you are standing.
 * At the floor they are the whole area; inside a pod they are that pod; on a
 * table they are that table. The labels do not say which, because the
 * breadcrumb two inches to the left already does, and a bar that repeats
 * itself is a bar nobody reads.
 */
export function topBar(state, dispatch) {
  const pod = findPod(state.pods, state.podId);
  const table = findTable(state.pods, state.tableId);

  const perf =
    state.level === "table" && table ? performance([table])
    : state.level === "pod" && pod ? podPerformance(pod)
    : sectionPerformance(state.pods);

  const stat = (label, value, color) =>
    h(
      "div.clock.clock--stat",
      {},
      h("span.micro", { text: label }),
      h("b.mono", { text: value, style: { color: color || "" } })
    );

  const right = [
    stat("Handle", compact(perf.handle)),
    stat("Win", compact(perf.win), perf.win < 0 ? "var(--critical-ink)" : "var(--ok-ink)"),
    h(
      "div.clock.clock--quiet",
      {},
      h("span.micro", { text: GAMING_DAY }),
      h("b.mono", { text: wallClock(state.clockSeconds), data: { live: "clock" } })
    ),
    h("button.icon-btn", { "aria-label": "Help", on: { click: () => dispatch({ type: "sheet", sheet: "help" }) } }, iconHelp()),
    h(
      "button.icon-btn",
      { "aria-label": "Your account", on: { click: () => dispatch({ type: "sheet", sheet: "account" }) } },
      h("span.avatar", { text: "04" })
    ),
  ];

  if (state.level === "section") {
    const tables = state.pods.reduce((n, p) => n + p.tables.length, 0);
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
        "div.segmented",
        { role: "group", "aria-label": "What the floor is showing" },
        MODES.map(([id, label, icon]) =>
          h(
            "button",
            { "aria-pressed": String(state.mode === id), on: { click: () => dispatch({ type: "mode", mode: id }) } },
            icon(),
            label,
            id === "alerts" && state.alerts.length ? h("span.count-badge", { text: String(state.alerts.length) }) : null
          )
        )
      ),
      h("div", { style: { flex: "1" } }),
      right
    );
  }

  const scoped =
    state.level === "pod" && pod ? alertsForPod(state.alerts, pod.id).length : table ? alertsForTable(state.alerts, table.id).length : 0;

  const crumb = h("nav", { style: { display: "flex", alignItems: "center", gap: "8px", minWidth: "0" }, "aria-label": "Breadcrumb" });
  crumb.appendChild(h("button.crumb-link", { text: AREA_NAME, on: { click: () => dispatch({ type: "go-section" }) } }));
  crumb.appendChild(h("span", { style: { color: "var(--ink-3)", display: "flex" } }, iconChevron(12)));

  if (state.level === "pod") {
    crumb.appendChild(h("span.crumb-current", { text: pod.name }));
  } else {
    crumb.appendChild(h("button.crumb-link", { text: pod.name, on: { click: () => dispatch({ type: "go-pod", podId: pod.id }) } }));
    crumb.appendChild(h("span", { style: { color: "var(--ink-3)", display: "flex" } }, iconChevron(12)));
    crumb.appendChild(h("span.crumb-current", { text: table.name }));
    crumb.appendChild(
      h("span.tag", { text: table.role === "PT" ? "PRIMARY" : "SECONDARY", style: { background: "var(--surface-soft)", color: "var(--ink-2)", marginLeft: "4px" } })
    );
  }

  return h(
    "header.bar",
    {},
    h("button.icon-btn", {
      "aria-label": "Back",
      on: { click: () => (state.level === "table" ? dispatch({ type: "go-pod", podId: pod.id }) : dispatch({ type: "go-section" })) },
    }, iconBack()),
    crumb,
    scoped ? h("span.tag", { text: `${scoped} OPEN`, style: { background: "var(--critical-wash)", color: "var(--critical-ink)" } }) : null,
    h("div", { style: { flex: "1" } }),
    right
  );
}
