import { X } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { Note } from '../../lib/notes';
import { NoteForm } from './NoteForm';

interface NoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    initialData?: Note | null;
    relatedTaskId?: string;
    onSave: () => void;
}

export function NoteModal({ isOpen, onClose, userId, initialData, relatedTaskId, onSave }: NoteModalProps) {
    const { t } = useI18n();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {initialData ? t('notes.editNote') : t('notes.newNote')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto">
                    <NoteForm
                        userId={userId}
                        initialData={initialData}
                        relatedTaskId={relatedTaskId}
                        onSave={() => {
                            onSave();
                            onClose();
                        }}
                        onCancel={onClose}
                    />
                </div>
            </div>
        </div>
    );
}
