import { h } from "../lib/dom.js";
import { compact, money } from "../lib/format.js";
import { currentHand } from "../data/games.js";
import { BET_TYPES, gameRows, inventoryFor, limitProfiles, memberNo, sessionKpis, sessionsFor, wagers } from "../data/casino.js";
import { alertsForTable, findTable, playersForTable } from "../lib/selectors.js";
import { iconCard, iconChevron, iconFill, iconFlip, iconOpen, iconScan } from "./icons.js";
import { overrideTab } from "./override.js";
import { dealerDisplay } from "./viewtable.js";
import { dataTable } from "./datatable.js";

/**
 * The table dashboard tabs, in the order of the WDTS Table Dashboard so a
 * manager moving between the two finds the same thing in the same place.
 * Opening a table from the overview lands on Players.
 */
export const TABS = [
  ["players", "Players"],
  ["inventory", "Inventory"],
  ["games", "Games"],
  ["sessions", "Sessions"],
  ["override", "Override"],
  ["live", "View Table"],
];

export function tableBody(state, dispatch, handlers) {
  const table = findTable(state.tables, state.tableId);
  if (!table) return h("div");
  switch (state.tab) {
    case "inventory": return inventoryTab(state, table, dispatch, handlers);
    case "games": return gamesTab(state, table, dispatch);
    case "sessions": return sessionsTab(state, table, dispatch);
    case "override": return overrideTab(state, table, { tables: [table] }, dispatch);
    case "live": return dealerDisplay(state, table, dispatch);
    default: return playersTab(state, table, dispatch);
  }
}

/* ================================================================ players */

/** Seat cards turned over to their KPIs. A glance, so it lives outside the store. */
const flippedSeats = new Set();
/** Which line of a fourteen-seat table is on screen. */
const lineOf = new Map();

/**
 * Players, as the current Players tab has it: the shoe across the top, a card
 * on every occupied position with the wagers on it now, and a rating entry on
 * each card. A tap on the turn icon flips a card to the player's session
 * figures and the four player functions. The open icon goes to the full
 * player record.
 */
function playersTab(state, table, dispatch) {
  const players = playersForTable(state.players, table.id);
  const bySeat = new Map(players.map((p) => [p.seat, p]));
  const hand = currentHand(table.id);
  const big = table.seats > 7;
  const line = big ? lineOf.get(table.id) || "front" : "front";
  const first = line === "back" ? 8 : 1;
  const seatsShown = Array.from({ length: 7 }, (_, i) => first + i);
  const shoeWL = gameRows(table, players, "").reduce((n, g) => n + g.casinoWL, 0);

  const shoe = h(
    "div.pl-shoe",
    {},
    h("span.pl-shoe__tag", { text: "Shoe" }),
    cell("ID", String(2751000 + (hand.game * 7) % 900)),
    cell("Game", String(hand.game)),
    cell("Cards", String(416 - hand.game * 5)),
    h(
      "button.pl-shoe__cell.pl-shoe__reveal",
      { "aria-label": "Shoe win or loss", on: { click: (e) => { const b = e.currentTarget.querySelector("b"); b.textContent = b.textContent === "Reveal" ? money(shoeWL) : "Reveal"; } } },
      h("span.micro", { text: "Shoe W/L" }),
      h("b.mono", { text: "Reveal" })
    )
  );

  const lineToggle = big
    ? h(
        "div.segmented.segmented--sm",
        { role: "group", "aria-label": "Which line" },
        [["front", "Seats 1 to 7"], ["back", "Seats 8 to 14"]].map(([id, label]) =>
          h("button", { text: label, "aria-pressed": String(line === id), on: { click: () => { lineOf.set(table.id, id); dispatch({ type: "view-refresh" }); } } })
        )
      )
    : null;

  const cards = seatsShown.map((n, i) => {
    const off = Math.abs(i - 3);
    const lift = { transform: `translateY(${Math.round(off * off * 4)}px)` };
    const p = bySeat.get(n);
    return h("div.pl-pos", { style: lift }, p ? seatCard(state, table, p, dispatch) : emptySeat(table, n, dispatch));
  });

  const diff = (() => {
    const all = players.flatMap((p) => wagers(table, p));
    const b = all.filter((w) => w.key === "B").reduce((n, w) => n + w.amount, 0);
    const pl = all.filter((w) => w.key === "P").reduce((n, w) => n + w.amount, 0);
    return b - pl;
  })();

  return h(
    "div.fade-in.pl",
    {},
    h("div.pl__top", {}, shoe, h("span", { style: { flex: "1" } }), lineToggle),
    h("div.pl__table", {}, h("div.pl__felt", { "aria-hidden": "true" }), h("div.pl__cards", {}, cards), h("div.pl__diff", {}, "Differential: ", h("b.mono", { text: money(diff) })))
  );
}

const cell = (label, value) => h("div.pl-shoe__cell", {}, h("span.micro", { text: label }), h("b.mono", { text: value }));

const initials = (name) => {
  if (!name || name === "Anonymous") return "?";
  return name.split(/[\s.]+/).filter(Boolean).map((x) => x[0]).join("").slice(0, 2).toUpperCase();
};

function seatCard(state, table, p, dispatch) {
  const key = `${table.id}:${p.seat}`;
  const on = flippedSeats.has(key);
  const w = wagers(table, p);
  const k = sessionKpis(table, p);
  const no = memberNo(p);

  const flip = (label) =>
    h(
      "button.pc__flip",
      {
        "aria-label": label,
        title: label,
        on: {
          click: (e) => {
            e.stopPropagation();
            const el = e.currentTarget.closest(".pc");
            if (flippedSeats.has(key)) flippedSeats.delete(key);
            else flippedSeats.add(key);
            el.dataset.flipped = String(flippedSeats.has(key));
          },
        },
      },
      iconFlip(14)
    );

  const head = h(
    "div.pc__head",
    {},
    h("span.pc__seat", { text: String(p.seat), data: { rated: !!p.rated } }),
    h("span", { style: { flex: "1" } }),
    flip(on ? "Back to wagers" : "Player figures")
  );

  const who = h(
    "button.pc__who",
    { on: { click: () => dispatch({ type: "open-player", playerId: p.id }) }, "aria-label": `Open ${p.name}` },
    h("span.pc__avatar", { text: initials(p.name), data: { anon: !p.rated } }),
    no ? h("span.pc__no.mono", { text: `(${no})` }) : null,
    h("span.pc__name", { text: p.name })
  );

  const front = h(
    "div.pc__face.pc__front",
    { "aria-hidden": on ? "true" : "false" },
    head,
    who,
    h(
      "div.pc__wagers",
      {},
      w.map((x) => h("div.pc__wager", { data: { zero: !x.amount } }, h("span", { text: x.key, title: x.label }), h("b.mono", { text: x.amount ? compact(x.amount) : "0" })))
    ),
    h(
      "button.pc__rate",
      { on: { click: () => dispatch({ type: "expand", tableId: table.id, view: "rate", amount: p.avgBet, reason: p.id }) } },
      "Rating",
      iconChevron(12, "right")
    )
  );

  const fig = (label, value, color) => h("div.pc__kpi", {}, h("span.micro", { text: label }), h("b.mono", { text: value || "—", style: color ? { color } : {} }));
  const act = (label, msg) => h("button.pc__act", { text: label, on: { click: () => dispatch({ type: "toast", message: msg }) } });
  const back = h(
    "div.pc__face.pc__back",
    { "aria-hidden": on ? "false" : "true" },
    h("div.pc__head", {}, h("span.pc__seat", { text: String(p.seat), data: { rated: !!p.rated } }), h("span.pc__bname", { text: p.name }), flip("Back to wagers")),
    h(
      "div.pc__kpis",
      {},
      fig("Session W/L", compact(k.sessionWL), k.sessionWL > 0 ? "var(--critical-ink)" : null),
      fig("Cash handle", compact(k.cashHandle)),
      fig("Promo handle", compact(k.promoHandle)),
      fig("Avg bet", compact(k.avgBet)),
      fig("Start time", k.start),
      fig("Buy in", compact(k.buyIn)),
      fig("Chips in", compact(k.chipsIn)),
      fig("MID", k.mid)
    ),
    h(
      "div.pc__acts",
      {},
      act("MID No.", `MID for ${p.name}: ${k.mid || "none on file"}.`),
      act("Clock out", `${p.name} clocked out of seat ${p.seat}.`),
      act("Move", `Pick the seat to move ${p.name} to.`),
      act("Cancel rating", `Rating for ${p.name} cancelled.`)
    ),
    h("button.pc__open", { on: { click: () => dispatch({ type: "open-player", playerId: p.id }) } }, iconOpen(13), "Player record")
  );

  return h("div.pc", { data: { flipped: on, rated: !!p.rated } }, front, back);
}

function emptySeat(table, n, dispatch) {
  return h(
    "button.pc.pc--empty",
    { "aria-label": `Seat ${n}, open. Attach a player card`, on: { click: () => dispatch({ type: "toast", message: `Seat ${n}: tap the player's card on the reader to open a session.` }) } },
    h("span.pc__bignum", { text: String(n) }),
    h("span.pc__reader", {}, iconCard(26))
  );
}

/* ============================================================== inventory */

/**
 * Inventory, with the Table Dashboard's fields: the tray filters, actual,
 * expected and variance, RIM and marker balances, the tray by denomination,
 * and the functions around it. Scan lives here now rather than on the tile.
 */
function inventoryTab(state, table, dispatch, { onScan }) {
  const inv = inventoryFor(table);
  const scanning = !!state.scanning[table.id];
  const varianceOpen = alertsForTable(state.alerts, table.id).some((a) => a.title.toLowerCase().includes("tray"));

  const pick = (label, value) =>
    h("button.inv-pick", { on: { click: () => dispatch({ type: "toast", message: `${label}: ${value}. Other options come from the table system.` }) } }, h("span.micro", { text: label }), h("span.inv-pick__v", {}, value, iconChevron(12, "down")));

  const stat = (label, value, alarm) => h("div.inv-stat", { data: { alarm: !!alarm } }, h("span.micro", { text: label }), h("b.mono", { text: value }));

  const side = (label, onClick, opts = {}) =>
    h("button.inv-side", { data: { tone: opts.tone || "" }, disabled: opts.disabled ? "" : null, on: { click: onClick } }, h("span", { text: label }), iconOpen(14));

  return h(
    "div.fade-in.inv",
    {},
    h(
      "div.inv__left",
      {},
      pick("Chip tray", "Both trays"),
      pick("Chip set", "All"),
      h("span", { style: { flex: "1" } }),
      side("Opener / Closer / Roll table", () => dispatch({ type: "toast", message: `${table.name}: opener 18:00. Roll table is scheduled.` })),
      side("Player transactions", () => dispatch({ type: "toast", message: "Buy-ins, markers and cash outs at this table, newest first." }))
    ),
    h(
      "div.inv__mid",
      {},
      h(
        "div.inv__stats",
        {},
        h("div.inv-group", {}, stat("Actual", money(inv.actual)), stat("Expected", money(inv.expected)), stat("Variance", money(inv.variance), inv.variance !== 0)),
        h("div.inv-group", {}, stat("RIM balance", money(inv.rim)), stat("Marker balance", money(inv.marker)))
      ),
      dataTable({
        className: "dt--inv",
        columns: [
          { key: "d", label: "Denominations", render: (r) => money(r.value) },
          { key: "c", label: "Count", align: "right", render: (r) => String(r.count) },
          { key: "v", label: "Value", align: "right", render: (r) => money(r.value * r.count) },
        ],
        rows: inv.rows,
        foot: ["Total", String(inv.count), money(inv.actual)],
      })
    ),
    h(
      "div.inv__right",
      {},
      h("button.inv-side.inv-side--plain", { on: { click: () => dispatch({ type: "toast", message: `${table.name} game win/loss today: ${money(table.dayWin)}.` }) } }, h("span", { text: "Game W/L" })),
      h("button.inv-side.inv-side--plain", { on: { click: () => dispatch({ type: "toast", message: `${table.name} revenue today: ${money(Math.round(table.dayWin * 0.92))}.` }) } }, h("span", { text: "Revenue" })),
      h("span", { style: { flex: "1" } }),
      h(
        "button.scan-dial.inv__scan",
        { data: { scanning }, "aria-label": "Scan the chip tray", on: { click: () => onScan(table.id) } },
        iconScan(26),
        scanning ? null : h("span.display", { text: "Scan" })
      ),
      h("span", { style: { flex: "1" } }),
      side("Adjust", () => dispatch({ type: "expand", tableId: table.id, view: "adjust", alertId: varianceOpen ? "b1" : null }), { disabled: !inv.variance }),
      side("Fills / Credits / Transfer", () => dispatch({ type: "expand", tableId: table.id, view: "fill" }), { tone: "strong" })
    )
  );
}

/* ================================================================== games */

/** Games opened to their positions. A glance, so outside the store. */
const openGames = new Set();

/**
 * Games, with the Table Dashboard's columns. Limits is the long profile name,
 * so it is tucked into the row: tap a game to see its limits and every
 * position's bets. Results read B, P, TIE plus any side bet that hit.
 */
export function gamesTab(state, table, dispatch) {
  const players = playersForTable(state.players, table.id);
  const profile = limitProfiles(table)[0].name;
  const all = gameRows(table, players, profile);
  const f = FILTERS.games;
  const rows = all.filter((g) => (f.result === "all" || g.result.split("/")[0] === f.result) && (!f.side || g.result.includes("/")) && (!f.loss || g.casinoWL < 0));
  return h(
    "div.fade-in.hist",
    {},
    h("div.hist__head", {}, h("span.hist__count", { text: countLabel(rows.length, all.length, "Games") }), h("span", { style: { flex: "1" } }), filtersBtn("games", dispatch)),
    f.open
      ? filterBar("games", dispatch, [
          group("Result", "result", [["all", "All"], ["B", "Banker"], ["P", "Player"], ["TIE", "Tie"]]),
          toggle("Side bet hit", "side"),
          toggle("House lost", "loss"),
        ])
      : null,
    dataTable({
      className: "dt--games",
      columns: [
        { key: "id", label: "Game ID", sticky: true, render: (g) => h("span.dt-strong", { text: String(g.id) }) },
        { key: "shoe", label: "Shoe ID", render: (g) => String(g.shoe) },
        { key: "start", label: "Start", render: (g) => g.start },
        { key: "end", label: "End", render: (g) => g.end },
        { key: "sup", label: "Supervisor", render: (g) => g.supervisor },
        { key: "dealer", label: "Dealer", render: (g) => g.dealer },
        { key: "handle", label: "Handle", align: "right", render: (g) => money(g.handle) },
        { key: "wl", label: "Casino W/L", align: "right", render: (g) => h("span", { text: money(g.casinoWL), data: { neg: g.casinoWL < 0 } }) },
        { key: "bp", label: "B · P", align: "center", render: (g) => h("span.dt-bp", {}, h("b", { text: String(g.bTotal), data: { side: "b" } }), h("b", { text: String(g.pTotal), data: { side: "p" } })) },
        { key: "res", label: "Result(s)", render: (g) => h("span", {}, g.result, g.corrected ? h("span.tag.dt-tag", { text: "Corrected" }) : null) },
        { key: "x", label: "", width: "40px", render: (g) => h("span.dt-caret", { data: { open: openGames.has(`${table.id}:${g.id}`) } }, iconChevron(14, "down")) },
      ],
      rows,
      empty: "No games match these filters.",
      rowKey: (g) => `${table.id}:${g.id}`,
      isOpen: (g) => openGames.has(`${table.id}:${g.id}`),
      onRow: (g) => {
        const k = `${table.id}:${g.id}`;
        if (openGames.has(k)) openGames.delete(k);
        else openGames.add(k);
        dispatch({ type: "view-refresh" });
      },
      expand: (g) =>
        h(
          "div.dt-more",
          {},
          h("div.dt-more__limits", {}, h("span.micro", { text: "Limits" }), h("span.mono", { text: g.limits })),
          g.lines.length
            ? h(
                "table.dt-sub",
                {},
                h("thead", {}, h("tr", {}, ["Position", "Player", "Tip", "Bet type", "Bets", "Chip set", "Casino W/L"].map((x, i) => h("th", { text: x, style: i >= 4 && i !== 5 ? { textAlign: "right" } : {} })))),
                h(
                  "tbody",
                  {},
                  g.lines.map((l) =>
                    h(
                      "tr",
                      {},
                      h("td", { text: l.position ? String(l.position) : "" }),
                      h("td", {}, l.player ? h("span.dt-player", { text: l.member ? `${l.player} (${l.member})` : l.player }) : ""),
                      h("td", { text: l.tip === null ? "" : String(l.tip) }),
                      h("td", {}, l.type, l.odds ? h("span.dt-odds", { text: ` (${l.odds})` }) : null),
                      h("td.mono", { text: money(l.bet), style: { textAlign: "right" } }),
                      h("td", { text: l.chipSet }),
                      h("td.mono", { text: money(l.wl), style: { textAlign: "right" }, data: { neg: l.wl < 0 } })
                    )
                  )
                )
              )
            : h("div.dt-empty", { text: "No positions bet on this game." })
        ),
    })
  );
}

/* =============================================================== sessions */

/**
 * Sessions, with every Table Dashboard column. On a tablet they do not all
 * fit, so Session ID and Player stay put and the rest scroll sideways; the
 * fade on the right edge says there is more.
 */
export function sessionsTab(state, table, dispatch) {
  const everyone = state.players.filter((p) => p.tableId === table.id);
  const all = sessionsFor(table, everyone);
  const f = FILTERS.sessions;
  const rows = all.filter((r) => (f.status === "all" || r.status === f.status) && (f.rated === "all" || (f.rated === "rated" ? !!r.rating : !r.rating)));
  const sum = (k) => rows.reduce((n, r) => n + (r[k] || 0), 0);
  const avg = rows.length ? Math.round(sum("avgBet") / rows.length) : 0;
  const fig = (label, value, neg) => h("div.hist-fig", {}, h("span.micro", { text: label }), h("b.mono", { text: value, data: { neg: !!neg } }));

  return h(
    "div.fade-in.hist",
    {},
    h(
      "div.hist__head",
      {},
      h("span.hist__count", { text: countLabel(rows.length, all.length, "Sessions") }),
      h("span", { style: { flex: "1" } }),
      h("button.btn.btn--ghost", { text: "Create manual rating", on: { click: () => dispatch({ type: "expand", tableId: table.id, view: "rate" }) } }),
      h("button.btn.btn--ghost", { text: "Update closed sessions", on: { click: () => dispatch({ type: "toast", message: "Closed sessions sent for update." }) } }),
      filtersBtn("sessions", dispatch)
    ),
    f.open
      ? filterBar("sessions", dispatch, [
          group("Status", "status", [["all", "All"], ["open", "Open"], ["closed", "Closed"]]),
          group("Player", "rated", [["all", "All"], ["rated", "Rated"], ["anon", "Anonymous"]]),
        ])
      : null,
    // The totals follow the filter, so they always describe the rows shown.
    h("div.hist__figs", {}, fig("Casino W/L", money(sum("casinoWL")), sum("casinoWL") < 0), fig("Average bet", money(avg)), fig("Cash handle", money(sum("cashHandle"))), fig("Promo handle", money(sum("promoHandle"))), fig("Buy in", money(sum("buyIn")))),
    dataTable({
      className: "dt--sessions",
      columns: [
        { key: "id", label: "Session ID", sticky: true, render: (r) => h("span.dt-strong", { text: String(r.id) }) },
        { key: "status", label: "Status", align: "center", render: (r) => h("span.dt-status", { data: { open: r.status === "open" }, title: r.status === "open" ? "Open" : "Closed" }) },
        { key: "player", label: "Player", sticky: true, render: (r) => h("span.dt-player", {}, r.player, r.member ? h("span.dt-member", { text: ` (${r.member})` }) : null) },
        { key: "rating", label: "Rating", render: (r) => (r.rating ? String(r.rating) : "—") },
        { key: "shoe", label: "Shoe ID", render: (r) => String(r.shoe) },
        { key: "start", label: "Start", render: (r) => r.start },
        { key: "end", label: "End", render: (r) => r.end || "Open" },
        { key: "wl", label: "Casino W/L", align: "right", render: (r) => h("span", { text: money(r.casinoWL), data: { neg: r.casinoWL < 0 } }) },
        { key: "avg", label: "Average bet", align: "right", render: (r) => money(r.avgBet) },
        { key: "cash", label: "Cash handle", align: "right", render: (r) => money(r.cashHandle) },
        { key: "promo", label: "Promo handle", align: "right", render: (r) => money(r.promoHandle) },
        { key: "buyin", label: "Buy in", align: "right", render: (r) => money(r.buyIn) },
        { key: "seat", label: "Seat", align: "center", render: (r) => String(r.seat) },
        { key: "mid", label: "MID", render: (r) => h("button.dt-link", { text: "Edit", on: { click: (e) => { e.stopPropagation(); dispatch({ type: "toast", message: `MID for ${r.player}: ${r.mid || "none"}.` }); } } }) },
        { key: "notes", label: "Notes", align: "center", render: (r) => h("span.dt-notes", { text: String(r.notes) }) },
      ],
      rows,
      onRow: (r) => dispatch({ type: "open-player", playerId: r.playerId }),
      empty: "No sessions match these filters.",
    })
  );
}

/* ---------------------------------------------------------------- filters */

/**
 * Filters for Games and Sessions. They narrow the list on screen, so they
 * are a glance, held here rather than in the store, and they stay set while
 * the manager moves between tables.
 */
const FILTERS = {
  games: { open: false, result: "all", side: false, loss: false },
  sessions: { open: false, status: "all", rated: "all" },
};
const DEFAULTS = { games: { result: "all", side: false, loss: false }, sessions: { status: "all", rated: "all" } };
const activeCount = (key) => Object.entries(DEFAULTS[key]).filter(([k, v]) => FILTERS[key][k] !== v).length;
const countLabel = (n, of, noun) => (n === of ? `${n} ${noun}` : `${n} of ${of} ${noun}`);

function filtersBtn(key, dispatch) {
  const n = activeCount(key);
  return h(
    "button.btn.btn--ghost.hist__filters",
    { "aria-pressed": String(FILTERS[key].open), on: { click: () => { FILTERS[key].open = !FILTERS[key].open; dispatch({ type: "view-refresh" }); } } },
    "Filters",
    n ? h("span.count-badge", { text: String(n) }) : null
  );
}

/** The filter row: each group is one tap per option, Clear resets them. */
function filterBar(key, dispatch, parts) {
  const set = (k, v) => { FILTERS[key][k] = v; dispatch({ type: "view-refresh" }); };
  return h(
    "div.hist__filterbar",
    {},
    parts.map((part) => part(key, set)),
    h("span", { style: { flex: "1" } }),
    activeCount(key) ? h("button.btn.btn--ghost", { text: "Clear", on: { click: () => { Object.assign(FILTERS[key], DEFAULTS[key]); dispatch({ type: "view-refresh" }); } } }) : null
  );
}
const group = (label, k, options) => (key, set) =>
  h(
    "div.hist__fgroup",
    {},
    h("span.micro", { text: label }),
    h("div.segmented.segmented--sm", { role: "group", "aria-label": label }, options.map(([v, text]) => h("button", { text, "aria-pressed": String(FILTERS[key][k] === v), on: { click: () => set(k, v) } })))
  );
const toggle = (label, k) => (key, set) =>
  h("button.chip.hist__ftoggle", { text: label, "aria-pressed": String(!!FILTERS[key][k]), on: { click: () => set(k, !FILTERS[key][k]) } });

export { iconFill };
