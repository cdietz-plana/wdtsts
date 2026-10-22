import { h } from "../lib/dom.js";
import { compact, percent, wallClock } from "../lib/format.js";
import { findTable, performance } from "../lib/selectors.js";
import { SUPERVISOR } from "../lib/supervisor.js";
import { iconBack, iconChevron, iconGrid, iconHelp, iconTick } from "./icons.js";
import { initialAlerts } from "../data/alerts.js";
const ALL_ACTIONS = initialAlerts.filter((a) => a.kind === "action");
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
    const sec = state.sections.find((x) => x.id === state.sectionId) || state.sections[0];
    const onSections = state.level === "sections";
    const allTables = state.allTables.length;
    return h(
      "header.bar",
      {},
      h("div.mark", {}, h("img", { src: ICON, alt: "WDTS", width: "26", height: "26" })),
      h(
        "div",
        { style: { flexShrink: "0" } },
        h("div.display", { text: SUPERVISOR.name, style: { fontSize: "var(--t-title)", fontWeight: "600", lineHeight: "1.2", whiteSpace: "nowrap" } }),
        h("div", { text: onSections ? `${state.sections.length} sections · ${allTables} tables` : `${state.tables.length} tables`, style: { fontSize: "var(--t-detail)", color: "var(--ink-3)", whiteSpace: "nowrap" } })
      ),
      sectionPicker(state, dispatch, sec, onSections),
      h("div", { style: { flex: "1" } }),
      onSections ? null : right[0],
      right.slice(1)
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

/**
 * The section picker. Shows the section on screen; opens a list of the
 * others with their table and Action counts, and ends with View all sections.
 */
function sectionPicker(state, dispatch, sec, onSections) {
  const open = state.sectionMenu;
  const actionCount = (x) => {
    const ids = new Set(x.tableIds);
    return ACTIONS_BY_TABLE(state).filter((id) => ids.has(id)).length;
  };
  const menu = open
    ? h(
        "div.secmenu",
        { role: "menu" },
        h("div.secmenu__label", { text: "Sections" }),
        state.sections.map((x) => {
          const n = actionCount(x);
          return h(
            "button.secmenu__item",
            { role: "menuitemradio", "aria-checked": String(!onSections && x.id === state.sectionId), on: { click: () => dispatch({ type: "select-section", sectionId: x.id }) } },
            h("span.secmenu__sw", { style: { background: `hsl(${x.hue} 55% 48%)` } }),
            h("span", { style: { flex: "1", minWidth: "0" } }, h("span.secmenu__name", { text: x.name }), h("span.secmenu__sub", { text: `${x.tableIds.length} tables · ${x.manager}` })),
            n ? h("span.count-badge", { text: String(n) }) : null,
            !onSections && x.id === state.sectionId ? h("span.secmenu__tick", {}, iconTick(15)) : null
          );
        }),
        h("button.secmenu__all", { on: { click: () => dispatch({ type: "go-sections" }) } }, iconGrid(15), "View all sections")
      )
    : null;
  return h(
    "div.secpick",
    {},
    h(
      "button.secpick__btn",
      { "aria-haspopup": "menu", "aria-expanded": String(open), on: { click: () => dispatch({ type: "section-menu" }) } },
      h("span.secpick__sw", { style: { background: onSections ? "var(--ink-3)" : `hsl(${sec.hue} 55% 48%)` } }),
      h("span", { text: onSections ? "All sections" : sec.name }),
      iconChevron(13, "down")
    ),
    open ? h("button.secmenu__scrim", { "aria-label": "Close", on: { click: () => dispatch({ type: "section-menu", open: false }) } }) : null,
    menu
  );
}

/** Table ids with an open Action, from the full list, so other sections show counts too. */
const ACTIONS_BY_TABLE = (state) => ALL_ACTIONS.filter((a) => !state.resolved.includes(a.id)).map((a) => a.tableId);
