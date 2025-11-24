import { describe, it, expect } from 'vitest';
import { computeTaskStatusOnChange, UserTask } from './tasks';
import { Task } from './config';

describe('Task Smart Status', () => {
    const mockTask: UserTask = {
        id: '1',
        userId: 'u1',
        taskId: 't1',
        status: 'todo',
        subtaskProgress: {},
        createdAt: '',
        updatedAt: '',
        notes: null,
        customDueDate: null,
        completedAt: null,
        metadata: {}
    };

    it('should transition to in_progress when subtask is completed', () => {
        const newStatus = computeTaskStatusOnChange(
            'todo',
            { 'sub1': true },
            {}, // linkedSubtaskStatus
            false, // hasNotes
            false, // hasDocuments
            [] // requiredSubtaskIds
        );
        expect(newStatus).toBe('in_progress');
    });

    it('should transition to in_progress when linked task is completed', () => {
        const newStatus = computeTaskStatusOnChange(
            'todo',
            {},
            { 'linked1': true },
            false,
            false,
            []
        );
        expect(newStatus).toBe('in_progress');
    });

    it('should stay in done status if already done', () => {
        const newStatus = computeTaskStatusOnChange(
            'done',
            { 'sub1': true },
            {},
            false,
            false,
            []
        );
        expect(newStatus).toBe('done');
    });

    it('should transition to in_progress when notes are added', () => {
        const newStatus = computeTaskStatusOnChange(
            'todo',
            {},
            {},
            true, // hasNotes
            false,
            []
        );
        expect(newStatus).toBe('in_progress');
    });

    it('should transition to done when all required subtasks (simple and linked) are done', () => {
        const newStatus = computeTaskStatusOnChange(
            'in_progress',
            { 'simple1': true },
            { 'linked1': true },
            false,
            false,
            ['simple1', 'linked1']
        );
        expect(newStatus).toBe('done');
    });

    it('should NOT transition to done if a required linked task is not done', () => {
        const newStatus = computeTaskStatusOnChange(
            'in_progress',
            { 'simple1': true },
            { 'linked1': false },
            false,
            false,
            ['simple1', 'linked1']
        );
        expect(newStatus).toBe('in_progress');
    });

    it('should transition to done when form_criteria subtask is completed via metadata', () => {
        const taskConfig: Task = {
            id: 't1',
            title: 'T1',
            description: 'D1',
            module: 'housing',
            timeWindow: 'arrival',
            importance: 'critical',
            cityScope: [],
            dependencies: [],
            subtasks: [
                {
                    id: 'form1',
                    title: 'Form 1',
                    type: 'form_criteria',
                    criteriaKey: 'housing_preferences',
                    fields: ['maxRent', 'minSize']
                }
            ]
        };

        const metadata = {
            housing_preferences: {
                maxRent: 1000,
                minSize: 50
            }
        };

        const newStatus = computeTaskStatusOnChange(
            'in_progress',
            {},
            {},
            false,
            false,
            ['form1'],
            metadata,
            taskConfig
        );
        expect(newStatus).toBe('done');
    });

    it('should NOT transition to done if form_criteria fields are missing', () => {
        const taskConfig: Task = {
            id: 't1',
            title: 'T1',
            description: 'D1',
            module: 'housing',
            timeWindow: 'arrival',
            importance: 'critical',
            cityScope: [],
            dependencies: [],
            subtasks: [
                {
                    id: 'form1',
                    title: 'Form 1',
                    type: 'form_criteria',
                    criteriaKey: 'housing_preferences',
                    fields: ['maxRent', 'minSize']
                }
            ]
        };

        const metadata = {
            housing_preferences: {
                maxRent: 1000
                // minSize missing
            }
        };

        const newStatus = computeTaskStatusOnChange(
            'in_progress',
            {},
            {},
            false,
            false,
            ['form1'],
            metadata,
            taskConfig
        );
        expect(newStatus).toBe('in_progress');
    });

    it('should transition to done when external_action subtask is completed via metadata', () => {
        const taskConfig: Task = {
            id: 't1',
            title: 'T1',
            description: 'D1',
            module: 'housing',
            timeWindow: 'arrival',
            importance: 'critical',
            cityScope: [],
            dependencies: [],
            subtasks: [
                {
                    id: 'action1',
                    title: 'Action 1',
                    type: 'external_action',
                    actionType: 'housing_platform_signup',
                    providers: ['wg_gesucht']
                }
            ]
        };

        const metadata = {
            housing_platform_signup: {
                wg_gesucht: true
            }
        };

        const newStatus = computeTaskStatusOnChange(
            'in_progress',
            {},
            {},
            false,
            false,
            ['action1'],
            metadata,
            taskConfig
        );
        expect(newStatus).toBe('done');
    });
});
