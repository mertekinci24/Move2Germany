import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubtaskEditor } from './SubtaskEditor';
import * as tasksLib from '../../lib/tasks';
import * as i18nContext from '../../contexts/I18nContext';

// Mock dependencies
vi.mock('../../lib/tasks');
vi.mock('../../contexts/I18nContext');
vi.mock('sonner', () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn()
    }
}));

describe('SubtaskEditor', () => {
    const mockUserId = 'user-123';
    const mockTaskId = 'task-123';
    const mockSubtasks = [
        { id: '1', userId: mockUserId, taskId: mockTaskId, title: 'Existing Subtask', isCompleted: false, order: 0, createdAt: '2023-01-01' }
    ];

    beforeEach(() => {
        vi.resetAllMocks();
        (i18nContext.useI18n as any).mockReturnValue({ t: (key: string) => key });
        (tasksLib.getUserSubtasks as any).mockResolvedValue(mockSubtasks);
    });

    it('renders existing subtasks', async () => {
        render(<SubtaskEditor userId={mockUserId} taskId={mockTaskId} />);

        await waitFor(() => {
            expect(screen.getByText('Existing Subtask')).toBeDefined();
        });
    });

    it('adds a new subtask optimistically', async () => {
        const newSubtask = { id: '2', userId: mockUserId, taskId: mockTaskId, title: 'New Subtask', isCompleted: false, order: 1, createdAt: '2023-01-02' };
        (tasksLib.createUserSubtask as any).mockResolvedValue(newSubtask);

        render(<SubtaskEditor userId={mockUserId} taskId={mockTaskId} />);

        // Wait for initial load
        await waitFor(() => screen.getByText('Existing Subtask'));

        const input = screen.getByPlaceholderText('tasks.detail.addSubtaskPlaceholder');
        const button = screen.getByRole('button', { name: 'tasks.detail.addSubtaskPlaceholder' });

        fireEvent.change(input, { target: { value: 'New Subtask' } });
        fireEvent.click(button);

        // Should appear immediately (optimistic)
        expect(screen.getByText('New Subtask')).toBeDefined();

        // Verify service call
        await waitFor(() => {
            expect(tasksLib.createUserSubtask).toHaveBeenCalledWith(mockUserId, mockTaskId, 'New Subtask');
        });
    });

    it('reverts optimistic update on error', async () => {
        (tasksLib.createUserSubtask as any).mockRejectedValue(new Error('Failed'));

        render(<SubtaskEditor userId={mockUserId} taskId={mockTaskId} />);

        // Wait for initial load
        await waitFor(() => screen.getByText('Existing Subtask'));

        const input = screen.getByPlaceholderText('tasks.detail.addSubtaskPlaceholder');
        const button = screen.getByRole('button', { name: 'tasks.detail.addSubtaskPlaceholder' });

        fireEvent.change(input, { target: { value: 'Fail Subtask' } });
        fireEvent.click(button);

        // Should appear initially
        expect(screen.getByText('Fail Subtask')).toBeDefined();

        // Should disappear after error
        await waitFor(() => {
            expect(screen.queryByText('Fail Subtask')).toBeNull();
        });
    });
});
