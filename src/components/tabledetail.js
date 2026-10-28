import { h } from "../lib/dom.js";
import { findTable } from "../lib/selectors.js";
import { iconFill, iconLimits } from "./icons.js";
import { TABS, tableBody } from "./tableview.js";

/**
 * The full table, with the WDTS Table Dashboard's tabs in its order:
 * Players, Inventory, Games, Sessions, Override, View Table. Fill / Credit
 * and Limits sit beside the tabs, so the quick functions from the tile work
 * the same way here.
 */
export function tableDetail(state, dispatch, handlers) {
  const table = findTable(state.tables, state.tableId);
  if (!table) return h("div");

  const tabs = h(
    "div.tabs.tabs--six",
    { role: "tablist" },
    TABS.map(([id, label]) =>
      h("button", { role: "tab", text: label, "aria-pressed": String(state.tab === id), on: { click: () => dispatch({ type: "tab", tab: id }) } })
    )
  );

  const tool = (icon, label, onClick) => h("button.tool-btn", { on: { click: onClick } }, icon, h("span", { text: label }));

  const tools = h(
    "div",
    { style: { display: "flex", gap: "8px" } },
    tool(iconFill(18), "Fill / Credit", () => dispatch({ type: "expand", tableId: table.id, view: "fill" })),
    tool(iconLimits(18), "Limits", () => dispatch({ type: "expand", tableId: table.id, view: "limits" }))
  );

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "12px", flex: "1", minHeight: "0" } },
    h("div", { style: { display: "flex", alignItems: "center", gap: "12px", flexShrink: "0" } }, tabs, h("span", { style: { flex: "1" } }), tools),
    tableBody(state, dispatch, handlers)
  );
}
