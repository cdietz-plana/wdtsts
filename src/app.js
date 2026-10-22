import { expandContent } from "./components/expand.js";
import { overview } from "./components/grid.js";
import { loginScreen } from "./components/login.js";
import { playerSheet } from "./components/playersheet.js";
import { rail } from "./components/rail.js";
import { accountSheet, helpSheet, thresholdSheet } from "./components/sheets.js";
import { historyPanel, tableDetail } from "./components/tabledetail.js";
import { topBar } from "./components/topbar.js";
import { clear, h } from "./lib/dom.js";
import { annotate, wireTips } from "./lib/helptips.js";
import { patchLive } from "./lib/live.js";
import { FILL_STAGES, findTable, pageOf } from "./lib/selectors.js";
import { money } from "./lib/format.js";
import { WALLPAPERS, wallpaper } from "./assets.js";
import { createStore } from "./store.js";

const HINTS = {
  login: "Try: tap the card reader, or key in any ID of four digits or more.",
  section:
    "Try: an Action's button right on its tile · Supervisor requested: On my way, then Close with a reason · Fill / Credit or More to open a tile · the turn icon on a tile for its figures · pages and 4 / 9 / 12 per page above the grid · tap a tile to open the full table.",
  table: "Try: the arrows beside the table name step through the section · History holds Games and Sessions · Scan and Fill / Credit work here too.",
};

const root = document.getElementById("app");
const store = createStore((state, action) => render(action));
const { dispatch, getState } = store;

/* ---------------------------------------------------------------- behavior */

function runScan(tableId) {
  const s = getState();
  if (s.scanning[tableId]) return;
  dispatch({ type: "scan-start", tableId });
  window.setTimeout(() => {
    dispatch({ type: "scan-done", tableId });
    const t = findTable(getState().tables, tableId);
    dispatch({ type: "toast", message: `${t.name} scanned. ${t.variance ? "Still 1,000 short." : "Tray balanced."}` });
  }, 1400);
}

/** Clear an item. `receipt` adds a line to Activity so the history is kept. */
const resolve = (alertId, message, receipt) => dispatch({ type: "resolve", alertId, message, receipt });

/** Open a tile, turning to its page first if it is on another page. */
function openTile(tableId, view, extra = {}) {
  const s = getState();
  dispatch({ type: "expand", tableId, view, page: s.level === "section" ? pageOf(s.tables, tableId, s.perPage) : s.page, ...extra });
}

/**
 * A fill is one item that moves through its stages. In the product these
 * steps come from the cage and the table; here they are played out on timers
 * so the whole life of a fill can be seen in a minute.
 */
const fillTimers = {};
function runFill(tableId) {
  const f = getState().fills[tableId];
  if (!f) return;
  const t = findTable(getState().tables, tableId);
  const labels = FILL_STAGES[f.by];
  (fillTimers[tableId] || []).forEach(window.clearTimeout);
  fillTimers[tableId] = [];
  let delay = 0;
  for (let stage = f.stage + 1; stage < labels.length; stage += 1) {
    delay += 4000;
    fillTimers[tableId].push(
      window.setTimeout(() => {
        dispatch({ type: "fill-stage", tableId, stage });
        dispatch({ type: "receipt", tableId, title: `${f.mode === "fill" ? "Fill" : "Credit"} ${labels[stage].toLowerCase()}`, detail: `${money(f.amount)} · ${t.name}` });
      }, delay)
    );
  }
  // Once processed, the tracker leaves the tile; the receipts stay in Activity.
  fillTimers[tableId].push(window.setTimeout(() => dispatch({ type: "fill-done", tableId }), delay + 3500));
}

function authorizeFill(alertId, tableId) {
  const f = getState().fills[tableId];
  dispatch({ type: "fill-stage", tableId, stage: 1 });
  resolve(alertId, `Fill authorized. ${money(f ? f.amount : 0)} on its way.`, { title: "Fill authorized", detail: money(f ? f.amount : 0) });
  runFill(tableId);
}

function sendFill(tableId, mode, amount) {
  dispatch({ type: "fill-start", tableId, mode, amount, by: "you" });
  dispatch({ type: "collapse" });
  dispatch({ type: "toast", message: `${mode === "fill" ? "Fill" : "Credit"} of ${money(amount)} sent to the cage.` });
  runFill(tableId);
}

/** One place decides what an item's button does, wherever it was pressed. */
function onAlert(alert) {
  // Supervisor Requested has two taps: On my way, then Close with a reason.
  if (alert.enroute) {
    openTile(alert.tableId, "request", { alertId: alert.id });
    return;
  }
  const action = alert.actions[0];
  switch (action.intent) {
    case "on-my-way":
      dispatch({ type: "alert-patch", alertId: alert.id, patch: { enroute: true, enrouteAt: alert.ageSeconds } });
      dispatch({ type: "toast", message: "The dealer display now shows Supervisor coming." });
      break;
    case "acknowledge":
      resolve(alert.id, `${alert.title}: done.`, action.receipt ? { title: action.receipt } : null);
      break;
    case "authorize-fill":
      openTile(alert.tableId, "authorize", { alertId: alert.id });
      break;
    case "adjust":
      openTile(alert.tableId, "adjust", { alertId: alert.id });
      break;
    case "verify-jackpot":
      openTile(alert.tableId, "jackpot", { alertId: alert.id });
      break;
    case "review-hand":
      openTile(alert.tableId, "games", { alertId: alert.id });
      break;
    case "open-player": {
      const person = getState().players.find((p) => p.tableId === alert.tableId && !p.closed && alert.subject && p.seat === alert.subject.seat);
      if (person) dispatch({ type: "open-player", playerId: person.id });
      else dispatch({ type: "go-table", tableId: alert.tableId, tab: "players" });
      break;
    }
    default:
      dispatch({ type: "go-table", tableId: alert.tableId, tab: "live" });
  }
}

const handlers = {
  onScan: runScan,
  onAlert,
  onResolve: resolve,
  onAuthorizeFill: authorizeFill,
  onSendFill: sendFill,
  onAdjust: (id) => openTile(id, "adjust", { alertId: "b1" }),
  onOrderFill: (id) => openTile(id, "fill"),
};

let closeTimer;
function closePlayer() {
  const s = getState();
  if (!s.playerId || s.playerClosing) return;
  dispatch({ type: "close-player-start" });
  window.clearTimeout(closeTimer);
  closeTimer = window.setTimeout(() => dispatch({ type: "close-player" }), 200);
}

/* -------------------------------------------------------------------- view */

function device(state) {
  const paper = wallpaper(state.wallpaper);
  const ambient = h(
    "div.ambient",
    { "aria-hidden": "true" },
    h("div.ambient__photo", { style: { backgroundImage: paper.image ? `url(${paper.image})` : "none" } }),
    h("div.ambient__veil"),
    h("span", { style: { left: "-200px", top: "-320px", width: "820px", height: "620px", background: "radial-gradient(circle, rgba(168,30,51,.18), rgba(168,30,51,0) 68%)" } }),
    h("span", { style: { right: "-180px", bottom: "-220px", width: "760px", height: "620px", background: "radial-gradient(circle, rgba(36,86,138,.2), rgba(36,86,138,0) 70%)" } })
  );

  if (!state.signedIn) {
    return h("div.ltg", { data: { theme: state.theme, wallpaper: paper.id } }, ambient, loginScreen(state, dispatch));
  }

  const content = state.level === "table" ? tableDetail(state, dispatch, handlers) : overview(state, dispatch, handlers);

  // A tile opened as a side panel, or anything opened from the full table,
  // shows in the right-edge panel over the rail.
  const panelOpen = !!state.expand && (state.expandStyle === "panel" || state.level === "table");
  const panel = h("aside.flyout.flyout--xp", { data: { open: panelOpen }, "aria-hidden": String(!panelOpen) }, panelOpen ? expandContent(state, dispatch, handlers) : null);

  return h(
    "div.ltg",
    { data: { theme: state.theme, wallpaper: paper.id, level: state.level } },
    ambient,
    topBar(state, dispatch),
    h(
      "div.panes",
      {},
      h("section.pane.pane--content.pane--tables", {}, content),
      h("section.pane.pane--alerts.pane--rail", { "aria-label": "Actions, alerts and players" }, rail(state, dispatch, handlers))
    ),
    h("button.scrim", {
      // Light for an opened tile, so the grid stays readable beside it.
      class: state.level === "section" ? "scrim scrim--light" : "scrim",
      data: { open: panelOpen || !!state.history },
      "aria-label": "Close panel",
      on: { click: () => { dispatch({ type: "collapse" }); dispatch({ type: "history", history: null }); } },
    }),
    panel,
    historyPanel(state, dispatch),
    state.playerId ? playerSheet(state, dispatch, closePlayer) : null,
    state.sheet === "help" ? helpSheet(state, dispatch) : null,
    state.sheet === "account" ? accountSheet(state, dispatch) : null,
    state.sheet === "thresholds" ? thresholdSheet(state, dispatch) : null,
    h("div.toast", { data: { open: !!state.toast }, role: "status", text: state.toast || "" })
  );
}

function page(state) {
  const hint = HINTS[state.signedIn ? state.level : "login"];
  const [lead, ...rest] = hint.split(":");

  const group = (label, items, value, action) =>
    h(
      "div.area-switch",
      { role: "group", "aria-label": label },
      h("span.area-switch__label", { text: label }),
      items.map(([v, text]) => h("button", { text, "aria-pressed": String(value === v), on: { click: () => dispatch({ ...action, [Object.keys(action)[1]]: v }) } }))
    );

  return h(
    "div.page",
    {},
    h(
      "div.page-bar",
      {},
      h("span.page-title", { text: "Mobile Manager · Tables" }),
      h("span.page-sub", { html: "Interaction prototype. Designed for a 10&Prime; tablet in landscape; scaled to fit this window." }),
      // Review controls, not product.
      state.signedIn ? group("Tables", [[12, "12"], [24, "24"], [200, "200"]], state.sectionSize, { type: "section-size", size: 0 }) : null,
      state.signedIn ? group("Open a tile", [["inplace", "In place"], ["panel", "Side panel"]], state.expandStyle, { type: "expand-style", style: "" }) : null,
      state.signedIn ? h("button.chip", { text: "Sign out", on: { click: () => dispatch({ type: "sign-out" }) } }) : null,
      h(
        "button.chip.chip--tips",
        { "aria-pressed": String(state.helpTips), on: { click: () => dispatch({ type: "help-tips" }) } },
        h("span.gloss__i", { text: "i", "aria-hidden": "true" }),
        "Jargon tips"
      ),
      h(
        "div.theme-switch",
        { role: "group", "aria-label": "Theme" },
        [["glass", "Glass"], ["square", "Square"], ["simple", "Simple"], ["studio", "Studio"], ["ledger", "Ledger"], ["rouge", "Rouge"], ["felt", "Felt"], ["bw", "B&W"], ["dark", "Dark"]].map(([t, label]) =>
          h("button", { text: label, "aria-pressed": String(state.theme === t), on: { click: () => dispatch({ type: "theme", theme: t }) } })
        )
      ),
      h(
        "div.theme-switch.theme-switch--paper",
        { role: "group", "aria-label": "Wallpaper" },
        h("span.theme-switch__label", { text: "Wallpaper" }),
        WALLPAPERS.map((w) => h("button", { text: w.label, "aria-pressed": String(state.wallpaper === w.id), on: { click: () => dispatch({ type: "wallpaper", wallpaper: w.id }) } }))
      )
    ),
    h("div.stage", { id: "stage" }, device(state)),
    h("p.page-hint", {}, h("b", { text: lead + ":" }), rest.join(":"))
  );
}

/* --------------------------------------------------------------- lifecycle */

function fit() {
  const stage = document.getElementById("stage");
  if (!stage) return;
  const scale = Math.max(0.24, Math.min(1, (window.innerWidth - 32) / 1280, (window.innerHeight - 150) / 800));
  stage.style.transform = `scale(${scale})`;
  stage.style.width = `${1280 * scale}px`;
  stage.style.height = `${800 * scale}px`;
}

let toastTimer;
function scheduleToastClear(state) {
  if (!state.toast) return;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => dispatch({ type: "toast", message: null }), 2600);
}

function render(action) {
  const state = getState();
  if (action && action.type === "tick" && patchLive(root, state)) return;
  if (action && action.type === "toast") {
    const el = root.querySelector(".toast");
    if (el) {
      el.textContent = state.toast || "";
      el.dataset.open = String(!!state.toast);
      scheduleToastClear(state);
      return;
    }
  }

  document.body.dataset.pageTheme = state.theme;
  clear(root).appendChild(page(state));
  fit();

  if (state.helpTips) {
    const dev = root.querySelector(".ltg");
    if (dev) {
      annotate(dev);
      wireTips(dev);
    }
  }
  scheduleToastClear(state);
}

window.addEventListener("resize", fit);
window.setInterval(() => {
  const s = getState();
  if (s.signedIn && !s.expand && !s.history && !s.sheet && !s.playerId && !s.playerClosing && !Object.keys(s.scanning).length) dispatch({ type: "tick" });
}, 1000);

render();
