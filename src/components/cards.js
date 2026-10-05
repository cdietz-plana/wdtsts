import { h } from "../lib/dom.js";
import { SUIT_GLYPH, isRedSuit } from "../data/games.js";

/**
 * Playing cards, drawn as cards.
 *
 * Review feedback: show the cards on the Primary, with number and suit. Up to
 * now the prototype showed the game as a result ("Banker 7, Player 4"), which
 * is the right thing on a history row and the wrong thing on a live table. A
 * supervisor walking up to a dispute is looking at the felt, so the screen
 * that stands in for the felt should show what is on it.
 *
 * Red suits are red. That is the one place in this product where a red thing
 * does not mean a problem, and it is unavoidable: a heart drawn in slate is
 * not a heart. It is contained to the card face, which is a white rectangle
 * that looks like nothing else on the screen.
 */

const SIZES = {
  sm: { w: 26, h: 36, rank: 13, suit: 12, radius: 3 },
  md: { w: 34, h: 48, rank: 17, suit: 15, radius: 4 },
  lg: { w: 52, h: 73, rank: 25, suit: 22, radius: 6 },
  xl: { w: 72, h: 101, rank: 35, suit: 31, radius: 8 },
};

export function playingCard(card, size = "md") {
  const s = SIZES[size] || SIZES.md;
  const red = isRedSuit(card.suit);
  return h(
    "div.pcard",
    {
      style: {
        width: `${s.w}px`,
        height: `${s.h}px`,
        borderRadius: `${s.radius}px`,
        color: red ? "#c0392b" : "#1a1f27",
      },
      "aria-label": `${card.rank} of ${{ S: "spades", H: "hearts", D: "diamonds", C: "clubs" }[card.suit]}`,
    },
    h("span", { text: card.rank, style: { fontSize: `${s.rank}px`, fontWeight: "700", lineHeight: "1" } }),
    h("span", { text: SUIT_GLYPH[card.suit], style: { fontSize: `${s.suit}px`, lineHeight: "1" } })
  );
}

/** A face-down slot, so the layout does not jump when the third card lands. */
export function cardSlot(size = "md") {
  const s = SIZES[size] || SIZES.md;
  return h("div.pcard.pcard--slot", { style: { width: `${s.w}px`, height: `${s.h}px`, borderRadius: `${s.radius}px` } });
}

const side = (label, cards, totalValue, size, holdSlot) =>
  h(
    "div",
    { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" } },
    h(
      "div",
      { style: { display: "flex", gap: size === "xl" ? "8px" : size === "lg" ? "6px" : "4px", alignItems: "center" } },
      cards.map((c) => playingCard(c, size)),
      holdSlot ? cardSlot(size) : null
    ),
    h(
      "div",
      { style: { display: "flex", alignItems: "baseline", gap: "6px" } },
      h("span", { text: label, style: { fontSize: "var(--t-micro)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: "700", color: "var(--on-felt-2)" } }),
      h("span.mono", { text: String(totalValue), style: { fontSize: size === "xl" ? "var(--t-metric)" : size === "lg" ? "var(--t-title)" : "var(--t-body)", fontWeight: "700", color: "var(--on-felt)" } })
    )
  );

/**
 * The hand in progress: Player on the left, Banker on the right, as they sit
 * on the layout. Each side keeps a slot for the third card so nothing shifts
 * under the supervisor's eye when it is drawn.
 */
export function handView(hand, { size = "md" } = {}) {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: size === "xl" ? "40px" : size === "lg" ? "28px" : "18px" } },
    side("Player", hand.player, hand.playerTotal, size, hand.player.length < 3),
    side("Banker", hand.banker, hand.bankerTotal, size, hand.banker.length < 3)
  );
}
