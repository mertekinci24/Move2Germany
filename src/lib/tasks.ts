import { supabase } from './supabase';
import { configLoader, Task } from './config';
import { logAuditEvent } from './auth';

export type UserTask = {
  id: string;
  userId: string;
  taskId: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  notes: string | null;
  customDueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TaskWithStatus = Task & {
  userTask?: UserTask;
};

export async function getUserTasks(userId: string, filters?: {
  status?: string;
  taskId?: string;
}): Promise<UserTask[]> {
  let query = supabase
    .from('user_tasks')
    .select('*')
    .eq('user_id', userId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.taskId) {
    query = query.eq('task_id', filters.taskId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToUserTask);
}

export async function getUserTask(userId: string, taskId: string): Promise<UserTask | null> {
  const { data, error } = await supabase
    .from('user_tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapDbToUserTask(data) : null;
}

export async function createUserTask(userId: string, taskId: string): Promise<UserTask> {
  const existing = await getUserTask(userId, taskId);

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('user_tasks')
    .insert({
      user_id: userId,
      task_id: taskId,
      status: 'todo'
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapDbToUserTask(data);
}

export async function updateUserTask(
  userId: string,
  taskId: string,
  updates: {
    status?: UserTask['status'];
    notes?: string;
    customDueDate?: string | null;
  }
): Promise<UserTask> {
  const existingTask = await getUserTask(userId, taskId);

  if (!existingTask) {
    await createUserTask(userId, taskId);
  }

  const dbUpdates: Record<string, unknown> = {};

  if (updates.status !== undefined) {
    dbUpdates.status = updates.status;
    if (updates.status === 'done') {
      dbUpdates.completed_at = new Date().toISOString();
    } else if (existingTask?.completedAt) {
      dbUpdates.completed_at = null;
    }
  }

  if (updates.notes !== undefined) {
    dbUpdates.notes = updates.notes;
  }

  if (updates.customDueDate !== undefined) {
    dbUpdates.custom_due_date = updates.customDueDate;
  }

  const { data, error } = await supabase
    .from('user_tasks')
    .update(dbUpdates)
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (updates.status) {
    await logAuditEvent(userId, 'TASK_STATUS_CHANGED', {
      taskId,
      newStatus: updates.status,
      oldStatus: existingTask?.status || 'not_started'
    });
  } else {
    await logAuditEvent(userId, 'TASK_UPDATED', {
      taskId,
      updates
    });
  }

  return mapDbToUserTask(data);
}

export async function getTasksWithStatus(
  userId: string,
  filters?: {
    cityId?: string;
    timeWindowId?: string;
    moduleId?: string;
    importance?: Task['importance'];
    status?: UserTask['status'];
    search?: string;
  }
): Promise<TaskWithStatus[]> {
  const tasks = configLoader.filterTasks({
    cityId: filters?.cityId,
    timeWindowId: filters?.timeWindowId,
    moduleId: filters?.moduleId,
    importance: filters?.importance,
    search: filters?.search
  });

  const userTasks = await getUserTasks(userId, {
    status: filters?.status
  });

  const userTaskMap = new Map(
    userTasks.map(ut => [ut.taskId, ut])
  );

  return tasks.map(task => ({
    ...task,
    userTask: userTaskMap.get(task.id)
  }));
}

export async function initializeUserTasks(userId: string, cityId: string): Promise<void> {
  const tasks = configLoader.filterTasks({ cityId });

  const criticalTasks = tasks.filter(t => t.importance === 'critical');

  for (const task of criticalTasks) {
    await createUserTask(userId, task.id);
  }
}

export function checkDependencies(task: Task, userTasks: UserTask[]): {
  canComplete: boolean;
  blockedBy: Task[];
} {
  if (!task.dependencies.length) {
    return { canComplete: true, blockedBy: [] };
  }

  const userTaskMap = new Map(
    userTasks.map(ut => [ut.taskId, ut])
  );

  const blockedBy: Task[] = [];

  for (const depId of task.dependencies) {
    const depTask = configLoader.getTask(depId);
    const depUserTask = userTaskMap.get(depId);

    if (depTask && (!depUserTask || depUserTask.status !== 'done')) {
      blockedBy.push(depTask);
    }
  }

  return {
    canComplete: blockedBy.length === 0,
    blockedBy
  };
}

function mapDbToUserTask(data: Record<string, unknown>): UserTask {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    taskId: data.task_id as string,
    status: data.status as 'todo' | 'in_progress' | 'done' | 'blocked',
    notes: data.notes as string | null,
    customDueDate: data.custom_due_date as string | null,
    completedAt: data.completed_at as string | null,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string
  };
}
