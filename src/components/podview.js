import { h } from "../lib/dom.js";
import { age, ageLong, countdown, money } from "../lib/format.js";
import { alertsForTable, findPod, limitsLabel, seatedInPod, shoeWinLossForPod, worstSeverity } from "../lib/selectors.js";
import { sevColor, sevEdge, sevInk, sevWash } from "../lib/severity.js";
import { felt, seats } from "./seats.js";

const STATUS_LABEL = {
  dealing: "Dealing", playing: "In play", "tray-short": "Tray short",
  "fill-open": "Fill open", idle: "Empty", offline: "Offline",
};

function statusColor(t) {
  if (t.status === "offline" || t.status === "tray-short") return "var(--critical)";
  if (t.status === "fill-open") return "var(--high)";
  if (t.status === "idle") return "var(--ink-3)";
  return "var(--ok)";
}

const figure = (label, value, { color, big, live } = {}) =>
  h(
    "div",
    { style: { whiteSpace: "nowrap" } },
    h("div.micro", { text: label, style: color ? { color } : {} }),
    h("div.mono.display", { text: value, data: live ? { live } : undefined, style: { fontSize: big ? "19px" : "15px", fontWeight: big ? "700" : "600", color: color || "" } })
  );

const tile = (label, value, color) =>
  h(
    "div",
    { style: { background: "var(--surface-soft)", borderRadius: "11px", padding: "9px 11px" } },
    h("div.micro", { text: label }),
    h("div.mono.display", { text: value, style: { fontSize: "21px", fontWeight: "600", color: color || "" } })
  );

const quiet = (label, value) =>
  h(
    "div",
    { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" } },
    h("span.micro", { text: label }),
    h("span.mono", { text: value, style: { fontSize: "15px", fontWeight: "600", color: "var(--ink-2)", whiteSpace: "nowrap" } })
  );

const card = (dashed) =>
  h("span", {
    style: {
      width: "30px", height: "42px", borderRadius: "4px", display: "block",
      background: dashed ? "rgba(255,255,255,.3)" : "rgba(255,255,255,.8)",
      border: dashed ? "1px dashed rgba(255,255,255,.45)" : "",
    },
  });

/**
 * One pod, four tables. Shared state sits across the top exactly once, because
 * the pod shares it: one shoe, one countdown, one gaming day. Everything below
 * is per table. That split is the argument that a pod is one machine.
 */
export function podView(state, dispatch, onAlertAction) {
  const pod = findPod(state.pods, state.podId);
  if (!pod) return h("div");

  const [primary, ...secondaries] = pod.tables;
  const { seated, capacity } = seatedInPod(pod);
  const held = !!state.held[pod.id];

  const strip = h(
    "div.card",
    { style: { flexShrink: "0", height: "76px", display: "flex", alignItems: "center", padding: "0 16px", gap: "22px" } },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", gap: "11px" } },
      h(
        "div",
        // All four borders as longhands. A `border:` shorthand holding a var()
        // cannot be overridden per side and still serialise, which breaks any
        // tool that reads the rendered DOM back out (Figma import, for one).
        {
          style: {
            width: "50px", height: "50px", borderRadius: "50%",
            borderWidth: "3px", borderStyle: "solid",
            borderTopColor: "var(--ok)", borderLeftColor: "var(--ok)",
            borderRightColor: "var(--line)", borderBottomColor: "var(--line)",
            display: "flex", alignItems: "center", justifyContent: "center",
          },
        },
        h("span.mono.display", { text: countdown(state.countdown), data: { live: "countdown" }, style: { fontSize: "17px", fontWeight: "600" } })
      ),
      h("div", {}, h("div.micro", { text: "Shared countdown" }), h("div", { text: "all four tables", style: { fontSize: "15px", color: "var(--ink-2)" } }))
    ),
    h("div", { style: { width: "1px", height: "40px", background: "var(--line)" } }),
    figure("Shared shoe", "Game 9 · 36 left"),
    figure("Shoe W/L, pod", money(shoeWinLossForPod(pod))),
    figure("Seated", `${seated} / ${capacity}`),
    h("span", { style: { flex: "1" } }),
    h("button.btn.btn--ghost.btn--big", {
      text: held ? "Resume the pod" : "Hold the pod",
      style: held ? {} : { color: "var(--critical)", borderColor: "var(--critical-edge)" },
      on: {
        click: () => {
          dispatch({ type: "toggle-hold", podId: pod.id });
          dispatch({ type: "toast", message: held ? `${pod.name} resumed.` : `${pod.name} held. All four tables suspended.` });
        },
      },
    })
  );

  const hero = h(
    "button.card",
    {
      style: { width: "348px", flexShrink: "0", padding: "15px 16px", display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit" },
      on: { click: () => dispatch({ type: "go-table", podId: pod.id, tableId: primary.id, tab: "live" }) },
    },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
      h(
        "div",
        {},
        h("span.tag", { text: "PRIMARY · CHIP DOOR", style: { background: "var(--surface-soft)", color: "var(--ink)" } }),
        h("div.display", { text: primary.name, style: { fontSize: "26px", fontWeight: "700", marginTop: "6px" } })
      ),
      h(
        "span.pill",
        { style: { background: "var(--ok-wash)", borderColor: "var(--ok-edge)", color: "var(--ok)" } },
        h("span.dot", { style: { background: "var(--ok)" } }),
        held ? "Held" : "Dealing"
      )
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "8px 0 4px" } },
      seats(primary.seats, primary.seated, 12, 9),
      felt(primary, {
        width: 246,
        height: 74,
        children: h(
          "span",
          { style: { display: "flex", gap: "9px", alignItems: "center" } },
          card(), card(), h("span", { style: { width: "1px", height: "44px", background: "rgba(255,255,255,.3)" } }), card(), card(true)
        ),
      }),
      h("span", { text: "Banker 7 · Player 4 · drawing", style: { fontSize: "14px", color: "var(--ink-3)" } })
    ),
    h(
      "div",
      { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } },
      tile("Shoe W/L", money(primary.shoeWinLoss)),
      tile("Variance", money(primary.variance), primary.variance ? "var(--critical)" : "var(--ok)")
    ),
    // Reference figures, not numbers you react to, so they sit quietly under
    // the two that are.
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "7px" } },
      quiet("Table limits", limitsLabel(primary)),
      quiet("Seated", `${primary.seated} of ${primary.seats}`),
      quiet("Opened", primary.opener)
    ),
    h("span", { style: { flex: "1" } }),
    h("span", { text: "Tap to open the table", style: { fontSize: "15px", color: "var(--ink-3)" } })
  );

  const rows = secondaries.map((t) => {
    const ta = alertsForTable(state.alerts, t.id);
    const sev = worstSeverity(ta);
    const bad = ta.length > 0;

    const figs =
      t.status === "offline"
        ? [
            figure("Last scan", "18:04"),
            figure("Inventory", money(t.actualInventory)),
            figure("Dark for", age(ta[0] ? ta[0].ageSeconds : 0), { color: "var(--critical)", big: true, live: ta[0] ? `age:${ta[0].id}` : null }),
          ]
        : [
            figure("Shoe W/L", money(t.shoeWinLoss)),
            figure("Variance", money(t.variance), { color: t.variance ? "var(--critical)" : "var(--ok)", big: !!t.variance }),
            figure(bad ? "Open" : "Settled", bad ? age(ta[0].ageSeconds) : "on pace", { color: bad ? sevInk(sev) : "", live: bad ? `age:${ta[0].id}` : null }),
          ];

    return h(
      "div.card",
      {
        style: {
          flex: "1", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px",
          justifyContent: "center", minHeight: "0", cursor: "pointer",
          ...(sev === "critical" ? { borderColor: "var(--critical)", boxShadow: "0 0 0 3px var(--critical-wash)" } : {}),
        },
        on: { click: () => dispatch({ type: "go-table", podId: pod.id, tableId: t.id, tab: t.status === "tray-short" ? "chips" : "live" }) },
      },
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "10px", minWidth: "0" } },
        h("span.display", { text: t.name, style: { fontSize: "22px", fontWeight: "600" } }),
        h("span.mono", { text: limitsLabel(t), style: { fontSize: "14px", color: "var(--ink-3)", whiteSpace: "nowrap", flexShrink: "0" } }),
        h(
          "span.pill",
          { style: { background: bad ? sevWash(sev) : "transparent", borderColor: bad ? sevEdge(sev) : "var(--line)", color: statusColor(t) } },
          h("span.dot", { style: { background: statusColor(t) } }),
          STATUS_LABEL[t.status]
        ),
        h("span", { style: { flex: "1" } }),
        // The button says what the alert says. One place decides what an
        // alert action does, so the pod row cannot offer a different verb from
        // the tree for the same problem.
        h("button", {
          class: bad ? "btn btn--big" : "btn btn--ghost btn--big",
          text: bad ? (ta[0].actions.find((x) => x.primary) || ta[0].actions[0]).label : "Open table",
          on: {
            click: (e) => {
              e.stopPropagation();
              if (bad) onAlertAction(ta[0], ta[0].actions.find((x) => x.primary) || ta[0].actions[0]);
              else dispatch({ type: "go-table", podId: pod.id, tableId: t.id, tab: "live" });
            },
          },
        })
      ),
      h(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "18px", minWidth: "0" } },
        h(
          "div",
          { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: "0", opacity: t.status === "offline" ? "0.42" : "1" } },
          seats(t.seats, t.seated, 10, 6),
          felt(t, { hasAlert: t.status === "tray-short", width: 124, height: 28 })
        ),
        figs
      )
    );
  });

  return h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "12px", flex: "1", minHeight: "0" } },
    strip,
    h(
      "div",
      { style: { flex: "1", display: "flex", gap: "12px", minHeight: "0" } },
      hero,
      h("div", { style: { flex: "1", display: "flex", flexDirection: "column", gap: "12px", minWidth: "0" } }, rows)
    )
  );
}
