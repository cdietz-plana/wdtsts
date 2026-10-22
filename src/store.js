import { tables as ALL_TABLES } from "./data/tables.js";
import { initialAlerts } from "./data/alerts.js";

let receiptSeq = 100;
import { closedPlayers, players as namedPlayers, withAnonymousFill } from "./data/players.js";
import { thresholds as initialThresholds } from "./data/thresholds.js";
import { HOME_SECTION, initialSections } from "./data/sections.js";
import { wallClock } from "./lib/format.js";
import { WALLPAPER_FOR_THEME } from "./assets.js";

/**
 * One state object, one reducer, one subscriber. Every screen is a pure
 * function of state.
 */

const tableName = (id) => (ALL_TABLES.find((t) => t.id === id) || {}).name || "";

/** Seated players, then the ones who have left, each carrying the table they played. */
const ALL_PLAYERS = [
  ...withAnonymousFill([{ tables: ALL_TABLES }], namedPlayers),
  ...closedPlayers.map((p) => ({ ...p, sessions: p.sessions.map((sx) => ({ ...sx, table: tableName(p.tableId) })) })),
];

/**
 * Player threshold alerts are derived, not stored: change a threshold and the
 * Alerts list changes with it. Win and loss are from the player's side, so a
 * player up 60,000 is `winLoss: -60000` (the house's result).
 */
const T = (thresholds, id) => thresholds.find((t) => t.id === id);
export function playerAlerts(players, thresholds, resolved) {
  const win = T(thresholds, "th5"), loss = T(thresholds, "th6"), avg = T(thresholds, "th8");
  const out = [];
  for (const p of players) {
    if (p.closed) continue;
    const up = -p.winLoss;
    const who = { kind: "player", name: p.name, seat: p.seat };
    if (win && up >= win.value) out.push({ id: `pw-${p.id}-${win.value}`, kind: "alert", gen: "player", tableId: p.tableId, severity: "high", subject: who, title: "Player win", detail: `Up ${up.toLocaleString("en-US")}. Alert at ${win.value.toLocaleString("en-US")}.`, ageSeconds: 60 + (p.seat * 37) % 400, actions: [{ label: "Player", primary: true, intent: "open-player" }] });
    if (loss && -up >= loss.value) out.push({ id: `pl-${p.id}-${loss.value}`, kind: "alert", gen: "player", tableId: p.tableId, severity: "high", subject: who, title: "Player loss", detail: `Down ${(-up).toLocaleString("en-US")}. Alert at ${loss.value.toLocaleString("en-US")}.`, ageSeconds: 90 + (p.seat * 53) % 400, actions: [{ label: "Player", primary: true, intent: "open-player" }] });
    if (avg && (p.avgBet || 0) >= avg.value) out.push({ id: `pa-${p.id}-${avg.value}`, kind: "alert", gen: "player", tableId: p.tableId, severity: "high", subject: who, title: "Average bet", detail: `Average bet ${p.avgBet.toLocaleString("en-US")}. Alert at ${avg.value.toLocaleString("en-US")}.`, ageSeconds: 120 + (p.seat * 71) % 400, actions: [{ label: "Player", primary: true, intent: "open-player" }] });
  }
  return out.filter((a) => !resolved.includes(a.id));
}
const withPlayerAlerts = (s) => ({ ...s, alerts: [...s.alerts.filter((a) => a.gen !== "player"), ...playerAlerts(s.players, s.thresholds, s.resolved)] });

/** Everything that narrows to the tables in one section. */
function scoped(sections, sectionId, resolved) {
  const sec = sections.find((x) => x.id === sectionId) || sections[0];
  const ids = new Set(sec.tableIds);
  const tables = ALL_TABLES.filter((t) => ids.has(t.id));
  return {
    tables,
    alerts: initialAlerts.filter((x) => ids.has(x.tableId) && !resolved.includes(x.id)),
    players: ALL_PLAYERS.filter((p) => ids.has(p.tableId)),
  };
}

const START0 = scoped(initialSections, HOME_SECTION, []);
const START = { ...START0, alerts: [...START0.alerts, ...playerAlerts(START0.players, initialThresholds, [])] };

export const initialState = {
  theme: "felt",
  wallpaper: WALLPAPER_FOR_THEME.felt,
  signedIn: false,
  login: { id: "" },

  /** "section" is the twelve-up overview; "table" is one table's dashboard. */
  level: "section",
  /** Which twelve of the section are on screen. */
  page: 0,
  tableId: null,
  /** Table dashboard tab. Games and Sessions are not tabs; see `panel`. */
  tab: "live",

  /**
   * The tile a manager has opened up from the overview, and what it is showing.
   * `view` is "menu" (all quick functions), "fill", "authorize", "adjust",
   * "rating", "games" or "sessions". Null when every tile is closed.
   * @type {null|{tableId:string, view:string, step:number, alertId?:string, mode?:"fill"|"credit", amount?:number, reason?:string}}
   */
  expand: null,
  /**
   * Review control, not product: where an opened tile shows its content.
   * "inplace" grows the tile over its neighbors; "panel" slides a side panel
   * over the rail. Both are here so WDTS can compare them.
   */
  expandStyle: "inplace",

  /** Right rail: Actions, Alerts or Players. */
  rail: "actions",
  /** @type {"open"|"closed"} */ playerList: "open",

  /** Games and Sessions on the table dashboard live in a side panel. */
  /** @type {null|"games"|"sessions"} */ history: null,

  /** Tables whose tray scan is running, by id. */
  scanning: {},
  /**
   * Fills and credits in flight, by table id. One item per fill, moving
   * through its stages, rather than a request, an acceptance and a
   * processing message as three separate entries.
   * @type {Record<string, {mode:"fill"|"credit", amount:number, by:"dealer"|"you", stage:number}>}
   */
  fills: { t15: { mode: "fill", amount: 250000, by: "dealer", stage: 0 } },

  /** Sections on the floor, and the one this manager is looking at. */
  sections: initialSections,
  sectionId: HOME_SECTION,
  /** The section picker in the bar. */
  sectionMenu: false,
  /**
   * The section being created or edited on the All sections screen.
   * `tableIds` is the draft; nothing moves until Save.
   * @type {null|{id:string|null, name:string, tableIds:string[], pick:string[], from:string, mode:"list"|"map", picked:string[]}}
   */
  editSection: null,
  /** All sections screen: which section card is turned over, and the map preview. */
  mapPreview: null,
  /** Tiles per page: 4, 9 or 12. */
  perPage: 4,
  /** Section overview as tiles or as the floor map. */
  overviewMode: "grid",
  tables: START.tables,
  alerts: START.alerts,
  /** Every table on the floor, for the map and the section editor. */
  allTables: ALL_TABLES,
  /** Items cleared this session, so changing the section size does not bring them back. */
  resolved: [],
  players: START.players,
  /** Player alert thresholds open for quick edit in the Players tab. */
  thresholdEdit: false,
  thresholds: initialThresholds,

  helpTips: false,
  sheet: null,
  playerId: null,
  playerClosing: false,
  noteDraft: "",
  cardDraft: "",
  toast: null,
  clockSeconds: 18 * 3600 + 21 * 60,
};

export function reducer(s, a) {
  switch (a.type) {
    case "theme": return { ...s, theme: a.theme, wallpaper: WALLPAPER_FOR_THEME[a.theme] || s.wallpaper };
    case "wallpaper": return { ...s, wallpaper: a.wallpaper };
    case "login-id": return { ...s, login: { ...s.login, id: a.id } };
    case "sign-in": return { ...s, signedIn: true };
    case "sign-out":
      return { ...initialState, theme: s.theme, wallpaper: s.wallpaper, expandStyle: s.expandStyle, sections: s.sections, sectionId: s.sectionId, perPage: s.perPage, resolved: s.resolved, tables: s.tables, alerts: s.alerts, players: s.players };
    case "section-menu": return { ...s, sectionMenu: a.open ?? !s.sectionMenu };
    case "select-section":
      return withPlayerAlerts({
        ...s,
        ...scoped(s.sections, a.sectionId, s.resolved),
        sectionId: a.sectionId, sectionMenu: false, page: 0, level: "section", tableId: null, expand: null, editSection: null, mapPreview: null,
      });
    case "go-sections": return { ...s, level: "sections", sectionMenu: false, expand: null, editSection: null, mapPreview: null };
    case "map-preview": return { ...s, mapPreview: a.tableId };

    /* --- section editor --------------------------------------------------- */
    case "edit-section": {
      const sec = a.sectionId ? s.sections.find((x) => x.id === a.sectionId) : null;
      return {
        ...s,
        mapPreview: null,
        editSection: {
          id: sec ? sec.id : null,
          name: sec ? sec.name : "",
          tableIds: sec ? [...sec.tableIds] : [],
          from: "unassigned",
          mode: "list",
          pickLeft: [],
          pickRight: [],
        },
      };
    }
    case "edit-set": return s.editSection ? { ...s, editSection: { ...s.editSection, ...a.patch } } : s;
    case "edit-toggle": {
      if (!s.editSection) return s;
      const key = a.side === "right" ? "pickRight" : "pickLeft";
      const cur = s.editSection[key];
      return { ...s, editSection: { ...s.editSection, [key]: cur.includes(a.tableId) ? cur.filter((x) => x !== a.tableId) : [...cur, a.tableId] } };
    }
    case "edit-move": {
      const e = s.editSection;
      if (!e) return s;
      if (a.dir === "in") return { ...s, editSection: { ...e, tableIds: [...e.tableIds, ...e.pickLeft.filter((x) => !e.tableIds.includes(x))], pickLeft: [] } };
      return { ...s, editSection: { ...e, tableIds: e.tableIds.filter((x) => !e.pickRight.includes(x)), pickRight: [] } };
    }
    // On the map a tap moves a table straight in or out of the draft.
    case "edit-map-toggle": {
      const e = s.editSection;
      if (!e) return s;
      const inIt = e.tableIds.includes(a.tableId);
      return { ...s, editSection: { ...e, tableIds: inIt ? e.tableIds.filter((x) => x !== a.tableId) : [...e.tableIds, a.tableId] } };
    }
    case "edit-save": {
      const e = s.editSection;
      if (!e || !e.name.trim()) return s;
      const id = e.id || `s${Date.now() % 100000}`;
      const moving = new Set(e.tableIds);
      // A table belongs to one section, so anything moved in leaves its old one.
      let sections = s.sections.map((x) => (x.id === id ? x : { ...x, tableIds: x.tableIds.filter((t) => !moving.has(t)) }));
      if (e.id) sections = sections.map((x) => (x.id === id ? { ...x, name: e.name.trim(), tableIds: [...e.tableIds] } : x));
      else sections = [...sections, { id, name: e.name.trim(), manager: "Unassigned", tableIds: [...e.tableIds], hue: 12 + (sections.length * 67) % 360, zone: null }];
      const next = { ...s, sections, editSection: null, toast: `${e.name.trim()} saved with ${e.tableIds.length} tables.` };
      return withPlayerAlerts({ ...next, ...scoped(sections, s.sectionId, s.resolved) });
    }
    case "edit-cancel": return { ...s, editSection: null };
    case "threshold-edit": return { ...s, thresholdEdit: a.open ?? !s.thresholdEdit };
    case "expand-style": return { ...s, expandStyle: a.style };
    case "page": return { ...s, page: a.page, expand: null };
    // Changing density keeps the first table on screen in view.
    case "overview-mode": return { ...s, overviewMode: a.mode, expand: null, mapPreview: null };
    case "per-page": {
      const first = s.page * s.perPage;
      return { ...s, perPage: a.perPage, overviewMode: "grid", page: Math.floor(first / a.perPage), expand: null };
    }
    case "rail": return { ...s, rail: a.rail };
    case "player-list": return { ...s, playerList: a.list };
    case "sheet": return { ...s, sheet: a.sheet };
    case "help-tips": return { ...s, helpTips: !s.helpTips };

    case "expand":
      return {
        ...s,
        page: a.page ?? s.page,
        expand: { tableId: a.tableId, view: a.view || "menu", step: 1, alertId: a.alertId || null, mode: a.mode || "fill", amount: a.amount || null, reason: null },
      };
    case "expand-view": return s.expand ? { ...s, expand: { ...s.expand, view: a.view, step: 1, amount: a.amount ?? null, mode: a.mode || s.expand.mode } } : s;
    case "expand-set": return s.expand ? { ...s, expand: { ...s.expand, ...a.patch } } : s;
    case "collapse": return { ...s, expand: null };
    // The Override tab raises its corrections in the same side panel.
    case "flyout-open":
      return { ...s, expand: { tableId: s.tableId, view: "override", step: 1, overrideId: a.overrideId, reason: null } };

    case "go-section": return { ...s, level: "section", tableId: null, history: null, expand: null };
    case "go-table": return { ...s, level: "table", tableId: a.tableId, tab: a.tab || "live", history: a.history || null, expand: null, page: a.page ?? s.page };
    case "tab": return { ...s, tab: a.tab };
    // Re-render for a glance (an open bet spot) that lives outside the store.
    case "view-refresh": return { ...s };
    case "history": return { ...s, history: a.history };

    case "scan-start": return { ...s, scanning: { ...s.scanning, [a.tableId]: true } };
    case "scan-done": {
      const { [a.tableId]: _, ...rest } = s.scanning;
      return { ...s, scanning: rest };
    }
    case "fill-start": return { ...s, fills: { ...s.fills, [a.tableId]: { mode: a.mode, amount: a.amount, by: a.by, stage: 0 } } };
    case "fill-stage": {
      const f = s.fills[a.tableId];
      if (!f) return s;
      return { ...s, fills: { ...s.fills, [a.tableId]: { ...f, stage: a.stage } } };
    }
    case "fill-done": {
      const { [a.tableId]: _, ...rest } = s.fills;
      return { ...s, fills: rest };
    }
    case "receipt": return { ...s, alerts: [...s.alerts, receipt(a.tableId, a.title, a.detail)] };
    // Supervisor Requested, acknowledged: still open, but the dealer now sees
    // that someone is coming.
    case "alert-patch": return { ...s, alerts: s.alerts.map((x) => (x.id === a.alertId ? { ...x, ...a.patch } : x)) };

    case "resolve":
      return {
        ...s,
        alerts: [
          ...s.alerts.filter((x) => x.id !== a.alertId),
          ...(a.receipt ? [receipt(a.receipt.tableId || (s.alerts.find((x) => x.id === a.alertId) || {}).tableId, a.receipt.title, a.receipt.detail)] : []),
        ],
        resolved: [...s.resolved, a.alertId],
        tables: applyResolution(s.tables, a.alertId),
        expand: null,
        toast: a.message || s.toast,
      };

    case "threshold":
      return withPlayerAlerts({ ...s, thresholds: s.thresholds.map((t) => (t.id === a.id ? { ...t, value: Math.max(t.step, t.value + a.delta * t.step) } : t)) });
    case "threshold-set":
      return withPlayerAlerts({ ...s, thresholds: s.thresholds.map((t) => (t.id === a.id ? { ...t, value: a.value } : t)) });
    case "threshold-notify":
      return { ...s, thresholds: s.thresholds.map((t) => (t.id === a.id ? { ...t, notify: a.notify } : t)) };

    case "open-player": return { ...s, playerId: a.playerId, playerClosing: false, noteDraft: "", cardDraft: "" };
    case "close-player-start": return s.playerId ? { ...s, playerClosing: true } : s;
    case "close-player": return { ...s, playerId: null, playerClosing: false, noteDraft: "", cardDraft: "" };
    case "note-draft": return { ...s, noteDraft: a.text };
    case "card-draft": return { ...s, cardDraft: a.text };
    case "add-note":
      if (!s.noteDraft.trim()) return s;
      return {
        ...s,
        noteDraft: "",
        toast: "Note saved.",
        players: s.players.map((p) =>
          p.id === a.playerId ? { ...p, notes: [{ at: wallClock(s.clockSeconds), by: "You", text: s.noteDraft.trim() }, ...p.notes] } : p
        ),
      };
    case "rate-player":
      return {
        ...s,
        toast: `Card ${a.card} attached.`,
        cardDraft: "",
        players: s.players.map((p) => (p.id === a.playerId ? { ...p, rated: true, tier: "Gold", card: a.card, name: a.name } : p)),
      };

    case "toast": return { ...s, toast: a.message };
    case "tick":
      return { ...s, clockSeconds: s.clockSeconds + 1, alerts: s.alerts.map((x) => ({ ...x, ageSeconds: x.ageSeconds + 1 })) };
    default: return s;
  }
}

function receipt(tableId, title, detail) {
  receiptSeq += 1;
  return { id: `r${receiptSeq}`, kind: "receipt", tableId, title, detail: detail || "", ageSeconds: 0, actions: [] };
}

/** Clearing an item changes the table, not just the list. */
function applyResolution(tables, alertId) {
  const effects = {
    a4: { tableId: "t15", patch: (t) => ({ ...t, status: "playing" }) },
    a8: { tableId: "t12", patch: (t) => ({ ...t, status: "playing" }) },
    b1: { tableId: "t21", patch: (t) => ({ ...t, variance: 0, expectedInventory: t.actualInventory, status: "playing" }) },
  };
  const effect = effects[alertId];
  if (!effect) return tables;
  return tables.map((t) => (t.id === effect.tableId ? effect.patch(t) : t));
}

export function createStore(onChange) {
  let state = initialState;
  const dispatch = (action) => {
    const next = reducer(state, action);
    if (next !== state) {
      state = next;
      onChange(state, action);
    }
  };
  return { dispatch, getState: () => state };
}
