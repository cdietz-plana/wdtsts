import { h } from "../lib/dom.js";
import { findTable } from "../lib/selectors.js";
import { iconChevron, iconClose, iconEye, iconRadio, iconTick } from "./icons.js";

/**
 * Dispatch: the manager calls another department to the floor.
 *
 * The dealer has Supervisor Requested to call the manager; this is the same
 * idea one level up. Pick who, pick where, pick why, send. The call is then
 * tracked as one item, Sent, Acknowledged, On the way, Arrived, like a fill.
 *
 * Surveillance is discreet: it never shows on a tile, and so never anywhere
 * a player or dealer could read it. It shows here and in Activity only.
 *
 * ASSUMED: how each department receives the call (its own app, a dispatch
 * system, a radio) is open, so acknowledgements are simulated on timers.
 */

export const ROLES = [
  { id: "security", label: "Security", sub: "Officer to the floor", reasons: ["Player disturbance", "Escort chips or cash", "Unattended item", "Medical assistance", "Other"] },
  { id: "surveillance", label: "Surveillance", sub: "Discreet. Never shown on a table.", discreet: true, reasons: ["Watch a player", "Review a hand", "Possible collusion", "Chip discrepancy", "Other"] },
  { id: "floor-ops", label: "Floor Operations Manager", sub: "Escalate to the floor manager", reasons: ["Player complaint", "Limit or game decision", "Staffing", "Table open or close", "Other"] },
  { id: "public-area", label: "Public Area", sub: "Environmental services", reasons: ["Spill", "Cleaning needed", "Trash or debris", "Restock supplies", "Other"] },
];
export const roleOf = (id) => ROLES.find((r) => r.id === id);
export const CALL_STAGES = ["Sent", "Acknowledged", "On the way", "Arrived"];

/** Places a call can be sent to that are not a table. */
const AREAS = ["Pit podium", "Section entrance", "Cage window", "Restrooms nearby"];

export function dispatchPanel(state, dispatch, { onCall, onCloseCall }) {
  const d = state.dispatchOpen;
  const set = (patch) => dispatch({ type: "dispatch-set", patch });
  const role = d && d.role ? roleOf(d.role) : null;
  const table = d && d.tableId ? findTable(state.tables, d.tableId) : null;
  const whereLabel = table ? table.name : d && d.where ? d.where : "";

  const head = h(
    "div.xp__head",
    {},
    h("div", { style: { minWidth: "0" } }, h("div.display.xp__name", { text: "Dispatch" }), h("div.xp__sub", { text: role ? role.label : "Call someone to the floor" })),
    h("span", { style: { flex: "1" } }),
    h("button.icon-btn", { "aria-label": "Close", on: { click: () => dispatch({ type: "dispatch-close" }) } }, iconClose())
  );

  const done = (label, value, step) =>
    h(
      "button.step-done",
      { on: { click: () => set({ step }) } },
      h("span", { style: { color: "var(--ok)", display: "flex" } }, iconTick()),
      h("span", { style: { flex: "1", minWidth: "0" } }, h("span.micro", { text: label, style: { display: "block" } }), h("span", { text: value, style: { display: "block", fontSize: "var(--t-body)", marginTop: "1px" } })),
      h("span", { text: "Edit", style: { fontSize: "var(--t-detail)", color: "var(--ink-2)" } })
    );

  let body;
  if (!d) body = null;
  else if (d.step === 1) {
    body = h(
      "div.xp__body",
      {},
      h("div.micro", { text: "Who" }),
      h(
        "div.dx-roles",
        {},
        ROLES.map((r) =>
          h(
            "button.dx-role",
            { data: { discreet: !!r.discreet }, on: { click: () => set({ role: r.id, reason: null, step: 2 }) } },
            h("span.dx-role__icon", {}, r.discreet ? iconEye(18) : iconRadio(18)),
            h("span", { style: { flex: "1", minWidth: "0" } }, h("span.dx-role__name", { text: r.label }), h("span.dx-role__sub", { text: r.sub })),
            iconChevron(14)
          )
        )
      ),
      openCalls(state, dispatch, onCloseCall)
    );
  } else if (d.step === 2) {
    // Where: the table this was opened from is already picked; otherwise the
    // tables in view, then places on the floor that are not a table.
    const tables = state.tables.filter((t) => t.status !== "closed").slice(0, 12);
    body = h(
      "div.xp__body",
      {},
      done("Who", role.label, 1),
      h("div.micro", { text: "Where" }),
      h(
        "div.dx-where",
        {},
        tables.map((t) => h("button.option.option--tight.dx-place", { text: t.name, "aria-pressed": String(d.tableId === t.id), on: { click: () => set({ tableId: t.id, where: "" }) } }))
      ),
      h("div.micro", { text: "Not at a table" }),
      h(
        "div.dx-where.dx-where--areas",
        {},
        AREAS.map((a) => h("button.option.option--tight.dx-place", { text: a, "aria-pressed": String(!d.tableId && d.where === a), on: { click: () => set({ tableId: null, where: a }) } }))
      ),
      h("span", { style: { flex: "1" } }),
      h(
        "div.xp__nav",
        {},
        h("button.btn.btn--ghost.btn--big", { text: "Back", style: { flex: "1" }, on: { click: () => set({ step: 1 }) } }),
        h("button.btn.btn--big", { text: whereLabel ? `Next · ${whereLabel}` : "Pick a place", style: { flex: "2" }, disabled: whereLabel ? null : "", on: { click: () => set({ step: 3 }) } })
      )
    );
  } else {
    body = h(
      "div.xp__body",
      {},
      done("Who", role.label, 1),
      done("Where", whereLabel, 2),
      h("div.micro", { text: "Why" }),
      h(
        "div.dx-reasons",
        {},
        role.reasons.map((r) => h("button.option.option--tight", { text: r, "aria-pressed": String(d.reason === r), on: { click: () => set({ reason: r }) } }))
      ),
      role.discreet ? h("div.dx-note", {}, iconEye(15), "Discreet: this call never shows on the table, the tile or the dealer display.") : null,
      h("span", { style: { flex: "1" } }),
      h(
        "div.xp__nav",
        {},
        h("button.btn.btn--ghost.btn--big", { text: "Back", style: { flex: "1" }, on: { click: () => set({ step: 2 }) } }),
        h("button.btn.btn--big", {
          text: d.reason ? `Send to ${role.label}` : "Pick a reason",
          style: { flex: "2" },
          disabled: d.reason ? null : "",
          on: { click: () => onCall({ role: role.id, tableId: d.tableId, where: whereLabel, reason: d.reason, discreet: !!role.discreet }) },
        })
      )
    );
  }

  return h("div.xp", { data: { view: "dispatch" } }, head, body);
}

/** Calls in flight, newest first, each with its stage and a close. */
function openCalls(state, dispatch, onCloseCall) {
  if (!state.calls.length) return null;
  return h(
    "div.dx-calls",
    {},
    h("div.micro", { text: "In progress" }),
    [...state.calls].reverse().map((c) => {
      const r = roleOf(c.role);
      return h(
        "div.dx-call",
        { data: { discreet: c.discreet } },
        h(
          "div.dx-call__top",
          {},
          h("span.dx-call__name", { text: r.label }),
          h("span.dx-call__stage", { text: CALL_STAGES[c.stage] }),
          h("button.icon-btn.dx-call__x", { "aria-label": `Close call to ${r.label}`, on: { click: () => onCloseCall(c.id) } }, iconClose(13))
        ),
        h("div.dx-call__sub", { text: `${c.where} · ${c.reason}` }),
        callSteps(c)
      );
    })
  );
}

export function callSteps(c) {
  return h("div.tile__fill-steps", {}, CALL_STAGES.map((l, i) => h("span", { data: { state: i < c.stage ? "done" : i === c.stage ? "now" : "next" }, title: l })));
}
