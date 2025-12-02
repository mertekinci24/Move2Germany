import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ArrowRight, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Task } from '../../lib/config';
import { UserTask, UserSubtask, getUserSubtasks, createUserSubtask, updateUserSubtask, deleteUserSubtask } from '../../lib/tasks';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import externalServicesConfig from '../../../config/external_services.json';

type SubtaskListProps = {
    task: Task;
    userTask?: Partial<UserTask>;
    linkedSubtaskStatus?: Record<string, boolean>;
    onToggle: (subtaskId: string, completed: boolean) => void;
    onNavigate?: (taskId: string) => void;
    onMetadataChange?: (key: string, value: any) => void;
};

export function SubtaskList({ task, userTask, linkedSubtaskStatus, onToggle, onNavigate, onMetadataChange }: SubtaskListProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const [userSubtasks, setUserSubtasks] = useState<UserSubtask[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [saving, setSaving] = useState(false);

    const subtasks = task.subtasks || [];

    // Fetch user subtasks
    useEffect(() => {
        if (user) {
            loadUserSubtasks();
        }
    }, [user, task.id]);

    async function loadUserSubtasks() {
        if (!user) return;
        try {
            const loaded = await getUserSubtasks(user.id, task.id);
            setUserSubtasks(loaded);
        } catch (error) {
            console.error('Failed to load user subtasks:', error);
        }
    }

    async function handleAddSubtask() {
        if (!user || !newSubtaskTitle.trim()) return;

        setSaving(true);
        try {
            const newSubtask = await createUserSubtask(user.id, task.id, newSubtaskTitle.trim());
            setUserSubtasks([...userSubtasks, newSubtask]); // Optimistic update
            setNewSubtaskTitle('');
            setIsAdding(false);
        } catch (error) {
            console.error('Failed to create subtask:', error);
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleUserSubtask(subtask: UserSubtask) {
        // Optimistic update
        setUserSubtasks(prev => prev.map(s =>
            s.id === subtask.id ? { ...s, isCompleted: !s.isCompleted } : s
        ));

        try {
            await updateUserSubtask(subtask.id, { isCompleted: !subtask.isCompleted });
        } catch (error) {
            console.error('Failed to toggle subtask:', error);
            // Revert on error
            setUserSubtasks(prev => prev.map(s =>
                s.id === subtask.id ? { ...s, isCompleted: !s.isCompleted } : s
            ));
        }
    }

    async function handleDeleteUserSubtask(id: string) {
        if (!confirm(t('tasks.subtask.custom.deleteConfirm'))) return;

        // Optimistic deletion
        setUserSubtasks(prev => prev.filter(s => s.id !== id));

        try {
            await deleteUserSubtask(id);
        } catch (error) {
            console.error('Failed to delete subtask:', error);
            // Reload on error
            loadUserSubtasks();
        }
    }

    // if (subtasks.length === 0 && userSubtasks.length === 0 && !isAdding) return null;

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                {t('tasks.detail.subtasks')}
            </h3>

            {/* Canonical Subtasks */}
            <div className="space-y-2">
                {subtasks.map(subtask => (
                    <SubtaskItem
                        key={subtask.id}
                        subtask={subtask}
                        userTask={userTask}
                        linkedSubtaskStatus={linkedSubtaskStatus}
                        onToggle={onToggle}
                        onNavigate={onNavigate}
                        onMetadataChange={onMetadataChange}
                        t={t}
                    />
                ))}
            </div>

            {/* User Custom Subtasks */}
            {userSubtasks.length > 0 && (
                <div className="mt-4 space-y-2">
                    {userSubtasks.map(subtask => (
                        <div
                            key={subtask.id}
                            className={`flex items-start p-3 rounded-lg border transition-all ${subtask.isCompleted
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                                }`}
                        >
                            <div
                                onClick={() => handleToggleUserSubtask(subtask)}
                                className={`mt-0.5 mr-3 flex-shrink-0 cursor-pointer ${subtask.isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-400'
                                    }`}
                            >
                                {subtask.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </div>
                            <div className="flex-1">
                                <span className={`text-sm ${subtask.isCompleted
                                    ? 'text-slate-600 dark:text-slate-400 line-through'
                                    : 'text-slate-900 dark:text-white'
                                    }`}>
                                    {subtask.title}
                                </span>
                                <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                                    {t('tasks.subtask.custom.badge')}
                                </span>
                            </div>
                            <button
                                onClick={() => handleDeleteUserSubtask(subtask.id)}
                                className="ml-2 p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Delete"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Subtask Form */}
            {isAdding ? (
                <div className="mt-3 p-3 border border-indigo-200 dark:border-indigo-800 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                    <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddSubtask();
                            if (e.key === 'Escape') { setIsAdding(false); setNewSubtaskTitle(''); }
                        }}
                        placeholder={t('tasks.subtask.custom.placeholder')}
                        className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                        autoFocus
                        disabled={saving}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleAddSubtask}
                            disabled={saving || !newSubtaskTitle.trim()}
                            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? t('common.loading') : t('tasks.subtask.custom.save')}
                        </button>
                        <button
                            onClick={() => { setIsAdding(false); setNewSubtaskTitle(''); }}
                            disabled={saving}
                            className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            {t('tasks.subtask.custom.cancel')}
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setIsAdding(true)}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:border-indigo-400 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">{t('tasks.subtask.custom.add')}</span>
                </button>
            )}
        </div>
    );
}

// Helper function to find service across all categories
function findService(providerId: string) {
    const categories = (externalServicesConfig as any).categories || {};
    for (const category of Object.values(categories)) {
        const service = (category as any).services?.find((s: any) => s.id === providerId);
        if (service) return service;
    }
    return null;
}

function SubtaskItem({
    subtask,
    userTask,
    linkedSubtaskStatus,
    onToggle,
    onNavigate,
    onMetadataChange,
    t
}: any) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (subtask.type === 'linked_task') {
        const isCompleted = linkedSubtaskStatus?.[subtask.id] || false;
        return (
            <div
                onClick={() => onNavigate?.(subtask.linkedTaskId)}
                className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${isCompleted
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
            >
                <div className={`mt-0.5 mr-3 flex-shrink-0 ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-blue-400'}`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                    <p className={`text-sm font-medium ${isCompleted ? 'text-green-900 dark:text-green-100 line-through' : 'text-slate-900 dark:text-white'}`}>
                        {subtask.title}
                    </p>
                    <div className="flex items-center mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                        <span>{t('tasks.subtask.linked.goToTask')}</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                </div>
            </div>
        );
    }

    if (subtask.type === 'form_criteria') {
        const criteria = userTask?.metadata?.[subtask.criteriaKey] || {};
        const isFilled = subtask.fields.every((f: string) => criteria[f]);

        return (
            <div className="border rounded-lg p-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center">
                        <div className={`mr-3 ${isFilled ? 'text-green-600' : 'text-slate-400'}`}>
                            {isFilled ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{subtask.title}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>

                {isExpanded && (
                    <div className="mt-3 pl-8 space-y-3">
                        {subtask.fields.map((field: string) => (
                            <div key={field}>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 capitalize">
                                    {field.replace(/([A-Z])/g, ' $1').trim()}
                                </label>
                                <input
                                    type={field.toLowerCase().includes('rent') || field.toLowerCase().includes('size') ? 'number' : 'text'}
                                    value={criteria[field] || ''}
                                    onChange={(e) => {
                                        const newVal = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
                                        onMetadataChange?.(subtask.criteriaKey, { ...criteria, [field]: newVal });
                                    }}
                                    className="w-full text-sm rounded-md border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                                    placeholder={t('tasks.subtask.formCriteria.placeholder', { field: field.replace(/([A-Z])/g, ' $1').trim() })}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (subtask.type === 'external_action') {
        const actionProgress = userTask?.metadata?.[subtask.actionType] || {};
        const isCompleted = Object.values(actionProgress).some(v => v === true);

        return (
            <div className="border rounded-lg p-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="flex items-center mb-2">
                    <div className={`mr-3 ${isCompleted ? 'text-green-600' : 'text-slate-400'}`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{subtask.title}</span>
                </div>
                <div className="pl-8 space-y-2">
                    {subtask.providers?.map((providerId: string) => {
                        const isProviderDone = actionProgress[providerId] || false;
                        const platform = findService(providerId);
                        return (
                            <div key={providerId} className="flex items-center justify-between text-sm gap-2">
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="text-slate-600 dark:text-slate-400 capitalize">{providerId.replace(/_/g, ' ')}</span>
                                    {platform && (
                                        <a
                                            href={platform.baseUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                                        >
                                            {t('tasks.subtask.externalAction.visit')} →
                                        </a>
                                    )}
                                </div>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isProviderDone}
                                        onChange={(e) => {
                                            onMetadataChange?.(subtask.actionType, { ...actionProgress, [providerId]: e.target.checked });
                                        }}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-slate-500">{t('tasks.subtask.externalAction.markDone')}</span>
                                </label>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    // Simple subtask
    const isCompleted = userTask?.subtaskProgress?.[subtask.id] || false;
    return (
        <div
            onClick={() => onToggle(subtask.id, !isCompleted)}
            className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${isCompleted
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
        >
            <div className={`mt-0.5 mr-3 flex-shrink-0 ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}`}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </div>
            <div className="flex-1">
                <p className={`text-sm font-medium ${isCompleted ? 'text-green-900 dark:text-green-100 line-through' : 'text-slate-900 dark:text-white'}`}>
                    {subtask.title}
                </p>
                {!subtask.required && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                        {t('common.optional')}
                    </span>
                )}
            </div>
        </div>
    );
}
