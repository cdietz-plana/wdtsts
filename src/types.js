/**
 * Domain types for the Linked Table Games supervisor tablet.
 *
 * Declared as JSDoc so editors type-check the project with no build step and
 * no dependencies. `npm run typecheck` runs the TypeScript compiler over these
 * in checkJs mode.
 */

/** @typedef {"glass"|"square"|"simple"|"studio"|"ledger"|"rouge"|"felt"|"bw"|"dark"} Theme */

/** Which pane carries the weight. Neither pane ever changes side.
 * @typedef {"floor"|"alerts"} Mode */

/** Navigation depth: the whole section, one pod, or one table.
 * @typedef {"section"|"pod"|"table"} Level */

/** Task-shaped tabs. Replaces the six data tabs of the desktop dashboard.
 * @typedef {"live"|"chips"|"players"|"history"|"override"} TableTab */

/** @typedef {"critical"|"high"|"low"} Severity */

/** Not severities: an alert can be low and still stop the gaming day closing.
 * @typedef {"blocks-roll"|"needs-signature"} AlertFlag */

/** @typedef {"dealing"|"playing"|"tray-short"|"fill-open"|"idle"|"offline"} TableStatus */

/**
 * @typedef {object} Table
 * @property {string} id
 * @property {string} name
 * @property {"PT"|"ST"} role  PT is the Primary: the pod's chip door and its only full-authority table.
 * @property {number} seats   Seven a side. Fourteen is a full-size table, both sides.
 * @property {number} seated
 * @property {TableStatus} status
 * @property {number} shoeWinLoss      Casino win/loss for the current shoe.
 * @property {number|null} variance    Actual minus expected. Non-zero means money is unaccounted for.
 * @property {number} actualInventory
 * @property {number} expectedInventory
 * @property {{min: number, max: number}} limits  Table minimum and maximum for this table.
 * @property {number} handle   Everything wagered on this table this gaming day.
 * @property {number} dayWin   What the house kept this gaming day. Negative means the table lost.
 * @property {number} drop     Cash and markers across the table this gaming day.
 * @property {string} opener   Who opened the table and when.
 * @property {string|null} closer  Null while the table is still open.
 */

/**
 * @typedef {object} Pod
 * @property {string} id
 * @property {string} name
 * @property {Table[]} tables  Index 0 is the Primary.
 */

/**
 * @typedef {object} AlertSubject
 * @property {"player"|"dealer"} kind
 * @property {string} name
 * @property {number} [seat]
 */

/**
 * @typedef {"open-table"|"open-players"|"rescan"|"adjust"|"authorize-fill"|"approve-rating"|"dismiss"} ActionIntent
 */

/**
 * @typedef {object} AlertAction
 * @property {string} label
 * @property {boolean} [primary]  Renders filled rather than ghost.
 * @property {ActionIntent} intent
 */

/**
 * @typedef {object} Alert
 * @property {string} id
 * @property {string} podId
 * @property {string} tableId
 * @property {AlertSubject} [subject]
 * @property {Severity} severity
 * @property {AlertFlag[]} flags
 * @property {string} title
 * @property {string} detail
 * @property {number} ageSeconds  Seconds since the alert opened. Ticks while the prototype runs.
 * @property {AlertAction[]} actions
 */

/** @typedef {"adjust"|"fill"|"rating"} FlyoutKind */

export {};

/** A person at a table. Lists of people are filters over one array of these.
 * @typedef {object} Player
 * @property {string} id
 * @property {string} name
 * @property {string} tableId
 * @property {number} seat
 * @property {boolean} rated   False means anonymous: no card, no loyalty record.
 * @property {string|null} tier
 * @property {string|null} card
 * @property {number} buyIn
 * @property {number} handle
 * @property {number} theoWin  Theoretical win. What the loyalty system rates on.
 * @property {number} winLoss  What actually happened. A different number.
 * @property {number} avgBet
 * @property {number} markerBalance
 * @property {number} rimBalance
 * @property {number} frontMoney
 * @property {{at: string, by: string, text: string}[]} notes
 * @property {object[]} sessions
 * @property {object[]} transactions
 * @property {object[]} bankroll
 */

/** One completed game.
 * @typedef {object} Game
 * @property {string} id
 * @property {number} shoe
 * @property {number} game
 * @property {string} at
 * @property {number} banker
 * @property {number} player
 * @property {string} outcome
 * @property {number} handle
 * @property {number} result
 * @property {string|null} corrected  Non-null means a person changed the outcome.
 */
