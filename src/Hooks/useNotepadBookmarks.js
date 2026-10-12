import { useCallback } from "react";
import useStickyState from "./StickyStateHook";

// A per-device list of notepad ids this browser has opened — the source of
// truth for data lives on the server now; this is just "which notepads do I
// know about" so a switcher (and the root launcher) has something to show.
export default function useNotepadBookmarks() {
  const [bookmarks, setBookmarks] = useStickyState([], "notepad_bookmarks");

  const touchBookmark = useCallback(
    (id) => {
      setBookmarks((prev) => {
        const now = Date.now();
        if (!prev.some((b) => b.id === id)) {
          return [...prev, { id, lastOpenedAt: now }];
        }
        return prev.map((b) => (b.id === id ? { ...b, lastOpenedAt: now } : b));
      });
    },
    [setBookmarks]
  );

  const removeBookmark = useCallback(
    (id) => {
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    },
    [setBookmarks]
  );

  const mostRecent =
    bookmarks.length > 0
      ? [...bookmarks].sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)[0]
      : null;

  return { bookmarks, addBookmark: touchBookmark, touchBookmark, removeBookmark, mostRecent };
}
