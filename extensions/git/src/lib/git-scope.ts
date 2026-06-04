import { active_git_project_path } from "@/lib/project-scope";

export async function active_project(): Promise<string | undefined> {
  return active_git_project_path();
}

let depth = 0;
const listeners = new Set<(busy: boolean) => void>();

export function is_busy(): boolean {
  return depth > 0;
}

export function on_busy_change(fn: (busy: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function set_depth(next: number): void {
  const was = depth > 0;
  depth = next;
  const now = depth > 0;
  if (was !== now) for (const fn of listeners) fn(now);
}

export async function run_pinned<T>(fn: (project?: string) => Promise<T>): Promise<T> {
  const project = await active_project();
  set_depth(depth + 1);
  try {
    return await fn(project);
  } finally {
    set_depth(depth - 1);
  }
}
