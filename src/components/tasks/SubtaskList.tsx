import { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Task } from '../../lib/config';
import { UserTask } from '../../lib/tasks';
import { useI18n } from '../../contexts/I18nContext';

type SubtaskListProps = {
    task: Task;
    userTask?: UserTask;
    linkedSubtaskStatus?: Record<string, boolean>;
    onToggle: (subtaskId: string, completed: boolean) => void;
    onNavigate?: (taskId: string) => void;
    onMetadataChange?: (key: string, value: any) => void;
};

export function SubtaskList({ task, userTask, linkedSubtaskStatus, onToggle, onNavigate, onMetadataChange }: SubtaskListProps) {
    const { t } = useI18n();
    const subtasks = task.subtasks || [];

    if (subtasks.length === 0) return null;

    return (
        <div className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                {t('tasks.detail.subtasks')}
            </h3>
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
        </div>
    );
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
                        <span>Go to task</span>
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
                                    placeholder={`Enter ${field}...`}
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
                        return (
                            <div key={providerId} className="flex items-center justify-between text-sm">
                                <span className="text-slate-600 dark:text-slate-400 capitalize">{providerId.replace('_', ' ')}</span>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isProviderDone}
                                        onChange={(e) => {
                                            onMetadataChange?.(subtask.actionType, { ...actionProgress, [providerId]: e.target.checked });
                                        }}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-slate-500">Signed up</span>
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
