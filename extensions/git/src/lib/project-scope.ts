interface ProjectCandidate {
  path: string;
  isActive?: boolean;
}

interface WorktreeCandidate {
  path: string;
  isPrimary: boolean;
}

function normalize_path(path: string): string {
  return path.replace(/\/+$/, "");
}

function same_path(a: string, b: string): boolean {
  return normalize_path(a) === normalize_path(b);
}

export function resolve_git_project_path(
  projects: ProjectCandidate[],
  worktrees: WorktreeCandidate[],
): string | undefined {
  const project = projects.find((p) => p.isActive)?.path ?? projects[0]?.path;
  const primary = worktrees.find((w) => w.isPrimary)?.path;
  if (!project) return primary;

  const selectedWorktree = worktrees.find((w) => same_path(w.path, project));
  if (selectedWorktree && !selectedWorktree.isPrimary) return primary;

  return project;
}

export async function active_git_project_path(): Promise<string | undefined> {
  const [projects, worktrees] = await Promise.all([
    muxy.projects.list().catch(() => [] as MuxyProject[]),
    muxy.worktrees.list().catch(() => [] as MuxyWorktree[]),
  ]);
  const project = resolve_git_project_path(projects, worktrees);
  if (!project) return undefined;

  try {
    await muxy.git.repoInfo({ project });
    return project;
  } catch {
    return undefined;
  }
}
