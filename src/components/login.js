import { h } from "../lib/dom.js";
import { iconCard, iconTick } from "./icons.js";
import { LOGO } from "../assets.js";

/**
 * Sign-in. Two paths, because the requirements ask for both: tap a card, or
 * type an ID. The card is the primary target at 200px because that is what
 * actually happens at shift change — a badge against a reader, one-handed.
 *
 * Nothing here authenticates. It exists so the prototype starts where the
 * shift starts, and so the login moment gets designed rather than assumed.
 */
export function loginScreen(state, dispatch) {
  const id = state.login.id;
  const ready = id.length >= 4;

  const submit = () => dispatch({ type: "sign-in" });

  return h(
    "div.login",
    {},
    h("div.login__plate", {}, h("img.login__logo", { src: LOGO, alt: "Walker Digital Table Systems" })),

    h(
      "div.login__card.card",
      {},
      h("div.display.login__product", { text: "Mobile Manager" }),
      h("div.login__sub", { text: "Table Games Supervisor · North Baccarat" }),

      h(
        "button.login__tap",
        { on: { click: submit } },
        h("span.login__tapicon", {}, iconCard(26)),
        h(
          "span",
          {},
          h("span.login__taptitle", { text: "Tap your card" }),
          h("span.login__taphint", { text: "Hold it against the reader on the back of the tablet" })
        )
      ),

      h("div.login__or", {}, h("span", {}), h("span", { text: "or sign in with an ID" }), h("span", {})),

      h(
        "div.login__field",
        {},
        h(
          "div",
          { style: { flex: "1" } },
          h("div.micro", { text: "Supervisor ID" }),
          h("div.mono.login__value", {
            text: id ? id : "Enter your ID",
            style: { color: id ? "var(--ink)" : "var(--ink-3)", letterSpacing: id ? "0.2em" : "0" },
          })
        ),
        ready ? h("span", { style: { color: "var(--ok)", display: "flex" } }, iconTick()) : null
      ),

      h(
        "div.login__pad",
        {},
        ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "go"].map((k) => {
          if (k === "go") {
            return h("button.key.login__go", { text: "Sign in", disabled: !ready, on: { click: submit } });
          }
          return h("button.key", {
            text: k === "clear" ? "Clear" : k,
            style: k === "clear" ? { fontSize: "var(--t-body)", opacity: "0.6" } : {},
            on: {
              click: () =>
                dispatch({
                  type: "login-id",
                  id: k === "clear" ? "" : id.length < 6 ? id + k : id,
                }),
            },
          });
        })
      ),

      h("div.login__note", { text: "Prototype. Any ID of four digits or more signs you in." })
    )
  );
}
