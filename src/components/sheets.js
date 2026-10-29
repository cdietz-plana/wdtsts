import { SUPERVISOR } from "../lib/supervisor.js";
import { h } from "../lib/dom.js";
import { wallClock } from "../lib/format.js";
import { iconClose, iconTrend } from "./icons.js";

/**
 * Full-device overlays: help, and the account sheet that finally gives sign out
 * a home inside the tablet rather than in the page chrome around it.
 *
 * Both are sheets rather than screens because neither is a destination. You
 * are never doing your job in here, so nothing should have navigated you away
 * from what you were doing.
 */

/**
 * Information. Review feedback: legends come off the working screens, which
 * the team will learn quickly, and live here for reference.
 */
const LEGEND = [
  { mark: () => h("span.seat", { style: { width: "14px", height: "14px", background: "var(--value-3)" } }), label: "High average bet", note: "A seat dot filled in the value color." },
  { mark: () => h("span.seat", { style: { width: "14px", height: "14px", background: "var(--value-1)", boxShadow: "0 0 0 3px var(--ring-hot)" } }), label: "Large win", note: "A ring around the seat dot." },
  { mark: () => h("span.seat.seat--empty", { style: { width: "14px", height: "14px" } }), label: "Open seat", note: "Front line only. Empty back-line seats are not drawn." },
  { mark: () => h("span.info-trend", { data: { up: true } }, iconTrend(16, true)), label: "Table up", note: "Beside the table ID. Flip the tile for the figure." },
  { mark: () => h("span.info-trend", { data: { up: false } }, iconTrend(16, false)), label: "Table down", note: "Beside the table ID. Flip the tile for the figure." },
  { mark: () => h("span.info-sw", { style: { background: "#c21f3a" } }), label: "Action", note: "Needs you now. Shown on the table's felt and first in the rail." },
  { mark: () => h("span.info-sw", { style: { background: "var(--high)" } }), label: "Alert", note: "Worth a look. Shown under Alerts with a count." },
  { mark: () => h("span.info-tag", { text: "Dealer" }), label: "Dealer or System", note: "Who raised an Action: the dealer display, or the table system." },
  { mark: () => h("span.info-steps", {}, h("i", { data: { s: "done" } }), h("i", { data: { s: "now" } }), h("i")), label: "Fill in progress", note: "Requested, Authorized, Accepted, Processed." },
  { mark: () => h("span.info-dot"), label: "Alerts on a table", note: "A red dot on the tile's Alerts button." },
];

const HELP = [
  { q: "Actions and Alerts", a: "Actions need you now: dealer requests and what the table system detects. Alerts are worth a look. X closes either one; it is logged in Activity." },
  { q: "Supervisor requested", a: "On my way tells the dealer display you are coming. Close records the reason." },
  { q: "The tile", a: "Inventory, Fill / Credit, More, History, Limits and Alerts. At 9 per page the buttons are icons; at 12, History, Limits and Alerts are under More." },
  { q: "Other pages", a: "When Actions are waiting on a page you are not looking at, a red line above the tables says how many and takes you there." },
  { q: "Seat cards", a: "On Players, tap the turn icon on a card for that player's session figures and functions. Rate player enters a rating." },
  { q: "Figures bar", a: "The section's figures on the overview, and the table's figures on a table." },
];

function sheet(title, subtitle, dispatch, body) {
  return h(
    "div.sheet",
    { role: "dialog", "aria-modal": "true", "aria-label": title },
    h(
      "div.sheet__bar",
      {},
      h(
        "div",
        {},
        h("div.display", { text: title, style: { fontSize: "var(--t-metric)", fontWeight: "700" } }),
        h("div", { text: subtitle, style: { fontSize: "var(--t-detail)", color: "var(--ink-3)", marginTop: "2px" } })
      ),
      h("span", { style: { flex: "1" } }),
      h("button.icon-btn", { "aria-label": "Close", on: { click: () => dispatch({ type: "sheet", sheet: null }) } }, iconClose())
    ),
    body
  );
}

export function helpSheet(state, dispatch) {
  return sheet(
    "Information",
    "What the marks mean, and where things are.",
    dispatch,
    h(
      "div.sheet__body.info",
      {},
      h(
        "div.card.info__legend",
        {},
        h("div.micro", { text: "Legend" }),
        LEGEND.map((l) => h("div.info-row", {}, h("span.info-mark", {}, l.mark()), h("span", { style: { minWidth: "0" } }, h("b", { text: l.label }), h("span.info-note", { text: l.note }))))
      ),
      h(
        "div.info__help",
        {},
        HELP.map((item) =>
          h(
            "div.card",
            { style: { padding: "11px 14px", display: "flex", flexDirection: "column", gap: "4px" } },
            h("div.display", { text: item.q, style: { fontSize: "var(--t-body)", fontWeight: "600" } }),
            h("div", { text: item.a, style: { fontSize: "var(--t-detail)", color: "var(--ink-2)", lineHeight: "1.45" } })
          )
        )
      )
    )
  );
}

const field = (label, value) =>
  h(
    "div",
    { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--line)" } },
    h("span.micro", { text: label }),
    h("span", { text: value, style: { fontSize: "var(--t-action)", fontWeight: "600" } })
  );

export function accountSheet(state, dispatch) {
  return sheet(
    SUPERVISOR.name,
    "Signed in on this device",
    dispatch,
    h(
      "div.sheet__body",
      { style: { display: "flex", justifyContent: "center", alignItems: "flex-start" } },
      h(
        "div.card",
        { style: { width: "460px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "4px" } },
        field("Supervisor ID", SUPERVISOR.id),
        field("Section", SUPERVISOR.section),
        field("Assigned", `${state.tables.length} tables`),
        field("Shift", `Swing · signed in 17:52 · now ${wallClock(state.clockSeconds)}`),
        field("Authority", "Approve ratings, authorize fills, adjust trays"),
        h(
          "div",
          { style: { display: "flex", gap: "10px", marginTop: "14px" } },
          h("button.btn.btn--ghost.btn--big", {
            text: "Thresholds",
            style: { flex: "1" },
            on: { click: () => dispatch({ type: "sheet", sheet: "thresholds" }) },
          }),
          h("button.btn.btn--ghost.btn--big", {
            text: "Change section",
            style: { flex: "1" },
            on: { click: () => dispatch({ type: "toast", message: "Section handover happens at shift change." }) },
          }),
          h("button.btn.btn--big", {
            text: "Sign out",
            style: { flex: "1", background: "var(--critical)", color: "var(--on-accent)", borderColor: "var(--critical)" },
            on: { click: () => dispatch({ type: "sign-out" }) },
          })
        ),
        h("div", {
          text: "Signing out ends the shift record on this device. Anything unsigned stays open and goes to the pit manager.",
          style: { fontSize: "var(--t-detail)", color: "var(--ink-3)", marginTop: "10px", lineHeight: "1.5" },
        })
      )
    )
  );
}

const NOTIFY = [
  ["screen", "On screen"],
  ["both", "On screen and device"],
];

/**
 * Thresholds. Eight rules, two columns, one screen: the whole point of a
 * threshold screen is that you can see the rules against each other, and a
 * list you have to scroll defeats that.
 */
export function thresholdSheet(state, dispatch) {
  const card = (t) => {
    const locked = t.owner !== "own";
    const value = t.unit ? `${t.value} ${t.unit}` : t.value.toLocaleString("en-US");

    return h(
      "div.card",
      { style: { padding: "13px 15px", display: "flex", flexDirection: "column", gap: "9px", ...(locked ? { opacity: "0.82" } : {}) } },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "8px" } },
        h("span.tag", { text: t.scope.toUpperCase(), style: { background: "var(--surface-soft)", color: "var(--ink-2)" } }),
        h("span", { text: t.metric, style: { fontSize: "var(--t-body)", fontWeight: "600" } }),
        h("span", { style: { flex: "1" } }),
        locked ? h("span.tag", { text: t.owner === "compliance" ? "COMPLIANCE" : "PROPERTY", style: { background: "var(--high-wash)", color: "var(--high-ink)" } }) : null
      ),
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "10px" } },
        h("span.mono.display", { text: value, style: { fontSize: "var(--t-metric)", fontWeight: "700", flex: "1" } }),
        locked
          ? null
          : h(
              "div",
              { style: { display: "flex", gap: "6px" } },
              h("button.btn.btn--ghost", { text: "−", "aria-label": `Lower ${t.metric}`, on: { click: () => dispatch({ type: "threshold", id: t.id, delta: -1 }) } }),
              h("button.btn.btn--ghost", { text: "+", "aria-label": `Raise ${t.metric}`, on: { click: () => dispatch({ type: "threshold", id: t.id, delta: 1 }) } })
            )
      ),
      h(
        "div.segmented.segmented--sm",
        // Hugs its options. A control stretched to the width of its card is the
        // shape the brief specifically rules out.
        { role: "group", "aria-label": `How ${t.metric} notifies`, style: { alignSelf: "flex-start" } },
        NOTIFY.map(([id, label]) =>
          h("button", {
            text: label,
            "aria-pressed": String(t.notify === id),
            disabled: locked ? "" : null,
            on: { click: () => dispatch({ type: "threshold-notify", id: t.id, notify: id }) },
          })
        )
      ),
      t.note ? h("div", { text: t.note, style: { fontSize: "var(--t-micro)", color: "var(--ink-2)", lineHeight: "1.45" } }) : null
    );
  };

  return sheet(
    "Notification thresholds",
    "What is worth interrupting you for. On device means it reaches you with the screen asleep.",
    dispatch,
    h(
      "div.sheet__body",
      { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px", alignContent: "start" } },
      state.thresholds.map(card)
    )
  );
}
