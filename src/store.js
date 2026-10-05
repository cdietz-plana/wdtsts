import { pods as initialPods } from "./data/pods.js";
import { initialAlerts } from "./data/alerts.js";
import { players as namedPlayers, withAnonymousFill } from "./data/players.js";
import { thresholds as initialThresholds } from "./data/thresholds.js";
import { wallClock } from "./lib/format.js";
import { WALLPAPER_FOR_THEME } from "./assets.js";

/**
 * One state object, one reducer, one subscriber. Actions are plain data, so a
 * session is replayable and every screen is a pure function of state.
 */

/** The full floor. An area is a slice of it. */
const ALL_PODS = initialPods;

export const initialState = {
  /** @type {import("./types.js").Theme} */ theme: "glass",
  /**
   * What sits behind the glass. A separate choice from the theme, but changing
   * theme moves it, because the pairings matter: dark glass over a bright room
   * is unreadable and the reverse is worse. Choosing one explicitly is how you
   * go somewhere else on purpose.
   */
  wallpaper: WALLPAPER_FOR_THEME.glass,
  /** The prototype starts where the shift starts. Nothing here authenticates. */
  signedIn: false,
  login: { id: "" },
  /** @type {import("./types.js").Mode} */ mode: "floor",
  /** @type {import("./types.js").Level} */ level: "section",
  podId: null,
  tableId: null,
  /** @type {import("./types.js").TableTab} */ tab: "chips",
  /** Which pods are expanded, in both the tree and the switcher. */
  expanded: { p1: true },
  /** @type {"all"|"critical"|"blocks-roll"|"needs-signature"} */ filter: "all",
  /** @type {null|{kind:string, alertId:string, step:number, reason?:string, verified?:boolean, pin:string}} */ flyout: null,
  /**
      * Pods the dealer has put on hold. Read only: a hold is raised at the
      * table, never from a tablet, so nothing in the product sets this. Pod 3
      * is seeded held because its shoe has finished and its own alert says all
      * four tables are stopped. The pod screen used to say "Dealing" anyway.
      */
  held: { p3: true },
  scanning: false,
  toast: null,
  /** At pod level the right pane carries either the alerts or the people. */
  /** @type {"alerts"|"players"} */ podPane: "alerts",
  /**
   * How the people lists are ranked. Starts on actuals, not on theoretical
   * win: a supervisor asked who to watch wants what is happening now.
   * @type {"winners"|"losers"|"buyin"|"handle"|"theo"}
   */
  playerRank: "winners",
  /**
   * How many pods are in this supervisor's area. Review control, not product:
   * an area is assigned, not chosen, and Load Pods is undesigned. It is here
   * so the adaptive floor layouts can actually be seen.
   */
  areaSize: 6,
  /** Learning aid for the design team, switched from the page chrome. Not product. */
  helpTips: false,
  /** An overlay that covers the whole device: help, or the account sheet. */
  /** @type {null|"help"|"account"} */ sheet: null,
  /** Which player's detail is open, on the Players and Session tabs. */
  playerId: null,
  /** True while the record is playing its exit. See closePlayer() in app.js. */
  playerClosing: false,
  /** Draft text in the notes composer, so a half-written note survives a re-render. */
  noteDraft: "",
  /** Draft loyalty card number, keyed or scanned. */
  cardDraft: "",
  /** Shared wall clock, seconds past midnight. Everything dated agrees with it. */
  clockSeconds: 18 * 3600 + 21 * 60,
  /** Seconds until the next game opens across the pod. */
  countdown: 18,
  /** Minutes until the gaming day closes. */
  rollMinutes: 222,
  pods: initialPods,
  alerts: initialAlerts,
  players: withAnonymousFill(initialPods, namedPlayers),
  thresholds: initialThresholds,
};

export function reducer(s, a) {
  switch (a.type) {
    case "theme": return { ...s, theme: a.theme, wallpaper: WALLPAPER_FOR_THEME[a.theme] || s.wallpaper };
    case "wallpaper": return { ...s, wallpaper: a.wallpaper };
    case "player-rank": return { ...s, playerRank: a.rank };
    case "area-size": {
      const pods = ALL_PODS.slice(0, a.size);
      const ids = new Set(pods.map((p) => p.id));
      return {
        ...s,
        areaSize: a.size,
        pods,
        // Everything derived from the pods has to narrow with them, or the
        // tree lists alerts for tables that are no longer in the area.
        alerts: s.alerts.filter((x) => ids.has(x.podId)),
        players: s.players.filter((p) => pods.some((pod) => pod.tables.some((t) => t.id === p.tableId))),
        level: "section",
        podId: null,
        tableId: null,
        flyout: null,
      };
    }
    case "login-id": return { ...s, login: { ...s.login, id: a.id } };
    case "sign-in": return { ...s, signedIn: true };
    case "sign-out": return { ...initialState, theme: s.theme, wallpaper: s.wallpaper, areaSize: s.areaSize, pods: s.pods, alerts: s.alerts, players: s.players };
    case "mode": return { ...s, mode: a.mode };
    case "sheet": return { ...s, sheet: a.sheet };
    case "pod-pane": return { ...s, podPane: a.pane };
    case "help-tips": return { ...s, helpTips: !s.helpTips };
    case "threshold":
      return {
        ...s,
        thresholds: s.thresholds.map((t) =>
          t.id === a.id ? { ...t, value: Math.max(0, t.value + a.delta * t.step) } : t
        ),
      };
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
        toast: "Note saved against the player record.",
        players: s.players.map((p) =>
          p.id === a.playerId
            ? { ...p, notes: [{ at: wallClock(s.clockSeconds), by: "You", text: s.noteDraft.trim() }, ...p.notes] }
            : p
        ),
      };
    case "rate-player":
      return {
        ...s,
        toast: `${a.name} converted to a rated player. Card ${a.card} attached.`,
        cardDraft: "",
        players: s.players.map((p) => (p.id === a.playerId ? { ...p, rated: true, tier: "Gold", card: a.card, name: a.name } : p)),
      };
    case "toggle-pod": return { ...s, expanded: { ...s.expanded, [a.podId]: !s.expanded[a.podId] } };
    case "filter": return { ...s, filter: a.filter };
    case "go-section": return { ...s, level: "section", podId: null, tableId: null, flyout: null };
    case "go-pod": return { ...s, level: "pod", podId: a.podId, flyout: null };
    case "go-table": return { ...s, level: "table", podId: a.podId, tableId: a.tableId, tab: a.tab || s.tab, flyout: null };
    case "tab": return { ...s, tab: a.tab };
    case "flyout-open":
      return { ...s, flyout: { kind: a.kind, alertId: a.alertId, step: 1, pin: "", overrideId: a.overrideId || null, position: null, reason: null } };
    case "flyout-close": return { ...s, flyout: null };
    case "flyout-step": return s.flyout ? { ...s, flyout: { ...s.flyout, step: a.step } } : s;
    case "flyout-reason": return s.flyout ? { ...s, flyout: { ...s.flyout, reason: a.reason } } : s;
    case "flyout-pin": return s.flyout ? { ...s, flyout: { ...s.flyout, pin: a.pin } } : s;
    case "flyout-amount": return s.flyout ? { ...s, flyout: { ...s.flyout, amount: a.amount } } : s;
    case "flyout-position": return s.flyout ? { ...s, flyout: { ...s.flyout, position: a.position } } : s;
    case "scan-start": return { ...s, scanning: true };
    case "scan-done":
      return {
        ...s,
        scanning: false,
        flyout: s.flyout ? { ...s.flyout, verified: true, step: Math.max(s.flyout.step, 3) } : null,
      };
    case "resolve":
      return {
        ...s,
        alerts: s.alerts.filter((x) => x.id !== a.alertId),
        pods: applyResolution(s.pods, a.alertId),
        flyout: null,
        toast: a.message,
      };
    case "toast": return { ...s, toast: a.message };
    case "tick":
      return {
        ...s,
        clockSeconds: s.clockSeconds + 1,
        countdown: s.countdown <= 0 ? 29 : s.countdown - 1,
        rollMinutes: s.countdown <= 0 ? Math.max(0, s.rollMinutes - 1) : s.rollMinutes,
        alerts: s.alerts.map((x) => ({ ...x, ageSeconds: x.ageSeconds + 1 })),
      };
    default: return s;
  }
}

/**
 * Clearing an alert changes the world, not just the list: an adjusted tray
 * reconciles, an authorized fill puts the table back in play.
 */
function applyResolution(pods, alertId) {
  const effects = {
    a2: { tableId: "t3", patch: (t) => ({ ...t, variance: 0, expectedInventory: t.actualInventory, status: "playing" }) },
    a4: { tableId: "t14", patch: (t) => ({ ...t, status: "playing" }) },
  };
  const effect = effects[alertId];
  if (!effect) return pods;
  return pods.map((p) => ({ ...p, tables: p.tables.map((t) => (t.id === effect.tableId ? effect.patch(t) : t)) }));
}

/** Minimal store: dispatch, getState, subscribe. */
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
