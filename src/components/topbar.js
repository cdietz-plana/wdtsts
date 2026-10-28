import { h } from "../lib/dom.js";
import { compact, percent, wallClock } from "../lib/format.js";
import { barKpis, findTable } from "../lib/selectors.js";
import { currentHand } from "../data/games.js";
import { SUPERVISOR } from "../lib/supervisor.js";
import { iconBack, iconChevron, iconGrid, iconInfo, iconTick } from "./icons.js";
import { initialAlerts } from "../data/alerts.js";
const ALL_ACTIONS = initialAlerts.filter((a) => a.kind === "action");
import { ICON } from "../assets.js";

const GAMING_DAY = "Fri 25 Sep";

/**
 * KPI strip with the Casino Manager figures WDTS asked for. Nine figures do
 * not fit beside the section picker at a readable size, so the strip scrolls
 * sideways: the last figure fades out and an arrow says there is more.
 */
function kpis(state, table) {
  const scopeTables = table ? [table] : state.tables;
  const scopePlayers = table ? state.players.filter((p) => p.tableId === table.id) : state.players;
  const k = barKpis(scopeTables, scopePlayers);
  const item = (label, value, color) =>
    h("div.kpi", {}, h("span.kpi__label", { text: label }), h("b.kpi__value.mono", { text: value, style: color ? { color } : {} }));
  const wl = k.winLoss < 0 ? "var(--critical-ink)" : "var(--ok-ink)";
  const items = [
    table ? item("Hand", String(currentHand(table.id).game)) : item("Open tables", `${k.openTables}/${k.totalTables}`),
    item("Utilization", `${Math.round(k.utilization * 100)}%`),
    item(table ? "Table W/L" : "Section W/L", compact(k.winLoss), wl),
    item("Theo win", compact(k.theo)),
    item("Hold", percent(k.hold)),
    item("Handle", compact(k.handle)),
    item("Total buy in", compact(k.buyIn)),
    item("Avg bet", compact(k.avgBet)),
    item("Rated play", `${Math.round(k.ratedPlay * 100)}%`),
  ];
  const track = h("div.kpi-track", { role: "group", "aria-label": "Key figures" }, items);
  const wrap = h("div.kpi-strip.kpi-strip--scroll", { data: { end: "false", start: "true" } }, track);
  const more = h(
    "button.kpi-more",
    { "aria-label": "More figures", on: { click: () => track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" }) } },
    iconChevron(16)
  );
  const less = h(
    "button.kpi-more.kpi-more--back",
    { "aria-label": "Earlier figures", on: { click: () => track.scrollBy({ left: -track.clientWidth * 0.8, behavior: "smooth" }) } },
    iconChevron(16, "left")
  );
  wrap.appendChild(less);
  wrap.appendChild(more);
  const sync = () => {
    wrap.dataset.end = String(track.scrollLeft + track.clientWidth >= track.scrollWidth - 4);
    wrap.dataset.start = String(track.scrollLeft <= 4);
  };
  track.addEventListener("scroll", sync, { passive: true });
  requestAnimationFrame(() => { track.scrollLeft = kpiScroll; sync(); });
  track.addEventListener("scroll", () => { kpiScroll = track.scrollLeft; }, { passive: true });
  return wrap;
}
/** Where the strip was scrolled, so a re-render does not snap it back. */
let kpiScroll = 0;

export function topBar(state, dispatch) {
  const table = state.level === "table" ? findTable(state.tables, state.tableId) : null;
  const right = [
    kpis(state, table),
    h("div.clock.clock--quiet", {}, h("span.micro", { text: GAMING_DAY }), h("b.mono", { text: wallClock(state.clockSeconds), data: { live: "clock" } })),
    h("button.icon-btn", { "aria-label": "Information", title: "Information", on: { click: () => dispatch({ type: "sheet", sheet: "help" }) } }, iconInfo(19)),
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
      onSections ? h("div", { style: { flex: "1" } }) : right[0],
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
    // Review feedback: the way back out has to be obvious, so it is a full
    // button with the section's name, not a small arrow.
    h("button.back-btn", { "aria-label": "Back to all tables", on: { click: () => dispatch({ type: "go-section" }) } }, iconBack(20), h("span", { text: secName(state) })),
    h(
      "div.table-stepper",
      {},
      step(prev, "left", "Previous table"),
      h("span.crumb-current", { text: table.name, style: { minWidth: "92px", textAlign: "center" } }),
      step(next, "right", "Next table")
    ),
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

const secName = (state) => (state.sections.find((x) => x.id === state.sectionId) || state.sections[0]).name;
