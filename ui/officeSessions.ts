export function selectOfficeSessions<
  T extends { businessId: string; roleId: string; status: string },
>(tasks: T[]) {
  const sessions = new Map<string, { task: T; activeCount: number }>();
  for (const task of tasks) {
    const key = task.businessId + ":" + task.roleId;
    const current = sessions.get(key);
    const active = task.status === "working";
    if (!current) sessions.set(key, { task, activeCount: active ? 1 : 0 });
    else {
      if (active || current.task.status !== "working") current.task = task;
      if (active) current.activeCount++;
    }
  }
  return sessions;
}
