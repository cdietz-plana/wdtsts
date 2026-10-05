import { h } from "../lib/dom.js";
import { money } from "../lib/format.js";
import { findPlayer, findTable } from "../lib/selectors.js";
import { iconClose, iconNote } from "./icons.js";

/**
 * Everything the product knows about one person, in one sheet.
 *
 * The requirements scatter this across a Player tab, a Session tab, player
 * notes, transactions, bankroll history, marker balances and a conversion from
 * anonymous to rated. They are not six screens. They are six things a
 * supervisor wants while standing next to one person, and every one of them is
 * a reason to open the same record.
 *
 * Three columns rather than one long scroll: value on the left, what happened
 * in the middle, what we wrote down on the right. Nothing here scrolls past
 * its own column.
 *
 * ASSUMED, NOT SPECIFIED: which system owns each of these fields. Tiers,
 * markers, RIM and bankroll almost certainly live outside the table system.
 * The layout holds whichever way that resolves; the data path does not.
 */

const stat = (label, value, color) =>
  h(
    "div",
    { style: { background: "var(--surface-soft)", borderRadius: "var(--r-md)", border: "1px solid var(--line-strong)", padding: "9px 11px" } },
    h("div.micro", { text: label }),
    h("div.mono.display", { text: value, style: { fontSize: "var(--t-title)", fontWeight: "700", color: color || "", marginTop: "1px" } })
  );

const row = (left, right, sub, color) =>
  h(
    "div",
    { style: { display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", padding: "8px 0", borderBottom: "1px solid var(--line)" } },
    h(
      "span",
      { style: { minWidth: "0" } },
      h("span", { text: left, style: { display: "block", fontSize: "var(--t-body)", fontWeight: "600" } }),
      sub ? h("span", { text: sub, style: { display: "block", fontSize: "var(--t-micro)", color: "var(--ink-3)" } }) : null
    ),
    h("span.mono", { text: right, style: { fontSize: "var(--t-body)", fontWeight: "600", color: color || "var(--ink-2)", whiteSpace: "nowrap" } })
  );

const column = (title, body, foot) =>
  h(
    "div.card",
    { style: { flex: "1", minWidth: "0", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" } },
    h("div.micro", { text: title }),
    h("div", { style: { flex: "1", minHeight: "0", overflow: "hidden", display: "flex", flexDirection: "column" } }, body),
    foot || null
  );

export function playerSheet(state, dispatch, onClose) {
  const p = findPlayer(state.players, state.playerId);
  if (!p) return null;
  const table = findTable(state.pods, p.tableId);

  /* --- left: who they are and what they are worth --- */
  const identity = column(
    "Value this gaming day",
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "10px" } },
      h(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "9px" } },
        stat("Theoretical win", money(p.theoWin)),
        stat("Win / loss", money(p.winLoss), p.winLoss < 0 ? "var(--critical)" : "var(--ok)"),
        stat("Handle", money(p.handle)),
        stat("Average bet", money(p.avgBet))
      ),
      h(
        "div",
        { style: { marginTop: "2px" } },
        row("Buy-in today", money(p.buyIn), null, p.buyIn >= 500000 ? "var(--high)" : null),
        row("Marker balance", money(p.markerBalance)),
        row("RIM balance", money(p.rimBalance)),
        row("Front money", money(p.frontMoney)),
        p.bankroll.length
          ? row("Bankroll, yesterday close", p.bankroll.length > 1 ? money(p.bankroll[1].close) : "—")
          : row("Bankroll", "No history")
      )
    ),
    h(
      "div",
      { style: { display: "flex", gap: "8px" } },
      h("button.btn.btn--ghost", {
        text: "Issue marker",
        style: { flex: "1" },
        on: { click: () => dispatch({ type: "toast", message: `Marker request raised for ${p.name}. Pit approval required.` }) },
      }),
      h("button.btn.btn--ghost", {
        text: "Guest service",
        style: { flex: "1" },
        on: { click: () => dispatch({ type: "toast", message: "Host notified. Property specific: comps, reservations and promo chips vary by casino." }) },
      })
    )
  );

  /* --- middle: what actually happened --- */
  const sessions = p.sessions.map((sx) =>
    row(`${sx.table} · ${sx.from} to ${sx.to}`, money(sx.winLoss), `${sx.day} · handle ${money(sx.handle)} · theo ${money(sx.theoWin)}`, sx.winLoss < 0 ? "var(--critical)" : "var(--ok)")
  );
  const transactions = p.transactions.map((t) => row(t.kind, money(t.amount), `${t.at} · ${t.detail}`));

  const activity = column(
    "Sessions and transactions",
    h(
      "div",
      { style: { display: "flex", flexDirection: "column", gap: "12px" } },
      h("div", {}, h("div.micro", { text: "Sessions", style: { marginBottom: "2px" } }), sessions),
      h("div", {}, h("div.micro", { text: "Transactions", style: { marginBottom: "2px" } }), transactions.length ? transactions : h("div", { text: "None today.", style: { fontSize: "var(--t-body)", color: "var(--ink-3)", padding: "8px 0" } }))
    )
  );

  /* --- right: what we wrote down --- */
  const notes = p.notes.length
    ? p.notes.map((n) =>
        h(
          "div",
          { style: { padding: "9px 0", borderBottom: "1px solid var(--line)" } },
          h("div", { text: n.text, style: { fontSize: "var(--t-body)", lineHeight: "1.5" } }),
          h("div", { text: `${n.by} · ${n.at}`, style: { fontSize: "var(--t-micro)", color: "var(--ink-3)", marginTop: "3px" } })
        )
      )
    : h(
        "div",
        { style: { display: "flex", flexDirection: "column", alignItems: "center", gap: "7px", padding: "26px 0", color: "var(--ink-3)" } },
        iconNote(20),
        h("span", { text: "Nothing written down yet.", style: { fontSize: "var(--t-body)" } })
      );

  const composer = h(
    "div",
    { style: { display: "flex", flexDirection: "column", gap: "8px" } },
    h("textarea.field", {
      rows: "2",
      placeholder: "Add a note. It goes on the player record with your ID.",
      value: state.noteDraft,
      on: { input: (e) => dispatch({ type: "note-draft", text: e.target.value }) },
    }),
    h("button.btn.btn--big", {
      text: "Save note",
      disabled: !state.noteDraft.trim() ? "" : null,
      on: { click: () => dispatch({ type: "add-note", playerId: p.id }) },
    })
  );

  const notesCol = column("Notes", notes, composer);

  /* --- header --- */
  const rateAction = p.rated
    ? h("span.tag", { text: `CARD ${p.card}`, style: { background: "var(--surface-soft)", color: "var(--ink-2)" } })
    : h(
        "div",
        { style: { display: "flex", gap: "8px", alignItems: "center" } },
        h("input.field", {
          style: { width: "160px" },
          placeholder: "Card number",
          value: state.cardDraft,
          on: { input: (e) => dispatch({ type: "card-draft", text: e.target.value }) },
        }),
        h("button.btn", {
          text: "Convert to rated",
          disabled: state.cardDraft.trim().length < 4 ? "" : null,
          on: {
            click: () =>
              dispatch({ type: "rate-player", playerId: p.id, card: state.cardDraft.trim(), name: p.name === "Anonymous" ? "New rated player" : p.name }),
          },
        })
      );

  return h(
    // The record slides up from the bottom and back down on the way out, which
    // is why closing goes through a handler rather than straight to the store:
    // the element has to stay mounted for the length of the exit.
    "div.sheet.sheet--rise",
    { role: "dialog", "aria-modal": "true", "aria-label": `${p.name}, player record`, data: { closing: !!state.playerClosing } },
    h(
      "div.sheet__bar",
      {},
      // Close sits at the top left. On a tablet held in two hands the left
      // thumb is already there, and it puts the way out in the same corner as
      // the back control on every other screen.
      h("button.icon-btn", { "aria-label": "Close", on: { click: onClose } }, iconClose()),
      h(
        "div",
        {},
        h(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "9px" } },
          h("div.display", { text: p.name, style: { fontSize: "var(--t-metric)", fontWeight: "700" } }),
          p.rated
            ? h("span.tag", { text: p.tier.toUpperCase(), style: { background: "var(--critical-wash)", color: "var(--brand)" } })
            : h("span.tag", { text: "ANONYMOUS", style: { background: "var(--surface-soft)", color: "var(--ink-3)" } })
        ),
        h("div", { text: `${table ? table.name : ""} · seat ${p.seat}`, style: { fontSize: "var(--t-detail)", color: "var(--ink-3)", marginTop: "2px" } })
      ),
      h("span", { style: { flex: "1" } }),
      rateAction
    ),
    h("div.sheet__body", { style: { display: "flex", gap: "13px" } }, identity, activity, notesCol)
  );
}
