import React, { useEffect, useState } from 'react';
import { Plus, FileText, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { Note } from '../../lib/notes';
import { Button } from '../ui/Button';
import { useI18n } from '../../contexts/I18nContext';
import { NoteModal } from './NoteModal';

type SmartNoteListProps = {
    taskId: string;
    userId: string;
};

export function SmartNoteList({ taskId, userId }: SmartNoteListProps) {
    const { t } = useI18n();
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    useEffect(() => {
        loadNotes();
    }, [taskId]);

    async function loadNotes() {
        try {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', userId)
                .eq('related_task_id', taskId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error) {
            console.error('Error loading notes:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleCreateNote() {
        setSelectedNote(null);
        setIsModalOpen(true);
    }

    function handleNoteClick(note: Note) {
        setSelectedNote(note);
        setIsModalOpen(true);
    }

    if (loading) {
        return <div className="animate-pulse h-20 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>;
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    {t('tasks.detail.notes')}
                </h3>
                <Button size="sm" variant="secondary" onClick={handleCreateNote}>
                    <Plus className="w-4 h-4 mr-1" />
                    {t('notes.createLinked')}
                </Button>
            </div>

            {notes.length === 0 ? (
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                        {t('notes.emptyState')}
                    </p>
                    <Button variant="ghost" size="sm" onClick={handleCreateNote} className="text-indigo-600">
                        {t('notes.createFirst')}
                    </Button>
                </div>
            ) : (
                <div className="grid gap-3">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => handleNoteClick(note)}
                            className="group relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-3 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="font-medium text-slate-900 dark:text-white truncate pr-6">
                                    {note.title}
                                </h4>
                                {note.event_date && (
                                    <span className="text-xs text-slate-500 flex items-center bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                                        <CalendarIcon className="w-3 h-3 mr-1" />
                                        {format(new Date(note.event_date), 'MMM d')}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                                {note.content}
                            </p>
                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            )}

            <NoteModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                userId={userId}
                initialData={selectedNote}
                relatedTaskId={taskId}
                onSave={loadNotes}
            />
        </div>
    );
}
