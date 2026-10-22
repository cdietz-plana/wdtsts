/**
 * The section: individual tables, not pods.
 *
 * Customer priority moved from linked pods to single tables. An Area Manager
 * runs up to 24 of them, and the tablet shows 12 at a time. Every table here
 * has full authority over its own shoe, tray and slips; nothing routes
 * through another table.
 *
 * Replace this module with a feed from the table system. Nothing else in the
 * app reads table state from anywhere but here.
 */
export const tables = [
  { id: "t1", name: "BA0301", role: "PT", seats: 7, seated: 4, status: "playing", variance: 0, actualInventory: 3940000, expectedInventory: 3940000, limits: { min: 5000, max: 500000 }, handle: 49200000, dayWin: 210800, drop: 5010000, dealer: "W. Chan", opener: "18:00", closer: null },
  { id: "t2", name: "BA0302", role: "PT", seats: 7, seated: 5, status: "playing", variance: 0, actualInventory: 2290000, expectedInventory: 2290000, limits: { min: 1000, max: 100000 }, handle: 20500000, dayWin: 167100, drop: 2790000, dealer: "K. Ho", opener: "18:00", closer: null },
  { id: "t3", name: "BA0303", role: "PT", seats: 7, seated: 6, status: "playing", variance: 0, actualInventory: 1660000, expectedInventory: 1660000, limits: { min: 1000, max: 100000 }, handle: 12100000, dayWin: 257300, drop: 1240000, dealer: "S. Lei", opener: "18:00", closer: null },
  { id: "t4", name: "BA0304", role: "PT", seats: 7, seated: 3, status: "playing", variance: 0, actualInventory: 2340000, expectedInventory: 2340000, limits: { min: 2000, max: 200000 }, handle: 78600000, dayWin: 374400, drop: 9630000, dealer: "M. Ip", opener: "18:00", closer: null },
  { id: "t5", name: "BA0305", role: "PT", seats: 14, seated: 9, status: "playing", variance: 0, actualInventory: 3230000, expectedInventory: 3230000, limits: { min: 10000, max: 1000000 }, handle: 88900000, dayWin: 558400, drop: 10940000, dealer: "L. Fong", opener: "18:00", closer: null },
  { id: "t6", name: "BA0306", role: "PT", seats: 7, seated: 3, status: "playing", variance: 0, actualInventory: 2680000, expectedInventory: 2680000, limits: { min: 1000, max: 100000 }, handle: 14300000, dayWin: 130700, drop: 1920000, dealer: "J. Tam", opener: "18:00", closer: null },
  { id: "t7", name: "BA0307", role: "PT", seats: 7, seated: 0, status: "offline", variance: null, actualInventory: 4060000, expectedInventory: 4060000, limits: { min: 1000, max: 100000 }, handle: 61200000, dayWin: -327500, drop: 7510000, dealer: "A. Wong", opener: "18:00", closer: null },
  { id: "t8", name: "BA0308", role: "PT", seats: 7, seated: 2, status: "playing", variance: 0, actualInventory: 3100000, expectedInventory: 3100000, limits: { min: 1000, max: 100000 }, handle: 31100000, dayWin: 199900, drop: 3900000, dealer: "P. Sou", opener: "18:00", closer: null },
  { id: "t9", name: "BA0309", role: "PT", seats: 7, seated: 4, status: "playing", variance: 0, actualInventory: 2250000, expectedInventory: 2250000, limits: { min: 2000, max: 200000 }, handle: 20800000, dayWin: 222000, drop: 2540000, dealer: "R. Cheang", opener: "18:00", closer: null },
  { id: "t10", name: "BA0310", role: "PT", seats: 7, seated: 5, status: "playing", variance: 0, actualInventory: 4190000, expectedInventory: 4190000, limits: { min: 1000, max: 100000 }, handle: 71800000, dayWin: 1188000, drop: 8080000, dealer: "D. Lam", opener: "18:00", closer: null },
  { id: "t11", name: "BA0311", role: "PT", seats: 7, seated: 4, status: "playing", variance: 0, actualInventory: 2440000, expectedInventory: 2440000, limits: { min: 1000, max: 100000 }, handle: 66500000, dayWin: -572600, drop: 8760000, dealer: "T. Kuok", opener: "18:00", closer: null },
  { id: "t12", name: "BA0312", role: "PT", seats: 7, seated: 3, status: "shuffler-fault", variance: 0, actualInventory: 2950000, expectedInventory: 2950000, limits: { min: 500, max: 50000 }, handle: 18900000, dayWin: -20300, drop: 2260000, dealer: "Y. Kuok", opener: "18:00", closer: null },
  { id: "t13", name: "BA0313", role: "PT", seats: 14, seated: 11, status: "playing", variance: 0, actualInventory: 3820000, expectedInventory: 3820000, limits: { min: 10000, max: 1000000 }, handle: 65400000, dayWin: -571300, drop: 6730000, dealer: "C. Leong", opener: "18:00", closer: null },
  { id: "t14", name: "BA0314", role: "PT", seats: 7, seated: 4, status: "playing", variance: 0, actualInventory: 3700000, expectedInventory: 3700000, limits: { min: 1000, max: 100000 }, handle: 61200000, dayWin: 1049400, drop: 6490000, dealer: "H. Ng", opener: "18:00", closer: null },
  { id: "t15", name: "BA0315", role: "PT", seats: 7, seated: 2, status: "fill-pending", variance: 0, actualInventory: 4050000, expectedInventory: 4050000, limits: { min: 1000, max: 100000 }, handle: 61000000, dayWin: 790700, drop: 6280000, dealer: "T. Choi", opener: "18:00", closer: null },
  { id: "t16", name: "BA0316", role: "PT", seats: 7, seated: 1, status: "playing", variance: 0, actualInventory: 3740000, expectedInventory: 3740000, limits: { min: 500, max: 50000 }, handle: 81500000, dayWin: -855100, drop: 9290000, dealer: "E. Vong", opener: "18:00", closer: null },
  { id: "t17", name: "BA0317", role: "PT", seats: 7, seated: 7, status: "playing", variance: 0, actualInventory: 2580000, expectedInventory: 2580000, limits: { min: 5000, max: 500000 }, handle: 82700000, dayWin: 1931700, drop: 8570000, dealer: "B. Loi", opener: "18:00", closer: null },
  { id: "t18", name: "BA0318", role: "PT", seats: 14, seated: 9, status: "playing", variance: 0, actualInventory: 4150000, expectedInventory: 4150000, limits: { min: 1000, max: 100000 }, handle: 68100000, dayWin: 1548000, drop: 8720000, dealer: "N. Si", opener: "18:00", closer: null },
  { id: "t19", name: "BA0319", role: "PT", seats: 7, seated: 3, status: "playing", variance: 0, actualInventory: 2970000, expectedInventory: 2970000, limits: { min: 1000, max: 100000 }, handle: 65400000, dayWin: 754700, drop: 8860000, dealer: "F. Ung", opener: "18:00", closer: null },
  { id: "t20", name: "BA0320", role: "PT", seats: 7, seated: 5, status: "playing", variance: 0, actualInventory: 3720000, expectedInventory: 3720000, limits: { min: 1000, max: 100000 }, handle: 10700000, dayWin: 108700, drop: 1330000, dealer: "G. Chao", opener: "18:00", closer: null },
  { id: "t21", name: "BA0321", role: "PT", seats: 7, seated: 3, status: "tray-short", variance: -1000, actualInventory: 2460000, expectedInventory: 2461000, limits: { min: 2000, max: 200000 }, handle: 15300000, dayWin: -96800, drop: 1600000, dealer: "V. Lao", opener: "18:00", closer: null },
  { id: "t22", name: "BA0322", role: "PT", seats: 7, seated: 2, status: "playing", variance: 0, actualInventory: 2050000, expectedInventory: 2050000, limits: { min: 1000, max: 100000 }, handle: 58600000, dayWin: -671500, drop: 7020000, dealer: "S. Ng", opener: "18:00", closer: null },
  { id: "t23", name: "BA0323", role: "PT", seats: 7, seated: 0, status: "closed", variance: 0, actualInventory: 3490000, expectedInventory: 3490000, limits: { min: 500, max: 50000 }, handle: 0, dayWin: 0, drop: 0, dealer: null, opener: "18:00", closer: null },
  { id: "t24", name: "BA0324", role: "PT", seats: 7, seated: 3, status: "playing", variance: 0, actualInventory: 3400000, expectedInventory: 3400000, limits: { min: 1000, max: 100000 }, handle: 59800000, dayWin: 419800, drop: 6300000, dealer: "R. Iao", opener: "18:00", closer: null },
];

/**
 * The rest of a large section, so pagination can be tried at the scale it has
 * to survive: up to 200 tables. Deterministic, so the same table always reads
 * the same way.
 */
const DEALERS = ["A. Chan", "B. Ho", "C. Lei", "D. Ip", "E. Fong", "F. Tam", "G. Wong", "H. Sou", "I. Lam", "J. Kuok", "K. Leong", "L. Ng"];
const LIMITS = [{ min: 1000, max: 100000 }, { min: 2000, max: 200000 }, { min: 5000, max: 500000 }, { min: 500, max: 50000 }];
for (let i = tables.length + 1; i <= 200; i += 1) {
  const r = (n) => (i * 2654435761 + n * 40503) % 1000 / 1000;
  const handle = Math.round((8 + r(1) * 80) * 10) * 100000;
  const seats = r(2) > 0.85 ? 14 : 7;
  tables.push({
    id: `t${i}`, name: `BA${String(300 + i).padStart(4, "0")}`, role: "PT", seats,
    seated: Math.floor(r(3) * (seats === 14 ? 12 : 7)),
    status: r(4) > 0.96 ? "shuffling" : "playing",
    variance: 0, actualInventory: 1200000 + Math.round(r(5) * 30) * 100000, expectedInventory: 0,
    limits: LIMITS[i % LIMITS.length], handle,
    dayWin: Math.round(handle * (r(6) * 0.036 - 0.012) / 100) * 100,
    drop: Math.round(handle * (0.1 + r(7) * 0.04) / 10000) * 10000,
    dealer: DEALERS[i % DEALERS.length], opener: "18:00", closer: null,
  });
  tables[tables.length - 1].expectedInventory = tables[tables.length - 1].actualInventory;
}

/** Denomination breakdown on the Chips tab. */
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
