import { h } from "../lib/dom.js";
import { playersForTable } from "../lib/selectors.js";
import { currentHand } from "../data/games.js";
import {
  iconBook, iconCancelBets, iconCardBuffer, iconFlame,
  iconReplace, iconScroll, iconSettle, iconVoid,
} from "./icons.js";

/** One glyph per control, so the eight are told apart by shape before text. */
const ICONS = {
  void: iconVoid,
  "replace-card": iconReplace,
  burn: iconFlame,
  buffer: iconCardBuffer,
  settle: iconSettle,
  cancel: iconCancelBets,
  book: iconBook,
  insurance: iconScroll,
};

/**
 * Override.
 *
 * The most compliance-sensitive screen in the product and the one closest to
 * the regulator. Everything a supervisor does here changes a result that has
 * already been settled, which is why it was left undesigned until now.
 *
 * WHAT IS SOURCED, AND WHAT IS NOT
 *
 * The control set below is taken from the Appendix Table Dashboard Functional
 * Inventory, which FR-084 and section 6.4 make the preservation baseline. So
 * the eight controls, and the rule that three of them belong to the Primary
 * alone, are not inventions.
 *
 * Everything about HOW an override is authorized is invented, and marked as
 * such on screen. Specifically: that one supervisor may raise an override and
 * a second authenticated person must approve it; that a reason code is
 * mandatory; and that the pair is written to an audit trail with both IDs.
 * The requirements say none of this. WDTS has to confirm or correct it before
 * any of it is built.
 *
 * The screen is deliberately slower than the rest of the product: every
 * control states what it affects before it will open, and nothing here is a
 * single tap.
 */

/** @type {{id:string,group:"game"|"position",label:string,what:string,primaryOnly?:boolean,needsPosition?:boolean,blackjackOnly?:boolean}[]} */
export const OVERRIDES = [
  {
    id: "void", group: "game", label: "Void hand", primaryOnly: true,
    what: "Voids the game in progress. Every bet on every table in the pod is returned.",
  },
  {
    id: "replace-card", group: "game", label: "Replace a card", primaryOnly: true,
    what: "Swaps a misread card in the current hand and recalculates the outcome.",
  },
  {
    id: "burn", group: "game", label: "Burn cards", primaryOnly: true,
    what: "Burns cards off the top of the shoe before the next deal.",
  },
  {
    id: "buffer", group: "game", label: "Card buffer", primaryOnly: true,
    what: "Cards the table has read ahead of the deal. Clearing it forces a re-read.",
  },
  {
    id: "settle", group: "position", label: "Settle position", needsPosition: true,
    what: "Pays or takes one position by hand when the table cannot settle it.",
  },
  {
    id: "cancel", group: "position", label: "Cancel bets", needsPosition: true,
    what: "Removes the bets on one position before the deal closes.",
  },
  {
    id: "book", group: "position", label: "Book or rebook a bet", needsPosition: true,
    what: "Records a bet the table missed, or moves one to the position it belongs to.",
  },
  {
    id: "insurance", group: "position", label: "Insurance", blackjackOnly: true,
    what: "Books insurance against the dealer's up card.",
  },
];

export const findOverride = (id) => OVERRIDES.find((o) => o.id === id);

/**
 * Why an override is unavailable, in the supervisor's terms rather than the
 * system's. An unavailable control stays on screen: hiding it teaches nobody
 * that the Primary owns the shoe, and that is the single most misunderstood
 * thing about a pod.
 */
export function blockedReason(action, table, primary) {
  if (action.primaryOnly && table.role !== "PT") {
    return `Primary only. The shoe and the cards belong to ${primary.name}.`;
  }
  if (action.blackjackOnly) return "Blackjack only. This table is baccarat.";
  if (table.status === "offline") return "Table is offline. Nothing can be overridden until it reports.";
  return null;
}

const sectionHead = (title, note) =>
  h(
    "div.section-head",
    { style: { display: "flex", alignItems: "baseline", gap: "10px", flexShrink: "0", minWidth: "0" } },
    h("span.micro", { text: title, style: { flexShrink: "0" } }),
    h("span", {
      text: note,
      style: { fontSize: "var(--t-micro)", color: "var(--ink-3)", minWidth: "0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    })
  );

function actionTile(action, blocked, onOpen) {
  const glyph = ICONS[action.id];

  const body = [
    h(
      "div",
      {
        style: {
          display: "flex", alignItems: "center", justifyContent: "center",
          height: "40px", marginBottom: "10px", flexShrink: "0",
          color: blocked ? "var(--ink-3)" : "var(--ink-2)",
        },
      },
      glyph ? glyph(30) : null
    ),
    h(
      "div",
      { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", minWidth: "0" } },
      h("span.display", { text: action.label, style: { fontSize: "var(--t-body)", fontWeight: "600", minWidth: "0" } }),
      blocked
        ? h("span.tag", { text: "UNAVAILABLE", style: { background: "var(--surface-soft)", color: "var(--ink-3)", flexShrink: "0" } })
        : null
    ),
    h("div", {
      text: action.what,
      style: { fontSize: "var(--t-detail)", color: "var(--ink-2)", lineHeight: "1.45", marginTop: "5px" },
    }),
    h("span", { style: { flex: "1", minHeight: "8px" } }),
    blocked
      ? h("div", { text: blocked, style: { fontSize: "var(--t-micro)", color: "var(--ink-3)", lineHeight: "1.45" } })
      : h("div", { text: "Needs a reason and a second signature", style: { fontSize: "var(--t-micro)", color: "var(--ink-3)" } }),
  ];

  const style = {
    padding: "14px 15px", display: "flex", flexDirection: "column", textAlign: "left",
    font: "inherit", color: "inherit", width: "100%", minWidth: "0", justifyContent: "flex-start",
  };

  if (blocked) {
    return h("div.card", { style: { ...style, opacity: "0.55" } }, body);
  }
  return h(
    "button.card",
    { style: { ...style, cursor: "pointer" }, on: { click: () => onOpen(action) } },
    body
  );
}

/**
 * The tab itself. Two groups, because the two kinds of override have different
 * blast radii: one changes the game for the whole pod, the other changes one
 * person's bet.
 */
export function overrideTab(state, table, pod, dispatch) {
  const primary = pod.tables[0];
  const hand = currentHand(table.id);
  const open = (action) => dispatch({ type: "flyout-open", kind: "override", overrideId: action.id });

  const grid = (group) =>
    h(
      "div",
      {
        style: {
          display: "grid", gridTemplateColumns: "1fr 1fr", gridAutoRows: "1fr",
          gap: "10px", flex: "1", minHeight: "0",
        },
      },
      OVERRIDES.filter((o) => o.group === group).map((o) => actionTile(o, blockedReason(o, table, primary), open))
    );

  return h(
    "div.fade-in",
    { style: { display: "flex", flexDirection: "column", gap: "12px", flex: "1", minHeight: "0", overflow: "hidden" } },
    h(
      "div",
      { style: { flex: "1", minHeight: "0", display: "flex", gap: "14px" } },
      h(
        "div",
        { style: { flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "9px" } },
        sectionHead("This game", `Shoe ${hand.shoe} · game ${hand.game} · affects the whole pod`),
        grid("game")
      ),
      h(
        "div",
        { style: { flex: "1", minWidth: "0", display: "flex", flexDirection: "column", gap: "9px" } },
        sectionHead("Positions", `${playersForTable(state.players, table.id).length} seated on ${table.name}`),
        grid("position")
      )
    )
  );
}
