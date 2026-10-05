/**
 * Asset URLs resolved natively against this module, so they work with no build
 * step and from any base path (local file server, GitHub Pages subfolder).
 */
export const LOGO = new URL("./assets/wdts-logo.png", import.meta.url).href;
export const ICON = new URL("./assets/wdts-icon.png", import.meta.url).href;

/**
 * The room behind the glass. Blurred past recognition and pushed under a
 * crimson-to-black veil, it is there to give the dark theme somewhere to be
 * rather than a flat panel: the glass cards need something to refract.
 * Dark theme only; the ambient layer is transparent in light.
 */
export const LOBBY = new URL("./assets/lobby.jpg", import.meta.url).href;
