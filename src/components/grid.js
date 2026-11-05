import { h } from "../lib/dom.js";
import { age, compact } from "../lib/format.js";
import { DENSITIES, FILL_STAGES, actionsOf, alertsForTable, alertsOnly, playersForTable } from "../lib/selectors.js";
import { currentHand } from "../data/games.js";
import { expandContent } from "./expand.js";
import { compact as c2, limitShort, percent } from "../lib/format.js";
import { iconBell, iconBox, iconChevron, iconFill, iconFlip, iconHistory, iconLimits, iconMap, iconMore, iconScreen, iconTrend } from "./icons.js";
import { floorMap } from "./floormap.js";
import { CALL_STAGES, callSteps, roleOf } from "./dispatch.js";
import { seats } from "./seats.js";

/**
 * The overview: twelve tables at a time, four across and three down, which is
 * what a 10-inch tablet holds at a size a thumb can work.
 *
 * Every tile answers three questions at a glance (is anything wrong, who is
 * sitting there, how is it doing) and offers the three things a manager most
 * often does from the floor, one touch each:
 *
 *   Scan          runs the tray count right there on the tile
 *   Fill/Credit   opens the tile into the fill or credit request
 *   More          opens the tile into every other quick function
 *
 * A tile with an Action on it carries that action's own button, so most
 * Actions are answered without leaving the overview. Tapping anywhere else
 * on a tile opens the full table.
 */


const STATUS = {
  playing: ["In play", "ok"],
  offline: ["Offline", "critical"],
  shuffling: ["Shuffling", "quiet"],
  closed: ["Closed", "quiet"],
  "fill-pending": ["Fill requested", "high"],
  "shuffler-fault": ["Shuffler fault", "critical"],
  "tray-short": ["Tray short", "critical"],
};

export function overview(state, dispatch, handlers) {
  const per = state.perPage;
  const { cols, rows } = DENSITIES[per];
  const pages = Math.max(1, Math.ceil(state.tables.length / per));
  const page = Math.min(state.page, pages - 1);
  const onPage = state.tables.slice(page * per, page * per + per);

  // Which pages have an Action waiting, so trouble off screen is never silent.
  const actionPages = new Set(
    actionsOf(state.alerts).map((a) => Math.floor(state.tables.findIndex((t) => t.id === a.tableId) / per)).filter((i) => i >= 0)
  );

  const from = page * per + 1;
  const to = Math.min(state.tables.length, from + per - 1);
  const asMap = state.overviewMode === "map";
  // Which section is on screen, now that the picker is off the bar, with a
  // one-tap way to change its tables. Several sections show each name.
  const viewing = state.viewIds.map((id) => state.sections.find((x) => x.id === id)).filter(Boolean);
  const secLabel = h(
    "div.ov-sec",
    {},
    viewing.length === 1
      ? h("span.ov-sec__name", {}, h("span.ov-sec__sw", { style: { background: `hsl(${viewing[0].hue} 55% 48%)` } }), viewing[0].name)
      : h(
          "span.ov-sec__name",
          { title: viewing.map((x) => x.name).join(", ") },
          h("span.secv__picksw", {}, viewing.map((x) => h("span.ov-sec__sw", { style: { background: `hsl(${x.hue} 55% 48%)` } }))),
          `${viewing.length} sections`
        ),
    editTables(viewing, dispatch)
  );
  // Review layouts A, B and C carry the range and pages under the grid.
  const footPager = state.look !== "standard" && !asMap;
  const rangeEl = asMap
    ? h("span.ov-range", {}, h("b", { text: String(state.tables.length) }), " tables on the floor")
    : h("span.ov-range", {}, h("b", { text: `${from}\u2013${to}` }), ` of ${state.tables.length} tables`);
  const pagerEl = pages > 1 && !asMap ? pagination(page, pages, actionPages, dispatch) : null;
  const head = h(
    "div.ov-head",
    {},
    secLabel,
    footPager ? null : asMap
      ? h("span.ov-range", {}, h("b", { text: String(state.tables.length) }), " tables on the floor")
      : h("span.ov-range", {}, h("b", { text: `${from}\u2013${to}` }), ` of ${state.tables.length} tables`),
    footPager ? null : pagerEl,
    h("span", { style: { flex: "1" } }),
    densityControl(asMap ? null : per, dispatch, asMap)
  );

  // The section as it stands on the floor. Same preview rule as the grid:
  // a tap is a quick look, the button on it goes into the table.
  if (asMap) {
    return h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "10px", flex: "1", minHeight: "0" } },
      head,
      h(
        "div.card.ov-map",
        { on: { click: () => { if (state.mapPreview) dispatch({ type: "map-preview", tableId: null }); } } },
        floorMap(state, {
          only: state.tables.map((t) => t.id),
          big: true,
          preview: state.mapPreview,
          onTable: (id) => dispatch({ type: "map-preview", tableId: state.mapPreview === id ? null : id }),
          onClose: () => dispatch({ type: "map-preview", tableId: null }),
          previewActions: (t) => {
            const a = actionsOf(alertsForTable(state.alerts, t.id))[0];
            return h(
              "div.fm__pop-btns",
              { style: { gap: "6px" } },
              a ? h("button.btn.tile__action-btn", { text: a.enroute ? "Close" : a.actions[0].label, style: { flex: "1", height: "42px" }, on: { click: () => { dispatch({ type: "map-preview", tableId: null }); handlers.onAlert(a); } } }) : null,
              h("button.btn", { text: "Open table", on: { click: () => dispatch({ type: "go-table", tableId: t.id }) } })
            );
          },
        })
      )
    );
  }

  const ex = state.expand;
  const inplace = ex && state.expandStyle === "inplace" && onPage.some((t) => t.id === ex.tableId);

  const cells = onPage.map((t, i) => tile(state, dispatch, t, i, handlers, ex && ex.tableId === t.id, cols, per));

  // Grown in place: the open tile becomes a 2 x 2 card over its neighbors,
  // anchored so it never leaves the grid. The grid underneath dims and a tap
  // on it closes the card.
  let overlay = null;
  if (inplace) {
    const i = onPage.findIndex((t) => t.id === ex.tableId);
    const col = i % cols;
    const row = Math.floor(i / cols);
    // Always two rows tall, so every view fits without scrolling. At 4-up a
    // column is already half the grid, so it takes one column; otherwise two.
    const spanC = per === 4 ? 1 : 2;
    const spanR = 2;
    const c0 = Math.min(col, cols - spanC);
    const r0 = Math.min(row, rows - spanR);
    overlay = [
      h("button.grid-scrim", { "aria-label": "Close", on: { click: () => dispatch({ type: "collapse" }) } }),
      h("div.tile-xp", { style: { gridColumn: `${c0 + 1} / span ${spanC}`, gridRow: `${r0 + 1} / span ${spanR}` }, data: { from: `${Math.min(1, col - c0)}${Math.min(1, row - r0)}` } }, expandContent(state, dispatch, handlers)),
    ];
  }

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "10px", flex: "1", minHeight: "0" } },
    head,
    h(
      "div.tile-grid",
      { data: { open: !!inplace, density: String(per) }, style: { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` } },
      cells,
      overlay
    ),
    footPager ? h("div.ov-foot", {}, rangeEl, pagerEl) : null
  );
}

function tile(state, dispatch, t, i, { onAlert }, isOpen, cols, per) {
  const items = alertsForTable(state.alerts, t.id);
  const actions = actionsOf(items);
  const alerts = alertsOnly(items);
  const players = playersForTable(state.players, t.id);
  const fill = state.fills[t.id];
  const call = state.calls.find((c) => c.tableId === t.id && !c.discreet);
  const scanning = !!state.scanning[t.id];
  const [statusLabel, tone] = STATUS[t.status] || STATUS.playing;
  const dead = t.status === "offline" || t.status === "closed";
  // A fill shows on its own tracker, so it does not also label the felt.
  const exception = ["offline", "closed", "shuffling", "shuffler-fault", "tray-short"].includes(t.status);

  const open = () => dispatch({ type: "go-table", tableId: t.id });
  figuresFirst = state.look !== "standard";
  const isFlipped = figuresFirst !== flipped.has(t.id);
  const hand = currentHand(t.id);

  // Review feedback: the win figure leaves the tile. An arrow says which way
  // the table is going; the amount is one flip or one tap away.
  const up = t.dayWin >= 0;
  const head = h(
    "div.tile__head",
    {},
    dead && !t.dayWin ? null : h("span.tile__trend", { data: { up }, "aria-label": up ? "Table up" : "Table down", title: up ? "Table up" : "Table down" }, iconTrend(per === 12 ? 15 : 18, up)),
    state.viewIds.length > 1 ? sectionDot(state, t.id) : null,
    h("span.display.tile__name", { text: t.name }),
    h("span.tile__dealer", { text: t.dealer || "" }),
    h("span", { style: { flex: "1" } }),
    // More than one Action on a table: the felt shows the first, the badge says how many.
    actions.length > 1 ? h("span.count-badge", { text: String(actions.length), title: `${actions.length} actions` }) : null,
    flipButton(t.id, "Show table figures")
  );

  const sub = h(
    "div.tile__sub",
    {},
    h("span", { text: t.status === "closed" ? "Closed" : `Hand ${hand.game}` }),
  );

  const dots = h("div.tile__seats", {}, seats(t, players, { frontOnly: true, scale: per === 4 ? 1.7 : per === 9 ? 1.3 : 1, gap: per === 4 ? 8 : 5, onPick: (p) => dispatch({ type: "open-player", playerId: p.id }) }));

  // The table image is the stage: an Action plays out on it, then a fill in
  // progress, then an exception. When nothing needs the manager it shows the
  // average bet. It is sized to hold one Action, no more.
  const a = actions[0];
  let onFelt;
  if (a) {
    const subline = a.enroute
      ? h("span.tile__action-sub", { text: "On my way · dealer told" })
      : a.source === "dealer"
        ? h("span.tile__action-sub", {}, "Waiting ", h("span", { text: age(a.ageSeconds), data: { live: `age:${a.id}` } }))
        : a.subject && a.subject.seat
          ? h("span.tile__action-sub", { text: `Seat ${a.subject.seat}` })
          : null;
    onFelt = h(
      "div.tile__action",
      { data: { enroute: !!a.enroute } },
      h("span", { style: { flex: "1", minWidth: "0" } }, h("span.tile__action-title", { text: a.title }), subline),
      h("button.btn.tile__action-btn", {
        text: a.enroute ? "Close" : a.actions[0].label,
        on: { click: (e) => { e.stopPropagation(); onAlert(a); } },
      })
    );
  } else if (fill) {
    onFelt = fillTracker(fill);
  } else if (call) {
    // A department on its way to this table. Surveillance never shows here.
    onFelt = h(
      "div.tile__fill.tile__call",
      { "aria-label": `${roleOf(call.role).label}, ${CALL_STAGES[call.stage]}` },
      h("div.tile__fill-top", {}, h("span.tile__fill-name", { text: roleOf(call.role).label }), h("span.tile__fill-stage", { text: CALL_STAGES[call.stage] })),
      callSteps(call)
    );
  } else if (exception) {
    onFelt = h("span.tile__hand", { text: statusLabel, data: { tone } });
  } else {
    const avg = players.length ? Math.round(players.reduce((n, p) => n + (p.avgBet || 0), 0) / players.length) : 0;
    onFelt = h("span.tile__felt-note", { text: players.length ? `avg bet ${compact(avg)}` : "No players" });
  }
  const stage = h("div.tile__stage", { data: { role: t.role, offline: t.status === "offline", busy: !!(a || fill || call) } }, onFelt);

  const quick = (icon, label, onClick, opts = {}) =>
    h(
      "button.tile__quick",
      { disabled: opts.disabled ? "" : null, "aria-label": label, title: label, data: { dot: !!opts.dot }, on: { click: (e) => { e.stopPropagation(); onClick(); } } },
      icon,
      h("span", { text: label })
    );
  const xp = (view) => () => dispatch({ type: "expand", tableId: t.id, view });
  const B = {
    inventory: () => quick(iconBox(17), scanning ? "Scanning" : "Inventory", xp("inventory")),
    fill: () => quick(iconFill(17), "Fill / Credit", xp("fill"), { disabled: t.status === "closed" }),
    more: () => quick(iconMore(17), "More", xp("menu")),
    history: () => quick(iconHistory(17), "History", () => dispatch({ type: "go-table", tableId: t.id, tab: "games" })),
    view: () => quick(iconScreen(17), "View Table", () => dispatch({ type: "go-table", tableId: t.id, tab: "live" }), { disabled: t.status === "offline" }),
    limits: () => quick(iconLimits(17), "Limits", xp("limits")),
    alerts: () => quick(iconBell(17), "Alerts", xp("alerts"), { dot: alerts.length > 0 }),
  };
  // Review feedback: Inventory, View Table and History at every density, and
  // an arrow at the end of the row that leads to everything else, Fill /
  // Credit included.
  const set = ["inventory", "view", "history"];
  const moreArrow = h(
    "button.tile__morearrow",
    { "aria-label": "More functions", title: "More", on: { click: (e) => { e.stopPropagation(); dispatch({ type: "expand", tableId: t.id, view: "menu" }); } } },
    iconChevron(18)
  );
  const bar = h("div.tile__bar.tile__bar--arrow", { data: { n: "3" } }, set.map((k) => B[k]()), moreArrow);

  return h(
    "div.tile",
    {
      role: "button",
      tabindex: "0",
      "aria-label": `${t.name}${actions.length ? `, ${actions[0].title}` : ""}`,
      data: { action: actions.length > 0, dead, open: !!isOpen, scanning, flipped: isFlipped },
      style: { gridColumn: String((i % cols) + 1), gridRow: String(Math.floor(i / cols) + 1) },
      on: { click: open, keydown: (e) => e.key === "Enter" && open() },
    },
    h("div.tile__face.tile__front", { "aria-hidden": isFlipped ? "true" : null }, head, sub, dots, stage, bar),
    back(t, players, dispatch, state.look)
  );
}

/* ----------------------------------------------------------------- flip */

/**
 * Which tiles are turned over. Held outside the store on purpose: a flip is a
 * glance, not state anyone else needs, and toggling the attribute directly on
 * the tile lets the turn animate instead of being replaced by a re-render.
 */
const flipped = new Set();

/** True in the review layouts A, B and C, where a tile opens on its figures. */
let figuresFirst = false;

function flipButton(tableId, label) {
  return h(
    "button.tile__flip",
    {
      "aria-label": label,
      title: label,
      on: {
        click: (e) => {
          e.stopPropagation();
          const el = e.currentTarget.closest(".tile");
          if (flipped.has(tableId)) flipped.delete(tableId);
          else flipped.add(tableId);
          // In the figure-first layouts the figures are the home side.
          const on = figuresFirst !== flipped.has(tableId);
          el.dataset.flipped = String(on);
          el.querySelector(".tile__front").setAttribute("aria-hidden", on ? "true" : "false");
          el.querySelector(".tile__back").setAttribute("aria-hidden", on ? "false" : "true");
        },
      },
    },
    iconFlip(16)
  );
}

/** The back of a tile: the table's figures, where the hover card used to be. */
/**
 * Daily or Shift on the back of every tile. One setting for all tiles, so a
 * manager comparing tables compares like with like. Daily is the gaming day;
 * Shift is since this manager signed in.
 */
let figRange = "daily";

/** The table's figures for the shift: a deterministic share of the day. */
function shiftOf(t) {
  let n = 0;
  for (const c of t.id) n = (n * 31 + c.charCodeAt(0)) % 997;
  const share = 0.24 + (n % 21) / 100;
  return { win: Math.round(t.dayWin * share / 100) * 100, handle: Math.round(t.handle * share / 1000) * 1000, drop: Math.round(t.drop * share / 1000) * 1000 };
}

/** The back of a tile: win or loss, handle with hold beside it, buy in. */
function back(t, players, dispatch, look = "standard") {
  if (look !== "standard") return figuresFace(t, dispatch, look);
  const src = figRange === "shift" ? shiftOf(t) : { win: t.dayWin, handle: t.handle, drop: t.drop };
  const hold = src.drop ? src.win / src.drop : 0;
  const isOn = figuresFirst !== flipped.has(t.id);
  const range = h(
    "div.segmented.segmented--sm.tile__range",
    { role: "group", "aria-label": "Figures for" },
    [["daily", "Daily"], ["shift", "Shift"]].map(([id, label]) =>
      h("button", { text: label, "aria-pressed": String(figRange === id), on: { click: (e) => { e.stopPropagation(); figRange = id; dispatch({ type: "view-refresh" }); } } })
    )
  );
  return h(
    "div.tile__face.tile__back",
    { "aria-hidden": isOn ? "false" : "true", on: { click: (e) => e.stopPropagation() } },
    h(
      "div.tile__head",
      {},
      h("span.display.tile__name", { text: t.name }),
      h("span", { style: { flex: "1" } }),
      range,
      flipButton(t.id, "Back to the table")
    ),
    h(
      "div.tile__bfigs",
      {},
      h("div.tile__bfig.tile__bfig--wl", {}, h("span.micro", { text: "Win / loss" }), h("b.mono", { text: compact(src.win), data: { neg: src.win < 0 } })),
      h("div.tile__bfig", {}, h("span.micro", { text: "Handle" }), h("b.mono", { text: compact(src.handle) }), h("span.tile__hold", { text: `Hold ${percent(hold)}` })),
      h("div.tile__bfig", {}, h("span.micro", { text: "Buy in" }), h("b.mono", { text: compact(src.drop) }))
    )
  );
}

/**
 * The figure-first face for review layouts A, B and C. One structure, three
 * arrangements in CSS: the table ID, Shift or Daily, the turn icon; then win
 * or loss as the lead figure and Buy in, Handle and Hold beside or below it.
 */
function figuresFace(t, dispatch, look) {
  const src = figRange === "shift" ? shiftOf(t) : { win: t.dayWin, handle: t.handle, drop: t.drop };
  const hold = src.drop ? src.win / src.drop : 0;
  const isOn = figuresFirst !== flipped.has(t.id);
  const seg = h(
    "div.tf__range",
    { role: "group", "aria-label": "Figures for" },
    [["shift", "Shift"], ["daily", "Daily"]].map(([id, label]) =>
      h("button", { text: label, "aria-pressed": String(figRange === id), on: { click: (e) => { e.stopPropagation(); figRange = id; dispatch({ type: "view-refresh" }); } } })
    )
  );
  const item = (label, value) => h("div.tf__item", {}, h("span.tf__label", { text: label }), h("span.tf__value", { text: value }));
  const wl = compact(src.win);
  return h(
    "div.tile__face.tile__back.tf",
    { "aria-hidden": isOn ? "false" : "true", data: { look } },
    h("div.tf__head", {}, h("span.tf__name", { text: t.name }), h("span", { style: { flex: "1" } }), seg, flipButton(t.id, "Show the table")),
    h(
      "div.tf__body",
      {},
      h("div.tf__wl", {}, h("span.tf__label", { text: "Win / loss" }), h("span.tf__big", { text: wl, data: { neg: src.win < 0 } })),
      h("div.tf__list", {}, item("Buy in", compact(src.drop)), item("Handle", compact(src.handle)), item("Hold", percent(hold)))
    )
  );
}

/** A section's color beside the table ID, when several sections share the screen. */
function sectionDot(state, tableId) {
  const sec = state.sections.find((x) => x.tableIds.includes(tableId));
  return sec ? h("span.tile__secdot", { title: sec.name, style: { background: `hsl(${sec.hue} 55% 48%)` } }) : null;
}

/** Edit tables, straight from the overview. With several sections, pick which. */
let editMenu = false;
function editTables(viewing, dispatch) {
  if (viewing.length === 1) {
    return h("button.ov-sec__edit", { on: { click: () => dispatch({ type: "edit-from-overview", sectionId: viewing[0].id }) } }, "Edit tables");
  }
  return h(
    "span.ov-sec__menuwrap",
    {},
    h("button.ov-sec__edit", { "aria-expanded": String(editMenu), on: { click: () => { editMenu = !editMenu; dispatch({ type: "view-refresh" }); } } }, "Edit tables", iconChevron(12, "down")),
    editMenu
      ? h(
          "div.ov-sec__menu",
          { role: "menu" },
          viewing.map((x) => h("button", { role: "menuitem", on: { click: () => { editMenu = false; dispatch({ type: "edit-from-overview", sectionId: x.id }); } } }, h("span.ov-sec__sw", { style: { background: `hsl(${x.hue} 55% 48%)` } }), x.name))
        )
      : null
  );
}

/**
 * Plain pagination, built to survive a 200-table section: previous, first,
 * a window around the current page, last, next. A red dot on a page number
 * means an Action is waiting there.
 */
function pagination(page, pages, actionPages, dispatch) {
  const go = (p) => dispatch({ type: "page", page: Math.max(0, Math.min(pages - 1, p)) });
  const nums = new Set([0, pages - 1, page - 1, page, page + 1]);
  if (page <= 2) [1, 2, 3].forEach((n) => nums.add(n));
  if (page >= pages - 3) [pages - 2, pages - 3, pages - 4].forEach((n) => nums.add(n));
  const list = [...nums].filter((n) => n >= 0 && n < pages).sort((a, b) => a - b);

  const items = [];
  list.forEach((n, i) => {
    if (i > 0 && n - list[i - 1] > 1) items.push(h("span.pg__gap", { text: "\u2026", "aria-hidden": "true" }));
    items.push(
      h(
        "button.pg__num",
        { "aria-current": n === page ? "page" : null, "aria-label": `Page ${n + 1}${actionPages.has(n) ? ", action waiting" : ""}`, on: { click: () => go(n) } },
        String(n + 1),
        actionPages.has(n) ? h("span.pg__dot") : null
      )
    );
  });

  return h(
    "nav.pg",
    { "aria-label": "Pages" },
    h("button.pg__step", { "aria-label": "Previous page", disabled: page === 0 ? "" : null, on: { click: () => go(page - 1) } }, iconChevron(14, "left")),
    items,
    h("button.pg__step", { "aria-label": "Next page", disabled: page === pages - 1 ? "" : null, on: { click: () => go(page + 1) } }, iconChevron(14))
  );
}

/** Tiles per page, or the floor map. Each option is drawn as what it gives you. */
function densityControl(per, dispatch, asMap) {
  const glyph = (n) => {
    const { cols, rows } = DENSITIES[n];
    return h(
      "span.dens__glyph",
      { style: { gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }, "aria-hidden": "true" },
      Array.from({ length: n }, () => h("span"))
    );
  };
  return h(
    "div.segmented.segmented--sm.dens",
    { role: "group", "aria-label": "Tables per page" },
    [4, 9, 12].map((n) =>
      h("button", { "aria-pressed": String(per === n), "aria-label": `${n} per page`, title: `${n} per page`, on: { click: () => dispatch({ type: "per-page", perPage: n }) } }, glyph(n), String(n))
    ),
    h("button", { "aria-pressed": String(!!asMap), "aria-label": "Floor map", title: "Floor map", on: { click: () => dispatch({ type: "overview-mode", mode: "map" }) } }, iconMap(15), "Map")
  );
}

/**
 * One fill, one item: the stages it has passed and the one it is in.
 * Dealer fills run Requested, Authorized, Accepted, Processed; fills the
 * supervisor sends run Sent, Accepted, Processed.
 */
function fillTracker(f) {
  const labels = FILL_STAGES[f.by];
  return h(
    "div.tile__fill",
    { "aria-label": `${f.mode === "fill" ? "Fill" : "Credit"} ${compact(f.amount)}, ${labels[f.stage]}` },
    h(
      "div.tile__fill-top",
      {},
      h("span.tile__fill-name", { text: `${f.mode === "fill" ? "Fill" : "Credit"} ${compact(f.amount)}` }),
      h("span.tile__fill-stage", { text: labels[f.stage] })
    ),
    h(
      "div.tile__fill-steps",
      {},
      labels.map((l, i) => h("span", { data: { state: i < f.stage ? "done" : i === f.stage ? "now" : "next" }, title: l }))
    )
  );
}

function topPlayersBlock(players, dispatch) {
  const top = [...players].sort((a, b) => a.winLoss - b.winLoss).slice(0, 3);
  if (!top.length) return h("div.tile__people.tile__people--empty", { text: "No players seated" });
  return h(
    "div.tile__people",
    {},
    top.map((p) => {
      const up = -p.winLoss;
      return h(
        "button.tile__person",
        { on: { click: (e) => { e.stopPropagation(); dispatch({ type: "open-player", playerId: p.id }); } } },
        h("span.tile__pseat", { text: String(p.seat) }),
        h("span.tile__pname", { text: p.name }),
        h("span.mono.tile__pavg", { text: `avg ${compact(p.avgBet)}` }),
        h("span.mono.tile__pwin", { text: (up > 0 ? "+" : up < 0 ? "\u2212" : "") + compact(Math.abs(up)), data: { up: up > 0 } })
      );
    })
  );
}

/**
 * Review feedback: with the section on more than one page, an Action on a
 * page you are not looking at must not be missable. This line appears only
 * then, counts them, and takes you to each page in one tap.
 */
function offPageBanner(state, page, per, dispatch) {
  const byPage = new Map();
  actionsOf(state.alerts).forEach((a) => {
    const i = state.tables.findIndex((t) => t.id === a.tableId);
    if (i < 0) return;
    const p = Math.floor(i / per);
    if (p === page) return;
    byPage.set(p, (byPage.get(p) || 0) + 1);
  });
  if (!byPage.size) return null;
  const total = [...byPage.values()].reduce((n, x) => n + x, 0);
  const dealer = actionsOf(state.alerts).some((a) => a.source === "dealer" && Math.floor(state.tables.findIndex((t) => t.id === a.tableId) / per) !== page);
  const pages = [...byPage.entries()].sort((x, y) => x[0] - y[0]);
  return h(
    "div.offpage",
    { role: "status" },
    h("span.offpage__pulse", { "aria-hidden": "true" }),
    h("b", { text: `${total} ${total === 1 ? "Action" : "Actions"} on other pages` }),
    dealer ? h("span.offpage__sub", { text: "including a dealer request" }) : null,
    h("span", { style: { flex: "1" } }),
    pages.slice(0, 5).map(([p, n]) =>
      h("button.offpage__go", { on: { click: () => dispatch({ type: "page", page: p }) } }, `Page ${p + 1}`, h("span.offpage__n", { text: String(n) }))
    )
  );
}
