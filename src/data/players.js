/**
 * People, not seats. A player belongs to a table and a seat while they are
 * sitting, which is why every list in the product (top players in the section,
 * top players in a pod, the seats on a table) is derived from this one array
 * rather than stored three times.
 *
 * `theoWin` is theoretical win: handle multiplied by the house edge and the
 * hands played. It is what the loyalty system rates a player on, and it is the
 * figure a host argues about, so it is the one the supervisor is asked for.
 * `winLoss` is what actually happened, which is a different number and often a
 * very different one.
 *
 * ASSUMED, NOT SPECIFIED: tiers, marker and RIM balances, front money and
 * bankroll history all live in the loyalty and casino management systems, not
 * in the table system. They are modelled here so the screens can be designed.
 * Which system serves each field is an open integration question.
 *
 * @type {import("../types.js").Player[]}
 */
export const players = [
  {
    id: "pl1", name: "L. Fong", tableId: "t1", seat: 1, rated: true, tier: "Diamond", card: "8841 2207",
    buyIn: 168000, handle: 4820000, theoWin: 57800, winLoss: -92400, avgBet: 32000,
    markerBalance: 0, rimBalance: 0, frontMoney: 500000,
    notes: [{ at: "17:42", by: "You", text: "Host aware, playing to a flight at 23:00. Wants the seat held if he steps out." }],
    sessions: [
      { day: "Today", table: "NB0101", from: "18:02", to: "open", handle: 4820000, theoWin: 57800, winLoss: -92400 },
      { day: "Yesterday", table: "NB0104", from: "19:10", to: "23:48", handle: 6240000, theoWin: 74900, winLoss: 318000 },
    ],
    transactions: [
      { at: "18:04", kind: "Buy-in", detail: "Cash", amount: 100000 },
      { at: "18:31", kind: "Buy-in", detail: "Front money draw", amount: 68000 },
    ],
    bankroll: [{ day: "Today", open: 500000, close: null }, { day: "Yesterday", open: 500000, close: 818000 }],
  },
  {
    id: "pl2", name: "Anonymous", tableId: "t1", seat: 2, rated: false, tier: null, card: null,
    buyIn: 24000, handle: 410000, theoWin: 4900, winLoss: 12600, avgBet: 5000,
    markerBalance: 0, rimBalance: 0, frontMoney: 0,
    notes: [], sessions: [{ day: "Today", table: "NB0101", from: "18:22", to: "open", handle: 410000, theoWin: 4900, winLoss: 12600 }],
    transactions: [{ at: "18:22", kind: "Buy-in", detail: "Cash", amount: 24000 }],
    bankroll: [],
  },
  {
    id: "pl3", name: "K. Leung", tableId: "t3", seat: 4, rated: true, tier: "Platinum", card: "8840 9912",
    buyIn: 512000, handle: 7310000, theoWin: 87700, winLoss: 224000, avgBet: 48000,
    markerBalance: 200000, rimBalance: 0, frontMoney: 0,
    notes: [{ at: "18:33", by: "System", text: "Cumulative buy-in passed 500,000. AML entry required before the next buy-in." }],
    sessions: [{ day: "Today", table: "NB0101B", from: "17:55", to: "open", handle: 7310000, theoWin: 87700, winLoss: 224000 }],
    transactions: [
      { at: "17:58", kind: "Buy-in", detail: "Cash", amount: 300000 },
      { at: "18:29", kind: "Marker", detail: "Issued, approved by pit", amount: 200000 },
      { at: "18:33", kind: "Buy-in", detail: "Marker draw", amount: 212000 },
    ],
    bankroll: [{ day: "Today", open: 0, close: null }],
  },
  {
    id: "pl4", name: "W. Chan", tableId: "t5", seat: 3, rated: true, tier: "Diamond", card: "8842 4418",
    buyIn: 880000, handle: 12400000, theoWin: 148800, winLoss: -410000, avgBet: 85000,
    markerBalance: 500000, rimBalance: 1000000, frontMoney: 0,
    notes: [{ at: "18:07", by: "You", text: "Rating submitted manually by Dealer 0631, over threshold. Pending approval." }],
    sessions: [
      { day: "Today", table: "NB0102", from: "17:30", to: "open", handle: 12400000, theoWin: 148800, winLoss: -410000 },
      { day: "Yesterday", table: "NB0102", from: "20:05", to: "01:12", handle: 15900000, theoWin: 190800, winLoss: -246000 },
    ],
    transactions: [
      { at: "17:32", kind: "Buy-in", detail: "RIM draw", amount: 500000 },
      { at: "18:12", kind: "Marker", detail: "Issued, approved by pit", amount: 500000 },
      { at: "18:14", kind: "Buy-in", detail: "Marker draw", amount: 380000 },
    ],
    bankroll: [{ day: "Today", open: 1000000, close: null }, { day: "Yesterday", open: 1000000, close: 754000 }],
  },
  {
    id: "pl5", name: "S. Ieong", tableId: "t5", seat: 6, rated: true, tier: "Gold", card: "8839 1140",
    buyIn: 120000, handle: 2180000, theoWin: 26200, winLoss: 64000, avgBet: 18000,
    markerBalance: 0, rimBalance: 0, frontMoney: 0,
    notes: [], sessions: [{ day: "Today", table: "NB0102", from: "18:14", to: "open", handle: 2180000, theoWin: 26200, winLoss: 64000 }],
    transactions: [{ at: "18:14", kind: "Buy-in", detail: "Cash", amount: 120000 }],
    bankroll: [],
  },
  {
    id: "pl6", name: "Anonymous", tableId: "t5", seat: 9, rated: false, tier: null, card: null,
    buyIn: 60000, handle: 740000, theoWin: 8900, winLoss: -18000, avgBet: 8000,
    markerBalance: 0, rimBalance: 0, frontMoney: 0,
    notes: [{ at: "18:40", by: "You", text: "Asked about rating. Offer card on the next shoe change." }],
    sessions: [{ day: "Today", table: "NB0102", from: "18:36", to: "open", handle: 740000, theoWin: 8900, winLoss: -18000 }],
    transactions: [{ at: "18:36", kind: "Buy-in", detail: "Cash", amount: 60000 }],
    bankroll: [],
  },
  {
    id: "pl7", name: "H. Pang", tableId: "t13", seat: 2, rated: true, tier: "Diamond", card: "8843 7781",
    buyIn: 1200000, handle: 18600000, theoWin: 223200, winLoss: 862000, avgBet: 120000,
    markerBalance: 1000000, rimBalance: 2000000, frontMoney: 0,
    notes: [{ at: "16:20", by: "Pit", text: "Two comps outstanding, host contacted. Do not settle marker without the host." }],
    sessions: [
      { day: "Today", table: "NB0104", from: "16:40", to: "open", handle: 18600000, theoWin: 223200, winLoss: 862000 },
      { day: "Yesterday", table: "NB0104", from: "18:00", to: "02:30", handle: 22100000, theoWin: 265200, winLoss: -1140000 },
    ],
    transactions: [
      { at: "16:42", kind: "Buy-in", detail: "RIM draw", amount: 1000000 },
      { at: "17:55", kind: "Marker", detail: "Issued, approved by pit", amount: 1000000 },
      { at: "17:56", kind: "Buy-in", detail: "Marker draw", amount: 200000 },
    ],
    bankroll: [{ day: "Today", open: 2000000, close: null }, { day: "Yesterday", open: 2000000, close: 860000 }],
  },
  {
    id: "pl8", name: "M. Sou", tableId: "t13", seat: 7, rated: true, tier: "Platinum", card: "8841 6630",
    buyIn: 420000, handle: 6900000, theoWin: 82800, winLoss: -174000, avgBet: 44000,
    markerBalance: 0, rimBalance: 0, frontMoney: 300000,
    notes: [], sessions: [{ day: "Today", table: "NB0104", from: "17:20", to: "open", handle: 6900000, theoWin: 82800, winLoss: -174000 }],
    transactions: [{ at: "17:21", kind: "Buy-in", detail: "Front money draw", amount: 420000 }],
    bankroll: [{ day: "Today", open: 300000, close: null }],
  },
  {
    id: "pl9", name: "C. Iao", tableId: "t14", seat: 1, rated: true, tier: "Gold", card: "8838 2204",
    buyIn: 96000, handle: 1540000, theoWin: 18500, winLoss: 41000, avgBet: 14000,
    markerBalance: 0, rimBalance: 0, frontMoney: 0,
    notes: [], sessions: [{ day: "Today", table: "NB0104A", from: "18:08", to: "open", handle: 1540000, theoWin: 18500, winLoss: 41000 }],
    transactions: [{ at: "18:08", kind: "Buy-in", detail: "Cash", amount: 96000 }],
    bankroll: [],
  },
  {
    id: "pl10", name: "B. Loi", tableId: "t17", seat: 4, rated: true, tier: "Platinum", card: "8842 9083",
    buyIn: 640000, handle: 9200000, theoWin: 110400, winLoss: 318000, avgBet: 60000,
    markerBalance: 300000, rimBalance: 0, frontMoney: 0,
    notes: [], sessions: [{ day: "Today", table: "NB0105", from: "17:05", to: "open", handle: 9200000, theoWin: 110400, winLoss: 318000 }],
    transactions: [
      { at: "17:06", kind: "Buy-in", detail: "Cash", amount: 340000 },
      { at: "18:02", kind: "Marker", detail: "Issued, approved by pit", amount: 300000 },
    ],
    bankroll: [{ day: "Today", open: 0, close: null }],
  },
  {
    id: "pl11", name: "N. Si", tableId: "t18", seat: 5, rated: true, tier: "Gold", card: "8840 3357",
    buyIn: 150000, handle: 2640000, theoWin: 31700, winLoss: -58000, avgBet: 20000,
    markerBalance: 0, rimBalance: 0, frontMoney: 0,
    notes: [], sessions: [{ day: "Today", table: "NB0105A", from: "18:18", to: "open", handle: 2640000, theoWin: 31700, winLoss: -58000 }],
    transactions: [{ at: "18:18", kind: "Buy-in", detail: "Cash", amount: 150000 }],
    bankroll: [],
  },
  {
    id: "pl12", name: "V. Lao", tableId: "t21", seat: 3, rated: true, tier: "Gold", card: "8839 8812",
    buyIn: 210000, handle: 3480000, theoWin: 41800, winLoss: 96000, avgBet: 24000,
    markerBalance: 0, rimBalance: 0, frontMoney: 0,
    notes: [], sessions: [{ day: "Today", table: "NB0106", from: "17:48", to: "open", handle: 3480000, theoWin: 41800, winLoss: 96000 }],
    transactions: [{ at: "17:48", kind: "Buy-in", detail: "Cash", amount: 210000 }],
    bankroll: [],
  },
  {
    id: "pl13", name: "R. Cheang", tableId: "t9", seat: 2, rated: true, tier: "Platinum", card: "8843 1129",
    buyIn: 380000, handle: 5900000, theoWin: 70800, winLoss: -142000, avgBet: 38000,
    markerBalance: 0, rimBalance: 500000, frontMoney: 0,
    notes: [], sessions: [{ day: "Today", table: "NB0103", from: "17:36", to: "open", handle: 5900000, theoWin: 70800, winLoss: -142000 }],
    transactions: [{ at: "17:37", kind: "Buy-in", detail: "RIM draw", amount: 380000 }],
    bankroll: [{ day: "Today", open: 500000, close: null }],
  },
  {
    id: "pl14", name: "Y. Kuok", tableId: "t12", seat: 1, rated: true, tier: "Gold", card: "8838 7741",
    buyIn: 88000, handle: 1320000, theoWin: 15800, winLoss: 27000, avgBet: 12000,
    markerBalance: 0, rimBalance: 0, frontMoney: 0,
    notes: [], sessions: [{ day: "Today", table: "NB0103C", from: "18:26", to: "open", handle: 1320000, theoWin: 15800, winLoss: 27000 }],
    transactions: [{ at: "18:26", kind: "Buy-in", detail: "Cash", amount: 88000 }],
    bankroll: [],
  },
];

/**
 * Every occupied seat is a person, so the seat dots and the Players tab can
 * never disagree. Named records above are the ones the product has something
 * to say about; the rest of the floor is padded here with anonymous cash
 * players, which is what most seats actually hold.
 *
 * Deterministic, so the same table always shows the same room.
 */
export function withAnonymousFill(pods, named) {
  const out = [...named];
  let n = 0;
  for (const pod of pods) {
    for (const t of pod.tables) {
      const taken = new Set(out.filter((p) => p.tableId === t.id).map((p) => p.seat));
      let have = taken.size;
      let seat = 1;
      while (have < t.seated && seat <= t.seats) {
        if (!taken.has(seat)) {
          n += 1;
          const buyIn = 8000 + ((n * 37) % 22) * 4000;
          const handle = buyIn * (6 + (n % 5));
          out.push({
            id: `an${n}`, name: "Anonymous", tableId: t.id, seat, rated: false, tier: null, card: null,
            buyIn, handle, theoWin: Math.round(handle * 0.012), winLoss: ((n % 2) ? 1 : -1) * ((n * 3100) % 48000),
            avgBet: 2000 + ((n * 11) % 9) * 1000,
            markerBalance: 0, rimBalance: 0, frontMoney: 0,
            notes: [],
            sessions: [{ day: "Today", table: t.name, from: "18:0" + (n % 10), to: "open", handle, theoWin: Math.round(handle * 0.012), winLoss: ((n % 2) ? 1 : -1) * ((n * 3100) % 48000) }],
            transactions: [{ at: "18:0" + (n % 10), kind: "Buy-in", detail: "Cash", amount: buyIn }],
            bankroll: [],
          });
          have += 1;
        }
        seat += 1;
      }
    }
  }
  return out;
}
