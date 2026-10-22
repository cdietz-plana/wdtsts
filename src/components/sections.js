import { h } from "../lib/dom.js";
import { compact, percent } from "../lib/format.js";
import { performance } from "../lib/selectors.js";
import { initialAlerts } from "../data/alerts.js";
import { floorMap, sectionOf } from "./floormap.js";
import { iconChevron, iconClose, iconFlip, iconGrid } from "./icons.js";

/**
 * All sections.
 *
 * The floor map on the left, the sections on the right. It uses the two
 * patterns the stakeholder liked on the overview: a section card flips over
 * for its figures, and a tap is a preview (the section lights up on the map,
 * a table opens a quick card) with a second tap to go in.
 */

/** Which section cards are turned over. A glance, not app state. */
const flipped = new Set();
/** The section card tapped once: highlighted on the map, buttons shown. */
let focused = null;

const openActions = (state, ids) => {
  const set = new Set(ids);
  return initialAlerts.filter((a) => a.kind === "action" && set.has(a.tableId) && !state.resolved.includes(a.id)).length;
};

export function sectionsView(state, dispatch) {
  if (state.editSection) return sectionEditor(state, dispatch);

  const refresh = () => dispatch({ type: "view-refresh" });
  const tablesFor = (ids) => state.allTables.filter((t) => ids.includes(t.id));
  const assigned = new Set(state.sections.flatMap((s) => s.tableIds));
  const unassigned = state.allTables.filter((t) => !assigned.has(t.id));

  const map = h(
    "div.card.secv__map",
    { on: { click: () => { if (state.mapPreview) dispatch({ type: "map-preview", tableId: null }); } } },
    h("div.secv__maphead", {}, h("span.display", { text: "Floor" }), h("span.micro", { text: "Tap a table for a quick look" })),
    floorMap(state, {
      focus: focused,
      preview: state.mapPreview,
      onTable: (id) => dispatch({ type: "map-preview", tableId: state.mapPreview === id ? null : id }),
      onClose: () => dispatch({ type: "map-preview", tableId: null }),
      previewActions: (t, sec) =>
        h(
          "div.fm__pop-btns",
          {},
          sec
            ? h("button.btn", {
                text: "Open table",
                on: { click: () => { dispatch({ type: "select-section", sectionId: sec.id }); dispatch({ type: "go-table", tableId: t.id }); } },
              })
            : h("button.btn", { text: "Add to a section", on: { click: () => dispatch({ type: "edit-section", sectionId: null }) } })
        ),
    })
  );

  const card = (s) => {
    const ts = tablesFor(s.tableIds);
    const perf = performance(ts);
    const acts = openActions(state, s.tableIds);
    const seated = ts.reduce((n, t) => n + t.seated, 0);
    const isFocused = focused === s.id;
    const isFlipped = flipped.has(s.id);
    const flipBtn = (label) =>
      h("button.tile__flip", { "aria-label": label, on: { click: (e) => { e.stopPropagation(); isFlipped ? flipped.delete(s.id) : flipped.add(s.id); refresh(); } } }, iconFlip(15));

    const head = () => h(
      "div.seccard__head",
      {},
      h("span.seccard__sw", { style: { background: `hsl(${s.hue} 55% 48%)` } }),
      h("span", { style: { flex: "1", minWidth: "0" } }, h("span.seccard__name", { text: s.name }), h("span.seccard__sub", { text: s.manager })),
      acts ? h("span.count-badge", { text: String(acts), title: `${acts} actions` }) : null,
      flipBtn(isFlipped ? "Back to the section" : "Show section figures")
    );

    const front = h(
      "div.seccard__face.seccard__front",
      {},
      head(),
      h(
        "div.seccard__row",
        {},
        h("span", {}, h("b.mono", { text: String(ts.length) }), h("span.micro", { text: "Tables" })),
        h("span", {}, h("b.mono", { text: String(seated) }), h("span.micro", { text: "Seated" })),
        h("span", {}, h("b.mono", { text: compact(perf.win), style: { color: perf.win < 0 ? "var(--critical-ink)" : "var(--ok-ink)" } }), h("span.micro", { text: "Win" }))
      ),
      isFocused
        ? h(
            "div.seccard__btns",
            {},
            h("button.btn.btn--ghost", { text: "Edit tables", on: { click: (e) => { e.stopPropagation(); dispatch({ type: "edit-section", sectionId: s.id }); } } }),
            h("button.btn", { text: "Open section", on: { click: (e) => { e.stopPropagation(); focused = null; dispatch({ type: "select-section", sectionId: s.id }); } } })
          )
        : null
    );

    const back = h(
      "div.seccard__face.seccard__back",
      {},
      head(),
      h(
        "div.seccard__grid",
        {},
        [["Drop", compact(perf.drop)], ["Win", compact(perf.win)], ["Hold", percent(perf.hold)], ["Handle", compact(perf.handle)]].map(([l, v]) =>
          h("span", {}, h("span.micro", { text: l }), h("b.mono", { text: v, style: l === "Win" ? { color: perf.win < 0 ? "var(--critical-ink)" : "var(--ok-ink)" } : {} }))
        )
      )
    );

    return h(
      "div.seccard",
      {
        role: "button",
        tabindex: "0",
        data: { focused: isFocused, flipped: isFlipped, current: s.id === state.sectionId },
        on: { click: () => { focused = isFocused ? null : s.id; refresh(); } },
      },
      front,
      back
    );
  };

  const list = h(
    "div.secv__list",
    {},
    h(
      "div.secv__listhead",
      {},
      h("span.display", { text: "Sections" }),
      h("span", { style: { flex: "1" } }),
      h("button.btn", { text: "Create new section", on: { click: () => dispatch({ type: "edit-section", sectionId: null }) } })
    ),
    h(
      "div.secv__cards",
      {},
      state.sections.map(card),
      h(
        "div.seccard.seccard--unassigned",
        {},
        h(
          "div.seccard__face",
          {},
          h("div.seccard__head", {}, h("span.seccard__sw", { style: { background: "var(--ink-3)" } }), h("span", { style: { flex: "1" } }, h("span.seccard__name", { text: "Unassigned" }), h("span.seccard__sub", { text: "Not in any section" }))),
          h("div.seccard__row", {}, h("span", {}, h("b.mono", { text: String(unassigned.length) }), h("span.micro", { text: "Tables" })))
        )
      )
    )
  );

  return h("div.secv", {}, map, list);
}

/* ------------------------------------------------------------------ editor */

/**
 * Create or edit a section.
 *
 * Two ways to pick, the same draft underneath:
 *   List  two columns, tap to select, arrows to move between them
 *   Map   tap tables on the floor to add or remove them
 * Moving a table in takes it out of whatever section had it, which is said
 * on the chip before Save, not discovered after.
 */
function sectionEditor(state, dispatch) {
  const e = state.editSection;
  const set = (patch) => dispatch({ type: "edit-set", patch });
  const inDraft = new Set(e.tableIds);
  const owner = (id) => sectionOf(state.sections, id);
  const tableName = (id) => (state.allTables.find((t) => t.id === id) || {}).name || id;
  const own = e.id ? state.sections.find((s) => s.id === e.id) : null;
  const moving = e.tableIds.filter((id) => { const o = owner(id); return o && (!own || o.id !== own.id); });
  const leaving = own ? own.tableIds.filter((id) => !inDraft.has(id)) : [];

  const head = h(
    "div.sed__head",
    {},
    h("button.icon-btn", { "aria-label": "Cancel", on: { click: () => dispatch({ type: "edit-cancel" }) } }, iconClose()),
    h(
      "label.sed__namebox",
      {},
      h("span.micro", { text: "Section name" }),
      h("input.sed__name", {
        id: "section-name",
        value: e.name,
        placeholder: "For example, Salon 2",
        autocomplete: "off",
        on: { change: (ev) => set({ name: ev.target.value }), input: (ev) => { e.name = ev.target.value; } },
      })
    ),
    h("div.sed__count", {}, h("b.mono", { text: String(e.tableIds.length) }), h("span.micro", { text: "tables" })),
    h("span", { style: { flex: "1" } }),
    h(
      "div.segmented",
      { role: "group", "aria-label": "Pick tables from" },
      [["list", "List"], ["map", "Map"]].map(([id, label]) => h("button", { text: label, "aria-pressed": String(e.mode === id), on: { click: () => set({ mode: id }) } }))
    ),
    h("button.btn.btn--ghost.btn--big", { text: "Cancel", on: { click: () => dispatch({ type: "edit-cancel" }) } }),
    h("button.btn.btn--big", {
      text: e.id ? "Save section" : "Create section",
      on: {
        click: () => {
          const input = document.getElementById("section-name");
          if (input) dispatch({ type: "edit-set", patch: { name: input.value } });
          dispatch({ type: "edit-save" });
        },
      },
    })
  );

  const changes =
    moving.length || leaving.length
      ? h(
          "div.sed__changes",
          {},
          moving.length ? h("span", {}, h("b", { text: `${moving.length} moving in` }), ` from ${[...new Set(moving.map((id) => owner(id).name))].join(", ")}`) : null,
          leaving.length ? h("span", {}, h("b", { text: `${leaving.length} leaving` }), " to Unassigned") : null
        )
      : null;

  let body;
  if (e.mode === "map") {
    body = h(
      "div.sed__mapwrap",
      {},
      h("div.card.sed__mapcard", {}, floorMap(state, { draft: e.tableIds, onTable: (id) => dispatch({ type: "edit-map-toggle", tableId: id }) })),
      h(
        "div.card.sed__summary",
        {},
        h("span.micro", { text: "In this section" }),
        h("div.sed__chips", {}, e.tableIds.map((id) => chip(id, tableName(id), owner(id), own, false, () => dispatch({ type: "edit-map-toggle", tableId: id }), "Remove")))
      )
    );
  } else {
    // Left column: tables from one source at a time, so the list stays short.
    const sources = [{ id: "unassigned", name: "Unassigned" }, ...state.sections.filter((s) => !own || s.id !== own.id)];
    const srcIds =
      e.from === "unassigned"
        ? state.allTables.filter((t) => !owner(t.id)).map((t) => t.id)
        : (state.sections.find((s) => s.id === e.from) || { tableIds: [] }).tableIds;
    const available = srcIds.filter((id) => !inDraft.has(id));

    const left = h(
      "div.card.sed__col",
      {},
      h("div.sed__colhead", {}, h("span.display", { text: "Available" }), h("span.micro", { text: `${available.length} tables` })),
      h(
        "div.sed__sources",
        {},
        sources.map((src) =>
          h("button.chip", { "aria-pressed": String(e.from === src.id), on: { click: () => set({ from: src.id, pickLeft: [] }) } }, src.name)
        )
      ),
      h("div.sed__grid", {}, available.length ? available.map((id) => pickChip(id, tableName(id), e.pickLeft.includes(id), () => dispatch({ type: "edit-toggle", side: "left", tableId: id }))) : h("div.rail-empty", { text: "Nothing left here." }))
    );

    const mid = h(
      "div.sed__arrows",
      {},
      h("button.sed__arrow", { "aria-label": "Move selected into the section", disabled: e.pickLeft.length ? null : "", on: { click: () => dispatch({ type: "edit-move", dir: "in" }) } }, iconChevron(20), h("span", { text: e.pickLeft.length ? `Add ${e.pickLeft.length}` : "Add" })),
      h("button.sed__arrow", { "aria-label": "Remove selected from the section", disabled: e.pickRight.length ? null : "", on: { click: () => dispatch({ type: "edit-move", dir: "out" }) } }, iconChevron(20, "left"), h("span", { text: e.pickRight.length ? `Remove ${e.pickRight.length}` : "Remove" }))
    );

    const right = h(
      "div.card.sed__col",
      {},
      h("div.sed__colhead", {}, h("span.display", { text: e.name || "New section" }), h("span.micro", { text: `${e.tableIds.length} tables` })),
      h(
        "div.sed__grid",
        {},
        e.tableIds.length
          ? e.tableIds.map((id) => {
              const o = owner(id);
              const from = o && (!own || o.id !== own.id) ? o.name : null;
              return pickChip(id, tableName(id), e.pickRight.includes(id), () => dispatch({ type: "edit-toggle", side: "right", tableId: id }), from);
            })
          : h("div.rail-empty", { text: "Pick tables on the left, then Add." })
      )
    );
    body = h("div.sed__cols", {}, left, mid, right);
  }

  return h("div.sed", {}, head, changes, body);
}

function pickChip(id, name, selected, onClick, from) {
  return h(
    "button.sed__chip",
    { "aria-pressed": String(selected), on: { click: onClick } },
    h("span.mono", { text: name }),
    from ? h("span.sed__from", { text: `from ${from}` }) : null
  );
}

function chip(id, name, o, own, _sel, onClick, label) {
  const from = o && (!own || o.id !== own.id) ? o.name : null;
  return h(
    "button.sed__chip",
    { "aria-label": `${label} ${name}`, on: { click: onClick } },
    h("span.mono", { text: name }),
    from ? h("span.sed__from", { text: `from ${from}` }) : null,
    h("span.sed__x", {}, iconClose(11))
  );
}

export { iconGrid };
