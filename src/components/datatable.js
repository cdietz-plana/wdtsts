import { h } from "../lib/dom.js";

/**
 * A wide table for a tablet. Columns that do not fit scroll sideways inside
 * the card, the identifying columns stay pinned at the left, and the right
 * edge fades while there is more to see. The header stays put as rows scroll.
 *
 * @param {{ columns: {key:string,label:string,align?:string,sticky?:boolean,width?:string,render:(row)=>any}[],
 *   rows: any[], onRow?: (row)=>void, expand?: (row)=>any, isOpen?: (row)=>boolean,
 *   rowKey?: (row)=>string, foot?: string[], className?: string }} opts
 */
export function dataTable({ columns, rows, onRow, expand, isOpen, foot, className }) {
  const head = h(
    "thead",
    {},
    h(
      "tr",
      {},
      columns.map((c) => h("th", { text: c.label, data: { sticky: !!c.sticky }, style: { textAlign: c.align || "left", ...(c.width ? { width: c.width } : {}) } }))
    )
  );

  const body = h("tbody", {});
  rows.forEach((r) => {
    const open = isOpen ? isOpen(r) : false;
    body.appendChild(
      h(
        "tr.dt-row",
        { data: { open, tap: !!onRow }, on: onRow ? { click: () => onRow(r) } : {} },
        columns.map((c) => h("td", { data: { sticky: !!c.sticky }, style: { textAlign: c.align || "left" } }, c.render(r)))
      )
    );
    if (open && expand) body.appendChild(h("tr.dt-exp", {}, h("td", { colspan: String(columns.length) }, expand(r))));
  });

  const table = h(
    "table.dt-table",
    {},
    head,
    body,
    foot ? h("tfoot", {}, h("tr", {}, foot.map((x, i) => h("td", { text: x, style: { textAlign: (columns[i] && columns[i].align) || "left" } })))) : null
  );

  const scroller = h("div.dt-scroll", {}, table);
  const wrap = h("div.dt", { class: `dt ${className || ""}`, data: { end: "true", start: "true" } }, scroller);

  const sync = () => {
    wrap.dataset.end = String(scroller.scrollLeft + scroller.clientWidth >= scroller.scrollWidth - 4);
    wrap.dataset.start = String(scroller.scrollLeft <= 2);
  };
  scroller.addEventListener("scroll", sync, { passive: true });

  // Pinned columns sit side by side: each one's left edge is the width of the
  // pinned columns before it.
  requestAnimationFrame(() => {
    const ths = [...table.querySelectorAll("thead th")];
    let left = 0;
    columns.forEach((c, i) => {
      if (!c.sticky) return;
      const px = `${left}px`;
      table.querySelectorAll(`tr > :nth-child(${i + 1})[data-sticky="true"]`).forEach((cell) => { cell.style.left = px; });
      left += ths[i].getBoundingClientRect().width / (scaleOf(wrap) || 1);
    });
    sync();
  });
  return wrap;
}

/** The prototype is scaled to fit the window; measurements come back scaled. */
function scaleOf(el) {
  const r = el.getBoundingClientRect();
  return el.offsetWidth ? r.width / el.offsetWidth : 1;
}
