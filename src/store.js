import { tables as ALL_TABLES } from "./data/tables.js";
import { initialAlerts } from "./data/alerts.js";

let receiptSeq = 100;
import { closedPlayers, players as namedPlayers, withAnonymousFill } from "./data/players.js";
import { thresholds as initialThresholds } from "./data/thresholds.js";
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

export const initialState = {
  theme: "glass",
  wallpaper: WALLPAPER_FOR_THEME.glass,
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

  /** How many tables this manager has. Review control: 12 or 24. */
  sectionSize: 24,
  /** Tiles per page: 4, 9 or 12. */
  perPage: 12,
  tables: ALL_TABLES.slice(0, 24),
  alerts: initialAlerts.filter((x) => ALL_TABLES.slice(0, 24).some((t) => t.id === x.tableId)),
  /** Items cleared this session, so changing the section size does not bring them back. */
  resolved: [],
  players: ALL_PLAYERS.filter((p) => ALL_TABLES.slice(0, 24).some((t) => t.id === p.tableId)),
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
      return { ...initialState, theme: s.theme, wallpaper: s.wallpaper, expandStyle: s.expandStyle, sectionSize: s.sectionSize, perPage: s.perPage, resolved: s.resolved, tables: s.tables, alerts: s.alerts, players: s.players };
    case "section-size": {
      const tables = ALL_TABLES.slice(0, a.size);
      const ids = new Set(tables.map((t) => t.id));
      return {
        ...s,
        sectionSize: a.size,
        tables,
        alerts: initialAlerts.filter((x) => ids.has(x.tableId) && !s.resolved.includes(x.id)),
        players: ALL_PLAYERS.filter((p) => ids.has(p.tableId)),
        page: 0, level: "section", tableId: null, expand: null,
      };
    }
    case "expand-style": return { ...s, expandStyle: a.style };
    case "page": return { ...s, page: a.page, expand: null };
    // Changing density keeps the first table on screen in view.
    case "per-page": {
      const first = s.page * s.perPage;
      return { ...s, perPage: a.perPage, page: Math.floor(first / a.perPage), expand: null };
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
      return { ...s, thresholds: s.thresholds.map((t) => (t.id === a.id ? { ...t, value: Math.max(0, t.value + a.delta * t.step) } : t)) };
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
