import { h } from "../lib/dom.js";
import { countdown, rollIn, wallClock } from "../lib/format.js";
import { alertsForPod, alertsForTable, findPod, findTable } from "../lib/selectors.js";
import { iconBack, iconBars, iconBell, iconChevron, iconGrid, iconHelp } from "./icons.js";
import { ICON } from "../assets.js";

/** Fixed so the whole prototype agrees on a date. A gaming day is not a calendar day. */
const GAMING_DAY = "Fri 25 Sep";

const MODES = [
  ["floor", "Floor", iconGrid],
  ["performance", "Performance", iconBars],
  ["alerts", "Alerts", iconBell],
];

/**
 * Status, identity and exactly one mode control. The bar is the only place the
 * clocks live: the wall clock and gaming day, seconds until the next game, and
 * hours until the books close. Everything else in it is status, not navigation.
 *
 * Three relative clocks and one absolute one is a lot, so they are ordered by
 * how often a supervisor is asked for them, and the absolute one is quietest.
 */
export function topBar(state, dispatch) {
  const pod = findPod(state.pods, state.podId);
  const table = findTable(state.pods, state.tableId);

  const clocks = [
    h(
      "div.clock.clock--quiet",
      {},
      h("span.micro", { text: GAMING_DAY }),
      h("b.mono", { text: wallClock(state.clockSeconds), data: { live: "clock" } })
    ),
    h("div.clock", {}, h("span.micro", { text: "Next game" }), h("b.mono", { text: countdown(state.countdown), data: { live: "countdown" } })),
    h("div.clock", {}, h("span.micro", { text: "Roll in" }), h("b.mono", { text: rollIn(state.rollMinutes), data: { live: "roll" } })),
    h("button.icon-btn", { "aria-label": "Help", on: { click: () => dispatch({ type: "sheet", sheet: "help" }) } }, iconHelp()),
    h(
      "button.icon-btn",
      { "aria-label": "Your account", on: { click: () => dispatch({ type: "sheet", sheet: "account" }) } },
      h("span", { text: "04", style: { width: "30px", height: "30px", borderRadius: "50%", background: "var(--seat-on)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: "700", color: "var(--bg)" } })
    ),
  ];

  if (state.level === "section") {
    return h(
      "header.bar",
      {},
      h("div.mark", {}, h("img", { src: ICON, alt: "WDTS", width: "26", height: "26" })),
      h(
        "div",
        { style: { flexShrink: "0" } },
        h("div.display", { text: "Section 4", style: { fontSize: "20px", fontWeight: "600", lineHeight: "1.2", whiteSpace: "nowrap" } }),
        h("div", { text: "North Baccarat · 24 tables", style: { fontSize: "15px", color: "var(--ink-3)", whiteSpace: "nowrap" } })
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
      clocks
    );
  }

  const scoped =
    state.level === "pod" && pod ? alertsForPod(state.alerts, pod.id).length : table ? alertsForTable(state.alerts, table.id).length : 0;

  const crumb = h("nav", { style: { display: "flex", alignItems: "center", gap: "8px", minWidth: "0" }, "aria-label": "Breadcrumb" });
  crumb.appendChild(h("button.crumb-link", { text: "Section 4", on: { click: () => dispatch({ type: "go-section" }) } }));
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
    scoped ? h("span.tag", { text: `${scoped} OPEN`, style: { background: "var(--critical-wash)", color: "var(--critical)" } }) : null,
    h("div", { style: { flex: "1" } }),
    clocks
  );
}
