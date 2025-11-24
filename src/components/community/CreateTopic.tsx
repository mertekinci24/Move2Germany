import { useState } from 'react';
import { createTopic } from '../../lib/community';
import { useAuth } from '../../contexts/AuthContext';
import { X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

type CreateTopicProps = {
    onClose: () => void;
    onCreated: () => void;
};

export function CreateTopic({ onClose, onCreated }: CreateTopicProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const [form, setForm] = useState({ title: '', body: '', module_id: 'general' });
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user) return;
        if (!form.title.trim() || !form.body.trim()) {
            toast.error(t('community.forum.error.fillAll'));
            return;
        }

        setSubmitting(true);
        try {
            await createTopic({
                author_id: user.id,
                city_id: user.primaryCityId || 'berlin',
                title: form.title,
                body: form.body,
                module_id: form.module_id,
                status: 'active'
            });
            toast.success(t('community.forum.success.created'));
            onCreated();
        } catch (error) {
            console.error('Failed to create topic:', error);
            toast.error(t('community.forum.error.createTopic'));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 p-0 overflow-hidden shadow-2xl">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('community.forum.createTopic')}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t('community.forum.topicTitle')}
                        </label>
                        <input
                            type="text"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={t('community.forum.titlePlaceholder')}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t('community.forum.topicCategory')}
                        </label>
                        <select
                            value={form.module_id}
                            onChange={e => setForm({ ...form, module_id: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="general">{t('community.forum.categories.general')}</option>
                            <option value="housing">{t('community.forum.categories.housing')}</option>
                            <option value="bureaucracy">{t('community.forum.categories.bureaucracy')}</option>
                            <option value="social">{t('community.forum.categories.social')}</option>
                            <option value="jobs">{t('community.forum.categories.jobs')}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t('community.forum.topicContent')}
                        </label>
                        <textarea
                            value={form.body}
                            onChange={e => setForm({ ...form, body: e.target.value })}
                            className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                            placeholder={t('community.forum.contentPlaceholder')}
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                        <Button variant="ghost" onClick={onClose}>
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            isLoading={submitting}
                            leftIcon={<Save className="w-4 h-4" />}
                        >
                            {submitting ? t('community.forum.posting') : t('community.forum.postTopic')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
}
