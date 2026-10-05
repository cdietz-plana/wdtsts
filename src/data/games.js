/**
 * Completed games for the current gaming day.
 *
 * The Game tab is a lookup tool, not a feed. Nobody reads it in order; they
 * arrive at it holding a game number from a dispute, or a time from an alert.
 * That is why the list is filterable by shoe and why each row carries the one
 * thing a dispute turns on: whether the outcome was entered by the table or
 * corrected by a person.
 *
 * Deterministic from the table id so the same table always shows the same
 * history, which matters when the same screen is opened twice in a demo.
 */
const OUTCOMES = ["Banker", "Player", "Banker", "Player", "Tie", "Banker", "Player", "Banker"];

function seed(id) {
  let n = 0;
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

/**
 * Completed games, newest first. Shoe 9 is in progress at game 9, so the last
 * completed hand is game 8. The tail of shoe 8 is included deliberately: a
 * shoe boundary is where cards change and the pod stops, and a dispute that
 * straddles one is the hardest kind to reconstruct.
 *
 * @returns {import("../types.js").Game[]}
 */
export function gamesFor(tableId) {
  const s = seed(tableId);
  const rows = [];
  // 18:19 back in three minute steps, so the list lines up with the wall clock.
  let minutes = 18 * 60 + 19;

  const push = (shoe, game) => {
    const k = (s + game * 37) % 8;
    const outcome = OUTCOMES[k];
    rows.push({
      id: `${tableId}-s${shoe}-g${game}`,
      shoe,
      game,
      at: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
      banker: (s + game * 13) % 10,
      player: (s + game * 29) % 10,
      outcome,
      handle: 40000 + ((s + game * 911) % 46) * 10000,
      result: outcome === "Tie" ? 0 : ((s + game * 7) % 2 ? 1 : -1) * (10000 + ((s + game * 331) % 28) * 5000),
      // The only column a dispute actually turns on.
      corrected: tableId === "t3" && shoe === 9 && game === 6 ? "Void hand · 0418" : null,
    });
    minutes -= 3;
  };

  for (let g = 8; g >= 1; g--) push(9, g);
  for (let g = 62; g >= 59; g--) push(8, g);
  return rows;
}
