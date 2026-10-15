import { h } from "./dom.js";
import { compact, limitShort, percent } from "./format.js";
import { findTable, performance, playersForTable } from "./selectors.js";

/**
 * The table peek.
 *
 * Review feedback: show a table's KPIs by hovering over it, without opening
 * it. A tablet has no hover, so the same card answers two gestures: a mouse
 * resting on a table, and a finger held on one for under half a second. A
 * normal tap still opens the table. Lifting the finger puts the peek away.
 *
 * Any element carrying `data-peek="<tableId>"` gets this behavior. It is
 * wired after each render rather than through the store, because a peek is
 * a gesture in progress, not state anybody else needs to see.
 */
const HOLD_MS = 420;

function card(table, players) {
  const perf = performance([table]);
  const avgBet = players.length ? Math.round(players.reduce((n, p) => n + (p.avgBet || 0), 0) / players.length) : 0;
  const fig = (label, value, color) =>
    h("div.peek__fig", {}, h("span.micro", { text: label }), h("b.mono", { text: value, style: color ? { color } : {} }));
  return h(
    "div.peek",
    { role: "tooltip" },
    h(
      "div.peek__head",
      {},
      h("span.display", { text: table.name }),
      h("span", { text: table.dealer || "No dealer" })
    ),
    h(
      "div.peek__grid",
      {},
      fig("Win", compact(perf.win), perf.win < 0 ? "var(--critical-ink)" : "var(--ok-ink)"),
      fig("Drop", compact(perf.drop)),
      fig("Hold", percent(perf.hold)),
      fig("Handle", compact(perf.handle)),
      fig("Seated", `${table.seated} / ${table.seats}`),
      fig("Avg bet", compact(avgBet))
    ),
    h("div.peek__foot", { text: `Limits ${limitShort(table.limits)}` })
  );
}

export function wirePeek(device, getState) {
  if (!device) return;
  let current = null;
  let timer = null;
  let suppressClick = false;

  const hide = () => {
    window.clearTimeout(timer);
    if (current) current.remove();
    current = null;
  };

  const show = (el) => {
    hide();
    const state = getState();
    const table = findTable(state.pods, el.dataset.peek);
    if (!table) return;
    const node = card(table, playersForTable(state.players, table.id));
    device.appendChild(node);
    const dev = device.getBoundingClientRect();
    const scale = dev.width / device.offsetWidth || 1;
    const r = el.getBoundingClientRect();
    const w = node.offsetWidth;
    const hgt = node.offsetHeight;
    let left = (r.left - dev.left) / scale + r.width / scale / 2 - w / 2;
    let top = (r.top - dev.top) / scale - hgt - 10;
    if (top < 70) top = (r.bottom - dev.top) / scale + 10;
    left = Math.max(12, Math.min(device.offsetWidth - w - 12, left));
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
    current = node;
  };

  device.querySelectorAll("[data-peek]").forEach((el) => {
    el.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") show(el);
    });
    el.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") hide();
    });
    el.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        suppressClick = true;
        show(el);
      }, HOLD_MS);
    });
    const release = (e) => {
      if (e.pointerType === "mouse") return;
      window.clearTimeout(timer);
      if (current) hide();
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener(
      "click",
      (e) => {
        if (suppressClick) {
          suppressClick = false;
          e.stopPropagation();
          e.preventDefault();
        } else {
          hide();
        }
      },
      true
    );
  });
}
