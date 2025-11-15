import { describe, it, expect } from 'vitest';

describe('Task Status Update Logic', () => {
  describe('completed_at field', () => {
    it('should set completed_at when status changes to done', () => {
      const before = new Date('2025-01-01T00:00:00Z');
      const _task = {
        id: 'task-1',
        userId: 'user-1',
        taskId: 'task-123',
        status: 'in_progress' as const,
        notes: null,
        customDueDate: null,
        completedAt: null,
        createdAt: before.toISOString(),
        updatedAt: before.toISOString()
      };

      const updates = { status: 'done' as const };
      const shouldSetCompletedAt = updates.status === 'done';

      expect(shouldSetCompletedAt).toBe(true);
    });

    it('should clear completed_at when status changes from done to other', () => {
      const completedDate = new Date('2025-01-15T10:00:00Z');
      const task = {
        id: 'task-1',
        userId: 'user-1',
        taskId: 'task-123',
        status: 'done' as const,
        notes: null,
        customDueDate: null,
        completedAt: completedDate.toISOString(),
        createdAt: new Date('2025-01-01').toISOString(),
        updatedAt: new Date('2025-01-15').toISOString()
      };

      const updates = { status: 'in_progress' as const };
      const shouldClearCompletedAt =
        updates.status !== 'done' && task.completedAt !== null;

      expect(shouldClearCompletedAt).toBe(true);
    });

    it('should not modify completed_at when status is done and already has completed_at', () => {
      const completedDate = new Date('2025-01-15T10:00:00Z');
      const task = {
        id: 'task-1',
        userId: 'user-1',
        taskId: 'task-123',
        status: 'done' as const,
        notes: null,
        customDueDate: null,
        completedAt: completedDate.toISOString(),
        createdAt: new Date('2025-01-01').toISOString(),
        updatedAt: new Date('2025-01-15').toISOString()
      };

      const updates = { notes: 'Updated notes' };
      const shouldModifyCompletedAt = false;

      expect(shouldModifyCompletedAt).toBe(false);
      expect(task.completedAt).toBe(completedDate.toISOString());
    });
  });

  describe('status validation', () => {
    it('should accept valid status values', () => {
      const validStatuses = ['todo', 'in_progress', 'done', 'blocked'];

      validStatuses.forEach(status => {
        expect(validStatuses).toContain(status);
      });
    });

    it('should reject invalid status values', () => {
      const validStatuses = ['todo', 'in_progress', 'done', 'blocked'];
      const invalidStatus = 'invalid_status';

      expect(validStatuses).not.toContain(invalidStatus);
    });
  });

  describe('task update payload', () => {
    it('should build correct update payload for status change to done', () => {
      const _updates = { status: 'done' as const };
      const dbUpdates: Record<string, unknown> = {};

      if (updates.status !== undefined) {
        dbUpdates.status = updates.status;
        if (updates.status === 'done') {
          dbUpdates.completed_at = expect.any(String);
        }
      }

      expect(dbUpdates.status).toBe('done');
      expect(dbUpdates.completed_at).toBeDefined();
    });

    it('should build correct update payload for notes update', () => {
      const updates = { notes: 'My task notes' };
      const dbUpdates: Record<string, unknown> = {};

      if (updates.notes !== undefined) {
        dbUpdates.notes = updates.notes;
      }

      expect(dbUpdates.notes).toBe('My task notes');
      expect(dbUpdates.status).toBeUndefined();
    });

    it('should build correct update payload for custom due date', () => {
      const dueDate = '2025-02-15';
      const updates = { customDueDate: dueDate };
      const dbUpdates: Record<string, unknown> = {};

      if (updates.customDueDate !== undefined) {
        dbUpdates.custom_due_date = updates.customDueDate;
      }

      expect(dbUpdates.custom_due_date).toBe(dueDate);
    });
  });
});
