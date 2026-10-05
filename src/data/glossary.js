/**
 * Plain-English glossary, for the design team rather than the supervisor.
 *
 * This is a learning aid bolted onto the prototype, not part of the product.
 * It exists because neither of us is a casino person, and a word like "roll"
 * or "float" or "drop" means something precise here that you cannot guess from
 * ordinary English.
 *
 * Each entry: `short` is what it is, `why` is why it changes the design.
 * Keep `why` honest. If a term does not change a design decision, say so.
 */
export const glossary = [
  /* --- the pod --- */
  { term: "pod", short: "Four baccarat tables wired together: one Primary and three Secondaries. They share one shoe, one 30 second countdown and one gaming day.",
    why: "This is the whole thesis. A pod is one machine, not four tables, which is why holding, rolling or changing cards stops all four at once." },
  { term: "primary", alias: ["PT"], short: "The one table in a pod with a chip tray a dealer can physically reach, and the only one with full authority.",
    why: "Chips and signed slips route through it. A fill requested by a Secondary is delivered to the Primary, so the supervisor has to be standing at the right table." },
  { term: "secondary", alias: ["ST"], short: "The three satellite tables in a pod. Players bet on the Primary's game from their own terminal.",
    why: "A Secondary cannot do everything a Primary can: no Card Buffer, no Void Hand, no Burn Cards. Authority is asymmetric and the UI has to show less on a Secondary." },

  /* --- the game --- */
  { term: "shoe", short: "The box the cards are dealt from, and by extension one run of play through those cards, usually 60 to 80 hands.",
    why: "The pod shares one Shoe ID. When the shoe ends, every table in the pod stops while cards are changed." },
  { term: "cut card", short: "A colored plastic card placed near the back of the shoe. When it comes out, the shoe is finished after the current hand.",
    why: "It is the warning that a pod-wide stop is about to happen, which makes it worth surfacing before it lands rather than after." },
  { term: "burn", alias: ["burn cards", "burned"], short: "Discarding cards without playing them, either at the start of a shoe or after a dealing error.",
    why: "It is a correction with an audit trail, so it belongs to the Override screen and to the Primary only." },
  { term: "void hand", short: "Canceling the hand in progress and starting a new one.",
    why: "One of the most consequential buttons in the product. It needs confirmation and it is a Primary-only action." },

  /* --- money --- */
  { term: "handle", short: "The total amount wagered. Every bet placed, added up, win or lose.",
    why: "It is the measure of how busy a table is, not how profitable. Big handle with no win is a busy table having a bad day." },
  { term: "drop", short: "The money that came across the table: cash and markers exchanged for chips.",
    why: "It is the denominator operators manage to. Win over drop is hold." },
  { term: "hold", short: "Win divided by drop, as a percentage. The share of what came to the table that the house kept.",
    why: "The one number a casino executive asks for first. Baccarat hold is normally in the teens to low twenties." },
  { term: "win", alias: ["win/loss", "w/l", "casino w/l"], short: "What the house actually kept. Negative means the players are ahead.",
    why: "Always stated from the casino's point of view in this system, which is the opposite of how a player would say it." },
  { term: "theoretical win", alias: ["theo", "theo win"], short: "What the house should have won given how much the player wagered and the house edge. Not what actually happened.",
    why: "This is what a player is rated and comped on. A host argues about theo, not about win/loss, so it is the figure the supervisor gets asked for." },
  { term: "average bet", short: "The player's mean wager across the session.",
    why: "Feeds the rating. A manual average bet over a threshold is why a rating needs approval." },

  /* --- the chip tray --- */
  { term: "float", alias: ["chip tray", "tray"], short: "The rack of casino-owned chips at the table. The table's working capital.",
    why: "Everything on the Chips tab is about keeping this reconciled. The supervisor is personally accountable for it." },
  { term: "actual", short: "What the table's chip scan just counted in the tray.",
    why: "Scanned by the table itself, not typed by a person, which is what makes a mismatch worth investigating rather than retyping." },
  { term: "expected", short: "What should be in the tray: opener plus fills, minus credits, minus buy-ins, plus or minus win/loss and any adjustments.",
    why: "When variance is non-zero the supervisor needs to see which term of that sum is wrong, which the current design does not yet show." },
  { term: "variance", short: "Actual minus Expected. Anything other than zero means money is unaccounted for.",
    why: "Not a metric, an accusation. It is why the Adjust flow ends in a second signature." },
  { term: "fill", short: "Chips brought from the cage to top up the tray.",
    why: "Requested at a table, authorized by a supervisor, delivered to the pod's Primary. The physical route and the digital route differ." },
  { term: "credit", short: "The reverse of a fill: surplus chips sent back from the tray to the cage.",
    why: "Same workflow mirrored, and currently missing from the design." },
  { term: "opener", alias: ["closer"], short: "The counted tray inventory at the start of the gaming day, and the count at the end.",
    why: "The opener is the first term in the Expected formula, so a disputed variance often ends up being a disputed opener." },

  /* --- the day --- */
  { term: "gaming day", short: "The casino's accounting day, which does not start at midnight. It rolls at a configured time, often early morning.",
    why: "Every total in the product is scoped to it. Two things on the same calendar date can be in different gaming days." },
  { term: "roll", alias: ["table roll", "roll in", "blocks roll", "blocking the roll"], short: "Closing one gaming day and opening the next. Inventory is counted, totals are banked, the books close.",
    why: "The hard deadline the whole screen is organized around. An alert marked blocks roll must be cleared before the day can close." },

  /* --- people --- */
  { term: "rated", alias: ["rating", "rated player"], short: "A player identified by a loyalty card, so their play is tracked and earns comps.",
    why: "Rated players are the ones the casino makes money planning around, which is why the PRD keeps asking for top player lists." },
  { term: "anonymous", short: "A player with no card attached. Their play is tracked against the seat but not against a person.",
    why: "Converting anonymous to rated mid-session is a real workflow, and it rewrites that player's earlier transactions." },
  { term: "manual rating", short: "A rating a supervisor types in by hand, usually because the automatic one missed or the player sat down late.",
    why: "Over a threshold it needs a second person to approve, which is one of the authorization moments in the prototype." },
  { term: "buy-in", alias: ["buy in"], short: "Cash or a marker exchanged for chips at the table.",
    why: "Cumulative buy-in is the AML trigger, so it is tracked per player per gaming day rather than per transaction." },
  { term: "marker", short: "Casino credit issued to a player at the table. An IOU, counted as drop.",
    why: "Issuing one needs pit approval, and an outstanding balance changes what a supervisor may settle." },
  { term: "RIM", short: "Rim credit. A running credit line a player draws against during play without signing a marker each time.",
    why: "Carries over between gaming days where a marker balance does not, which is why they are two separate figures." },
  { term: "front money", short: "Money a player has deposited with the casino in advance and draws against at the table.",
    why: "Looks like a buy-in to the table but is not new money arriving, so it is counted differently." },
  { term: "pit", alias: ["pit manager"], short: "The supervisor's supervisor, and the physical area they oversee.",
    why: "The approver of last resort. Several actions in the product escalate here rather than resolving at the table." },
  { term: "dealer", short: "The person running the game.",
    why: "Logs in separately from the supervisor, and the login is blocked mid-transaction." },

  /* --- compliance and systems --- */
  { term: "AML", short: "Anti-money laundering. The rules requiring a casino to record and report large or structured cash activity.",
    why: "Not a preference. The buy-in threshold is set by regulation, which is why that one rule is not editable from the tablet." },
  { term: "DICJ", short: "Macau's gaming regulator.",
    why: "Anything touching game outcomes or money movement has to be auditable to their standard, which is why Override is the most sensitive screen." },
  { term: "CMS", short: "Casino Management System. The system of record for players, ratings, comps and credit.",
    why: "Most of the player data in these screens is owned by CMS, not by the table system. When it is disconnected, ratings go Pending." },
  { term: "Perfect Pay", short: "WDTS's smart table platform: RFID chips, antennas under the felt, and automatic reading of every bet and payout.",
    why: "It is why this product can exist. The supervisor no longer counts chips by eye, so the job became exception handling." },
  { term: "antenna", alias: ["dealer antenna", "bet spot"], short: "The RFID readers under the table that detect which chips are where.",
    why: "Chip validation during a fill happens on the Dealer Antenna specifically, which is a physical constraint on the flow." },
  { term: "pay/take", alias: ["pay or take"], short: "The moment after a result when the dealer pays winning bets and collects losing ones.",
    why: "Several actions are blocked during pay/take, and most chip errors are detected in it." },
  { term: "chip set", short: "A group of chips belonging to one property or denomination scheme.",
    why: "Inventory is counted per chip set, so a tray total without a chip set breakdown cannot be reconciled." },
  { term: "MID", short: "Marketing or member ID attached to a rated session.",
    why: "How play is credited to the right program. Blank by default and editable, which makes it a data-entry moment." },
  { term: "RN", alias: ["refused name"], short: "Refused Name. A player who will not give their identity, recorded with descriptive notes instead.",
    why: "A real category in the data model with its own flag and notes, and absent from the current design." },
];
