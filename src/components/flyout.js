import { h } from "../lib/dom.js";
import { money } from "../lib/format.js";
import { findTable, playersForTable, podOfTable } from "../lib/selectors.js";
import { findOverride } from "./override.js";
import { iconBackspace, iconCard, iconClose, iconScan, iconTick } from "./icons.js";

const TITLES = {
  adjust: ["Adjust chip tray", "BA0101B · variance (1,000)"],
  fill: ["Authorize fill", "BA0104A · 500,000"],
  rating: ["Approve rating", "BA0102 · seat 3"],
  order: ["Order a fill", "Chips to this pod"],
  override: ["Override", "Changes a settled result"],
};

/**
 * Why an override was raised. Deliberately not the tray reasons: a tray is out
 * of balance for accounting reasons, a result is overridden for gameplay ones,
 * and a shared list would make both useless on the audit trail.
 *
 * ASSUMED. The requirements name no reason codes at all.
 */
const OVERRIDE_REASONS = [
  "Dealer error at pay or take",
  "Card misread by the table",
  "Bet placed after the cut-off",
  "Player dispute, floor decision",
  "Other, add a note",
];

/** Preset amounts. A fill is ordered in round numbers, not typed to the dollar. */
const FILL_AMOUNTS = [100000, 250000, 500000, 1000000];

const REASONS = [
  "Missing loser · shoe 9, game 6",
  "Miscount at pay or take",
  "Chips in transit, not yet placed",
  "Other, add a note",
];

/**
 * A short wizard in a right-edge panel. Three rules hold it together:
 * no step ever scrolls, completed steps collapse to a one-line summary you can
 * reopen, and the last step is the second signature — the most repeated moment
 * in the product and the one the source documents never drew.
 */
export function flyout(state, dispatch, { onScan, onResolve }) {
  const fly = state.flyout;
  const panel = h("aside.flyout", { data: { open: !!fly }, "aria-hidden": String(!fly) });
  if (!fly) return panel;

  const kind = fly.kind;
  const steps = kind === "adjust" ? 3 : 2;
  const over = kind === "override" ? findOverride(fly.overrideId) : null;
  const [title, subtitle] = over ? [over.label, "Changes a settled result"] : TITLES[kind];

  panel.appendChild(
    h(
      "div",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: "0" } },
      h(
        "div",
        {},
        h("div.display", { text: title, style: { fontSize: "var(--t-metric)", fontWeight: "700" } }),
        h("div", { text: subtitle, style: { fontSize: "var(--t-detail)", color: "var(--ink-3)", marginTop: "2px" } })
      ),
      h("button.icon-btn", { "aria-label": "Close", on: { click: () => dispatch({ type: "flyout-close" }) } }, iconClose())
    )
  );

  panel.appendChild(
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "7px", flexShrink: "0" } },
      Array.from({ length: steps }, (_, i) =>
        h("span", {
          style: { flex: "1", height: "4px", borderRadius: "2px", background: i + 1 < fly.step ? "var(--ok)" : i + 1 === fly.step ? "var(--ink)" : "var(--line)" },
        })
      ),
      h("span", { text: `Step ${fly.step} of ${steps}`, style: { fontSize: "var(--t-micro)", color: "var(--ink-2)", marginLeft: "4px", whiteSpace: "nowrap" } })
    )
  );

  if (kind === "adjust") adjustBody(panel, state, dispatch, onScan, onResolve);
  if (kind === "fill") fillBody(panel, state, dispatch, onResolve);
  if (kind === "rating") ratingBody(panel, state, dispatch, onResolve);
  if (kind === "order") orderBody(panel, state, dispatch);
  if (kind === "override") overrideBody(panel, state, dispatch, over);

  return panel;
}

const stepDone = (label, value, onEdit) =>
  h(
    "button.step-done",
    { on: { click: onEdit } },
    h("span", { style: { color: "var(--ok)", display: "flex" } }, iconTick()),
    h(
      "span",
      { style: { flex: "1", minWidth: "0" } },
      h("span.micro", { text: label, style: { display: "block" } }),
      h("span", { text: value, style: { display: "block", fontSize: "var(--t-body)", marginTop: "1px" } })
    ),
    h("span", { text: "Edit", style: { fontSize: "var(--t-detail)", color: "var(--ink-2)" } })
  );

const navRow = (...buttons) => h("div", { style: { display: "flex", gap: "10px", flexShrink: "0" } }, buttons);

function adjustBody(panel, state, dispatch, onScan, onResolve) {
  const fly = state.flyout;
  const table = findTable(state.pods, "t3");

  if (fly.step > 1) panel.appendChild(stepDone("Reason", fly.reason || "—", () => dispatch({ type: "flyout-step", step: 1 })));
  if (fly.step > 2) panel.appendChild(stepDone("Verification scan", `18:21 · actual ${money(table.actualInventory)}`, () => dispatch({ type: "flyout-step", step: 2 })));

  if (fly.step === 1) {
    panel.appendChild(
      h(
        "div",
        { style: { flexShrink: "0" } },
        h("div.display", { text: "Why is it short?", style: { fontSize: "var(--t-body)", fontWeight: "600" } }),
        h("div", { text: "A reason code is required before the count can be accepted.", style: { fontSize: "var(--t-detail)", color: "var(--ink-2)", lineHeight: "1.45", marginTop: "3px" } })
      )
    );
    panel.appendChild(
      h(
        "div",
        { style: { display: "flex", flexDirection: "column", gap: "8px", flex: "1" } },
        REASONS.map((r) =>
          h("button.option", { text: r, "aria-pressed": String(fly.reason === r), on: { click: () => dispatch({ type: "flyout-reason", reason: r }) } })
        )
      )
    );
    panel.appendChild(
      navRow(
        h("button.btn.btn--ghost.btn--big", { text: "Cancel", style: { flex: "1" }, on: { click: () => dispatch({ type: "flyout-close" }) } }),
        h("button.btn.btn--big", { text: "Continue", style: { flex: "2" }, disabled: !fly.reason, on: { click: () => dispatch({ type: "flyout-step", step: 2 }) } })
      )
    );
  } else if (fly.step === 2) {
    panel.appendChild(
      h(
        "div",
        { style: { flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", textAlign: "center" } },
        h("div.display", { text: "Verification scan", style: { fontSize: "var(--t-title)", fontWeight: "600" } }),
        h("div", { text: "The tray is counted again before the adjustment is written. This is the count that goes on the record.", style: { fontSize: "var(--t-body)", color: "var(--ink-2)", maxWidth: "280px", lineHeight: "1.5" } }),
        h("button.scan-dial", { data: { scanning: state.scanning }, on: { click: onScan } }, iconScan(), state.scanning ? null : h("span.display", { text: "Scan", style: { fontSize: "var(--t-title)", fontWeight: "600" } }))
      )
    );
    panel.appendChild(h("button.btn.btn--ghost.btn--big", { text: "Back", style: { flexShrink: "0" }, on: { click: () => dispatch({ type: "flyout-step", step: 1 }) } }));
  } else {
    panel.appendChild(
      authorization(state, dispatch, "Confirm adjustment", () =>
        onResolve("a2", "Tray adjusted. BA0101B is back in balance and no longer blocks the roll.")
      )
    );
  }
}

function fillBody(panel, state, dispatch, onResolve) {
  const fly = state.flyout;
  if (fly.step > 1) panel.appendChild(stepDone("Request", "500,000 · float · BA0104A", () => dispatch({ type: "flyout-step", step: 1 })));

  if (fly.step === 1) {
    panel.appendChild(
      h(
        "div",
        { style: { flex: "1", display: "flex", flexDirection: "column", gap: "10px" } },
        h(
          "div.card",
          { style: { padding: "13px 15px" } },
          h("div.micro", { text: "Requested by" }),
          h("div.mono", { text: "BA0104A · Secondary", style: { fontSize: "var(--t-action)", marginTop: "2px" } }),
          h("div.micro", { text: "Chips delivered to", style: { marginTop: "10px" } }),
          h("div.mono", { text: "BA0104 · Primary", style: { fontSize: "var(--t-action)", marginTop: "2px", color: "var(--critical)" } }),
          h("div", { text: "The signed slip drops in the Primary’s box. Be at BA0104, not at A.", style: { fontSize: "var(--t-detail)", color: "var(--ink-2)", marginTop: "7px", lineHeight: "1.45" } })
        ),
        h(
          "div.card",
          { style: { padding: "13px 15px" } },
          h("div.micro", { text: "Denominations" }),
          h("div.mono", { html: "100,000 &times; 3<br>50,000 &times; 3<br>10,000 &times; 5", style: { fontSize: "var(--t-body)", marginTop: "5px", lineHeight: "1.7" } }),
          h(
            "div",
            { style: { borderTop: "1px solid var(--line)", marginTop: "8px", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "baseline" } },
            h("span", { text: "Total", style: { fontSize: "var(--t-body)", fontWeight: "600" } }),
            h("span.mono.display", { text: "500,000", style: { fontSize: "var(--t-title)", fontWeight: "700" } })
          )
        )
      )
    );
    panel.appendChild(
      navRow(
        h("button.btn.btn--ghost.btn--big", { text: "Reject", style: { flex: "1" }, on: { click: () => dispatch({ type: "flyout-close" }) } }),
        h("button.btn.btn--big", { text: "Continue", style: { flex: "2" }, on: { click: () => dispatch({ type: "flyout-step", step: 2 }) } })
      )
    );
  } else {
    panel.appendChild(
      authorization(state, dispatch, "Confirm fill", () =>
        onResolve("a4", "Fill authorized. Chips are on their way to BA0104, the Primary.")
      )
    );
  }
}

/**
 * Ordering a fill, as opposed to authorizing one somebody else asked for.
 *
 * Review feedback: the prototype could approve a fill request but a supervisor
 * had no way to raise one, which is the half of the job they actually start.
 * It ends on the same second signature as everything else that moves chips,
 * and it says out loud that the chips land at the Primary, because that is the
 * thing people get wrong about a pod.
 */
function orderBody(panel, state, dispatch) {
  const fly = state.flyout;
  const table = findTable(state.pods, state.tableId);
  const pod = state.pods.find((p) => p.tables.some((t) => t.id === state.tableId));
  const primary = pod ? pod.tables[0] : table;
  const amount = fly.amount || FILL_AMOUNTS[2];

  if (fly.step > 1) {
    panel.appendChild(stepDone("Amount", `${money(amount)} · to ${primary.name}`, () => dispatch({ type: "flyout-step", step: 1 })));
  }

  if (fly.step === 1) {
    panel.appendChild(
      h(
        "div",
        { style: { flex: "1", display: "flex", flexDirection: "column", gap: "10px" } },
        h(
          "div.card",
          { style: { padding: "13px 15px" } },
          h("div.micro", { text: "Requesting for" }),
          h("div.mono", { text: `${table.name} · ${table.role === "PT" ? "Primary" : "Secondary"}`, style: { fontSize: "var(--t-action)", marginTop: "2px" } }),
          h("div.micro", { text: "Chips delivered to", style: { marginTop: "10px" } }),
          h("div.mono", { text: `${primary.name} · Primary`, style: { fontSize: "var(--t-action)", marginTop: "2px", color: "var(--critical-ink)" } }),
          h("div", {
            text: "Every fill in the pod lands at the Primary and the signed slip drops in its box, whichever table ran short.",
            style: { fontSize: "var(--t-detail)", color: "var(--ink-2)", marginTop: "7px", lineHeight: "1.45" },
          })
        ),
        h(
          "div.card",
          { style: { padding: "13px 15px", display: "flex", flexDirection: "column", gap: "9px" } },
          h("div.micro", { text: "Amount" }),
          h(
            "div",
            { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" } },
            FILL_AMOUNTS.map((v) =>
              h("button.option", {
                text: money(v),
                "aria-pressed": String(v === amount),
                style: v === amount ? { borderColor: "var(--ink)", fontWeight: "700" } : {},
                on: { click: () => dispatch({ type: "flyout-amount", amount: v }) },
              })
            )
          )
        )
      )
    );
    panel.appendChild(
      navRow(
        h("button.btn.btn--ghost.btn--big", { text: "Cancel", style: { flex: "1" }, on: { click: () => dispatch({ type: "flyout-close" }) } }),
        h("button.btn.btn--big", { text: "Continue", style: { flex: "2" }, on: { click: () => dispatch({ type: "flyout-step", step: 2 }) } })
      )
    );
  } else {
    panel.appendChild(
      authorization(state, dispatch, "Order the fill", () => {
        dispatch({ type: "flyout-close" });
        dispatch({ type: "toast", message: `Fill ordered. ${money(amount)} to ${primary.name}, the Primary.` });
      })
    );
  }
}

/**
 * Raising an override.
 *
 * Two steps, and the first one will not pass until the supervisor has named a
 * position (where the action needs one) and a reason. That is the whole design
 * argument for this screen: the rest of the product is built to remove taps,
 * and this one is built to add them, because an override that was easy to
 * raise is the one nobody can explain afterwards.
 */
function overrideBody(panel, state, dispatch, action) {
  const fly = state.flyout;
  const table = findTable(state.pods, state.tableId);
  const pod = podOfTable(state.pods, state.tableId);
  const seated = playersForTable(state.players, table.id);
  const needsPosition = !!action.needsPosition;
  const ready = (!needsPosition || fly.position) && fly.reason;

  if (fly.step > 1) {
    const what = needsPosition ? `Seat ${fly.position} · ${fly.reason}` : fly.reason;
    panel.appendChild(stepDone("Raising", what, () => dispatch({ type: "flyout-step", step: 1 })));
  }

  if (fly.step === 1) {
    const blast = h(
      "div.card",
      { style: { padding: "13px 15px" } },
      h("div.micro", { text: "What this changes" }),
      h("div", { text: action.what, style: { fontSize: "var(--t-body)", marginTop: "4px", lineHeight: "1.5" } }),
      action.group === "game"
        ? h("div", {
            text: `${pod.name} shares one shoe, so this stops all four tables, not just ${table.name}.`,
            style: { fontSize: "var(--t-detail)", color: "var(--critical-ink)", marginTop: "8px", lineHeight: "1.45", fontWeight: "600" },
          })
        : null
    );

    const positions = needsPosition
      ? h(
          "div.card",
          { style: { padding: "13px 15px", display: "flex", flexDirection: "column", gap: "9px" } },
          h("div.micro", { text: "Position" }),
          h(
            "div",
            { style: { display: "flex", flexWrap: "wrap", gap: "7px" } },
            Array.from({ length: table.seats }, (_, i) => i + 1).map((seat) => {
              const person = seated.find((p) => p.seat === seat);
              return h("button.seat-key", {
                text: String(seat),
                "aria-pressed": String(fly.position === seat),
                "aria-label": person ? `Seat ${seat}, ${person.name}` : `Seat ${seat}, empty`,
                title: person ? person.name : "Empty",
                disabled: !person,
                on: { click: () => dispatch({ type: "flyout-position", position: seat }) },
              });
            })
          ),
          h("div", {
            text: fly.position
              ? (seated.find((p) => p.seat === fly.position) || {}).name || ""
              : "Empty seats cannot be overridden.",
            style: { fontSize: "var(--t-detail)", color: "var(--ink-2)" },
          })
        )
      : null;

    const reasons = h(
      "div.card",
      { style: { padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px" } },
      h("div.micro", { text: "Reason, required" }),
      OVERRIDE_REASONS.map((r) =>
        h("button.option.option--tight", {
          text: r,
          "aria-pressed": String(fly.reason === r),
          on: { click: () => dispatch({ type: "flyout-reason", reason: r }) },
        })
      )
    );

    panel.appendChild(
      h(
        "div",
        { style: { flex: "1", minHeight: "0", overflow: "auto", display: "flex", flexDirection: "column", gap: "9px" } },
        blast,
        positions,
        reasons
      )
    );
    panel.appendChild(
      navRow(
        h("button.btn.btn--ghost.btn--big", { text: "Cancel", style: { flex: "1" }, on: { click: () => dispatch({ type: "flyout-close" }) } }),
        h("button.btn.btn--big", {
          text: "Continue",
          style: { flex: "2" },
          disabled: !ready,
          on: { click: () => ready && dispatch({ type: "flyout-step", step: 2 }) },
        })
      )
    );
  } else {
    panel.appendChild(
      authorization(state, dispatch, `Authorize ${action.label.toLowerCase()}`, () => {
        dispatch({ type: "flyout-close" });
        const where = action.needsPosition ? ` on seat ${fly.position}` : "";
        dispatch({
          type: "toast",
          message: `${action.label}${where} authorized. Both IDs and the reason are on the audit trail.`,
        });
      })
    );
  }
}

function ratingBody(panel, state, dispatch, onResolve) {
  const fly = state.flyout;
  if (fly.step > 1) panel.appendChild(stepDone("Rating", "Seat 3 · W. Chan · avg bet 48,000", () => dispatch({ type: "flyout-step", step: 1 })));

  if (fly.step === 1) {
    panel.appendChild(
      h(
        "div",
        { style: { flex: "1" } },
        h(
          "div.card",
          { style: { padding: "14px 16px" } },
          h("div.micro", { text: "Submitted by" }),
          h("div", { text: "Dealer 0631 · 18:00", style: { fontSize: "var(--t-action)", marginTop: "2px" } }),
          h("div.micro", { text: "Average bet", style: { marginTop: "10px" } }),
          h("div.mono.display", { text: "48,000", style: { fontSize: "var(--t-metric)", fontWeight: "700", marginTop: "2px" } }),
          h("div", { text: "Above the configured threshold, so it needs an approver before it reaches the loyalty system.", style: { fontSize: "var(--t-detail)", color: "var(--ink-2)", marginTop: "8px", lineHeight: "1.45" } })
        )
      )
    );
    panel.appendChild(
      navRow(
        h("button.btn.btn--ghost.btn--big", { text: "Cancel rating", style: { flex: "1" }, on: { click: () => dispatch({ type: "flyout-close" }) } }),
        h("button.btn.btn--big", { text: "Continue", style: { flex: "2" }, on: { click: () => dispatch({ type: "flyout-step", step: 2 }) } })
      )
    );
  } else {
    panel.appendChild(authorization(state, dispatch, "Confirm rating", () => onResolve("a6", "Rating approved and sent to the loyalty system.")));
  }
}

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "delete"];

/**
 * The second signature. Casino operations run on "two people have to agree",
 * and this is that moment: a manager signs on this device, mid-task, standing
 * at a live table, without the supervisor losing what they had entered.
 */
function authorization(state, dispatch, confirmLabel, onConfirm) {
  const pin = (state.flyout && state.flyout.pin) || "";

  const press = (k) => {
    if (k === "clear") dispatch({ type: "flyout-pin", pin: "" });
    else if (k === "delete") dispatch({ type: "flyout-pin", pin: pin.slice(0, -1) });
    else if (pin.length < 6) dispatch({ type: "flyout-pin", pin: pin + k });
  };

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "11px", flex: "1", minHeight: "0" } },
    h(
      "div",
      { style: { flexShrink: "0" } },
      h("div.display", { text: "Authorization", style: { fontSize: "var(--t-body)", fontWeight: "600" } }),
      h("div", {
        text: "You do not hold this permission. An authorized user signs here, on this device, without losing the entry.",
        style: { fontSize: "var(--t-detail)", color: "var(--ink-2)", lineHeight: "1.45", marginTop: "3px" },
      })
    ),
    h(
      "div",
      { style: { flexShrink: "0", display: "flex", alignItems: "center", gap: "11px", height: "54px", padding: "0 14px", borderRadius: "12px", background: "var(--surface-soft)", border: "1px solid var(--line)" } },
      h("span", { style: { color: "var(--ink-2)", display: "flex" } }, iconCard()),
      h(
        "div",
        { style: { flex: "1" } },
        h("div.micro", { text: "Authorized by" }),
        h("div.mono", {
          text: pin ? "•".repeat(pin.length) : "Swipe card, or enter ID",
          style: { fontSize: "var(--t-body)", marginTop: "1px", letterSpacing: "0.2em", color: pin ? "var(--ink)" : "var(--ink-3)" },
        })
      ),
      pin.length >= 4 ? h("span", { style: { color: "var(--ok)", display: "flex" } }, iconTick()) : null
    ),
    h(
      "div.keypad",
      {},
      KEYS.map((k) =>
        h(
          "button.key",
          { "aria-label": k, on: { click: () => press(k) } },
          k === "clear" ? h("span", { text: "Clear", style: { fontSize: "var(--t-body)", opacity: "0.6" } }) : k === "delete" ? iconBackspace() : k
        )
      )
    ),
    navRow(
      h("button.btn.btn--ghost.btn--big", { text: "Cancel", style: { flex: "1" }, on: { click: () => dispatch({ type: "flyout-close" }) } }),
      h("button.btn.btn--big", { text: confirmLabel, style: { flex: "2" }, disabled: pin.length < 4, on: { click: onConfirm } })
    )
  );
}
