interface EditorStateRecord {
  dirty: boolean;
  filePath?: string;
  replaceable: boolean;
  updatedAt: number;
}

type EditorStateRegistry = Record<string, EditorStateRecord>;

export interface EditorStateSnapshot {
  dirty: boolean;
  filePath?: string;
  replaceable: boolean;
}

const STORAGE_KEY = "muxy.files.editor-state";
const STALE_AFTER_MS = 7000;

function now(): number {
  return Date.now();
}

function read_registry(): EditorStateRegistry {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as EditorStateRegistry) : {};
  } catch {
    return {};
  }
}

function write_registry(registry: EditorStateRegistry): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registry));
  } catch {
    void 0;
  }
}

function fresh_registry(registry: EditorStateRegistry, timestamp = now()): EditorStateRegistry {
  let changed = false;
  const fresh: EditorStateRegistry = {};

  for (const [id, record] of Object.entries(registry)) {
    if (timestamp - record.updatedAt > STALE_AFTER_MS) {
      changed = true;
      continue;
    }
    fresh[id] = record;
  }

  if (changed) write_registry(fresh);
  return fresh;
}

export function create_editor_state_id(): string {
  return globalThis.crypto?.randomUUID?.() ?? `editor-${now()}-${Math.random().toString(36).slice(2)}`;
}

export function write_editor_state(id: string, snapshot: EditorStateSnapshot): void {
  const registry = fresh_registry(read_registry());
  registry[id] = { ...snapshot, updatedAt: now() };
  write_registry(registry);
}

export function clear_editor_state(id: string): void {
  const registry = read_registry();
  if (!(id in registry)) return;
  delete registry[id];
  write_registry(registry);
}

export function has_dirty_replaceable_editor_for_other_file(filePath: string): boolean {
  const records = Object.values(fresh_registry(read_registry()));
  return records.some(
    (record) => record.replaceable && record.dirty && record.filePath !== filePath,
  );
}
