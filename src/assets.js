/**
 * Asset URLs resolved natively against this module, so they work with no build
 * step and from any base path (local file server, GitHub Pages subfolder).
 */
export const LOGO = new URL("./assets/wdts-logo.png", import.meta.url).href;
export const ICON = new URL("./assets/wdts-icon.png", import.meta.url).href;

/**
 * Wallpapers.
 *
 * Whatever sits behind the glass. Blurred and pushed under a veil, it is there
 * to give a translucent theme somewhere to be rather than a flat panel: a
 * glass card needs something to refract.
 *
 * The lobby is a room, used bright for the light-glass theme and dimmed for
 * the dark one. The suit patterns are flat graphics rather than photographs,
 * so they take far less blur: the point of them is the pattern, where the
 * point of the room is the light.
 *
 * Which one shows is a separate choice from the theme. See WALLPAPERS below.
 */
export const LOBBY = new URL("./assets/lobby.jpg", import.meta.url).href;
export const SUITS_RED = new URL("./assets/suits-red.jpg", import.meta.url).href;
export const SUITS_DARK = new URL("./assets/suits-dark.jpg", import.meta.url).href;

/**
 * The five wallpapers, in the order they appear in the review chrome.
 * `image: null` means there is nothing behind the glass and the theme's own
 * flat ground shows, which is what Square and Simple were built on.
 */
export const WALLPAPERS = [
  { id: "light-lobby", label: "Light lobby", image: LOBBY },
  { id: "dark-lobby", label: "Dark lobby", image: LOBBY },
  { id: "gray", label: "Gray", image: null },
  { id: "red-suits", label: "Red suits", image: SUITS_RED },
  { id: "dark-suits", label: "Dark suits", image: SUITS_DARK },
];

export const wallpaper = (id) => WALLPAPERS.find((w) => w.id === id) || WALLPAPERS[0];

/** What each theme opens on, so the defaults stay coherent. */
export const WALLPAPER_FOR_THEME = {
  glass: "light-lobby",
  dark: "dark-lobby",
  square: "gray",
  simple: "gray",
};
