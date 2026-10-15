import { h } from "../lib/dom.js";
import { dotStyle } from "../lib/playervalue.js";

/** One side of a baccarat layout. Fourteen is both sides, so it draws as two of these. */
const PER_ROW = 7;

/** Below this a dot is too small to aim a thumb at, so it stops being a button. */
const TAPPABLE_AT = 11;

/**
 * Seat dots.
 *
 * Every table has seven positions a side; a full-size table has fourteen and
 * draws as two rows, which is how the pit actually reads it. Never one long
 * row of fourteen: at pod-card size that is an unreadable dotted line and it
 * breaks the card grid.
 *
 * Review feedback turned these from occupancy into information. A dot now
 * carries who is in the seat: its color is the player's value band and its
 * size follows, so a table with a whale on it looks different from across the
 * pit. A ring means the player is ahead of the house, which is the one thing
 * a supervisor is accountable for noticing.
 *
 * The value hues share nothing with the severity hues. See lib/playervalue.js
 * for why that constraint exists and what it costs.
 *
 * @param {object} table
 * @param {object[]} players  the people at this table, one per occupied seat
 * @param {{scale?:number, gap?:number, tap?:boolean, onPick?:(player)=>void}} opts
 *   tap: draw at finger size. For the Live view, where the table fills the
 *   screen and a seat is something you press rather than something you read.
 */
export function seats(table, players = [], { scale = 1, gap = 3, tap = false, onPick = null } = {}) {
  const bySeat = new Map(players.map((p) => [p.seat, p]));
  const total = table.seats;
  const rows = [];

  // Review feedback: the front line always shows its seven places, so the
  // table's shape still reads. The back line shows only the people in it;
  // an empty back-line position is not a seat anyone is managing.
  const front = Math.min(PER_ROW, total);
  rows.push(
    h(
      "div",
      { style: { display: "flex", gap: `${gap}px`, alignItems: "center" } },
      Array.from({ length: front }, (_, i) => dot(bySeat.get(i + 1), scale, onPick, tap))
    )
  );
  const back = [];
  for (let n = PER_ROW + 1; n <= total; n += 1) if (bySeat.has(n)) back.push(dot(bySeat.get(n), scale, onPick, tap));
  if (back.length) rows.push(h("div", { style: { display: "flex", gap: `${gap}px`, alignItems: "center" } }, back));

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: `${gap}px` } },
    rows
  );
}

function dot(player, scale, onPick, tap) {
  const d = dotStyle(player, scale, tap);

  if (!d) {
    const size = tap ? 44 : Math.round(10 * scale);
    return h("span.seat.seat--empty", { style: { width: `${size}px`, height: `${size}px` } });
  }

  const style = {
    width: `${d.size}px`,
    height: `${d.size}px`,
    background: d.color,
    boxShadow: d.ring ? `0 0 0 ${d.ring}px ${d.ringColor}` : "",
  };

  // A dot only becomes a control once it is big enough to hit. On the floor at
  // six pods it is a mark; in a pod or on a table it is a person you can open.
  if (onPick && d.size >= TAPPABLE_AT) {
    return h(
      "button.seat.seat--pick",
      {
        style: tap
          ? { ...style, fontSize: "var(--t-action)", fontWeight: "700", color: "var(--on-value)" }
          : style,
        title: d.label,
        "aria-label": d.label,
        data: { tier: d.tier, pos: d.pos },
        on: {
          click: (e) => {
            e.stopPropagation();
            onPick(player);
          },
        },
      },
      tap ? String(player.seat) : null
    );
  }

  return h("span.seat", { style, title: d.label, data: { tier: d.tier, pos: d.pos } });
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

/** The key for the seat dots. Two facts, two marks, no sentence. */
export function valueLegend() {
  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: "14px", whiteSpace: "nowrap" } },
    h(
      "span",
      { style: { display: "flex", alignItems: "center", gap: "6px" } },
      h("span.seat", { style: { width: "12px", height: "12px", background: "var(--value-3)" } }),
      "High avg bet"
    ),
    h(
      "span",
      { style: { display: "flex", alignItems: "center", gap: "8px" } },
      h("span.seat", { style: { width: "12px", height: "12px", background: "var(--value-1)", boxShadow: "0 0 0 3px var(--ring-hot)" } }),
      "Large win"
    )
  );
}
