import { useState, useEffect } from 'react';
import { getReplies, createReply, type Topic, type Reply } from '../../lib/community';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Send, User, Clock, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useI18n } from '../../contexts/I18nContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';

type TopicDetailProps = {
    topic: Topic;
    onBack: () => void;
};

export function TopicDetail({ topic, onBack }: TopicDetailProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const [replies, setReplies] = useState<Reply[]>([]);
    const [loading, setLoading] = useState(true);
    const [newReply, setNewReply] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadReplies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topic.id]);

    async function loadReplies() {
        try {
            const data = await getReplies(topic.id);
            setReplies(data);
        } catch (error) {
            console.error('Failed to load replies:', error);
            toast.error(t('community.forum.error.loadReplies'));
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!user || !newReply.trim()) return;

        setSubmitting(true);
        try {
            const reply = await createReply({
                topic_id: topic.id,
                author_id: user.id,
                body: newReply,
            });
            const replyWithAuthor = { ...reply, author: { email: user.email || 'You' } };
            setReplies([...replies, replyWithAuthor]);
            setNewReply('');
            toast.success(t('community.forum.success.replyPosted'));
        } catch (error) {
            console.error('Failed to post reply:', error);
            toast.error(t('community.forum.error.postReply'));
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex flex-col h-full space-y-6">
            <div>
                <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    {t('community.forum.backToDiscussions')}
                </Button>
            </div>

            <Card className="p-6">
                <div className="flex justify-between items-start mb-4 gap-4">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{topic.title}</h1>
                    <Badge variant="secondary" className="shrink-0">
                        {t(`community.forum.categories.${topic.module_id || 'general'}`) || topic.module_id}
                    </Badge>
                </div>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-6 leading-relaxed">
                    {topic.body}
                </p>
                <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center mr-6">
                        <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <span className="font-medium">{topic.author?.email?.split('@')[0] || 'User'}</span>
                    </div>
                    <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                    </div>
                </div>
            </Card>

            <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center sticky top-0 bg-slate-50 dark:bg-slate-950 py-2 z-10">
                    <MessageSquare className="w-5 h-5 mr-2 text-indigo-500" />
                    {replies.length} {t('community.forum.replies')}
                </h3>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
                    </div>
                ) : replies.length === 0 ? (
                    <div className="py-8">
                        <EmptyState
                            icon={MessageSquare}
                            title={t('community.forum.noReplies')}
                            description=""
                        />
                    </div>
                ) : (
                    replies.map(reply => (
                        <Card key={reply.id} className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap mb-3">{reply.body}</p>
                            <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 space-x-3">
                                <div className="flex items-center">
                                    <User className="w-3 h-3 mr-1 text-slate-400" />
                                    <span className="font-medium">{reply.author?.email?.split('@')[0] || 'User'}</span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1 text-slate-400" />
                                    <span>{formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}</span>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Card className="mt-auto p-4 sticky bottom-0 z-10 shadow-lg border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSubmit} className="flex gap-3">
                    <input
                        type="text"
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        placeholder={t('community.forum.writeReply')}
                        className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        disabled={submitting}
                    />
                    <Button
                        type="submit"
                        disabled={submitting || !newReply.trim()}
                        isLoading={submitting}
                        rightIcon={<Send className="w-4 h-4" />}
                    >
                        {t('community.forum.reply')}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
