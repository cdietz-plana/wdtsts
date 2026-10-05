import { h } from "../lib/dom.js";
import { age, compact, limitShort, money } from "../lib/format.js";
import {
  alertsForTable, findPod, playerTotals, playersForPod, playersForTable,
  podPerformance, seatedInPod, worstSeverity,
} from "../lib/selectors.js";
import { sevColor, sevEdge, sevInk, sevWash } from "../lib/severity.js";
import { currentHand } from "../data/games.js";
import { handView } from "./cards.js";
import { felt, seats } from "./seats.js";

const STATUS_LABEL = {
  dealing: "Dealing", playing: "In play", "tray-short": "Tray short",
  "fill-open": "Fill open", idle: "Empty", offline: "Offline",
};

function statusColor(t) {
  if (t.status === "offline" || t.status === "tray-short") return "var(--critical-ink)";
  if (t.status === "fill-open") return "var(--high-ink)";
  if (t.status === "idle") return "var(--ink-3)";
  return "var(--ok-ink)";
}

const figure = (label, value, { color, big, live } = {}) =>
  h(
    "div",
    { style: { whiteSpace: "nowrap" } },
    h("div.micro", { text: label, style: color ? { color } : {} }),
    h("div.mono.display", {
      text: value,
      data: live ? { live } : undefined,
      style: { fontSize: big ? "var(--t-body)" : "var(--t-detail)", fontWeight: big ? "700" : "600", color: color || "" },
    })
  );

/** The four figures the pod header carries, set at metric weight. */
const metric = (label, value, color) =>
  h(
    "div",
    { style: { whiteSpace: "nowrap" } },
    h("div.micro", { text: label }),
    h("div.mono.display", { text: value, style: { fontSize: "var(--t-metric)", fontWeight: "700", lineHeight: "1.1", color: color || "" } })
  );

const tile = (label, value, color) =>
  h(
    "div",
    { style: { background: "var(--surface-soft)", borderRadius: "var(--r-md)", border: "1px solid var(--line-strong)", padding: "9px 11px" } },
    h("div.micro", { text: label }),
    h("div.mono.display", { text: value, style: { fontSize: "var(--t-title)", fontWeight: "600", color: color || "" } })
  );

const quiet = (label, value) =>
  h(
    "div",
    { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "10px" } },
    h("span.micro", { text: label }),
    h("span.mono", { text: value, style: { fontSize: "var(--t-detail)", fontWeight: "600", color: "var(--ink-2)", whiteSpace: "nowrap" } })
  );

/**
 * One pod, four tables.
 *
 * Review feedback took two things out of the header. The shared countdown
 * went: it is a dealer's clock, it moved every second, and it was the loudest
 * object on a screen where nothing about it is actionable. Hold the pod went
 * with it, because a hold is raised by the dealer at the table, not by a
 * supervisor pressing a button on a tablet.
 *
 * What is there instead is the four figures a supervisor is actually asked
 * for at pod level: win or loss, buy-in, handle, and how many seats are full.
 */
export function podView(state, dispatch, onAlertAction) {
  const pod = findPod(state.pods, state.podId);
  if (!pod) return h("div");

  const [primary, ...secondaries] = pod.tables;
  const { seated, capacity } = seatedInPod(pod);
  const held = !!state.held[pod.id];
  const perf = podPerformance(pod);
  const totals = playerTotals(playersForPod(state.players, pod));
  const openPlayer = (player) => dispatch({ type: "open-player", playerId: player.id });

  const strip = h(
    "div.card",
    { style: { flexShrink: "0", height: "88px", display: "flex", alignItems: "center", padding: "0 18px", gap: "26px" } },
    metric("Win / loss", money(perf.win), perf.win < 0 ? "var(--critical-ink)" : "var(--ok-ink)"),
    metric("Buy-in", money(totals.buyIn)),
    metric("Handle", compact(perf.handle)),
    metric("Seated", `${seated} / ${capacity}`),
    h("span", { style: { flex: "1" } }),
    h(
      "div",
      { style: { textAlign: "right", flexShrink: "0", whiteSpace: "nowrap" } },
      h("div.micro", { text: "Shared shoe" }),
      h("div.mono.display", { text: "Shoe 9 · game 9", style: { fontSize: "var(--t-body)", fontWeight: "600" } }),
      // The caption explaining that the shoe is shared is the first thing to
      // go when the header is carrying a hold: the hold says the same thing
      // more usefully, because a held pod IS all four tables stopping.
      held ? null : h("div", { text: "one shoe across all four tables", style: { fontSize: "var(--t-micro)", color: "var(--ink-3)" } })
    ),
    held
      ? h(
          "span.pill",
          { style: { background: "var(--high-wash)", borderColor: "var(--high-edge)", color: "var(--high-ink)", flexShrink: "0" } },
          h("span.dot", { style: { background: "var(--high)" } }),
          "Held by dealer"
        )
      : null
  );

  const hero = h(
    "button.card",
    {
      style: { width: "368px", flexShrink: "0", padding: "15px 16px", display: "flex", flexDirection: "column", gap: "12px", cursor: "pointer", textAlign: "left", font: "inherit", color: "inherit" },
      on: { click: () => dispatch({ type: "go-table", podId: pod.id, tableId: primary.id, tab: "live" }) },
    },
    h(
      "div",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
      h(
        "div",
        {},
        h("span.tag", { text: "PRIMARY · CHIP DOOR", style: { background: "var(--surface-soft)", color: "var(--ink)" } }),
        h("div.display", { text: primary.name, style: { fontSize: "var(--t-metric)", fontWeight: "700", marginTop: "6px" } })
      ),
      held
        ? h(
            "span.pill",
            { style: { background: "var(--high-wash)", borderColor: "var(--high-edge)", color: "var(--high-ink)" } },
            h("span.dot", { style: { background: "var(--high)" } }),
            "Held"
          )
        : h(
            "span.pill",
            { style: { background: "var(--ok-wash)", borderColor: "var(--ok-edge)", color: "var(--ok-ink)" } },
            h("span.dot", { style: { background: "var(--ok)" } }),
            "Dealing"
          )
    ),
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "10px 0 6px", flex: "1", justifyContent: "center" } },
      seats(primary, playersForTable(state.players, primary.id), { scale: 1.35, gap: 10, onPick: openPlayer }),
      // The cards, with rank and suit. This is the screen that stands in for
      // looking at the felt, so it shows what is on the felt.
      felt(primary, { width: 330, height: 120, children: handView(currentHand(primary.id), { size: "md" }) })
    ),
    h(
      "div",
      { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" } },
      tile("Shoe W/L", money(primary.shoeWinLoss)),
      tile("Variance", money(primary.variance), primary.variance ? "var(--critical-ink)" : "var(--ok-ink)")
    ),
    // Reference figures, not numbers you react to, so they sit quietly under
    // the two that are. Limits live here and at table level, never on the
    // all-pod floor: a limit is a reference figure, not an exception.
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "7px" } },
      quiet("PT limits", limitShort(primary.limits)),
      quiet("Dealer", primary.dealer || "unassigned"),
      quiet("Seated", `${primary.seated} of ${primary.seats}`),
      quiet("Opened", primary.opener)
    ),
    h("span", { text: "Tap to open the table", style: { fontSize: "var(--t-detail)", color: "var(--ink-3)" } })
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
            figure("Dark for", age(ta[0] ? ta[0].ageSeconds : 0), { color: "var(--critical-ink)", big: true, live: ta[0] ? `age:${ta[0].id}` : null }),
          ]
        : [
            figure("Win / loss", money(t.dayWin), { color: t.dayWin < 0 ? "var(--critical-ink)" : "var(--ok-ink)", big: true }),
            figure("Buy-in", compact(playerTotals(playersForTable(state.players, t.id)).buyIn)),
            figure("Handle", compact(t.handle)),
            figure("Variance", money(t.variance), { color: t.variance ? "var(--critical-ink)" : "var(--ok-ink)", big: !!t.variance }),
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
        h("span.display", { text: t.name, style: { fontSize: "var(--t-title)", fontWeight: "600" } }),
        h("span.mono", { text: `ST ${limitShort(t.limits)}`, style: { fontSize: "var(--t-micro)", color: "var(--ink-3)", whiteSpace: "nowrap", flexShrink: "0" } }),
        h("span", { text: t.dealer || "unassigned", style: { fontSize: "var(--t-micro)", color: "var(--ink-3)", whiteSpace: "nowrap", flexShrink: "0" } }),
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
          seats(t, playersForTable(state.players, t.id), { scale: 0.95, gap: 5, onPick: openPlayer }),
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
