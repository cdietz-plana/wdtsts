import { pods as initialPods } from "./data/pods.js";
import { initialAlerts } from "./data/alerts.js";
import { players as namedPlayers, withAnonymousFill } from "./data/players.js";
import { thresholds as initialThresholds } from "./data/thresholds.js";
import { wallClock } from "./lib/format.js";

/**
 * One state object, one reducer, one subscriber. Actions are plain data, so a
 * session is replayable and every screen is a pure function of state.
 */

export const initialState = {
  /** @type {import("./types.js").Theme} */ theme: "dark",
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
  held: {},
  scanning: false,
  toast: null,
  /** At pod level the right pane carries either the alerts or the people. */
  /** @type {"alerts"|"players"} */ podPane: "alerts",
  /** Learning aid for the design team, switched from the page chrome. Not product. */
  helpTips: false,
  /** An overlay that covers the whole device: help, or the account sheet. */
  /** @type {null|"help"|"account"} */ sheet: null,
  /** Which player's detail is open, on the Players and Session tabs. */
  playerId: null,
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
    case "theme": return { ...s, theme: a.theme };
    case "login-id": return { ...s, login: { ...s.login, id: a.id } };
    case "sign-in": return { ...s, signedIn: true };
    case "sign-out": return { ...initialState, theme: s.theme };
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
    case "open-player": return { ...s, playerId: a.playerId, noteDraft: "", cardDraft: "" };
    case "close-player": return { ...s, playerId: null, noteDraft: "", cardDraft: "" };
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
    case "flyout-open": return { ...s, flyout: { kind: a.kind, alertId: a.alertId, step: 1, pin: "" } };
    case "flyout-close": return { ...s, flyout: null };
    case "flyout-step": return s.flyout ? { ...s, flyout: { ...s.flyout, step: a.step } } : s;
    case "flyout-reason": return s.flyout ? { ...s, flyout: { ...s.flyout, reason: a.reason } } : s;
    case "flyout-pin": return s.flyout ? { ...s, flyout: { ...s.flyout, pin: a.pin } } : s;
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
    case "toggle-hold": return { ...s, held: { ...s.held, [a.podId]: !s.held[a.podId] } };
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
 * reconciles, an authorised fill puts the table back in play.
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
