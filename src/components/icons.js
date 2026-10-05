import { fromHTML } from "../lib/dom.js";

/** Stroke icons on a 24px grid. Never emoji: these need to scale and recolour. */
const svg = (size, body, extra = "") =>
  fromHTML(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ${extra}>${body}</svg>`);

export const iconGrid = (s = 15) =>
  svg(s, '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>', 'stroke-width="1.9"');

export const iconBell = (s = 15) =>
  svg(s, '<path d="M12 3a6 6 0 0 0-6 6c0 4-2 5-2 5h16s-2-1-2-5a6 6 0 0 0-6-6z"/><path d="M10.5 20a2 2 0 0 0 3 0"/>', 'stroke-width="1.9" stroke-linecap="round"');

export const iconBack = (s = 18) =>
  svg(s, '<path d="M15 18l-6-6 6-6"/>', 'stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"');

export const iconChevron = (s = 14, dir = "right") =>
  svg(s, `<path d="${dir === "down" ? "M6 9l6 6 6-6" : "M9 6l6 6-6 6"}"/>`, 'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"');

export const iconPerson = (s = 12) =>
  svg(s, '<circle cx="12" cy="8" r="3.4"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6"/>', 'stroke-width="2"');

export const iconScan = (s = 26) =>
  svg(s, '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M3 12h18"/>', 'stroke-width="1.8" stroke-linecap="round"');

export const iconClose = (s = 17) =>
  svg(s, '<path d="M6 6l12 12M18 6L6 18"/>', 'stroke-width="2.2" stroke-linecap="round"');

export const iconTick = (s = 16) =>
  svg(s, '<path d="M4 12.5l5.5 5.5L20 7"/>', 'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"');

export const iconCard = (s = 18) =>
  svg(s, '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/>', 'stroke-width="1.9"');

export const iconBackspace = (s = 20) =>
  svg(s, '<path d="M9 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-6-7z"/><path d="M12.5 9.5l4 5M16.5 9.5l-4 5"/>', 'stroke-width="1.9" stroke-linecap="round"');

export const iconSpade = (s = 19) =>
  fromHTML(`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="#fff"><path d="M12 2.6l6.2 8.1c1.5 2 .4 5-2.1 5.5-1.2.2-2.4-.2-3.2-1.1l.9 5.1h-3.6l.9-5.1c-.8.9-2 1.3-3.2 1.1-2.5-.5-3.6-3.5-2.1-5.5z"/></svg>`);

export const iconBars = (s = 15) =>
  svg(s, '<path d="M5 20V12"/><path d="M12 20V5"/><path d="M19 20v-6"/>', 'stroke-width="2.2" stroke-linecap="round"');

export const iconHelp = (s = 17) =>
  svg(s, '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.8-.9 1.4v.4"/><path d="M12 17.1h.01"/>', 'stroke-width="1.9" stroke-linecap="round"');

export const iconNext = (s = 16) =>
  svg(s, '<path d="M9 6l6 6-6 6"/>', 'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"');

export const iconPrev = (s = 16) =>
  svg(s, '<path d="M15 6l-6 6 6 6"/>', 'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"');

export const iconNote = (s = 15) =>
  svg(s, '<path d="M6 3.5h9l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z"/><path d="M14.5 3.7V8h4.2"/><path d="M8.5 12.5h7M8.5 16h4.5"/>', 'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"');
