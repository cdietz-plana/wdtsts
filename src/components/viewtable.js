import { h } from "../lib/dom.js";
import { compact, limitShort, money } from "../lib/format.js";
import { alertsForTable, playersForTable } from "../lib/selectors.js";
import { currentHand } from "../data/games.js";
import { chipTray } from "../data/tables.js";
import { handView } from "./cards.js";
import { iconClose } from "./icons.js";

/**
 * View Table: the dealer view.
 *
 * The functional inventory defines View Table as the live Dealer Display plus
 * the antenna view: the chip value sitting on every table location, with a
 * tap on a location opening its denominations, and for baccarat the shared
 * main bets at the top. The earlier Live tab kept the seats and the cards but
 * dropped the chips on the spots, which is the part a supervisor uses to see
 * the table without standing at it. This restores it.
 *
 * It follows the pattern the stakeholder liked on the overview: a tap on a
 * spot opens a quick overlay; a second tap on the player goes deeper.
 *
 * ASSUMED: the bet amounts are generated. In the product they come from the
 * table's RFID antennas through the Dealer Display integration.
 */

const BET_TYPES = [
  { key: "B", label: "Banker" },
  { key: "P", label: "Player" },
  { key: "T", label: "Tie" },
  { key: "BP", label: "Banker pair" },
  { key: "PP", label: "Player pair" },
];

const DENOMS = chipTray.map((d) => d.value).sort((a, b) => b - a);

/** Chips on a spot, largest first, as the antennas would read them. */
export function denominations(amount) {
  const out = [];
  let left = amount;
  for (const v of DENOMS) {
    const n = Math.floor(left / v);
    if (n > 0) {
      out.push({ value: v, count: n });
      left -= n * v;
    }
  }
  return out;
}

/** Deterministic bets for one position, inside the table's limits. */
export function betsAt(table, player) {
  if (!player) return [];
  const r = (k) => ((player.seat * 7919 + table.id.length * 131 + k * 977 + (player.avgBet || 0)) % 1000) / 1000;
  const unit = Math.max(table.limits.min, Math.min(table.limits.max, Math.round(((player.avgBet || table.limits.min) * (0.6 + r(1) * 0.8)) / 1000) * 1000));
  const main = r(2) > 0.45 ? "B" : "P";
  const bets = [{ key: main, amount: unit }];
  if (r(3) > 0.72) bets.push({ key: "T", amount: Math.max(table.limits.min / 5, Math.round(unit * 0.05 / 100) * 100) });
  if (r(4) > 0.8) bets.push({ key: main === "B" ? "BP" : "PP", amount: Math.max(table.limits.min / 5, Math.round(unit * 0.04 / 100) * 100) });
  return bets;
}

/** Module state for the open spot. A preview is a glance, not app state. */
let openSeat = null;

export function viewTable(state, table, dispatch) {
  if (table.status === "offline") {
    return h(
      "div.card.fade-in.vt",
      { style: { alignItems: "center", justifyContent: "center", gap: "12px" } },
      h("div.display", { text: "Offline", style: { fontSize: "var(--t-hero)", fontWeight: "700", color: "var(--critical)" } }),
      h("div", { text: "No dealer display while the table is disconnected. Last chip count 18:04.", style: { fontSize: "var(--t-action)", color: "var(--ink-2)" } })
    );
  }

  const players = playersForTable(state.players, table.id);
  const bySeat = new Map(players.map((p) => [p.seat, p]));
  const hand = currentHand(table.id);
  const positions = Array.from({ length: Math.min(7, table.seats) }, (_, i) => i + 1);
  const back = [];
  for (let n = 8; n <= table.seats; n += 1) if (bySeat.has(n)) back.push(n);

  // Shared main bets: every position's wagers added up by bet type, which is
  // how the dealer display shows a baccarat table at the top.
  const totals = Object.fromEntries(BET_TYPES.map((b) => [b.key, 0]));
  for (const p of players) for (const b of betsAt(table, p)) totals[b.key] += b.amount;

  const shared = h(
    "div.vt__shared",
    {},
    BET_TYPES.map((b) =>
      h("div.vt__sbet", { data: { key: b.key, empty: totals[b.key] === 0 } }, h("span.micro", { text: b.label }), h("b.mono", { text: totals[b.key] ? money(totals[b.key]) : "0" }))
    )
  );

  // The dealer display's own messages, shown as it shows them.
  const tableItems = alertsForTable(state.alerts, table.id).filter((a) => a.kind !== "receipt");
  const dd = h(
    "div.vt__dd",
    {},
    h("span.vt__dd-label", { text: "Dealer display" }),
    h("span.vt__dd-msg", { text: tableItems.length ? tableItems[0].title : "Bets open" }),
    h("span", { style: { flex: "1" } }),
    h("span.mono.vt__dd-meta", { text: `Hand ${hand.game} · Limits ${limitShort(table.limits)}` })
  );

  const spot = (seat, small) => {
    const p = bySeat.get(seat);
    const bets = betsAt(table, p);
    const total = bets.reduce((n, b) => n + b.amount, 0);
    return h(
      "button.vt__spot",
      {
        data: { empty: !p, small: !!small, open: openSeat === `${table.id}:${seat}` },
        disabled: p ? null : "",
        "aria-label": p ? `Seat ${seat}, ${p.name}, ${money(total)} on the table` : `Seat ${seat}, open`,
        on: {
          click: (e) => {
            e.stopPropagation();
            openSeat = openSeat === `${table.id}:${seat}` ? null : `${table.id}:${seat}`;
            dispatch({ type: "view-refresh" });
          },
        },
      },
      h("span.vt__seat", { text: String(seat) }),
      p
        ? [
            h("span.vt__name", { text: p.name }),
            small ? null : h("span.vt__bets", {}, bets.map((b) => h("span.vt__bet", { data: { key: b.key } }, h("i", { text: b.key }), h("b.mono", { text: compact(b.amount) })))),
            h("span.vt__total.mono", { text: compact(total) }),
          ]
        : h("span.vt__open", { text: "Open" })
    );
  };

  const arc = h(
    "div.vt__arc",
    {},
    positions.map((s, i) => {
      const off = Math.abs(i - (positions.length - 1) / 2);
      return h("div.vt__pos", { style: { transform: `translateY(${-Math.round(off * off * 5)}px)` } }, spot(s));
    })
  );

  const felt = h(
    "div.vt__felt",
    {},
    h("div.vt__cards", {}, handView(hand, { size: "lg" })),
    arc,
    back.length ? h("div.vt__back", {}, h("span.micro", { text: "Back line" }), back.map((s) => spot(s, true))) : null
  );

  return h(
    "div.card.fade-in.vt",
    { on: { click: () => { if (openSeat) { openSeat = null; dispatch({ type: "view-refresh" }); } } } },
    shared,
    felt,
    dd,
    openSeat && openSeat.startsWith(`${table.id}:`) ? spotDetail(table, bySeat.get(Number(openSeat.split(":")[1])), dispatch) : null
  );
}

/** The overlay for one spot: each bet and the chips that make it up. */
function spotDetail(table, p, dispatch) {
  if (!p) return null;
  const bets = betsAt(table, p);
  const total = bets.reduce((n, b) => n + b.amount, 0);
  const label = (k) => (BET_TYPES.find((b) => b.key === k) || {}).label;
  const close = () => {
    openSeat = null;
    dispatch({ type: "view-refresh" });
  };
  return h(
    "div.vt__pop",
    { role: "dialog", "aria-label": `Seat ${p.seat} bets`, on: { click: (e) => e.stopPropagation() } },
    h(
      "div.vt__pop-head",
      {},
      h("span.vt__seat", { text: String(p.seat) }),
      h("span", { style: { flex: "1", minWidth: "0" } }, h("span.vt__pop-name", { text: p.name }), h("span.vt__pop-sub", { text: p.rated ? `${p.tier} · card ${p.card}` : "Anonymous" })),
      h("button.icon-btn", { "aria-label": "Close", on: { click: close } }, iconClose(15))
    ),
    bets.map((b) =>
      h(
        "div.vt__pop-bet",
        {},
        h("div.vt__pop-line", {}, h("span", { text: label(b.key) }), h("b.mono", { text: money(b.amount) })),
        h("div.vt__chips", {}, denominations(b.amount).map((d) => h("span.vt__chip", {}, h("b.mono", { text: compact(d.value) }), h("span", { text: `×${d.count}` }))))
      )
    ),
    h("div.vt__pop-line.vt__pop-total", {}, h("span", { text: "On the table" }), h("b.mono", { text: money(total) })),
    h("button.btn.btn--big", {
      text: "Open player",
      on: {
        click: () => {
          openSeat = null;
          dispatch({ type: "open-player", playerId: p.id });
        },
      },
    })
  );
}
