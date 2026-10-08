import { alertPane } from "./components/alertpane.js";
import { floorPlan } from "./components/floorplan.js";
import { flyout } from "./components/flyout.js";
import { loginScreen } from "./components/login.js";
import { podSwitcher } from "./components/podswitcher.js";
import { panePodSwitch, performanceCards, playersPanel, podScope, sectionScope } from "./components/performance.js";
import { podView } from "./components/podview.js";
import { playerSheet } from "./components/playersheet.js";
import { accountSheet, helpSheet, thresholdSheet } from "./components/sheets.js";
import { tableView } from "./components/tableview.js";
import { topBar } from "./components/topbar.js";
import { clear, h } from "./lib/dom.js";
import { annotate, wireTips } from "./lib/helptips.js";
import { patchLive } from "./lib/live.js";
import { findPod, findTable, podOfTable } from "./lib/selectors.js";
import { WALLPAPERS, wallpaper } from "./assets.js";
import { createStore } from "./store.js";

const HINTS = {
  login: "Try: tap the card reader, or key in any ID of four digits or more.",
  section:
    "Try: Floor / Performance / Alerts in the bar (same six pods, same places; only what is printed on them changes) · tap a pod to open it · expand a pod in the tree, then tap an alert to jump straight to it.",
  pod: "Try: tap any table to open it · switch the right panel between Alerts and Players · the back arrow returns to the floor.",
  table:
    "Try: the task tabs · the Scan dial · Adjust opens the three-step flyout and ends on the second signature. Confirming it clears the alert everywhere.",
};

const root = document.getElementById("app");

/** Pane geometry. Pods stay left, alerts stay right; only the weight changes. */
const paneWidths = (wide) => ({
  contentWidth: wide ? "26%" : "74%",
  alertsLeft: wide ? "26%" : "74%",
  alertsWidth: wide ? "74%" : "26%",
});
let lastWide = false;
let pendingGeometry = null;
const store = createStore((state, action) => render(action));
const { dispatch, getState } = store;

/* ---------------------------------------------------------------- behavior */

function runScan() {
  const state = getState();
  if (state.scanning) return;
  dispatch({ type: "scan-start" });
  window.setTimeout(() => {
    dispatch({ type: "scan-done" });
    const s = getState();
    const table = findTable(s.pods, s.tableId || "t3");
    dispatch({ type: "toast", message: `Scan complete. ${table && table.variance ? "Still 1,000 short." : "Tray balanced."}` });
  }, 1500);
}

function openAdjust(tableId) {
  const pod = podOfTable(getState().pods, tableId);
  if (pod) dispatch({ type: "go-table", podId: pod.id, tableId, tab: "chips" });
  dispatch({ type: "flyout-open", kind: "adjust", alertId: "a2" });
}

function orderFill(tableId) {
  const pod = podOfTable(getState().pods, tableId);
  if (pod) dispatch({ type: "go-table", podId: pod.id, tableId, tab: "chips" });
  dispatch({ type: "flyout-open", kind: "order", alertId: null });
}

/** Let the record play its exit, then take it out of the state. */
let closeTimer;
function closePlayer() {
  const s = getState();
  if (!s.playerId || s.playerClosing) return;
  dispatch({ type: "close-player-start" });
  window.clearTimeout(closeTimer);
  closeTimer = window.setTimeout(() => dispatch({ type: "close-player" }), 200);
}

/**
 * Floor to Performance, and back.
 *
 * Both faces are the same six pods in the same six places, so the switch is
 * staged as a turn: the cards rotate away carrying the old content, the
 * content changes while they are edge on, and they rotate back carrying the
 * new. It reads as one object being turned over rather than one screen
 * replacing another, which is the thing worth saying about these two views.
 *
 * Only the two card faces turn. Alerts is a different shape, so it gets the
 * ordinary swap, and so does anyone who has asked their system for less
 * motion.
 */
const CARD_TURN = 130;
let flipTimers = [];
/**
 * Which half is running, held outside the store on purpose.
 *
 * The first half must not rebuild. An animation added to an element in the
 * same frame the element was created does not start until the engine has
 * resolved its start time, and a rebuild of six cards pushes that past the
 * 130ms the half is given, so the turn never runs. Dispatching for the first
 * half rebuilds, so the first half sets the attribute on the cards already in
 * the document and leaves the store alone. render() reads this back so a
 * render from anywhere else does not drop it.
 */
let flipPhase = null;

function switchMode(mode) {
  const s = getState();
  if (mode === s.mode) return;
  flipTimers.forEach(window.clearTimeout);
  flipTimers = [];

  const turns = s.level === "section" && mode !== "alerts" && s.mode !== "alerts";
  const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pane = document.querySelector(".pane--content");
  if (!turns || still || !pane) {
    flipPhase = null;
    dispatch({ type: "mode", mode });
    return;
  }

  flipPhase = "out";
  pane.dataset.flip = "out";
  flipTimers.push(
    window.setTimeout(() => {
      flipPhase = "in";
      dispatch({ type: "mode", mode });
      flipTimers.push(
        window.setTimeout(() => {
          flipPhase = null;
          dispatch({ type: "flip-done" });
        }, 430)
      );
    }, CARD_TURN)
  );
}

const resolve = (alertId, message) => dispatch({ type: "resolve", alertId, message });

/** One place decides what an alert action does, wherever it was pressed. */
function handleAction(alert, action) {
  const goTable = (tab) => dispatch({ type: "go-table", podId: alert.podId, tableId: alert.tableId, tab });

  switch (action.intent) {
    case "dismiss":
      dispatch({ type: "toast", message: "Rejected. A note goes on the audit trail." });
      break;
    case "rescan":
      goTable("chips");
      runScan();
      break;
    case "adjust":
      goTable("chips");
      dispatch({ type: "flyout-open", kind: "adjust", alertId: alert.id });
      break;
    case "authorize-fill":
      goTable("chips");
      dispatch({ type: "flyout-open", kind: "fill", alertId: alert.id });
      break;
    case "approve-rating":
      goTable("players");
      dispatch({ type: "flyout-open", kind: "rating", alertId: alert.id });
      break;
    case "open-players":
      goTable("players");
      break;
    case "thresholds":
      dispatch({ type: "sheet", sheet: "thresholds" });
      break;
    case "open-player": {
      const person = getState().players.find((p) => p.tableId === alert.tableId && alert.subject && p.seat === alert.subject.seat);
      goTable("players");
      if (person) dispatch({ type: "open-player", playerId: person.id });
      break;
    }
    default:
      goTable();
  }
}

/* -------------------------------------------------------------------- view */

function device(state) {
  const paper = wallpaper(state.wallpaper);

  // Three layers, bottom to top: the room, a crimson-to-black veil that kills
  // its detail and most of its light, then two soft glows that keep the corners
  // from going dead. Everything above this is glass, and glass needs something
  // behind it or it reads as gray plastic.
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

  const wide = state.level === "section" && state.mode === "alerts";
  const perf = state.level === "section" && state.mode === "performance";
  // Render at the previous geometry; paneGeometry() moves them next frame so
  // the width change animates even though the DOM was rebuilt.
  const from = paneWidths(lastWide);
  const to = paneWidths(wide);
  pendingGeometry = to;
  lastWide = wide;

  const content =
    state.level === "section"
      ? wide
        ? podSwitcher(state, dispatch)
        : perf
          ? performanceCards(state, dispatch)
          : floorPlan(state, dispatch)
      : state.level === "pod"
        ? podView(state, dispatch, handleAction)
        : tableView(state, dispatch, { onScan: runScan, onAdjust: openAdjust, onOrderFill: orderFill, onResolve: resolve });

  // Which half of a card turn is running, if any. The content is already
  // correct for the phase: during "out" the mode has not changed yet, so the
  // old face is still what is being rendered.
  const turn = flipPhase;

  // The right pane is the alert tree by default. It carries people instead
  // when the floor is in Performance, or when a pod's own switch asks for it.
  const showPlayers = perf || (state.level === "pod" && state.podPane === "players");
  const pod = state.podId ? findPod(state.pods, state.podId) : null;
  // My Section is a drawer over the alert rail, not a replacement for it. So
  // while the cards turn in, both layers are in the pane: the rail underneath,
  // the section panel sliding across it on the way to Performance or off it on
  // the way back. Outside that moment only one layer exists.
  const sliding = turn === "in" && state.level === "section";
  const panel =
    showPlayers && !sliding
      ? playersPanel(
          state,
          dispatch,
          perf ? sectionScope(state) : podScope(state, pod),
          perf ? null : panePodSwitch(state, dispatch, pod)
        )
      : alertPane(state, dispatch, wide, handleAction);
  const drawer = sliding
    ? h(
        "div.drawer",
        { data: { slide: perf ? "in" : "out" }, "aria-hidden": perf ? null : "true" },
        playersPanel(state, dispatch, sectionScope(state), null)
      )
    : null;

  return h(
    "div.ltg",
    { data: { theme: state.theme, wallpaper: paper.id } },
    ambient,
    topBar(state, dispatch, switchMode),
    h(
      "div.panes",
      {},
      h("section.pane.pane--content", { data: { narrow: wide, flip: turn }, style: { width: from.contentWidth } }, content),
      h(
        "section.pane.pane--alerts",
        { "aria-label": showPlayers ? "Players" : "Alerts", data: { wide }, style: { left: from.alertsLeft, width: from.alertsWidth } },
        panel,
        drawer
      )
    ),
    h("button.scrim", { data: { open: !!state.flyout }, "aria-label": "Close panel", on: { click: () => dispatch({ type: "flyout-close" }) } }),
    flyout(state, dispatch, { onScan: runScan, onResolve: resolve }),
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

  return h(
    "div.page",
    {},
    h(
      "div.page-bar",
      {},
      h("span.page-title", { text: "LTG Supervisor Tablet" }),
      h("span.page-sub", { html: "Interaction prototype. Designed for a 10&Prime; tablet in landscape; scaled to fit this window." }),
      // Review control, not product. An area is assigned at the start of a
      // shift, not picked from a toolbar, and Load Pods is undesigned. This is
      // here so the floor layouts for one, two and four pods can be seen
      // without shipping four screenshots.
      state.signedIn
        ? h(
            "div.area-switch",
            { role: "group", "aria-label": "Pods in the area" },
            h("span.area-switch__label", { text: "Pods" }),
            [1, 2, 3, 4, 5, 6].map((n) =>
              h("button", {
                text: String(n),
                "aria-pressed": String(state.areaSize === n),
                on: { click: () => dispatch({ type: "area-size", size: n }) },
              })
            )
          )
        : null,
      state.signedIn ? h("button.chip", { text: "Sign out", on: { click: () => dispatch({ type: "sign-out" }) } }) : null,
      // Outside the device on purpose: this teaches the design team the
      // vocabulary, and nothing in the product should be shaped by it.
      h(
        "button.chip.chip--tips",
        { "aria-pressed": String(state.helpTips), on: { click: () => dispatch({ type: "help-tips" }) } },
        h("span.gloss__i", { text: "i", "aria-hidden": "true" }),
        "Jargon tips"
      ),
      // Four themes now. Light reads as a wireframe to the client, so Square
      // and Glass are two different answers to the same complaint: one adds
      // structure, the other adds depth. Both are complete, not skins.
      h(
        "div.theme-switch",
        { role: "group", "aria-label": "Theme" },
        [["glass", "Glass"], ["square", "Square"], ["simple", "Simple"], ["studio", "Studio"], ["ledger", "Ledger"], ["rouge", "Rouge"], ["felt", "Felt"], ["bw", "B&W"], ["dark", "Dark"]].map(([t, label]) =>
          h("button", {
            text: label,
            "aria-pressed": String(state.theme === t),
            on: { click: () => dispatch({ type: "theme", theme: t }) },
          })
        )
      ),
      // What sits behind the glass, separately from the theme. Changing theme
      // moves this to the pairing that theme was built on; changing it here is
      // how you go somewhere else.
      h(
        "div.theme-switch.theme-switch--paper",
        { role: "group", "aria-label": "Wallpaper" },
        h("span.theme-switch__label", { text: "Wallpaper" }),
        WALLPAPERS.map((w) =>
          h("button", {
            text: w.label,
            "aria-pressed": String(state.wallpaper === w.id),
            on: { click: () => dispatch({ type: "wallpaper", wallpaper: w.id }) },
          })
        )
      )
    ),
    h("div.stage", { id: "stage" }, device(state)),
    h("p.page-hint", {}, h("b", { text: lead + ":" }), rest.join(":"))
  );
}

/* --------------------------------------------------------------- lifecycle */

/**
 * The device is authored at 1280x800 and scaled to the window, so what you see
 * here is exactly what lands on a 10-inch tablet.
 */
function fit() {
  const stage = document.getElementById("stage");
  if (!stage) return;
  const scale = Math.max(0.24, Math.min(1, (window.innerWidth - 32) / 1280, (window.innerHeight - 150) / 800));
  stage.style.transform = `scale(${scale})`;
  stage.style.width = `${1280 * scale}px`;
  stage.style.height = `${800 * scale}px`;
}

let toastTimer;

/** The toast clears itself. Dispatched as a plain toast action, so it takes the
    same patch path on the way out as it did on the way in. */
function scheduleToastClear(state) {
  if (!state.toast) return;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => dispatch({ type: "toast", message: null }), 2600);
}

function render(action) {
  const state = getState();

  // A tick changes four numbers. Rebuilding the screen for that tore down and
  // replayed every entry animation under the user once a second, which is what
  // the flicker was. Patch the numbers and leave the DOM alone.
  if (action && action.type === "tick" && patchLive(root, state)) return;

  // A toast changes one string, and raising one from inside the player record
  // rebuilt the whole screen and replayed the record's entry animation. From
  // the outside that looked like the screen flashing and nothing happening,
  // which is exactly what it was. Same treatment as the clock.
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
    const device = root.querySelector(".ltg");
    if (device) {
      annotate(device);
      wireTips(device);
    }
  }

  if (pendingGeometry) {
    const { contentWidth, alertsLeft, alertsWidth } = pendingGeometry;
    pendingGeometry = null;
    requestAnimationFrame(() => {
      const content = root.querySelector(".pane--content");
      const alerts = root.querySelector(".pane--alerts");
      if (content) content.style.width = contentWidth;
      if (alerts) {
        alerts.style.left = alertsLeft;
        alerts.style.width = alertsWidth;
      }
    });
  }

  scheduleToastClear(state);
}

window.addEventListener("resize", fit);

/* One second of wall clock. The countdown ticks and every open alert ages, so
   the pressure the design is about is visible while you look at it. */
window.setInterval(() => {
  const s = getState();
  // Hold the clock while a panel, sheet or record is open, or a scan is
  // running. A re-render must never interrupt something the user is in the
  // middle of, and a full re-render restarts every entry animation under it.
  if (s.signedIn && !s.flyout && !s.scanning && !s.sheet && !s.playerId && !s.playerClosing) dispatch({ type: "tick" });
}, 1000);

render();
