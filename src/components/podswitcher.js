import { fragment, h } from "../lib/dom.js";
import { alertsForPod, alertsForTable, worstSeverity } from "../lib/selectors.js";
import { sevColor, sevEdge, sevInk, sevWash } from "../lib/severity.js";
import { iconChevron } from "./icons.js";
import { felt } from "./seats.js";

/**
 * The floor, compressed. Same glyphs and same colours as the plan, so the two
 * states of the left pane read as one thing at two sizes rather than as two
 * different screens.
 */
export function podSwitcher(state, dispatch) {
  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "2px", flex: "1", minHeight: "0", overflow: "hidden" } },
    h("div.micro", { text: "Jump to", style: { padding: "2px 10px 8px" } }),
    state.pods.map((pod) => {
      const alerts = alertsForPod(state.alerts, pod.id);
      const severity = worstSeverity(alerts);
      const open = !!state.expanded[pod.id];

      const podRow = h(
        "button.row.row--nav",
        {
          "aria-expanded": String(open),
          style: { background: open ? "var(--surface-soft)" : "" },
          on: { click: () => dispatch({ type: "toggle-pod", podId: pod.id }) },
        },
        h("span", { style: { color: "var(--ink-2)", display: "flex" } }, iconChevron(13, open ? "down" : "right")),
        h("span", { text: pod.name, style: { flex: "1", fontSize: "17px", fontWeight: open ? "600" : "500" } }),
        h("span.dot", { data: { severity }, style: { background: sevColor(severity) } })
      );

      if (!open) return podRow;

      return fragment(
        podRow,
        pod.tables.map((t) => {
          const ta = alertsForTable(state.alerts, t.id);
          const tsev = worstSeverity(ta);
          return h(
            "button.row.row--nav",
            {
              style: {
                paddingLeft: "34px",
                minHeight: "44px",
                background: ta.length ? sevWash(tsev) : "",
                borderColor: ta.length ? sevEdge(tsev) : "transparent",
              },
              on: { click: () => dispatch({ type: "go-table", podId: pod.id, tableId: t.id, tab: "chips" }) },
            },
            felt(t, { hasAlert: ta.length > 0, width: 16, height: 10, chip: true }),
            h(
              "span",
              { style: { flex: "1", fontSize: "16px", color: ta.length ? sevInk(tsev) : "var(--ink-2)", fontWeight: ta.length ? "600" : "400" } },
              t.name,
              t.role === "PT" ? h("span", { text: " PT", style: { color: "var(--ink-3)" } }) : null
            ),
            ta.length
              ? h("span.count-badge", { text: String(ta.length), style: { background: sevColor(tsev), minWidth: "20px", height: "20px" } })
              : null
          );
        })
      );
    })
  );
}
