import { age, ageLong, countdown, rollIn, wallClock } from "./format.js";

/**
 * The handful of values that change every second.
 *
 * The prototype re-renders the whole screen from state on every action, which
 * is the right model for a prototype and the wrong one for a clock: rebuilding
 * the DOM once a second tore down and replayed every entry animation under the
 * user, which is the flicker. A tick now rewrites these nodes in place and
 * touches nothing else.
 *
 * Mark a node with `data: { live: "countdown" }`, or `"age:a2"` where the value
 * belongs to one alert. Everything else still goes through a normal render.
 */
const VALUES = {
  clock: (s) => wallClock(s.clockSeconds),
  countdown: (s) => countdown(s.countdown),
  roll: (s) => rollIn(s.rollMinutes),
  age: (s, id) => withAlert(s, id, (a) => age(a.ageSeconds)),
  ageLong: (s, id) => withAlert(s, id, (a) => ageLong(a.ageSeconds)),
};

function withAlert(state, id, fn) {
  const a = state.alerts.find((x) => x.id === id);
  return a ? fn(a) : "";
}

/** @returns true when every live node was found and patched. */
export function patchLive(root, state) {
  const nodes = root.querySelectorAll("[data-live]");
  if (!nodes.length) return false;
  for (const el of nodes) {
    const [kind, arg] = el.dataset.live.split(":");
    const fn = VALUES[kind];
    if (!fn) continue;
    const next = fn(state, arg);
    if (el.textContent === next) continue;
    // Write into the existing text node rather than replacing it, so the patch
    // is a character edit and not a child-list change.
    if (el.firstChild && el.firstChild.nodeType === 3 && !el.firstChild.nextSibling) {
      el.firstChild.nodeValue = next;
    } else {
      el.textContent = next;
    }
  }
  return true;
}
