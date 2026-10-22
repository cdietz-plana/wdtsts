import { h } from "../lib/dom.js";
import { findTable } from "../lib/selectors.js";
import { iconClose, iconFill, iconHistory, iconScan } from "./icons.js";
import { TABS, gamesTab, sessionsTab, tableBody } from "./tableview.js";

/**
 * The full table, as the current Table Dashboard has it.
 *
 * Four tabs carry the work done most often: Live, Chips, Players, Override.
 * Games and Sessions are looked at rarely, so they do not take two places in
 * the tab bar. They open together in a History panel from the button beside
 * the tabs, with the table still in view behind it.
 *
 * Scan and Fill/Credit sit beside the tabs as well, so the two quick
 * functions from the overview work the same way here.
 */
export function tableDetail(state, dispatch, handlers) {
  const table = findTable(state.tables, state.tableId);
  if (!table) return h("div");

  const tabs = h(
    "div.tabs",
    { role: "tablist" },
    TABS.map(([id, label]) =>
      h("button", { role: "tab", text: label, "aria-pressed": String(state.tab === id), on: { click: () => dispatch({ type: "tab", tab: id }) } })
    )
  );

  const tool = (icon, label, onClick, pressed) =>
    h("button.tool-btn", { "aria-pressed": pressed == null ? null : String(pressed), on: { click: onClick } }, icon, h("span", { text: label }));

  const scanning = !!state.scanning[table.id];
  const tools = h(
    "div",
    { style: { display: "flex", gap: "8px" } },
    tool(iconScan(18), scanning ? "Scanning" : "Scan", () => handlers.onScan(table.id)),
    tool(iconFill(18), "Fill / Credit", () => dispatch({ type: "expand", tableId: table.id, view: "fill" })),
    tool(iconHistory(18), "History", () => dispatch({ type: "history", history: state.history ? null : "games" }), !!state.history)
  );

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "12px", flex: "1", minHeight: "0" } },
    h("div", { style: { display: "flex", alignItems: "center", gap: "12px", flexShrink: "0" } }, tabs, h("span", { style: { flex: "1" } }), tools),
    tableBody(state, dispatch, handlers)
  );
}

/** Games and Sessions, side by side in one panel rather than two tabs. */
export function historyPanel(state, dispatch) {
  const table = findTable(state.tables, state.tableId);
  const open = !!state.history && !!table && !state.expand;
  const panel = h("aside.flyout.flyout--history", { data: { open }, "aria-hidden": String(!open) });
  if (!open) return panel;

  panel.appendChild(
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "10px", flexShrink: "0" } },
      h("div.display", { text: "History", style: { fontSize: "var(--t-metric)", fontWeight: "700" } }),
      h("span", { style: { flex: "1" } }),
      h(
        "div.segmented.segmented--sm",
        { role: "group", "aria-label": "History" },
        [["games", "Games"], ["sessions", "Sessions"]].map(([id, label]) =>
          h("button", { text: label, "aria-pressed": String(state.history === id), on: { click: () => dispatch({ type: "history", history: id }) } })
        )
      ),
      h("button.icon-btn", { "aria-label": "Close", on: { click: () => dispatch({ type: "history", history: null }) } }, iconClose())
    )
  );
  panel.appendChild(h("div.history-body", {}, state.history === "sessions" ? sessionsTab(state, table, dispatch) : gamesTab(table)));
  return panel;
}
