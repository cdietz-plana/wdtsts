import { glossary } from "../data/glossary.js";

/**
 * Help tips: a learning aid, not a product feature.
 *
 * Deliberately implemented as a pass over the rendered DOM rather than as
 * markup inside the components. Two reasons. No component has to know the
 * glossary exists, so nothing in the product is shaped by a teaching aid that
 * will be switched off before this ships. And it finds terms wherever they
 * appear, including on screens written after the glossary.
 *
 * Only the first occurrence of a term per screen is marked, or the floor view
 * alone would sprout forty badges.
 */

const ENTRIES = [...glossary].sort((a, b) => b.term.length - a.term.length);

/** One regex, longest terms first so "theoretical win" wins over "win". */
const PATTERN = new RegExp(
  "\\b(" +
    ENTRIES.flatMap((e) => [e.term, ...(e.alias || [])])
      .sort((a, b) => b.length - a.length)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|") +
    ")\\b",
  "i"
);

function lookup(text) {
  const t = text.toLowerCase();
  return ENTRIES.find((e) => e.term.toLowerCase() === t || (e.alias || []).some((a) => a.toLowerCase() === t));
}

const SKIP = new Set(["SCRIPT", "STYLE", "SVG", "PATH", "INPUT", "TEXTAREA"]);

function eligible(node) {
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (SKIP.has(el.tagName)) return false;
    // Live nodes are patched by writing straight into their text node once a
    // second. Wrapping one would be overwritten, and worse, silently.
    if (el.dataset && el.dataset.live) return false;
    if (el.classList && (el.classList.contains("gloss") || el.classList.contains("tiptip"))) return false;
    if (el.classList && el.classList.contains("ltg")) return true;
  }
  return false;
}

export function annotate(root) {
  const marked = new Set();
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const hits = [];
  let n;
  while ((n = walker.nextNode())) {
    if (!n.nodeValue.trim() || !eligible(n)) continue;
    const m = PATTERN.exec(n.nodeValue);
    if (!m) continue;
    const entry = lookup(m[1]);
    if (!entry || marked.has(entry.term)) continue;
    marked.add(entry.term);
    hits.push({ node: n, index: m.index, length: m[1].length, entry });
  }

  for (const hit of hits) {
    const after = hit.node.splitText(hit.index);
    after.splitText(hit.length);
    const span = document.createElement("span");
    span.className = "gloss";
    span.dataset.term = hit.entry.term;
    span.textContent = after.nodeValue;
    // A span, not a button: most of these land inside a card or row that is
    // itself a button, and a button inside a button is invalid markup that
    // browsers resolve differently.
    const badge = document.createElement("span");
    badge.className = "gloss__i";
    badge.setAttribute("role", "button");
    badge.setAttribute("tabindex", "0");
    badge.setAttribute("aria-label", `What does ${hit.entry.term} mean?`);
    badge.textContent = "i";
    span.appendChild(badge);
    after.parentNode.replaceChild(span, after);
  }
  return marked.size;
}

/** One popover, reused. Opens next to whichever badge was pressed. */
export function wireTips(root) {
  const tip = document.createElement("div");
  tip.className = "tiptip";
  tip.setAttribute("role", "dialog");
  root.appendChild(tip);

  const close = () => tip.removeAttribute("data-open");

  // Capture phase. Almost every badge sits inside a card or row that navigates
  // on click, and a listener on the way back up fires after that card has
  // already taken you somewhere else.
  root.addEventListener("click", (e) => {
    const badge = e.target.closest(".gloss__i");
    if (!badge) {
      if (!e.target.closest(".tiptip")) close();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const span = badge.closest(".gloss");
    const entry = ENTRIES.find((x) => x.term === span.dataset.term);
    if (!entry) return;

    tip.innerHTML = "";
    const h = document.createElement("div");
    h.className = "tiptip__term";
    h.textContent = entry.term;
    const s = document.createElement("div");
    s.className = "tiptip__what";
    s.textContent = entry.short;
    const w = document.createElement("div");
    w.className = "tiptip__why";
    w.innerHTML = "<b>Why it matters here. </b>";
    w.append(entry.why);
    tip.append(h, s, w);

    const r = span.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    tip.setAttribute("data-open", "true");
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    let x = r.left - rootRect.left + r.width / 2 - tw / 2;
    x = Math.max(12, Math.min(x, rootRect.width - tw - 12));
    let y = r.bottom - rootRect.top + 10;
    if (y + th > rootRect.height - 12) y = r.top - rootRect.top - th - 10;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  }, true);

  root.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("gloss__i")) {
      e.preventDefault();
      e.target.click();
    }
  });

  return close;
}
