import { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Note, getNotes, deleteNote } from '../../lib/notes';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Plus, Trash2, Edit2, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';
import { NoteForm } from '../notes/NoteForm';

interface NotesViewProps {
    userId: string;
}

export function NotesView({ userId }: NotesViewProps) {
    const { t } = useI18n();
    const location = useLocation();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [relatedTaskId, setRelatedTaskId] = useState('');

    useEffect(() => {
        loadNotes();

        // Check for pre-filled task from navigation state
        if (location.state?.relatedTaskId) {
            setRelatedTaskId(location.state.relatedTaskId);
            setIsCreating(true);
            window.history.replaceState({}, document.title);
        }
    }, [userId, t]);

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
        setIsCreating(false);
        setRelatedTaskId('');
    }

    function startCreate() {
        setEditingNote(null);
        setIsCreating(true);
        setRelatedTaskId('');
    }

    function cancelEdit() {
        setEditingNote(null);
        setIsCreating(false);
        setRelatedTaskId('');
    }

    function handleSave() {
        setEditingNote(null);
        setIsCreating(false);
        setRelatedTaskId('');
        loadNotes();
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
                                        {note.content || t('common.noContent')}
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

                            <NoteForm
                                userId={userId}
                                initialData={editingNote}
                                relatedTaskId={relatedTaskId}
                                onSave={handleSave}
                                onCancel={cancelEdit}
                            />
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
