import { h } from "../lib/dom.js";
import { compact, money } from "../lib/format.js";
import { playersForTable } from "../lib/selectors.js";
import { memberNo, wagers } from "../data/casino.js";

/**
 * View Table: the Dealer Display, as the dealer sees it.
 *
 * Review feedback: View Table should be the Dealer Display, not a breakdown
 * of every wager in real time, and no cards anywhere. So this is the display
 * itself: the positions around the layout, player search in the middle, the
 * Banker and Player line and the total on the table, with each position's
 * Player and Banker wager along the bottom.
 *
 * ASSUMED: amounts are generated. In the product this mirrors the dealer
 * display through the table system.
 */

/** Where each position sits on the display. Top center, the sides, the corners. */
const SPOTS = { 3: "t1", 4: "t2", 5: "t3", 2: "ml", 6: "mr", 1: "bl", 7: "br" };

export function dealerDisplay(state, table, dispatch) {
  if (table.status === "offline") {
    return h(
      "div.card.fade-in.dd",
      { style: { alignItems: "center", justifyContent: "center", gap: "12px" } },
      h("div.display", { text: "Offline", style: { fontSize: "var(--t-hero)", fontWeight: "700", color: "var(--critical)" } }),
      h("div", { text: "No dealer display while the table is disconnected.", style: { fontSize: "var(--t-action)", color: "var(--ink-2)" } })
    );
  }
  const players = playersForTable(state.players, table.id);
  const bySeat = new Map(players.map((p) => [p.seat, p]));
  const seatNums = [1, 2, 3, 4, 5, 6, 7].slice(0, Math.min(7, table.seats));
  const pb = (p) => {
    const w = wagers(table, p);
    return { P: (w.find((x) => x.key === "P") || {}).amount || 0, B: (w.find((x) => x.key === "B") || {}).amount || 0, all: w.reduce((n, x) => n + x.amount, 0) };
  };
  const totals = players.reduce((acc, p) => { const x = pb(p); return { P: acc.P + x.P, B: acc.B + x.B, all: acc.all + x.all, n: acc.n + (x.all ? 1 : 0) }; }, { P: 0, B: 0, all: 0, n: 0 });

  const box = (n) => {
    const p = bySeat.get(n);
    const x = p ? pb(p) : null;
    const no = p ? memberNo(p) : null;
    return h(
      "button.dd__box",
      { data: { spot: SPOTS[n], empty: !p }, disabled: p ? null : "", "aria-label": p ? `Position ${n}, ${p.name}` : `Position ${n}, open`, on: { click: () => p && dispatch({ type: "open-player", playerId: p.id }) } },
      h("span.dd__num", { text: String(n) }),
      p
        ? h(
            "span.dd__who",
            {},
            h("span.dd__name", { text: p.name }),
            no ? h("span.dd__no.mono", { text: `(${no})` }) : null,
            h("span.dd__amt.mono", { text: x.all ? compact(x.all) : "No bet" })
          )
        : null
    );
  };

  const screen = h(
    "div.dd__screen",
    {},
    seatNums.map(box),
    h(
      "div.dd__center",
      {},
      h("div.dd__search", { text: "Player search" }),
      h("span", { style: { flex: "1" } }),
      h(
        "div.dd__bp",
        {},
        h("span.dd__bpv.mono", { text: money(totals.B) }),
        h("span.dd__b", { text: "BANKER" }),
        h("span.dd__p", { text: "PLAYER" }),
        h("span.dd__bpv.mono", { text: money(totals.P) })
      ),
      h("div.dd__total.mono", { text: `${money(totals.all)} (${totals.n})` })
    ),
    h("span.dd__corner.dd__corner--l.mono", { text: table.name }),
    h("span.dd__corner.dd__corner--r.mono", { text: "Version 2.6.4.5" })
  );

  const strips = h(
    "div.dd__strips",
    {},
    seatNums.map((n) => {
      const p = bySeat.get(n);
      const x = p ? pb(p) : { P: 0, B: 0 };
      return h(
        "div.dd__strip",
        { data: { empty: !p } },
        h("span.dd__snum", { text: String(n) }),
        h("span.dd__sline", {}, h("i", { text: "P" }), h("b.mono", { text: x.P ? compact(x.P) : "" })),
        h("span.dd__sline", {}, h("i", { text: "B" }), h("b.mono", { text: x.B ? compact(x.B) : "" }))
      );
    })
  );

  return h(
    "div.card.fade-in.dd",
    {},
    h("div.dd__top", {}, h("div.dd__dealer", {}, h("span.micro", { text: "Dealer" }), h("b", { text: table.dealer || "None" })), h("span", { style: { flex: "1" } }), h("span.dd__note", { text: table.seats > 7 ? "Front line shown. Seats 8 to 14 are on Players." : "" })),
    screen,
    strips
  );
}
