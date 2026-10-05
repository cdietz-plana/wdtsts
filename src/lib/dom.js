/**
 * A 30-line view layer. No framework, no build step.
 *
 * `h` builds DOM nodes declaratively so component code reads like markup.
 * Everything in this app is a pure function of state, and `render` in app.js
 * rebuilds the tree on change — the same model a framework gives you, without
 * the dependency. If this is ever ported to React, each component here maps
 * one-to-one onto a component there.
 */

const SVG_NS = "http://www.w3.org/2000/svg";
const SVG_TAGS = new Set(["svg", "path", "rect", "circle", "g", "line", "polyline", "polygon"]);

/**
 * @param {string} tag       "div", or "div.card.is-open" for classes
 * @param {object} [props]   { style, class, text, html, data, on, ...attributes }
 * @param {...(Node|string|null|false|Array)} children
 * @returns {HTMLElement|SVGElement}
 */
export function h(tag, props, ...children) {
  const [name, ...classes] = tag.split(".");
  const isSvg = SVG_TAGS.has(name);
  const el = isSvg ? document.createElementNS(SVG_NS, name) : document.createElement(name);

  if (classes.length) el.setAttribute("class", classes.join(" "));

  for (const [key, value] of Object.entries(props || {})) {
    if (value === null || value === undefined || value === false) continue;

    if (key === "class") {
      el.setAttribute("class", [...classes, value].filter(Boolean).join(" "));
    } else if (key === "style" && typeof value === "object") {
      Object.assign(el.style, value);
    } else if (key === "text") {
      el.textContent = String(value);
    } else if (key === "html") {
      el.innerHTML = String(value);
    } else if (key === "data") {
      for (const [d, v] of Object.entries(value)) {
        if (v !== null && v !== undefined && v !== false) el.dataset[d] = String(v);
      }
    } else if (key === "on") {
      for (const [evt, fn] of Object.entries(value)) el.addEventListener(evt, fn);
    } else if (value === true) {
      el.setAttribute(key, "");
    } else {
      el.setAttribute(key, String(value));
    }
  }

  append(el, children);
  return el;
}

function append(parent, children) {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    if (Array.isArray(child)) append(parent, child);
    else parent.appendChild(typeof child === "string" || typeof child === "number" ? document.createTextNode(String(child)) : child);
  }
}

/** A run of nodes with no wrapper element, for list items that render siblings. */
export function fragment(...children) {
  const f = document.createDocumentFragment();
  append(f, children);
  return f;
}

/** Icons are static markup, so a template is safer and shorter than nested h(). */
export function fromHTML(markup) {
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  return t.content.firstElementChild;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}
