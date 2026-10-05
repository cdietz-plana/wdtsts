import { h } from "../lib/dom.js";
import { wallClock } from "../lib/format.js";
import { iconClose } from "./icons.js";

/**
 * Full-device overlays: help, and the account sheet that finally gives sign out
 * a home inside the tablet rather than in the page chrome around it.
 *
 * Both are sheets rather than screens because neither is a destination. You
 * are never doing your job in here, so nothing should have navigated you away
 * from what you were doing.
 */

const HELP = [
  {
    q: "Why is the pod the unit, not the table?",
    a: "Four tables share one shoe, one countdown and one gaming day. A card change or a roll stops all four, and the chips and signed slips route through the Primary. Treating a pod as four independent tables is what makes the old dashboard hard to read.",
  },
  {
    q: "What does color mean?",
    a: "One thing: needs attention. Crimson is critical, amber is high, green is settled. Color is never used for identity, so nothing is red because of what it is.",
  },
  {
    q: "Floor, Performance, Alerts",
    a: "The same six pods in the same places. Floor shows you where trouble is, Performance prints the money on the cards, Alerts gives the list the whole screen. The panels never swap sides, only weight.",
  },
  {
    q: "The two clocks",
    a: "Next game counts the seconds to the next deal across the pod. Roll in counts the hours until the gaming day closes. Every alert marked blocking roll has to be cleared before that second clock runs out.",
  },
  {
    q: "Adjusting a chip tray",
    a: "Reason code, verification scan, second signature. The signature is a real authorization and it goes on the audit trail with your ID. Confirming it clears the alert everywhere it appears at once.",
  },
  {
    q: "Something is wrong and it is not listed",
    a: "Call the pit manager. This tablet records and authorizes; it does not replace the phone.",
  },
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
    "How this works",
    "Six answers, no manual. If something here is wrong, it is the design that is wrong.",
    dispatch,
    h(
      "div.sheet__body",
      { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px", alignContent: "center" } },
      HELP.map((item) =>
        h(
          "div.card",
          { style: { padding: "13px 15px", display: "flex", flexDirection: "column", gap: "5px" } },
          h("div.display", { text: item.q, style: { fontSize: "var(--t-action)", fontWeight: "600" } }),
          h("div", { text: item.a, style: { fontSize: "var(--t-detail)", color: "var(--ink-2)", lineHeight: "1.5" } })
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
    "Supervisor 0418",
    "Signed in on this device",
    dispatch,
    h(
      "div.sheet__body",
      { style: { display: "flex", justifyContent: "center", alignItems: "flex-start" } },
      h(
        "div.card",
        { style: { width: "460px", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "4px" } },
        field("Section", "My Section · North Baccarat"),
        field("Assigned", "6 pods · 24 tables"),
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
            on: { click: () => dispatch({ type: "toast", message: "Section handover is designed in the Load Pods flow." }) },
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
        locked ? h("span.tag", { text: t.owner === "compliance" ? "COMPLIANCE" : "PROPERTY", style: { background: "var(--high-wash)", color: "var(--high)" } }) : null
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
      t.note ? h("div", { text: t.note, style: { fontSize: "var(--t-micro)", color: "var(--ink-3)", lineHeight: "1.45" } }) : null
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
