import { h } from "../lib/dom.js";
import { compact, percent, wallClock } from "../lib/format.js";
import { findTable, performance } from "../lib/selectors.js";
import { SUPERVISOR } from "../lib/supervisor.js";
import { iconBack, iconChevron, iconHelp } from "./icons.js";
import { ICON } from "../assets.js";

const GAMING_DAY = "Fri 25 Sep";

/**
 * KPI strip in the Casino Manager pattern, so this bar reads like the rest of
 * the WDTS suite: four figures at one weight, scoped to the section on the
 * overview and to the table on a table.
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

export function topBar(state, dispatch) {
  const table = state.level === "table" ? findTable(state.tables, state.tableId) : null;
  const perf = performance(table ? [table] : state.tables);

  const right = [
    kpis(perf),
    h("div.clock.clock--quiet", {}, h("span.micro", { text: GAMING_DAY }), h("b.mono", { text: wallClock(state.clockSeconds), data: { live: "clock" } })),
    h("button.icon-btn", { "aria-label": "Help", on: { click: () => dispatch({ type: "sheet", sheet: "help" }) } }, iconHelp()),
    h(
      "button.icon-btn",
      { "aria-label": `${SUPERVISOR.name}, account`, on: { click: () => dispatch({ type: "sheet", sheet: "account" }) } },
      h("span.avatar", { text: SUPERVISOR.initials })
    ),
  ];

  if (!table) {
    return h(
      "header.bar",
      {},
      h("div.mark", {}, h("img", { src: ICON, alt: "WDTS", width: "26", height: "26" })),
      h(
        "div",
        { style: { flexShrink: "0" } },
        h("div.display", { text: SUPERVISOR.name, style: { fontSize: "var(--t-title)", fontWeight: "600", lineHeight: "1.2", whiteSpace: "nowrap" } }),
        h("div", { text: `${SUPERVISOR.section} · ${state.tables.length} tables`, style: { fontSize: "var(--t-detail)", color: "var(--ink-3)", whiteSpace: "nowrap" } })
      ),
      h("div", { style: { flex: "1" } }),
      right
    );
  }

  // Table to table without going back out: previous and next walk the section
  // in floor order, and the name in the middle is where you are.
  const i = state.tables.findIndex((t) => t.id === table.id);
  const prev = state.tables[(i - 1 + state.tables.length) % state.tables.length];
  const next = state.tables[(i + 1) % state.tables.length];
  const step = (t, dir, label) =>
    h("button.icon-btn", { "aria-label": `${label}, ${t.name}`, on: { click: () => dispatch({ type: "go-table", tableId: t.id, tab: state.tab }) } }, iconChevron(15, dir));

  return h(
    "header.bar",
    {},
    h("button.icon-btn", { "aria-label": "Back to all tables", on: { click: () => dispatch({ type: "go-section" }) } }, iconBack()),
    h("button.crumb-link", { text: SUPERVISOR.name, on: { click: () => dispatch({ type: "go-section" }) } }),
    h("span", { style: { color: "var(--ink-3)", display: "flex" } }, iconChevron(12)),
    h(
      "div.table-stepper",
      {},
      step(prev, "left", "Previous table"),
      h("span.crumb-current", { text: table.name, style: { minWidth: "92px", textAlign: "center" } }),
      step(next, "right", "Next table")
    ),
    h("div", { style: { flex: "1" } }),
    right
  );
}
