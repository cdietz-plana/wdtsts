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

/* --- Override controls ------------------------------------------------------
   Eight glyphs for the Override screen, drawn on the same 24px grid and in the
   same stroke language as everything above.

   These correspond to named Lucide icons, listed beside each one. They are
   drawn here rather than pulled from the library because the prototype takes
   no runtime dependency: it runs from a folder with nothing installed, and an
   icon set fetched from a CDN is one blocked request away from a screen full
   of empty boxes on a casino network. Swapping in the real Lucide assets is a
   one-line change per icon if WDTS wants pixel-exact.
   --------------------------------------------------------------------------- */

const stroke = 'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

/** lucide: copy-slash. Voiding a hand is a copy with a line through it. */
export const iconVoid = (s = 24) =>
  svg(s, '<rect x="9" y="9" width="12.5" height="12.5" rx="2.4"/><path d="M5.5 15H4.5a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2H13a2 2 0 0 1 2 2v1"/><path d="m11.8 18.7 6.9-6.9"/>', stroke);

/** lucide: replace. */
export const iconReplace = (s = 24) =>
  svg(s, '<rect x="2.5" y="13.5" width="8.5" height="8.5" rx="2.2"/><path d="M14 3.6a2 2 0 0 1 2-2"/><path d="M20 1.6a2 2 0 0 1 2 2"/><path d="M22 7.6a2 2 0 0 1-2 2"/><path d="M16 9.6a2 2 0 0 1-2-2"/><path d="M6.8 10.6V5.8a3 3 0 0 1 3-3h1.4"/><path d="m3.8 7.6 3 3 3-3"/>', stroke);

/** lucide: hand-coins. Settling a position by hand, with the money in it. */
export const iconSettle = (s = 24) =>
  svg(s, '<circle cx="6.4" cy="5.8" r="3"/><circle cx="16.8" cy="8.4" r="2.6"/><path d="M10.6 15.4h2.2a1.9 1.9 0 0 0 0-3.8H10c-.6 0-1.1.2-1.5.6L3.2 17.4"/><path d="m7.2 21.6 1.6-1.5c.4-.4.9-.6 1.5-.6h3.8c1 0 2-.4 2.7-1.1l3.8-3.6"/><path d="m2.2 16.4 5.4 5.4"/>', stroke);

/** lucide: copy-x. */
export const iconCancelBets = (s = 24) =>
  svg(s, '<rect x="9" y="9" width="12.5" height="12.5" rx="2.4"/><path d="M5.5 15H4.5a2 2 0 0 1-2-2V4.5a2 2 0 0 1 2-2H13a2 2 0 0 1 2 2v1"/><path d="m12.2 12.2 6.1 6.1M18.3 12.2l-6.1 6.1"/>', stroke);

/** lucide: flame. */
export const iconFlame = (s = 24) =>
  svg(s, '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>', stroke);

/** lucide: playing-cards. The buffer is cards read ahead of the deal. */
export const iconCardBuffer = (s = 24) =>
  svg(s, '<rect x="9.6" y="4.4" width="11.6" height="17.2" rx="2.2"/><path d="M6.9 19.9 2.9 9.1a2 2 0 0 1 1.1-2.6l4.4-1.7"/>', stroke);

/** lucide: book-bookmark. */
export const iconBook = (s = 24) =>
  svg(s, '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M9.2 2v8.2l2.6-2 2.6 2V2"/>', stroke);

/** lucide: scroll-text. */
export const iconScroll = (s = 24) =>
  svg(s, '<path d="M19 17V5a2 2 0 0 0-2-2H4.5"/><path d="M8 21h11a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H10a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2h4"/><path d="M14.8 8H9.6"/><path d="M14.8 12H9.6"/>', stroke);
