// Serves the Vite build like `serve -s dist`, but also bakes a per-notepad
// start_url into the manifest link of the HTML response itself. iOS Safari's
// "Add to Home Screen" doesn't reliably pick up a <link rel="manifest">
// href that's changed by JS after the page loads — it reads the href that
// was present in the HTML it fetched. Injecting it server-side, at the
// response for each notepad's own URL, makes it correct from byte one.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname } from "node:path";

const DIST_DIR = join(import.meta.dirname, "dist");
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

async function fileIfExists(path) {
  try {
    const s = await stat(path);
    return s.isFile() ? path : null;
  } catch {
    return null;
  }
}

async function serveFile(res, filePath) {
  const body = await readFile(filePath);
  const type = MIME_TYPES[extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  res.end(body);
}

async function serveManifestForNotepad(res, notepadId) {
  const raw = await readFile(join(DIST_DIR, "manifest.json"), "utf8");
  const manifest = JSON.parse(raw);
  // Icon paths are relative to the manifest's OWN url, which for the static
  // file is "/" (so "favicon.ico" means "/favicon.ico") — but this manifest
  // is served from "/manifest/<id>.json", so they need to be rooted here.
  manifest.icons = manifest.icons.map((icon) => ({ ...icon, src: `/${icon.src}` }));
  manifest.start_url = `/${notepadId}`;
  manifest.scope = "/";
  res.writeHead(200, { "Content-Type": "application/manifest+json" });
  res.end(JSON.stringify(manifest));
}

async function serveIndexForNotepad(res, notepadId) {
  let html = await readFile(join(DIST_DIR, "index.html"), "utf8");
  if (notepadId) {
    html = html.replace(
      '<link rel="manifest" href="/manifest.json" />',
      `<link rel="manifest" href="/manifest/${notepadId}.json" />`
    );
  }
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const segments = url.pathname.split("/").filter(Boolean);

    if (segments.length === 2 && segments[0] === "manifest" && segments[1].endsWith(".json")) {
      const notepadId = segments[1].slice(0, -".json".length);
      await serveManifestForNotepad(res, notepadId);
      return;
    }

    const asFile = await fileIfExists(join(DIST_DIR, url.pathname));
    if (asFile) {
      await serveFile(res, asFile);
      return;
    }

    // SPA routes: "/" (Launcher) or "/:notepadId" (Notepad) — anything else
    // (App.jsx's catch-all) redirects client-side to "/", so no notepad id.
    const notepadId = segments.length === 1 ? segments[0] : null;
    await serveIndexForNotepad(res, notepadId);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
}).listen(PORT, () => {
  console.log(`Serving ${DIST_DIR} on port ${PORT}`);
});
