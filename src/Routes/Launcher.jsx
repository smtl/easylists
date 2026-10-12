import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import styles from "../Base.module.css";
import Header from "../UI/Header";
import useNotepadBookmarks from "../Hooks/useNotepadBookmarks";
import { createNotepad } from "../Utils/apiClient";
import { hasLegacyData, migrateLegacyData } from "../Utils/migrateLegacyData";

// Resolves "/" to a notepad: the most recently opened bookmark on this
// device, or — on a first visit — either an import of this browser's
// pre-sharing localStorage data, or a freshly created empty notepad.
const Launcher = () => {
  const { mostRecent, addBookmark } = useNotepadBookmarks();
  const [targetId, setTargetId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (mostRecent) {
      setTargetId(mostRecent.id);
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      setBusy(true);
      try {
        const id = hasLegacyData() ? await migrateLegacyData() : (await createNotepad()).id;
        if (cancelled) return;
        addBookmark(id);
        setTargetId(id);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setBusy(false);
      }
    };

    resolve();
    return () => {
      cancelled = true;
    };
  }, [mostRecent, addBookmark]);

  if (targetId) {
    return <Navigate to={`/${targetId}`} replace />;
  }

  return (
    <div className={styles.desk}>
      <main className={styles.pad}>
        <div className={styles.sheet}>
          <Header>{failed ? "Couldn't connect" : "Setting up your lists"}</Header>
          {failed ? (
            <p className={styles.empty}>
              <button type="button" onClick={() => window.location.reload()}>
                Retry
              </button>
            </p>
          ) : (
            busy && <p className={styles.empty}>One moment…</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default Launcher;
