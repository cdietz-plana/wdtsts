import { h } from "../lib/dom.js";
import { compact } from "../lib/format.js";
import { UNASSIGNED_ZONE, initialSections } from "../data/sections.js";
import { initialAlerts } from "../data/alerts.js";
import { tables as ALL_TABLES } from "../data/tables.js";
import { iconClose } from "./icons.js";

/**
 * The floor map.
 *
 * Positions are physical: a table stays where it stands on the floor no
 * matter which section it belongs to. Sections are drawn on top as color,
 * so moving a table between sections changes its color, never its place.
 *
 * ASSUMED: the layout is generated from invented zones. In the product it
 * comes from the property's floor plan.
 */

/** Physical position of every table, in map units 0 to 100. */
export const LAYOUT = (() => {
  const pos = {};
  const place = (ids, zone) => {
    const n = ids.length;
    const ratio = zone.w / zone.h;
    let cols = Math.max(1, Math.round(Math.sqrt(n * ratio * 0.62)));
    const rows = Math.ceil(n / cols);
    ids.forEach((id, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      pos[id] = {
        x: zone.x + ((c + 0.5) / cols) * zone.w,
        y: zone.y + ((r + 0.5) / rows) * zone.h,
      };
    });
  };
  const assigned = new Set();
  for (const s of initialSections) {
    place(s.tableIds, s.zone);
    s.tableIds.forEach((id) => assigned.add(id));
  }
  place(ALL_TABLES.filter((t) => !assigned.has(t.id)).map((t) => t.id), UNASSIGNED_ZONE);
  return pos;
})();

/** Which section a table is in right now, or null. */
export const sectionOf = (sections, tableId) => sections.find((s) => s.tableIds.includes(tableId)) || null;

const ACTION_TABLES = (state) =>
  new Set(initialAlerts.filter((a) => a.kind === "action" && !state.resolved.includes(a.id)).map((a) => a.tableId));

/**
 * Draw the map.
 *
 * opts.only      limit to these table ids and zoom to fit them (a section's own map)
 * opts.focus     section id to emphasize; others fade
 * opts.draft     table ids in a section being edited (drawn as selected)
 * opts.onTable   tap handler; receives the table id
 * opts.preview   table id whose preview card is open
 * opts.big       draw large glyphs with names (a section's own map)
 */
export function floorMap(state, opts = {}) {
  const sections = state.sections;
  const actions = ACTION_TABLES(state);
  const ids = opts.only ? opts.only : state.allTables.map((t) => t.id);

  // Fit the drawn tables into the box with a margin.
  let box = { x: 0, y: 0, w: 100, h: 100 };
  if (opts.only && ids.length) {
    const xs = ids.map((id) => LAYOUT[id].x);
    const ys = ids.map((id) => LAYOUT[id].y);
    const pad = 6;
    const x0 = Math.min(...xs) - pad, x1 = Math.max(...xs) + pad;
    const y0 = Math.min(...ys) - pad, y1 = Math.max(...ys) + pad;
    box = { x: x0, y: y0, w: Math.max(12, x1 - x0), h: Math.max(12, y1 - y0) };
  }
  const at = (id) => ({ left: `${((LAYOUT[id].x - box.x) / box.w) * 100}%`, top: `${((LAYOUT[id].y - box.y) / box.h) * 100}%` });

  const draft = opts.draft ? new Set(opts.draft) : null;
  const glyphs = ids.map((id) => {
    const t = state.allTables.find((x) => x.id === id);
    const sec = sectionOf(sections, id);
    const faded = opts.focus && (!sec || sec.id !== opts.focus);
    const inDraft = draft ? draft.has(id) : false;
    return h(
      "button.fm__t",
      {
        style: { ...at(id), "--hue": sec ? String(sec.hue) : "0", "--sat": sec ? "55%" : "0%" },
        data: {
          action: actions.has(id),
          faded: !!faded,
          none: !sec,
          draft: draft ? String(inDraft) : null,
          dead: t.status === "offline" || t.status === "closed",
          open: opts.preview === id,
        },
        "aria-label": `${t.name}${sec ? `, ${sec.name}` : ", unassigned"}${actions.has(id) ? ", action waiting" : ""}`,
        on: { click: (e) => { e.stopPropagation(); if (opts.onTable) opts.onTable(id); } },
      },
      opts.big ? h("span.fm__name", { text: t.name.slice(-3) }) : null
    );
  });

  // Section names at the middle of their tables, so the map labels itself
  // and follows the tables when they move.
  const labels = opts.only
    ? []
    : sections
        .filter((s) => s.tableIds.length)
        .map((s) => {
          const xs = s.tableIds.map((id) => LAYOUT[id].x);
          const ys = s.tableIds.map((id) => LAYOUT[id].y);
          const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
          const top = Math.min(...ys);
          return h("span.fm__label", { text: s.name, data: { faded: !!(opts.focus && opts.focus !== s.id) }, style: { left: `${cx}%`, top: `${Math.max(1, top - 3.2)}%` } });
        });

  return h(
    "div.fm",
    { data: { big: !!opts.big, editing: !!draft } },
    h("div.fm__floor", {}, opts.only ? null : h("span.fm__cage", { text: "Cage" }), labels, glyphs, opts.preview ? previewCard(state, opts.preview, at, opts) : null)
  );
}

/** Quick look at one table on the map. A second tap goes to the table. */
function previewCard(state, id, at, opts) {
  const t = state.allTables.find((x) => x.id === id);
  if (!t) return null;
  const sec = sectionOf(state.sections, id);
  const act = initialAlerts.find((a) => a.tableId === id && a.kind === "action" && !state.resolved.includes(a.id));
  const p = at(id);
  const leftPct = parseFloat(p.left);
  const topPct = parseFloat(p.top);
  return h(
    "div.fm__pop",
    {
      data: { side: leftPct > 60 ? "left" : "right", up: topPct > 62 },
      style: { left: p.left, top: p.top },
      on: { click: (e) => e.stopPropagation() },
    },
    h(
      "div.fm__pop-head",
      {},
      h("span", { style: { flex: "1", minWidth: "0" } }, h("span.fm__pop-name", { text: t.name }), h("span.fm__pop-sub", { text: `${sec ? sec.name : "Unassigned"} · ${t.dealer || "No dealer"}` })),
      h("button.icon-btn", { "aria-label": "Close", on: { click: () => opts.onClose && opts.onClose() } }, iconClose(14))
    ),
    act ? h("div.fm__pop-act", { text: act.title }) : null,
    h(
      "div.fm__pop-figs",
      {},
      h("span", {}, h("span.micro", { text: "Win" }), h("b.mono", { text: compact(t.dayWin), style: { color: t.dayWin < 0 ? "var(--critical-ink)" : "var(--ok-ink)" } })),
      h("span", {}, h("span.micro", { text: "Seated" }), h("b.mono", { text: `${t.seated}/${t.seats}` })),
      h("span", {}, h("span.micro", { text: "Limits" }), h("b.mono", { text: `${compact(t.limits.min)}+` }))
    ),
    opts.previewActions ? opts.previewActions(t, sec) : null
  );
}
