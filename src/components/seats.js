import { h } from "../lib/dom.js";

/** One side of a baccarat layout. Fourteen is both sides, so it draws as two of these. */
const PER_ROW = 7;

/**
 * Seat dots, filled means occupied. Every table has seven positions a side; a
 * full-size table has fourteen and draws as two rows, which is how the pit
 * actually reads it. Never one long row of fourteen: at pod-card size that is
 * an unreadable dotted line and it breaks the card grid.
 */
export function seats(total, occupied, size = 7, gap = 3) {
  const rows = [];
  for (let start = 0; start < total; start += PER_ROW) {
    const count = Math.min(PER_ROW, total - start);
    rows.push(
      h(
        "div",
        { style: { display: "flex", gap: `${gap}px` } },
        Array.from({ length: count }, (_, i) =>
          h("span.seat", { data: { on: start + i < occupied }, style: { width: `${size}px`, height: `${size}px` } })
        )
      )
    );
  }
  return h("div", { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: `${gap}px` } }, rows);
}

/**
 * The table itself: a baccarat layout seen from above, dealer at the flat edge.
 * A troubled table outlines; an offline one dims and goes dashed.
 */
export function felt(table, { hasAlert, width, height, chip, children } = {}) {
  return h(
    chip ? "div.felt.felt--chip" : "div.felt",
    {
      data: { role: table.role, alert: hasAlert, offline: table.status === "offline" },
      style: {
        width: `${width}px`,
        height: `${height}px`,
        display: children ? "flex" : "",
        alignItems: "center",
        justifyContent: "center",
      },
    },
    children
  );
}
