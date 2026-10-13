CREATE TABLE IF NOT EXISTS notepads (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lists (
  id text PRIMARY KEY,
  notepad_id text NOT NULL REFERENCES notepads(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lists_notepad_id_idx ON lists(notepad_id);
-- Soft delete: "deleted" lists/todos are just hidden (deleted_at IS NOT NULL
-- excluded from every read), not actually removed, so an accidental delete
-- can be undone with a manual `UPDATE ... SET deleted_at = NULL`.
ALTER TABLE lists ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE TABLE IF NOT EXISTS todos (
  id text PRIMARY KEY,
  list_id text NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  order_index double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS todos_list_id_idx ON todos(list_id);
ALTER TABLE todos ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
