/**
 * Player value, as a visual language.
 *
 * WDTS asked for the seat dots to carry color so a big bettor, and a player
 * who is a long way up, read from across the pit. That request collides with
 * the rule the rest of the product runs on: color means severity and nothing
 * else, which is what lets the floor view be read at arm's length.
 *
 * The resolution is two separate languages that cannot be confused:
 *
 *   severity  red, amber, green      something is wrong, or it is not
 *   value     slate, steel, indigo, gold   how much this player matters
 *
 * No hue appears in both. A table full of whales never looks like a fault, and
 * a dead table never looks like a high roller.
 *
 * Position (whether the player is ahead of the house) is NOT a third color.
 * It is a ring around the dot, so it reads as a modifier on the person rather
 * than as a new category. A player who is well up gets a bright ring. That is
 * deliberately the loudest thing a dot can do, because it is the one a
 * supervisor is accountable for noticing.
 *
 * ASSUMED, NOT SPECIFIED: the thresholds below. Average bet is a stand-in for
 * whatever rating the property actually grades on, and the money figures are
 * invented. WDTS sets the real bands.
 */

/** Average bet bands. The whale band is deliberately narrow. */
const TIERS = [
  { key: "whale", label: "Whale", floor: 60000 },
  { key: "high", label: "High", floor: 25000 },
  { key: "mid", label: "Mid", floor: 8000 },
  { key: "low", label: "Low", floor: 0 },
];

/** @returns {"whale"|"high"|"mid"|"low"} */
export function valueTier(player) {
  if (!player) return "low";
  const bet = player.avgBet || 0;
  return (TIERS.find((t) => bet >= t.floor) || TIERS[TIERS.length - 1]).key;
}

export const tierLabel = (key) => (TIERS.find((t) => t.key === key) || TIERS[3]).label;

/** Every tier, biggest first, for legends. */
export const tiers = () => TIERS.map((t) => ({ ...t }));

/** Dot fill. Slate to gold, nowhere near the severity hues. */
export const tierColor = (key) =>
  key === "whale" ? "var(--value-4)"
  : key === "high" ? "var(--value-3)"
  : key === "mid" ? "var(--value-2)"
  : "var(--value-1)";

/**
 * Dot diameter at full size. A whale is nearly twice a low roller, so the
 * pattern of a table reads before any color does. Floor cards pass a scale
 * below 1 to keep six pods legible without changing the relationship.
 */
export const tierSize = (key, scale = 1) =>
  Math.round((key === "whale" ? 15 : key === "high" ? 13 : key === "mid" ? 11 : 9) * scale);

/**
 * The same ladder at finger size, for the one surface where a dot is a control
 * rather than a mark. Everything here clears the 44px floor the rest of the
 * product uses for anything touched while walking, and the steps between tiers
 * stay proportional so the pattern of a table still reads.
 */
export const tapSize = (key) => (key === "whale" ? 62 : key === "high" ? 54 : key === "mid" ? 48 : 44);

/**
 * How far ahead of the house the player is.
 *
 * `winLoss` on a player is the HOUSE's result against that player, so a
 * negative figure means the player is up. That is the direction a supervisor
 * is asked about, so it is the one with a ring on it.
 *
 * @returns {"hot"|"up"|"flat"}
 */
export function position(player) {
  if (!player) return "flat";
  const playerUp = -(player.winLoss || 0);
  if (playerUp >= 300000) return "hot";
  if (playerUp >= 60000) return "up";
  return "flat";
}

/** Ring width in px. Zero means no ring, which is most seats. */
export const ringWidth = (pos) => (pos === "hot" ? 3 : pos === "up" ? 2 : 0);

/** Neutral by design: the ring must not read as a severity color. */
export const ringColor = (pos) => (pos === "hot" ? "var(--ring-hot)" : "var(--ring-up)");

export const positionLabel = (pos) =>
  pos === "hot" ? "Well up on the house" : pos === "up" ? "Up on the house" : "Level or down";

/**
 * Everything a dot needs, in one call, so seats.js stays about layout.
 * Returns null for an empty seat.
 */
export function dotStyle(player, scale = 1, tap = false) {
  if (!player) return null;
  const tier = valueTier(player);
  const pos = position(player);
  const size = tap ? tapSize(tier) : tierSize(tier, scale);
  return {
    tier,
    pos,
    size,
    color: tierColor(tier),
    // The ring grows with the dot, or it disappears at finger size.
    ring: ringWidth(pos) * (tap ? 2.2 : scale < 0.8 ? 0.7 : 1),
    ringColor: ringColor(pos),
    label: `Seat ${player.seat}, ${player.name}, ${tierLabel(tier)}, ${positionLabel(pos)}`,
  };
}
