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
  subtaskProgress: Record<string, boolean>;
  metadata: Record<string, any>;
  // Dynamic task fields
  title?: string;
  description?: string;
  module?: string;
  timeWindow?: string;
  isSystemGenerated?: boolean;
};

export type UserSubtask = {
  id: string;
  userId: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  order: number;
  createdAt: string;
};

export type TaskWithStatus = Task & {
  userTask?: UserTask;
};

export function computeTaskStatusOnChange(
  currentStatus: UserTask['status'],
  subtaskProgress: Record<string, boolean>,
  linkedSubtaskStatus: Record<string, boolean>,
  hasNotes: boolean,
  hasDocuments: boolean,
  requiredSubtaskIds: string[],
  metadata: Record<string, any> = {},
  taskConfig?: Task
): UserTask['status'] {
  // If already done, don't revert automatically unless explicitly requested (handled by UI)
  // But if we are in todo, we might want to move to in_progress

  if (currentStatus === 'todo') {
    const hasStartedSimple = Object.values(subtaskProgress).some(v => v);
    const hasStartedLinked = Object.values(linkedSubtaskStatus).some(v => v);
    const hasMetadata = Object.keys(metadata).length > 0;

    if (hasStartedSimple || hasStartedLinked || hasNotes || hasDocuments || hasMetadata) {
      return 'in_progress';
    }
  }

  // Auto-transition to done if all required subtasks are completed
  // and we are currently in_progress (or todo)
  if (currentStatus !== 'done' && requiredSubtaskIds.length > 0) {
    const allRequiredDone = requiredSubtaskIds.every(id => {
      // Check simple/linked subtasks
      if (subtaskProgress[id] || linkedSubtaskStatus[id]) return true;

      // Check complex subtasks (form_criteria, external_action)
      const subtaskConfig = taskConfig?.subtasks?.find(s => s.id === id);
      if (!subtaskConfig) return false;

      if (subtaskConfig.type === 'form_criteria') {
        // Considered done if all fields are present in metadata
        const criteria = metadata[subtaskConfig.criteriaKey] || {};
        return subtaskConfig.fields.every(field =>
          criteria[field] !== undefined && criteria[field] !== null && criteria[field] !== ''
        );
      }

      if (subtaskConfig.type === 'external_action') {
        // Considered done if at least one provider is marked as completed in metadata
        // Metadata structure: { [actionType]: { [providerId]: boolean } }
        const actionProgress = metadata[subtaskConfig.actionType] || {};
        return Object.values(actionProgress).some(v => v === true);
      }

      return false;
    });

    if (allRequiredDone) {
      return 'done';
    }
  }

  return currentStatus;
}

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
      status: 'todo',
      subtask_progress: {},
      metadata: {}
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
    subtaskProgress?: Record<string, boolean>;
    hasDocuments?: boolean; // Optional, passed from UI if known
    metadata?: Record<string, any>;
  }
): Promise<UserTask> {
  const existingTask = await getUserTask(userId, taskId);

  if (!existingTask) {
    await createUserTask(userId, taskId);
  }

  const dbUpdates: Record<string, unknown> = {};
  let newStatus = updates.status || existingTask?.status || 'todo';

  // Smart status logic
  if (updates.status === undefined) {
    // Only apply smart logic if status is NOT explicitly being updated
    const currentSubtaskProgress = updates.subtaskProgress || existingTask?.subtaskProgress || {};
    const currentNotes = updates.notes !== undefined ? updates.notes : existingTask?.notes;
    const hasNotes = !!currentNotes && currentNotes.trim().length > 0;
    const hasDocuments = updates.hasDocuments || false; // We might need to fetch this if critical, but for now rely on passed arg
    const currentMetadata = { ...(existingTask?.metadata || {}), ...(updates.metadata || {}) };

    // Get required subtasks from config
    const taskConfig = configLoader.getTask(taskId);
    const requiredSubtaskIds = taskConfig?.subtasks?.filter(s => s.required).map(s => s.id) || [];

    // Fetch linked tasks status
    const linkedSubtaskStatus: Record<string, boolean> = {};
    if (taskConfig?.subtasks) {
      for (const subtask of taskConfig.subtasks) {
        if (subtask.type === 'linked_task' && subtask.linkedTaskId) {
          const linkedTask = await getUserTask(userId, subtask.linkedTaskId);
          linkedSubtaskStatus[subtask.id] = linkedTask?.status === 'done';
        }
      }
    }

    newStatus = computeTaskStatusOnChange(
      newStatus,
      currentSubtaskProgress,
      linkedSubtaskStatus,
      hasNotes,
      hasDocuments,
      requiredSubtaskIds,
      currentMetadata,
      taskConfig
    );

    if (newStatus !== existingTask?.status) {
      dbUpdates.status = newStatus;
    }
  } else {
    dbUpdates.status = updates.status;
  }

  if (dbUpdates.status === 'done') {
    dbUpdates.completed_at = new Date().toISOString();
  } else if (existingTask?.completedAt && dbUpdates.status && dbUpdates.status !== 'done') {
    dbUpdates.completed_at = null;
  }

  if (updates.notes !== undefined) {
    dbUpdates.notes = updates.notes;
  }

  if (updates.customDueDate !== undefined) {
    dbUpdates.custom_due_date = updates.customDueDate;
  }

  if (updates.subtaskProgress !== undefined) {
    dbUpdates.subtask_progress = updates.subtaskProgress;
  }

  if (updates.metadata !== undefined) {
    dbUpdates.metadata = updates.metadata;
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

  await logAuditEvent(userId, 'task_update', {
    taskId,
    updates
  });

  return mapDbToUserTask(data);
}

export async function updateUserTaskMetadata(
  userId: string,
  taskId: string,
  metadataUpdates: Record<string, any>
): Promise<UserTask> {
  const existingTask = await getUserTask(userId, taskId);
  const currentMetadata = existingTask?.metadata || {};
  const newMetadata = { ...currentMetadata, ...metadataUpdates };

  return updateUserTask(userId, taskId, { metadata: newMetadata });
}

// --- User Subtasks CRUD ---

export async function getUserSubtasks(userId: string, taskId: string): Promise<UserSubtask[]> {
  const { data, error } = await supabase
    .from('user_subtasks')
    .select('*')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .order('order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []).map(mapDbToUserSubtask);
}

export async function createUserSubtask(userId: string, taskId: string, title: string): Promise<UserSubtask> {
  // Get max order
  const { data: maxOrderData } = await supabase
    .from('user_subtasks')
    .select('order')
    .eq('user_id', userId)
    .eq('task_id', taskId)
    .order('order', { ascending: false })
    .limit(1);

  const nextOrder = (maxOrderData?.[0]?.order ?? -1) + 1;

  const { data, error } = await supabase
    .from('user_subtasks')
    .insert({
      user_id: userId,
      task_id: taskId,
      title,
      order: nextOrder
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapDbToUserSubtask(data);
}

export async function updateUserSubtask(
  id: string,
  updates: { title?: string; isCompleted?: boolean; order?: number }
): Promise<UserSubtask> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted;
  if (updates.order !== undefined) dbUpdates.order = updates.order;

  const { data, error } = await supabase
    .from('user_subtasks')
    .update(dbUpdates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapDbToUserSubtask(data);
}

export async function deleteUserSubtask(id: string): Promise<void> {
  const { error } = await supabase
    .from('user_subtasks')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
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
    locale?: string;
    personaType?: string | null;
  }
): Promise<TaskWithStatus[]> {
  // 1. Get static tasks (filtered)
  const staticTasks = configLoader.filterTasks({
    cityId: filters?.cityId,
    timeWindowId: filters?.timeWindowId,
    moduleId: filters?.moduleId,
    importance: filters?.importance,
    search: filters?.search,
    locale: filters?.locale,
    personaType: filters?.personaType
  });

  // 2. Get all user tasks for this user (we need all to merge, filtering happens later for dynamic ones)
  const userTasks = await getUserTasks(userId, {
    status: filters?.status
  });

  const userTaskMap = new Map(
    userTasks.map(ut => [ut.taskId, ut])
  );

  // 3. Merge static tasks with user status
  const mergedStaticTasks = staticTasks.map(task => ({
    ...task,
    userTask: userTaskMap.get(task.id)
  }));

  // 4. Identify and process dynamic tasks
  // Dynamic tasks are those in userTasks that are NOT in staticTasks map (conceptually)
  // But since we only fetched filtered static tasks, we need to be careful.
  // We should check if the userTask has 'title' and 'description' which indicates it's a dynamic task.
  // And then apply the SAME filters to these dynamic tasks.

  const dynamicTasks: TaskWithStatus[] = [];
  const staticTaskIds = new Set(configLoader.getTasks(filters?.locale).map(t => t.id)); // All static IDs

  for (const ut of userTasks) {
    // If it's a known static task, it's already handled (or filtered out by static filters)
    if (staticTaskIds.has(ut.taskId)) continue;

    // If it's a dynamic task (has title/desc)
    if (ut.title && ut.description) {
      // Apply filters manually
      let matches = true;

      // Module filter
      if (filters?.moduleId && ut.module !== filters.moduleId) matches = false;

      // Time Window filter
      if (filters?.timeWindowId && ut.timeWindow !== filters.timeWindowId) matches = false;

      // Search filter
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        if (!ut.title.toLowerCase().includes(searchLower) &&
          !ut.description.toLowerCase().includes(searchLower)) {
          matches = false;
        }
      }

      // Note: We skip cityId, importance, personaType filters for dynamic tasks for now 
      // as they might not have these fields populated or applicable.

      if (matches) {
        dynamicTasks.push({
          id: ut.taskId,
          title: ut.title,
          description: ut.description,
          module: (ut.module as any) || 'social', // Default or cast
          timeWindow: ut.timeWindow || 'week_1', // Default
          importance: 'recommended', // Default
          cityScope: [], // Universal
          dependencies: [],
          userTask: ut
        });
      }
    }
  }

  return [...mergedStaticTasks, ...dynamicTasks];
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
    updatedAt: data.updated_at as string,
    subtaskProgress: (data.subtask_progress as Record<string, boolean>) || {},
    metadata: (data.metadata as Record<string, any>) || {},
    // Dynamic fields
    title: data.title as string | undefined,
    description: data.description as string | undefined,
    module: data.module as string | undefined,
    timeWindow: data.time_window as string | undefined,
    isSystemGenerated: data.is_system_generated as boolean | undefined
  };
}

export async function createDynamicTask(
  userId: string,
  taskData: {
    title: string;
    description: string;
    module: 'housing' | 'job' | 'bureaucracy' | 'social';
    timeWindow: string;
  }
): Promise<UserTask> {
  // Generate a unique ID for the dynamic task
  const taskId = `dynamic-${crypto.randomUUID()}`;

  const { data, error } = await supabase
    .from('user_tasks')
    .insert({
      user_id: userId,
      task_id: taskId,
      status: 'todo',
      title: taskData.title,
      description: taskData.description,
      module: taskData.module,
      time_window: taskData.timeWindow,
      is_system_generated: true,
      subtask_progress: {},
      metadata: {}
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapDbToUserTask(data);
}

function mapDbToUserSubtask(data: Record<string, unknown>): UserSubtask {
  return {
    id: data.id as string,
    userId: data.user_id as string,
    taskId: data.task_id as string,
    title: data.title as string,
    isCompleted: data.is_completed as boolean,
    order: data.order as number,
    createdAt: data.created_at as string
  };
}
