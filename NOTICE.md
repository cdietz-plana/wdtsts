# Confidentiality

This repository contains design work produced for **Walker Digital Table
Systems (WDTS)** in connection with the Linked Table Games Mobile Manager
programme, and includes WDTS trade marks and brand assets.

- It is **not** open source. No licence is granted.
- The source documents behind it are marked *Proprietary and confidential*.
- `src/assets/` contains WDTS logo files, used here with the client's knowledge
  for the purpose of this engagement only.

## The access gate

`index.html` puts an access code in front of the prototype. **This is a courtesy
lock, not security.** The site is static, so every file is served whether or not
the gate has been passed, and anything a browser checks a browser can be told to
skip. It exists to stop a shared link being opened casually, and a `noindex`
tag keeps the prototype out of search results.

The code is not stored in the repository. `src/gate.js` holds a SHA-256 digest
of it, with the instructions for changing it in a comment at the bottom of that
file. Share the code separately from the link.

**Use a private repository.** If you enable GitHub Pages, check whether your
plan serves Pages privately — on most plans a Pages site is publicly reachable
even when the repository itself is private.

Nothing in this prototype is production code, and none of the figures in it are
real operating data. Every number is invented for demonstration.
