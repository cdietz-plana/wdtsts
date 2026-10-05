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

  for (let start = 0; start < total; start += PER_ROW) {
    const count = Math.min(PER_ROW, total - start);
    rows.push(
      h(
        "div",
        { style: { display: "flex", gap: `${gap}px`, alignItems: "center" } },
        Array.from({ length: count }, (_, i) => dot(bySeat.get(start + i + 1), scale, onPick, tap))
      )
    );
  }

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: `${gap}px` } },
    rows
  );
}

function dot(player, scale, onPick, tap) {
  const d = dotStyle(player, scale, tap);

  if (!d) {
    const size = tap ? 44 : Math.round(9 * scale);
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

/**
 * The legend for the value colors. It exists because a color language nobody
 * is taught is just decoration, and this one has four steps.
 */
export function valueLegend(compact = false) {
  const swatch = (color, size, label) =>
    h(
      "span",
      { style: { display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" } },
      h("span.seat", { style: { width: `${size}px`, height: `${size}px`, background: color } }),
      label
    );

  const rule = h("span", {
    style: { width: "1px", height: "14px", background: "var(--line-strong)", opacity: "0.7", flexShrink: "0" },
  });

  return h(
    "div",
    { style: { display: "flex", alignItems: "center", gap: compact ? "9px" : "13px", flexWrap: "wrap" } },
    h("span.micro", { text: "Seat color · average bet", style: { whiteSpace: "nowrap" } }),
    swatch("var(--value-1)", 9, "Low"),
    swatch("var(--value-2)", 11, "Mid"),
    swatch("var(--value-3)", 13, "High"),
    swatch("var(--value-4)", 15, "Whale"),
    rule,
    h(
      "span",
      { style: { display: "flex", alignItems: "center", gap: "9px", whiteSpace: "nowrap" } },
      h("span.seat", { style: { width: "13px", height: "13px", background: "var(--value-3)", boxShadow: "0 0 0 3px var(--ring-hot)" } }),
      h("span.micro", { text: "Ring" }),
      "Up on the house"
    )
  );
}
