import { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Note, createNote, updateNote } from '../../lib/notes';
import { configLoader } from '../../lib/config';
import { Task } from '../../lib/types';
import { Button } from '../ui/Button';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';

interface NoteFormProps {
    userId: string;
    initialData?: Note | null;
    relatedTaskId?: string;
    onSave: () => void;
    onCancel: () => void;
}

export function NoteForm({ userId, initialData, relatedTaskId: initialRelatedTaskId, onSave, onCancel }: NoteFormProps) {
    const { t } = useI18n();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [relatedTaskId, setRelatedTaskId] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadTasks();
        if (initialData) {
            setTitle(initialData.title);
            setContent(initialData.content || '');
            setRelatedTaskId(initialData.related_task_id || '');
            setEventDate(initialData.event_date ? new Date(initialData.event_date).toISOString().slice(0, 10) : '');
        } else {
            // Reset form for new note
            setTitle('');
            setContent('');
            setRelatedTaskId(initialRelatedTaskId || '');
            setEventDate('');
        }
    }, [initialData, initialRelatedTaskId, t]);

    function loadTasks() {
        const tasks = configLoader.getTasksForLocale(t('common.languageCode') || 'en');
        setAvailableTasks(tasks);
    }

    async function handleSave() {
        if (!title.trim()) {
            toast.error(t('notes.error.titleRequired'));
            return;
        }

        setSaving(true);
        try {
            if (initialData) {
                await updateNote(initialData.id, {
                    title,
                    content,
                    related_task_id: relatedTaskId || undefined,
                    event_date: eventDate || undefined
                });
                toast.success(t('notes.success.updated'));
            } else {
                await createNote({
                    user_id: userId,
                    title,
                    content,
                    related_task_id: relatedTaskId || undefined,
                    event_date: eventDate || undefined,
                });
                toast.success(t('notes.success.created'));
            }
            onSave();
        } catch (error) {
            console.error('Error saving note:', error);
            toast.error(t('notes.error.save'));
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-4 flex-1 flex flex-col h-full">
            <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('notes.noteTitle')}
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('notes.titlePlaceholder')}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Related Task Selector */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('notes.relatedTask')}
                    </label>
                    <select
                        value={relatedTaskId}
                        onChange={(e) => setRelatedTaskId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">{t('notes.selectTask')}</option>
                        {availableTasks.map(task => (
                            <option key={task.id} value={task.id}>
                                {task.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Event Date Picker */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {t('notes.eventDate')}
                    </label>
                    <input
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            <div className="flex-1 flex flex-col min-h-[200px]">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {t('notes.noteContent')}
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t('notes.contentPlaceholder')}
                    className="w-full flex-1 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={onCancel}>
                    {t('common.cancel')}
                </Button>
                <Button
                    onClick={handleSave}
                    isLoading={saving}
                    leftIcon={<Save className="w-4 h-4" />}
                >
                    {t('common.save')}
                </Button>
            </div>
        </div>
    );
}
