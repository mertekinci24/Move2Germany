import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTasksWithStatus } from './tasks';
import { supabase } from './supabase';
import { configLoader } from './config';

// Mock supabase
vi.mock('./supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Mock configLoader
vi.mock('./config', () => ({
    configLoader: {
        filterTasks: vi.fn(),
        getTasks: vi.fn(),
        getTask: vi.fn(),
    },
}));

describe('Dynamic Tasks Logic', () => {
    const userId = 'test-user-id';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should include dynamic tasks from DB that are not in static config', async () => {
        // 1. Setup Static Tasks (Empty)
        (configLoader.filterTasks as any).mockReturnValue([]);
        (configLoader.getTasks as any).mockReturnValue([]);

        // 2. Setup User Tasks (One dynamic task)
        const mockUserTasks = [
            {
                id: '1',
                user_id: userId,
                task_id: 'dynamic-task-1',
                status: 'todo',
                title: 'Dynamic Task Title',
                description: 'Dynamic Description',
                module: 'social',
                time_window: 'week_1',
                is_system_generated: true,
                subtask_progress: {},
                metadata: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        ];

        const eqMock = vi.fn().mockResolvedValue({ data: mockUserTasks, error: null });
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
        (supabase.from as any).mockReturnValue({ select: selectMock });

        // 3. Act
        const tasks = await getTasksWithStatus(userId);

        // 4. Assert
        expect(tasks).toHaveLength(1);
        expect(tasks[0].id).toBe('dynamic-task-1');
        expect(tasks[0].title).toBe('Dynamic Task Title');
        expect(tasks[0].description).toBe('Dynamic Description');
        expect(tasks[0].module).toBe('social');
        expect(tasks[0].userTask?.isSystemGenerated).toBe(true);
    });

    it('should filter dynamic tasks based on search query', async () => {
        // 1. Setup Static Tasks (Empty)
        (configLoader.filterTasks as any).mockReturnValue([]);
        (configLoader.getTasks as any).mockReturnValue([]);

        // 2. Setup User Tasks (Two dynamic tasks)
        const mockUserTasks = [
            {
                id: '1',
                user_id: userId,
                task_id: 'dynamic-task-1',
                title: 'Learn German',
                description: 'Language course',
                module: 'social',
                is_system_generated: true,
            },
            {
                id: '2',
                user_id: userId,
                task_id: 'dynamic-task-2',
                title: 'Buy Groceries',
                description: 'Food',
                module: 'social',
                is_system_generated: true,
            },
        ];

        const eqMock = vi.fn().mockResolvedValue({ data: mockUserTasks, error: null });
        const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
        (supabase.from as any).mockReturnValue({ select: selectMock });

        // 3. Act (Search for "German")
        const tasks = await getTasksWithStatus(userId, { search: 'German' });

        // 4. Assert
        expect(tasks).toHaveLength(1);
        expect(tasks[0].title).toBe('Learn German');
    });

    it('should create a dynamic task via AI tool', async () => {
        // 1. Setup
        const taskData = {
            title: 'AI Generated Task',
            description: 'Created by AI',
            module: 'housing' as const,
            timeWindow: 'week_1'
        };

        const mockCreatedTask = {
            id: '123',
            user_id: userId,
            task_id: 'dynamic-uuid-123',
            status: 'todo',
            title: taskData.title,
            description: taskData.description,
            module: taskData.module,
            time_window: taskData.timeWindow,
            is_system_generated: true,
            subtask_progress: {},
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const singleMock = vi.fn().mockResolvedValue({ data: mockCreatedTask, error: null });
        const selectMock = vi.fn().mockReturnValue({ single: singleMock });
        const insertMock = vi.fn().mockReturnValue({ select: selectMock });
        (supabase.from as any).mockReturnValue({ insert: insertMock });

        // Mock crypto.randomUUID
        Object.defineProperty(global, 'crypto', {
            value: {
                randomUUID: () => 'uuid-123'
            },
            writable: true
        });

        // 2. Act
        const { createDynamicTask } = await import('./tasks');
        const created = await createDynamicTask(userId, taskData);

        // 3. Assert
        expect(insertMock).toHaveBeenCalledWith({
            user_id: userId,
            task_id: 'dynamic-uuid-123',
            status: 'todo',
            title: taskData.title,
            description: taskData.description,
            module: taskData.module,
            time_window: taskData.timeWindow,
            is_system_generated: true,
            subtask_progress: {},
            metadata: {}
        });

        expect(created.title).toBe(taskData.title);
        expect(created.isSystemGenerated).toBe(true);
    });
});
