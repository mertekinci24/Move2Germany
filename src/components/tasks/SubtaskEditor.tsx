import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUserSubtasks, createUserSubtask, updateUserSubtask, deleteUserSubtask, UserSubtask } from '../../lib/tasks';
import { useI18n } from '../../contexts/I18nContext';

type SubtaskEditorProps = {
    userId: string;
    taskId: string;
};

export function SubtaskEditor({ userId, taskId }: SubtaskEditorProps) {
    const { t } = useI18n();
    const [subtasks, setSubtasks] = useState<UserSubtask[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadSubtasks();
    }, [userId, taskId]);

    async function loadSubtasks() {
        try {
            const data = await getUserSubtasks(userId, taskId);
            setSubtasks(data);
        } catch (error) {
            console.error('Failed to load subtasks', error);
        }
    }

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!newTitle.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const tempSubtask: UserSubtask = {
            id: tempId,
            userId,
            taskId,
            title: newTitle,
            isCompleted: false,
            order: subtasks.length, // Approximate order
            createdAt: new Date().toISOString()
        };

        // Optimistic update
        setSubtasks([...subtasks, tempSubtask]);
        setNewTitle('');
        setIsLoading(true);

        try {
            const newSubtask = await createUserSubtask(userId, taskId, tempSubtask.title);
            // Replace temp with real
            setSubtasks(prev => prev.map(s => s.id === tempId ? newSubtask : s));
        } catch (error) {
            console.error('Failed to create subtask', error);
            setSubtasks(prev => prev.filter(s => s.id !== tempId));
            toast.error(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    }

    async function handleToggle(subtask: UserSubtask) {
        try {
            const updated = await updateUserSubtask(subtask.id, { isCompleted: !subtask.isCompleted });
            setSubtasks(subtasks.map(s => s.id === subtask.id ? updated : s));
        } catch (error) {
            console.error('Failed to update subtask', error);
        }
    }

    async function handleDelete(id: string) {
        try {
            await deleteUserSubtask(id);
            setSubtasks(subtasks.filter(s => s.id !== id));
        } catch (error) {
            console.error('Failed to delete subtask', error);
        }
    }

    return (
        <div className="space-y-4 mt-6 border-t pt-6 dark:border-slate-800">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('tasks.detail.mySubtasks') || 'My To-Do List'}
            </h3>

            <div className="space-y-2">
                {subtasks.map(subtask => (
                    <div
                        key={subtask.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 group"
                    >
                        <div
                            className="flex items-center flex-1 cursor-pointer"
                            onClick={() => handleToggle(subtask)}
                        >
                            <div className={`mr-3 ${subtask.isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                                {subtask.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </div>
                            <span className={`text-sm ${subtask.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                                {subtask.title}
                            </span>
                        </div>
                        <button
                            onClick={() => handleDelete(subtask.id)}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>

            <form onSubmit={handleAdd} className="flex gap-2">
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={t('tasks.detail.addSubtaskPlaceholder') || "Add a new step..."}
                    className="flex-1 rounded-md border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    type="submit"
                    disabled={!newTitle.trim() || isLoading}
                    aria-label={t('tasks.detail.addSubtaskPlaceholder')}
                    className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}
