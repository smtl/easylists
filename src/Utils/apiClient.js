const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    const error = new Error(`Request to ${path} failed with ${response.status}`);
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

export function createNotepad() {
  return request("/api/notepads", { method: "POST" });
}

export function getNotepad(notepadId) {
  return request(`/api/notepads/${notepadId}`);
}

export function importNotepad(notepadId, lists) {
  return request(`/api/notepads/${notepadId}/import`, {
    method: "POST",
    body: JSON.stringify({ lists }),
  });
}

export function createList(notepadId, name) {
  return request(`/api/notepads/${notepadId}/lists`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteList(listId) {
  return request(`/api/lists/${listId}`, { method: "DELETE" });
}

export function resetList(listId) {
  return request(`/api/lists/${listId}/reset`, { method: "POST" });
}

export function createTodo(listId, text) {
  return request(`/api/lists/${listId}/todos`, {
    method: "POST",
    body: JSON.stringify({ text }),
  });
}

export function updateTodo(todoId, changes) {
  return request(`/api/todos/${todoId}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

export function deleteTodo(todoId) {
  return request(`/api/todos/${todoId}`, { method: "DELETE" });
}
