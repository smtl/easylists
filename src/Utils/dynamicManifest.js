let currentManifestUrl = null;

// iOS Safari's "Add to Home Screen" uses the Web App Manifest's start_url
// rather than whatever page you were actually on — so with one static
// manifest.json shared by every notepad, every installed icon opened the
// same fixed URL regardless of which notepad you installed it from. Fixes
// it by swapping in a manifest generated for the current notepad: same
// icons/theme as the static one, but start_url pointing at this exact
// notepad, served as a blob URL so iOS picks it up at install time.
export function setManifestForNotepad(notepadId) {
  const origin = window.location.origin;
  const manifest = {
    short_name: "EasyLists",
    name: "EasyLists.app",
    icons: [
      { src: `${origin}/favicon.ico`, sizes: "64x64 32x32 24x24 16x16", type: "image/x-icon" },
      { src: `${origin}/logo192.png`, type: "image/png", sizes: "192x192", purpose: "any" },
      { src: `${origin}/logo512.png`, type: "image/png", sizes: "512x512", purpose: "any" },
      {
        src: `${origin}/logo512-maskable.png`,
        type: "image/png",
        sizes: "512x512",
        purpose: "maskable",
      },
    ],
    start_url: `/${notepadId}`,
    scope: "/",
    display: "standalone",
    theme_color: "#7a2e2a",
    background_color: "#fdf5b5",
  };

  const blobUrl = URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" })
  );

  const link = document.querySelector('link[rel="manifest"]');
  if (link) {
    link.setAttribute("href", blobUrl);
  }

  if (currentManifestUrl) {
    URL.revokeObjectURL(currentManifestUrl);
  }
  currentManifestUrl = blobUrl;
}
