/**
 * Six pods, four tables each: one Primary plus three Secondaries.
 *
 * Every table has seven seat positions a side. A full-size table has fourteen,
 * which is the baccarat maximum, and draws as two rows of seven.
 *
 * Replace this module with a feed from the Linked Table Games API. Nothing
 * else in the app reads table state from anywhere but here.
 *
 * @type {import("../types.js").Pod[]}
 */
export const pods = [
  {
    id: "p1", name: "Pod 1",
    tables: [
      { id: "t1", name: "NB0101", role: "PT", seats: 7, seated: 4, status: "dealing", shoeWinLoss: 213050, variance: 0, actualInventory: 2531300, expectedInventory: 2531300, limits: { min: 5000, max: 500000 }, handle: 41200000, dayWin: 612400, drop: 5480000, opener: "18:00 · Chan, W.", closer: null },
      { id: "t2", name: "NB0101A", role: "ST", seats: 7, seated: 5, status: "playing", shoeWinLoss: -12150, variance: 0, actualInventory: 2534250, expectedInventory: 2534250, limits: { min: 1000, max: 100000 }, handle: 18600000, dayWin: -142900, drop: 2310000, opener: "18:00 · Ho, K.", closer: null },
      { id: "t3", name: "NB0101B", role: "ST", seats: 7, seated: 2, status: "tray-short", shoeWinLoss: 114500, variance: -1000, actualInventory: 2531300, expectedInventory: 2532300, limits: { min: 1000, max: 100000 }, handle: 15400000, dayWin: 288100, drop: 1980000, opener: "18:00 · Lei, S.", closer: null },
      { id: "t4", name: "NB0101C", role: "ST", seats: 7, seated: 0, status: "offline", shoeWinLoss: 0, variance: null, actualInventory: 2448900, expectedInventory: 2448900, limits: { min: 1000, max: 100000 }, handle: 9200000, dayWin: 0, drop: 1140000, opener: "18:00 · Ip, M.", closer: "18:18 · system" },
    ],
  },
  {
    id: "p2", name: "Pod 2",
    tables: [
      { id: "t5", name: "NB0102", role: "PT", seats: 14, seated: 9, status: "dealing", shoeWinLoss: 98200, variance: 0, actualInventory: 3120000, expectedInventory: 3120000, limits: { min: 10000, max: 1000000 }, handle: 88500000, dayWin: 1284000, drop: 9720000, opener: "18:00 · Fong, L.", closer: null },
      { id: "t6", name: "NB0102A", role: "ST", seats: 7, seated: 3, status: "playing", shoeWinLoss: 22400, variance: 0, actualInventory: 1880500, expectedInventory: 1880500, limits: { min: 1000, max: 100000 }, handle: 21400000, dayWin: 214800, drop: 2640000, opener: "18:00 · Tam, J.", closer: null },
      { id: "t7", name: "NB0102B", role: "ST", seats: 7, seated: 4, status: "playing", shoeWinLoss: -8600, variance: 0, actualInventory: 1640000, expectedInventory: 1640000, limits: { min: 1000, max: 100000 }, handle: 19800000, dayWin: -96200, drop: 2410000, opener: "18:00 · Wong, A.", closer: null },
      { id: "t8", name: "NB0102C", role: "ST", seats: 7, seated: 2, status: "playing", shoeWinLoss: 5100, variance: 0, actualInventory: 1455000, expectedInventory: 1455000, limits: { min: 1000, max: 100000 }, handle: 12600000, dayWin: 48300, drop: 1560000, opener: "18:00 · Sou, P.", closer: null },
    ],
  },
  {
    id: "p3", name: "Pod 3",
    tables: [
      { id: "t9", name: "NB0103", role: "PT", seats: 7, seated: 3, status: "dealing", shoeWinLoss: 41000, variance: 0, actualInventory: 2740000, expectedInventory: 2740000, limits: { min: 2000, max: 200000 }, handle: 33700000, dayWin: 402600, drop: 4180000, opener: "18:00 · Cheang, R.", closer: null },
      { id: "t10", name: "NB0103A", role: "ST", seats: 7, seated: 2, status: "playing", shoeWinLoss: 11800, variance: 0, actualInventory: 1510000, expectedInventory: 1510000, limits: { min: 1000, max: 100000 }, handle: 16100000, dayWin: 118400, drop: 2020000, opener: "18:00 · Lam, D.", closer: null },
      { id: "t11", name: "NB0103B", role: "ST", seats: 7, seated: 0, status: "idle", shoeWinLoss: 0, variance: 0, actualInventory: 1480000, expectedInventory: 1480000, limits: { min: 1000, max: 100000 }, handle: 0, dayWin: 0, drop: 0, opener: "18:00 · unassigned", closer: null },
      { id: "t12", name: "NB0103C", role: "ST", seats: 7, seated: 3, status: "playing", shoeWinLoss: -3200, variance: 0, actualInventory: 1390000, expectedInventory: 1390000, limits: { min: 1000, max: 100000 }, handle: 14900000, dayWin: -31700, drop: 1870000, opener: "18:00 · Kuok, Y.", closer: null },
    ],
  },
  {
    id: "p4", name: "Pod 4",
    tables: [
      { id: "t13", name: "NB0104", role: "PT", seats: 14, seated: 11, status: "dealing", shoeWinLoss: 176400, variance: 0, actualInventory: 4010000, expectedInventory: 4010000, limits: { min: 10000, max: 1000000 }, handle: 79300000, dayWin: 1642000, drop: 8940000, opener: "18:00 · Leong, C.", closer: null },
      { id: "t14", name: "NB0104A", role: "ST", seats: 7, seated: 4, status: "fill-open", shoeWinLoss: 52000, variance: 0, actualInventory: 1204000, expectedInventory: 1204000, limits: { min: 1000, max: 100000 }, handle: 23500000, dayWin: 508400, drop: 2880000, opener: "18:00 · Pang, H.", closer: null },
      { id: "t15", name: "NB0104B", role: "ST", seats: 7, seated: 2, status: "playing", shoeWinLoss: -9400, variance: 0, actualInventory: 1655000, expectedInventory: 1655000, limits: { min: 1000, max: 100000 }, handle: 17200000, dayWin: -88600, drop: 2150000, opener: "18:00 · Choi, T.", closer: null },
      { id: "t16", name: "NB0104C", role: "ST", seats: 7, seated: 1, status: "playing", shoeWinLoss: 3300, variance: 0, actualInventory: 1490000, expectedInventory: 1490000, limits: { min: 500, max: 50000 }, handle: 10400000, dayWin: 32900, drop: 1290000, opener: "18:00 · Vong, E.", closer: null },
    ],
  },
  {
    id: "p5", name: "Pod 5",
    tables: [
      { id: "t17", name: "NB0105", role: "PT", seats: 7, seated: 7, status: "dealing", shoeWinLoss: 210500, variance: 0, actualInventory: 3860000, expectedInventory: 3860000, limits: { min: 5000, max: 500000 }, handle: 52800000, dayWin: 947300, drop: 6410000, opener: "18:00 · Loi, B.", closer: null },
      { id: "t18", name: "NB0105A", role: "ST", seats: 14, seated: 9, status: "playing", shoeWinLoss: 31000, variance: 0, actualInventory: 1720000, expectedInventory: 1720000, limits: { min: 1000, max: 100000 }, handle: 28900000, dayWin: 311200, drop: 3520000, opener: "18:00 · Si, N.", closer: null },
      { id: "t19", name: "NB0105B", role: "ST", seats: 7, seated: 3, status: "playing", shoeWinLoss: 14200, variance: 0, actualInventory: 1610000, expectedInventory: 1610000, limits: { min: 1000, max: 100000 }, handle: 18300000, dayWin: 142500, drop: 2290000, opener: "18:00 · Ung, F.", closer: null },
      { id: "t20", name: "NB0105C", role: "ST", seats: 7, seated: 5, status: "playing", shoeWinLoss: 27700, variance: 0, actualInventory: 1580000, expectedInventory: 1580000, limits: { min: 1000, max: 100000 }, handle: 20600000, dayWin: 276800, drop: 2540000, opener: "18:00 · Chao, G.", closer: null },
    ],
  },
  {
    id: "p6", name: "Pod 6",
    tables: [
      { id: "t21", name: "NB0106", role: "PT", seats: 7, seated: 3, status: "dealing", shoeWinLoss: 64000, variance: 0, actualInventory: 2980000, expectedInventory: 2980000, limits: { min: 2000, max: 200000 }, handle: 30100000, dayWin: 588000, drop: 3760000, opener: "18:00 · Lao, V.", closer: null },
      { id: "t22", name: "NB0106A", role: "ST", seats: 7, seated: 2, status: "playing", shoeWinLoss: 7700, variance: 0, actualInventory: 1440000, expectedInventory: 1440000, limits: { min: 1000, max: 100000 }, handle: 15700000, dayWin: 74200, drop: 1960000, opener: "18:00 · Ng, S.", closer: null },
      { id: "t23", name: "NB0106B", role: "ST", seats: 7, seated: 1, status: "playing", shoeWinLoss: -2100, variance: 0, actualInventory: 1395000, expectedInventory: 1395000, limits: { min: 500, max: 50000 }, handle: 11800000, dayWin: -21400, drop: 1470000, opener: "18:00 · Tong, W.", closer: null },
      { id: "t24", name: "NB0106C", role: "ST", seats: 7, seated: 3, status: "playing", shoeWinLoss: 9900, variance: 0, actualInventory: 1370000, expectedInventory: 1370000, limits: { min: 1000, max: 100000 }, handle: 16400000, dayWin: 98600, drop: 2040000, opener: "18:00 · Iao, R.", closer: null },
    ],
  },
];

/** Denomination breakdown on the Chips tab. Counts x denominations = actual inventory. */
export const chipTray = [
  { denomination: "100,000", value: 100000, count: 9 },
  { denomination: "50,000", value: 50000, count: 14 },
  { denomination: "10,000", value: 10000, count: 49 },
  { denomination: "5,000", value: 5000, count: 62 },
  { denomination: "1,000", value: 1000, count: 80 },
  { denomination: "500", value: 500, count: 83 },
  { denomination: "100", value: 100, count: 66 },
  { denomination: "50", value: 50, count: 64 },
];
