// The server already bakes the right manifest link into the HTML for
// whatever notepad URL was requested (see static-server.js) — that's what
// matters for iOS Safari's "Add to Home Screen", since it reads the href
// present at page load rather than one changed by JS afterwards. This just
// keeps the link in sync on top of that for same-page SPA navigation
// between notepads (e.g. via the notepad switcher), where no new HTML
// response ever happens.
export function setManifestForNotepad(notepadId) {
  const link = document.querySelector('link[rel="manifest"]');
  if (link) {
    link.setAttribute("href", `/manifest/${notepadId}.json`);
  }
}
