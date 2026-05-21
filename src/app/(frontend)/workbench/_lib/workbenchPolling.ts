export type WorkbenchSyncCandidate = {
  cardId: number;
  status: string;
  taskId?: null | number;
};

export type WorkbenchSyncTaskSelection<TTask extends WorkbenchSyncCandidate> = {
  nextCursor: number;
  selectedTasks: TTask[];
};

const isTerminalWorkbenchSyncStatus = (status: string) => {
  return status === "succeeded" || status === "failed" || status === "timeout";
};

export function selectWorkbenchSyncTasks<TTask extends WorkbenchSyncCandidate>(args: {
  activePendingCardId: null | number;
  batchSize: number;
  cursor: number;
  tasks: TTask[];
}): WorkbenchSyncTaskSelection<TTask> {
  const syncableTasks = args.tasks.filter(
    (task) => task.taskId && !isTerminalWorkbenchSyncStatus(task.status),
  );
  const normalizedBatchSize = Number.isFinite(args.batchSize)
    ? Math.max(1, Math.floor(args.batchSize))
    : 1;
  const activeTask = syncableTasks.find((task) => task.cardId === args.activePendingCardId);
  const backgroundTasks = activeTask
    ? syncableTasks.filter((task) => task.cardId !== activeTask.cardId)
    : syncableTasks;
  const selectedTasks: TTask[] = activeTask ? [activeTask] : [];
  const backgroundSlots = Math.max(0, normalizedBatchSize - selectedTasks.length);

  if (backgroundSlots <= 0 || backgroundTasks.length === 0) {
    return {
      nextCursor: args.cursor,
      selectedTasks,
    };
  }

  const startIndex = args.cursor % backgroundTasks.length;
  const taskCount = Math.min(backgroundSlots, backgroundTasks.length);

  for (let index = 0; index < taskCount; index += 1) {
    selectedTasks.push(backgroundTasks[(startIndex + index) % backgroundTasks.length]);
  }

  return {
    nextCursor: (startIndex + taskCount) % backgroundTasks.length,
    selectedTasks,
  };
}
