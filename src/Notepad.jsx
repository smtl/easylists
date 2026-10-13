import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import TodoList from "./Components/Todos/TodoList";
import ProjectList from "./Components/Projects/ProjectList";
import NotepadSwitcher from "./Components/NotepadSwitcher/NotepadSwitcher";
import Header from "./UI/Header";
import styles from "./Base.module.css";
import useStickyState from "./Hooks/StickyStateHook";
import useNotepad from "./Hooks/useNotepad";
import useNotepadBookmarks from "./Hooks/useNotepadBookmarks";
import SettingsContainer from "./Components/Settings/SettingsContainer";
import { createNotepad } from "./Utils/apiClient";
import { setManifestForNotepad } from "./Utils/dynamicManifest";

const Notepad = () => {
  const { notepadId } = useParams();
  const { touchBookmark } = useNotepadBookmarks();
  const {
    lists,
    todos,
    loading,
    notFound,
    error,
    addList,
    deleteList,
    addTodo,
    toggleTodo,
    deleteTodo,
    resetList,
  } = useNotepad(notepadId);

  const [savedActiveListId, setActiveListId] = useStickyState(
    null,
    `active_list_${notepadId}`
  );
  const [settingsActive, setSettingsActive] = useState(false);
  const [startingFresh, setStartingFresh] = useState(false);

  // Only bookmark ids that actually resolve — an unknown/mistyped id (404)
  // must never get remembered, or the next "/" visit would land back here.
  useEffect(() => {
    if (!loading && !notFound) {
      touchBookmark(notepadId);
    }
  }, [notepadId, loading, notFound, touchBookmark]);

  // Keeps the manifest's start_url in sync with whichever notepad is open,
  // so "Add to Home Screen" (iOS in particular) installs an icon that opens
  // back to this notepad instead of a fixed app-wide URL.
  useEffect(() => {
    if (!loading && !notFound) {
      setManifestForNotepad(notepadId);
    }
  }, [notepadId, loading, notFound]);

  if (notFound) {
    return (
      <div className={styles.desk}>
        <main className={styles.pad}>
          <div className={styles.sheet}>
            <Header>Notepad not found</Header>
            <p className={styles.empty}>
              {startingFresh ? (
                "One moment…"
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    setStartingFresh(true);
                    const notepad = await createNotepad();
                    window.location.href = `/${notepad.id}`;
                  }}
                >
                  Start a new notepad
                </button>
              )}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.desk}>
        <main className={styles.pad}>
          <div className={styles.sheet}>
            <Header>Loading…</Header>
          </div>
        </main>
      </div>
    );
  }

  // Fall back to the first list if the saved one no longer exists
  const activeListId = lists.some((l) => l.id === savedActiveListId)
    ? savedActiveListId
    : lists.length > 0
    ? lists[0].id
    : null;
  const activeList = lists.find((l) => l.id === activeListId) || null;

  const listSelectHandler = (listId) => {
    setSettingsActive(false);
    setActiveListId(listId);
  };

  const addNewProject = async (name) => {
    const existing = lists.find((l) => l.name === name);
    setSettingsActive(false);
    if (existing) {
      setActiveListId(existing.id);
      return;
    }
    // Select it once the server confirms a real id (the optimistic temp id
    // the row appears under isn't something callers outside this hook see)
    const created = await addList(name);
    if (created) {
      setActiveListId(created.id);
    }
  };

  const onDeleteProject = () => {
    const remaining = lists.filter((l) => l.id !== activeListId);
    deleteList(activeListId);
    setSettingsActive(false);
    setActiveListId(remaining.length > 0 ? remaining[0].id : null);
  };

  const activeListTodos = todos.filter((t) => t.listId === activeListId);
  const itemCount = activeListTodos.length;
  const doneCount = activeListTodos.filter((t) => t.done).length;
  const shareUrl = `${window.location.origin}/${notepadId}`;

  return (
    <div className={styles.desk}>
      <main className={styles.pad}>
        <ProjectList
          projects={lists}
          activeProject={activeListId}
          onSelect={listSelectHandler}
          addNewProject={addNewProject}
          switcher={<NotepadSwitcher currentNotepadId={notepadId} />}
        />
        <div className={styles.sheet}>
          {error && (
            <p className={styles.syncError}>
              Having trouble syncing — changes may not be saved.
            </p>
          )}
          {activeList ? (
            <>
              <Header
                optionsActive={settingsActive}
                onToggleOptions={() => setSettingsActive((s) => !s)}
              >
                {activeList.name}
              </Header>
              {settingsActive ? (
                <SettingsContainer
                  projectName={activeList.name}
                  itemCount={itemCount}
                  doneCount={doneCount}
                  shareUrl={shareUrl}
                  onResetProject={() => {
                    resetList(activeListId);
                    setSettingsActive(false);
                  }}
                  onDeleteProject={onDeleteProject}
                  onClose={() => setSettingsActive(false)}
                />
              ) : (
                <TodoList
                  addNewTodo={(text) => addTodo(activeListId, text)}
                  completeTodo={toggleTodo}
                  deleteTodo={deleteTodo}
                  todos={todos}
                  activeListId={activeListId}
                />
              )}
            </>
          ) : (
            <>
              <Header>No lists yet</Header>
              <p className={styles.empty}>Tap + above to start a list.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Notepad;
