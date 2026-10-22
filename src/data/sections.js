/**
 * Sections: named collections of tables, each run by one manager.
 *
 * Sections change during a shift ("can you take these two tables?"), so a
 * table belongs to at most one section and moving it is a normal action,
 * not an admin job. Tables in no section are Unassigned.
 *
 * `zone` places the section on the floor map, in map units (0 to 100 across,
 * 0 to 100 down). Real positions would come from the property's floor plan.
 *
 * ASSUMED: names, managers and the floor layout are invented.
 */
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => `t${a + i}`);

export const initialSections = [
  { id: "s1", name: "North Baccarat", manager: "Ana Lopes", tableIds: range(1, 24), hue: 352, zone: { x: 3, y: 4, w: 30, h: 44 } },
  { id: "s2", name: "South Baccarat", manager: "M. Ieong", tableIds: range(25, 48), hue: 214, zone: { x: 3, y: 52, w: 30, h: 44 } },
  { id: "s3", name: "VIP Salon", manager: "R. Wong", tableIds: range(49, 60), hue: 42, zone: { x: 36, y: 4, w: 20, h: 26 } },
  { id: "s4", name: "Main Floor East", manager: "K. Chan", tableIds: range(61, 140), hue: 160, zone: { x: 59, y: 4, w: 38, h: 60 } },
  { id: "s5", name: "Main Floor West", manager: "L. Sou", tableIds: range(141, 180), hue: 275, zone: { x: 36, y: 34, w: 20, h: 62 } },
];

/** Where the unassigned tables sit on the map. */
export const UNASSIGNED_ZONE = { x: 59, y: 68, w: 38, h: 28 };

/** The section the signed-in manager starts in. */
export const HOME_SECTION = "s1";
