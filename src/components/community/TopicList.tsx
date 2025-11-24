import { useState, useEffect } from 'react';
import { getTopics, type Topic } from '../../lib/community';
import { useAuth } from '../../contexts/AuthContext';
import { MessageSquare, User, Clock, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useI18n } from '../../contexts/I18nContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import { Badge } from '../ui/Badge';

type TopicListProps = {
    onSelectTopic: (topic: Topic) => void;
    onCreateTopic: () => void;
};

export function TopicList({ onSelectTopic, onCreateTopic }: TopicListProps) {
    const { user } = useAuth();
    const { t } = useI18n();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTopics();
    }, [user]);

    async function loadTopics() {
        if (!user) return;
        try {
            const data = await getTopics(user.primaryCityId || 'berlin');
            setTopics(data);
        } catch (error) {
            console.error('Failed to load topics:', error);
            toast.error(t('community.forum.error.loadTopics'));
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {t('community.forum.recentDiscussions')}
                </h2>
                <Button onClick={onCreateTopic} leftIcon={<Plus className="w-4 h-4" />}>
                    {t('community.forum.newTopic')}
                </Button>
            </div>

            {topics.length === 0 ? (
                <div className="py-8">
                    <EmptyState
                        icon={MessageSquare}
                        title={t('community.forum.noTopics')}
                        description={t('community.forum.noTopicsDesc')}
                        action={
                            <Button onClick={onCreateTopic} leftIcon={<Plus className="w-4 h-4" />}>
                                {t('community.forum.createTopic')}
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="space-y-3">
                    {topics.map(topic => (
                        <Card
                            key={topic.id}
                            onClick={() => onSelectTopic(topic)}
                            className="p-5 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-transparent hover:border-l-indigo-500 group"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                                        {topic.title}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 line-clamp-2">
                                        {topic.body}
                                    </p>
                                </div>
                                <Badge variant="secondary" className="shrink-0">
                                    {t(`community.forum.categories.${topic.module_id || 'general'}`) || topic.module_id}
                                </Badge>
                            </div>

                            <div className="flex items-center mt-4 text-xs text-slate-500 dark:text-slate-400 space-x-4">
                                <div className="flex items-center">
                                    <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                    <span className="font-medium text-slate-700 dark:text-slate-300">
                                        {topic.author?.email?.split('@')[0] || 'User'}
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                                    <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                                </div>
                                <div className="flex items-center ml-auto">
                                    <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
                                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                                        {topic.reply_count || 0} {t('community.forum.replies')}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
