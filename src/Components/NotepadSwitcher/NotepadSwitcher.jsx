import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./NotepadSwitcher.module.css";
import useNotepadBookmarks from "../../Hooks/useNotepadBookmarks";
import { createNotepad } from "../../Utils/apiClient";

// Bookmarks don't carry a human-readable name (the id in the URL is the only
// identifier), so other notepads are listed by a short id fragment.
const shortId = (id) => id.slice(0, 6);

const NotepadSwitcher = (props) => {
  const { bookmarks, addBookmark } = useNotepadBookmarks();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const others = bookmarks.filter((b) => b.id !== props.currentNotepadId);

  const newNotepad = async () => {
    setCreating(true);
    const notepad = await createNotepad();
    addBookmark(notepad.id);
    setOpen(false);
    setCreating(false);
    navigate(`/${notepad.id}`);
  };

  return (
    <div className={styles.switcher} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-label="Switch notepad"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {"▤"}
      </button>
      {open && (
        <div className={styles.menu}>
          {others.length > 0 && (
            <ul className={styles.list}>
              {others.map((bookmark) => (
                <li key={bookmark.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      navigate(`/${bookmark.id}`);
                    }}
                  >
                    Notepad {shortId(bookmark.id)}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            className={styles.newNotepad}
            disabled={creating}
            onClick={newNotepad}
          >
            + New notepad
          </button>
        </div>
      )}
    </div>
  );
};

export default NotepadSwitcher;
