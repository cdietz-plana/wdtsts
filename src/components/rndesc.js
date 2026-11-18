import { h } from "../lib/dom.js";
import { iconClose, iconTick } from "./icons.js";

/**
 * Refused Player Description, from the RN button on an anonymous player's
 * record. Fields as WDTS supplied them. Five short steps rather than one long
 * scroll: Basic, Appearance, Face, Clothing, Features. Every choice is one tap.
 * Choices are held per player for the session; in the product they save to
 * the player record against the PP ID.
 */
const STEPS = [
  { id: "basic", label: "Basic", groups: [
    { k: "sex", label: "Sex", opts: ["Male", "Female", "Other"] },
    { k: "age", label: "Estimated age", opts: ["20s", "30s", "40s", "50+"] },
    { k: "country", label: "Country", opts: ["China", "Hong Kong", "Macau", "Taiwan", "Other"] },
    { k: "ethnicity", label: "Ethnicity", opts: ["Hispanic", "Middle Eastern or North Africa (MENA)", "Black", "East Asian", "South Asian", "American Indian", "Other"], other: "Specify ethnicity" },
  ]},
  { id: "body", label: "Appearance", groups: [
    { k: "height", label: "Height", opts: ["4'0\" - 5'0\"", "5'1\" - 5'6\"", "5'7\" - 6'0\"", "6'1\"+"] },
    { k: "build", label: "Build / weight", opts: ["Thin", "Average", "Heavy", "Very heavy"] },
  ]},
  { id: "face", label: "Face", groups: [
    { k: "hair", label: "Hair color", opts: ["Black", "White", "Blonde", "Brown", "Red", "Gray", "Bald"] },
    { k: "eyes", label: "Eye color", opts: ["Green", "Brown", "Blue", "Hazel", "Gray"] },
  ]},
  { id: "clothes", label: "Clothing", groups: [
    { k: "top", label: "Top type", opts: ["T-shirt", "Uniform", "Sweater", "Polo", "Dress", "Shirt", "Jacket", "Suit", "Hoodie", "Other"], other: "Specify top type" },
    { k: "topColor", label: "Top color", swatch: true, opts: ["Black", "Yellow", "Orange", "White", "Gray", "Blue", "Green", "Purple", "Multi-colored", "Other"] },
    { k: "bottom", label: "Bottom type", opts: ["Jeans", "Skirt", "Trousers", "Leggings", "Shorts", "Joggers", "Other"], other: "Specify bottom type" },
    { k: "bottomColor", label: "Bottom color", swatch: true, opts: ["Black", "Yellow", "Orange", "White", "Gray", "Blue", "Green", "Purple", "Multi-colored", "Other"] },
  ]},
  { id: "features", label: "Features", groups: [
    { k: "features", label: "Distinguishing features", multi: true, opts: ["Beard", "Wheelchair", "Mustache", "Glasses", "Hat / cap", "Face mask", "Tattoos", "Piercing", "Walking stick", "Other"], other: "Specify feature" },
  ]},
];
const SW = { Black: "#111", Yellow: "#f2c200", Orange: "#f07a12", White: "#fff", Gray: "#9a9a9a", Blue: "#1f5fd6", Green: "#1d8a3a", Purple: "#6b2a9a" };

/** Descriptions per player, and the step on screen. */
const saved = new Map();
let draft = null;
let step = 0;

export const hasDescription = (playerId) => saved.has(playerId) && Object.keys(saved.get(playerId)).length > 0;
export const ppId = (p) => {
  let n = 0;
  for (const c of p.id) n = (n * 31 + c.charCodeAt(0)) % 99991;
  return 301000 + (n % 999);
};

export function openDescription(p) { draft = { ...(saved.get(p.id) || {}) }; step = 0; }

export function rnDescription(p, { refresh, close, toast }) {
  if (!draft) openDescription(p);
  const s = STEPS[step];
  const pick = (g, o) => {
    if (g.multi) { const cur = new Set(draft[g.k] || []); cur.has(o) ? cur.delete(o) : cur.add(o); draft[g.k] = [...cur]; }
    else draft[g.k] = draft[g.k] === o ? undefined : o;
    refresh();
  };
  const on = (g, o) => (g.multi ? (draft[g.k] || []).includes(o) : draft[g.k] === o);
  const count = (st) => st.groups.filter((g) => (g.multi ? (draft[g.k] || []).length : draft[g.k])).length;

  const group = (g) =>
    h(
      "div.rn-group",
      {},
      h("div.micro", { text: g.label }),
      h(
        "div.rn-opts",
        {},
        g.opts.map((o) =>
          h("button.rn-opt", { "aria-pressed": String(on(g, o)), on: { click: () => pick(g, o) } },
            g.swatch && SW[o] ? h("span.rn-sw", { style: { background: SW[o] } }) : g.swatch && o === "Multi-colored" ? h("span.rn-sw.rn-sw--multi") : null,
            o, on(g, o) ? iconTick(12) : null)
        )
      ),
      g.other && on(g, "Other") ? h("input.rn-other", { type: "text", placeholder: g.other, value: draft[`${g.k}Other`] || "", on: { input: (e) => { draft[`${g.k}Other`] = e.target.value; } } }) : null
    );

  return h(
    "div.rn-scrim",
    { on: { click: (e) => { if (e.target === e.currentTarget) { draft = null; close(); } } } },
    h(
      "div.rn",
      { role: "dialog", "aria-modal": "true", "aria-label": "Refused player description" },
      h("div.rn__head", {},
        h("div", {}, h("div.display.rn__title", { text: "Refused Player Description" }), h("div.rn__sub", { text: `PP ID ${ppId(p)} · ${p.seat ? `seat ${p.seat}` : ""}` })),
        h("span", { style: { flex: "1" } }),
        h("button.icon-btn", { "aria-label": "Close", on: { click: () => { draft = null; close(); } } }, iconClose())
      ),
      h("div.rn__steps", { role: "tablist" },
        STEPS.map((st, i) => h("button.rn-step", { role: "tab", "aria-pressed": String(i === step), on: { click: () => { step = i; refresh(); } } },
          h("span.rn-step__n", { text: count(st) ? String(count(st)) : String(i + 1), data: { done: count(st) > 0 } }), st.label))
      ),
      h("div.rn__body", {}, s.groups.map(group)),
      h("div.rn__foot", {},
        h("button.btn.btn--ghost", { text: "Reset", on: { click: () => { draft = {}; refresh(); } } }),
        h("span", { style: { flex: "1" } }),
        step > 0 ? h("button.btn.btn--ghost", { text: "Back", on: { click: () => { step -= 1; refresh(); } } }) : null,
        step < STEPS.length - 1
          ? h("button.btn", { text: `Next · ${STEPS[step + 1].label}`, on: { click: () => { step += 1; refresh(); } } })
          : null,
        h("button.btn", { text: "Save", on: { click: () => { saved.set(p.id, draft); draft = null; close(); toast(`Description saved to PP ID ${ppId(p)}.`); } } })
      )
    )
  );
}
