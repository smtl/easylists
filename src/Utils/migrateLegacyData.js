import { createNotepad, importNotepad } from "./apiClient";

const LEGACY_KEYS = ["todos_sticky", "projects_sticky", "active_project_sticky"];
const MIGRATION_MARKER = "legacy_migration_done_v1";

export function hasLegacyData() {
  if (localStorage.getItem(MIGRATION_MARKER)) {
    return false;
  }
  return Boolean(
    localStorage.getItem("projects_sticky") || localStorage.getItem("todos_sticky")
  );
}

// Imports this device's pre-sharing localStorage data into a fresh notepad.
// Legacy keys are only cleared after the server confirms the import — if the
// network call fails, the original data is left untouched so nothing is lost.
export async function migrateLegacyData() {
  const projects = JSON.parse(localStorage.getItem("projects_sticky") || "[]");
  const todos = JSON.parse(localStorage.getItem("todos_sticky") || "[]");

  const lists = projects.map((project) => ({
    name: project.name,
    todos: todos
      .filter((todo) => todo.project === project.name)
      .map((todo) => ({
        text: todo.text,
        done: todo.done,
        createdDate: todo.createdDate,
        completedDate: todo.completedDate,
      })),
  }));

  const notepad = await createNotepad();
  await importNotepad(notepad.id, lists);

  localStorage.setItem(MIGRATION_MARKER, "true");
  LEGACY_KEYS.forEach((key) => localStorage.removeItem(key));

  return notepad.id;
}
