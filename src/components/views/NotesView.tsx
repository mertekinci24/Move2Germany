import { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Note, getNotes, createNote, updateNote, deleteNote } from '../../lib/notes';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Plus, Trash2, Save, X, Edit2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface NotesViewProps {
    userId: string;
}

export function NotesView({ userId }: NotesViewProps) {
    const { t } = useI18n();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadNotes();
    }, [userId]);

    async function loadNotes() {
        try {
            setLoading(true);
            const data = await getNotes(userId);
            setNotes(data);
        } catch (error) {
            console.error('Error loading notes:', error);
            toast.error(t('notes.error.load'));
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!title.trim()) {
            toast.error(t('notes.error.titleRequired'));
            return;
        }

        setSaving(true);
        try {
            if (editingNote) {
                await updateNote(editingNote.id, { title, content });
                toast.success(t('notes.success.updated'));
            } else {
                await createNote({
                    user_id: userId,
                    title,
                    content,
                    // tags: [] // Future: Add tags support
                });
                toast.success(t('notes.success.created'));
            }

            setTitle('');
            setContent('');
            setEditingNote(null);
            setIsCreating(false);
            loadNotes();
        } catch (error) {
            console.error('Error saving note:', error);
            toast.error(t('notes.error.save'));
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm(t('notes.deleteConfirm'))) return;

        try {
            await deleteNote(id);
            toast.success(t('notes.success.deleted'));
            loadNotes();
            if (editingNote?.id === id) {
                setEditingNote(null);
                setIsCreating(false);
            }
        } catch (error) {
            console.error('Error deleting note:', error);
            toast.error(t('notes.error.delete'));
        }
    }

    function startEdit(note: Note) {
        setEditingNote(note);
        setTitle(note.title);
        setContent(note.content || '');
        setIsCreating(false);
    }

    function startCreate() {
        setEditingNote(null);
        setTitle('');
        setContent('');
        setIsCreating(true);
    }

    function cancelEdit() {
        setEditingNote(null);
        setIsCreating(false);
        setTitle('');
        setContent('');
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title={t('notes.title')}
                subtitle={t('notes.subtitle')}
                action={
                    !isCreating && !editingNote && (
                        <Button onClick={startCreate} leftIcon={<Plus className="w-4 h-4" />}>
                            {t('notes.newNote')}
                        </Button>
                    )
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Note List */}
                <div className="lg:col-span-1 space-y-4">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                            <p>{t('notes.emptyState')}</p>
                            <Button variant="ghost" size="sm" onClick={startCreate} className="mt-2">
                                {t('notes.newNote')}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notes.map((note) => (
                                <div
                                    key={note.id}
                                    onClick={() => startEdit(note)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${editingNote?.id === note.id
                                        ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800'
                                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-medium text-slate-900 dark:text-white truncate pr-2">
                                            {note.title}
                                        </h3>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(note.id);
                                            }}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 h-10">
                                        {note.content || 'No content'}
                                    </p>
                                    <div className="mt-2 text-xs text-slate-400">
                                        {new Date(note.updated_at).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Editor Area */}
                <div className="lg:col-span-2">
                    {(isCreating || editingNote) ? (
                        <Card className="h-full min-h-[500px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    {isCreating ? (
                                        <><Plus className="w-5 h-5 text-indigo-500" /> {t('notes.newNote')}</>
                                    ) : (
                                        <><Edit2 className="w-5 h-5 text-indigo-500" /> {t('notes.editNote')}</>
                                    )}
                                </h2>
                                <Button variant="ghost" size="sm" onClick={cancelEdit} leftIcon={<X className="w-4 h-4" />}>
                                    {t('common.cancel')}
                                </Button>
                            </div>

                            <div className="space-y-4 flex-1 flex flex-col">
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

                                <div className="flex-1 flex flex-col">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        {t('notes.noteContent')}
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder={t('notes.contentPlaceholder')}
                                        className="w-full flex-1 p-3 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none min-h-[300px]"
                                    />
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        onClick={handleSave}
                                        isLoading={saving}
                                        leftIcon={<Save className="w-4 h-4" />}
                                    >
                                        {t('common.save')}
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        <div className="h-full min-h-[400px] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <EmptyState
                                icon={FileText}
                                title={t('notes.title')}
                                description={t('notes.subtitle')}
                                action={
                                    <Button onClick={startCreate} leftIcon={<Plus className="w-4 h-4" />}>
                                        {t('notes.newNote')}
                                    </Button>
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
