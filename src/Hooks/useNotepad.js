import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "../Utils/apiClient";

const POLL_MS = 5000;

const flattenTodos = (lists) =>
  lists.flatMap((list) =>
    list.todos.map((todo) => ({
      id: todo.id,
      listId: list.id,
      text: todo.text,
      done: todo.done,
      createdDate: todo.createdAt,
      completedDate: todo.completedAt,
    }))
  );

// Fetches a notepad's lists/todos, scoped by notepadId, and keeps them in
// sync with the server via short polling + refetch-on-focus (no websockets).
// Mutations apply to local state immediately so swipe/strike/long-press
// animations never wait on the network, then reconcile with the server;
// a pending-mutation counter stops an in-flight poll from clobbering an
// optimistic update that hasn't round-tripped yet.
export default function useNotepad(notepadId) {
  const [lists, setLists] = useState([]);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const pendingMutations = useRef(0);

  const applySnapshot = useCallback((notepad) => {
    setLists(notepad.lists.map((l) => ({ id: l.id, name: l.name })));
    setTodos(flattenTodos(notepad.lists));
  }, []);

  const fetchNotepad = useCallback(async () => {
    if (pendingMutations.current > 0) {
      return;
    }
    try {
      const notepad = await api.getNotepad(notepadId);
      applySnapshot(notepad);
      setNotFound(false);
      setError(null);
    } catch (err) {
      if (err.status === 404) {
        setNotFound(true);
      } else {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [notepadId, applySnapshot]);

  useEffect(() => {
    setLoading(true);
    fetchNotepad();
    const interval = setInterval(fetchNotepad, POLL_MS);
    const onFocus = () => fetchNotepad();
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchNotepad]);

  const mutate = useCallback(async (applyOptimistic, apiCall, onSuccess) => {
    const rollback = applyOptimistic();
    pendingMutations.current += 1;
    try {
      const result = await apiCall();
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (err) {
      rollback();
      setError(err);
      return null;
    } finally {
      pendingMutations.current -= 1;
    }
  }, []);

  const addList = useCallback(
    (name) => {
      const tempId = `temp-list-${Date.now()}`;
      return mutate(
        () => {
          setLists((prev) => [...prev, { id: tempId, name }]);
          return () => setLists((prev) => prev.filter((l) => l.id !== tempId));
        },
        () => api.createList(notepadId, name),
        (created) => {
          setLists((prev) =>
            prev.map((l) => (l.id === tempId ? { id: created.id, name: created.name } : l))
          );
        }
      );
    },
    [notepadId, mutate]
  );

  const deleteList = useCallback(
    (listId) => {
      let removedList;
      let removedTodos;
      mutate(
        () => {
          setLists((prev) => {
            removedList = prev.find((l) => l.id === listId);
            return prev.filter((l) => l.id !== listId);
          });
          setTodos((prev) => {
            removedTodos = prev.filter((t) => t.listId === listId);
            return prev.filter((t) => t.listId !== listId);
          });
          return () => {
            if (removedList) setLists((prev) => [...prev, removedList]);
            if (removedTodos && removedTodos.length > 0) {
              setTodos((prev) => [...prev, ...removedTodos]);
            }
          };
        },
        () => api.deleteList(listId)
      );
    },
    [mutate]
  );

  const addTodo = useCallback(
    (listId, text) => {
      const tempId = `temp-todo-${Date.now()}`;
      const optimisticTodo = {
        id: tempId,
        listId,
        text,
        done: false,
        createdDate: new Date().toISOString(),
        completedDate: null,
      };
      mutate(
        () => {
          setTodos((prev) => [...prev, optimisticTodo]);
          return () => setTodos((prev) => prev.filter((t) => t.id !== tempId));
        },
        () => api.createTodo(listId, text),
        (created) => {
          setTodos((prev) =>
            prev.map((t) =>
              t.id === tempId
                ? {
                    id: created.id,
                    listId,
                    text: created.text,
                    done: created.done,
                    createdDate: created.createdAt,
                    completedDate: created.completedAt,
                  }
                : t
            )
          );
        }
      );
    },
    [mutate]
  );

  const toggleTodo = useCallback(
    (todo) => {
      const nextDone = !todo.done;
      let previous;
      mutate(
        () => {
          setTodos((prev) =>
            prev.map((t) => {
              if (t.id !== todo.id) return t;
              previous = t;
              return {
                ...t,
                done: nextDone,
                completedDate: nextDone ? new Date().toISOString() : null,
              };
            })
          );
          return () => setTodos((prev) => prev.map((t) => (t.id === todo.id ? previous : t)));
        },
        () => api.updateTodo(todo.id, { done: nextDone }),
        (updated) => {
          setTodos((prev) =>
            prev.map((t) =>
              t.id === todo.id
                ? { ...t, done: updated.done, completedDate: updated.completedAt }
                : t
            )
          );
        }
      );
    },
    [mutate]
  );

  const deleteTodo = useCallback(
    (todo) => {
      let removed;
      mutate(
        () => {
          setTodos((prev) => {
            removed = prev.find((t) => t.id === todo.id);
            return prev.filter((t) => t.id !== todo.id);
          });
          return () => {
            if (removed) setTodos((prev) => [...prev, removed]);
          };
        },
        () => api.deleteTodo(todo.id)
      );
    },
    [mutate]
  );

  return {
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
  };
}
