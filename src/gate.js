/**
 * Access gate.
 *
 * This is a courtesy lock, not security. Anything a browser can check, a
 * browser can be told to skip, and every file in this prototype is served
 * publicly whether or not the gate has been passed. It exists to stop a
 * shared link being opened casually by someone who should not see the work,
 * and to keep the prototype out of search results. It does not protect the
 * contents from anyone who looks.
 *
 * The code itself is not in this file. What is stored is a digest of it, so
 * reading the source does not hand the code over, and so the code can be
 * changed without it ever appearing in the repository history in plain text.
 *
 * To change the code: run the two lines at the bottom of this file in a
 * browser console with the new code, and paste the results in below.
 */

/** SHA-256 of the access code, hex. Used wherever Web Crypto is available. */
const DIGEST = "38599b5a729b7c73a6a9aff253cb63749f52a37718bd17de8d2973b23dd78a82";

/** FNV-1a fallback, for the rare context with no Web Crypto (file:// mostly). */
const FALLBACK = "bac5af09";

const KEY = "ltg.unlocked";

const hex = (buf) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const fnv1a = (s) => {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
};

async function check(code) {
  const value = code.trim();
  if (!value) return false;
  if (globalThis.crypto && crypto.subtle) {
    try {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
      return hex(digest) === DIGEST;
    } catch {
      /* fall through */
    }
  }
  return fnv1a(value) === FALLBACK;
}

const store = {
  get() {
    try {
      return sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(v) {
    try {
      sessionStorage.setItem(KEY, v);
    } catch {
      /* private browsing, just means retyping on the next tab */
    }
  },
};

const gate = document.getElementById("gate");

/** Hand over to the prototype and take the gate out of the document. */
async function boot() {
  if (gate) gate.remove();
  document.body.removeAttribute("data-gated");
  await import("./app.js");
}

function wire() {
  // The repo's index.html sets this on <body> directly. Published as an
  // artifact the skeleton owns <body>, so the gate sets it itself.
  document.body.setAttribute("data-gated", "");

  const form = document.getElementById("gate-form");
  const input = document.getElementById("gate-code");
  const error = document.getElementById("gate-error");

  const clearError = () => {
    error.hidden = true;
    input.removeAttribute("aria-invalid");
  };

  input.addEventListener("input", clearError);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const ok = await check(input.value);
    if (!ok) {
      error.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.select();
      gate.dataset.shake = "1";
      setTimeout(() => delete gate.dataset.shake, 420);
      return;
    }
    store.set(DIGEST);
    boot();
  });

  gate.hidden = false;
  input.focus();
}

if (store.get() === DIGEST) boot();
else wire();

/*
  Changing the access code. In a browser console:

    const c = "YOUR NEW CODE";
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(c))
      .then(b => console.log("DIGEST", Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,"0")).join("")));
    (() => { let h = 0x811c9dc5 >>> 0; for (const ch of c) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; } console.log("FALLBACK", h.toString(16).padStart(8,"0")); })();
*/
