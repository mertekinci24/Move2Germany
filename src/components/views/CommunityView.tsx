import { useState } from 'react';
import { TopicList } from '../community/TopicList';
import { TopicDetail } from '../community/TopicDetail';
import { CreateTopic } from '../community/CreateTopic';
import { Topic } from '../../lib/community';
import { Users, MessageCircle, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useI18n } from '../../contexts/I18nContext';

export function CommunityView() {
    const { t } = useI18n();
    const [view, setView] = useState<'list' | 'detail'>('list');
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [activeTab, setActiveTab] = useState<'forum' | 'chat'>('forum');

    const handleSelectTopic = (topic: Topic) => {
        setSelectedTopic(topic);
        setView('detail');
    };

    const handleBack = () => {
        setSelectedTopic(null);
        setView('list');
    };

    const handleCreated = () => {
        setShowCreate(false);
        // Ideally reload topics here, but TopicList re-mounts or we can add a refresh trigger
        // For now, just closing will trigger re-fetch if we pass a key or similar, 
        // but since TopicList fetches on mount, we might need to force update.
        // I'll add a key to TopicList to force re-render.
        setView('list');
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <Users className="w-8 h-8 mr-3 text-blue-600" />
                    {t('community.title')}
                </h1>

                <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => { setActiveTab('forum'); setView('list'); }}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center",
                            activeTab === 'forum' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {t('community.tabs.forum')}
                    </button>
                    <button
                        onClick={() => setActiveTab('chat')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center",
                            activeTab === 'chat' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        {t('community.tabs.chat')}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                {activeTab === 'forum' ? (
                    view === 'list' ? (
                        <TopicList
                            key={showCreate ? 'refresh' : 'list'} // Simple hack to refresh list after create
                            onSelectTopic={handleSelectTopic}
                            onCreateTopic={() => setShowCreate(true)}
                        />
                    ) : (
                        selectedTopic && <TopicDetail topic={selectedTopic} onBack={handleBack} />
                    )
                ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-white rounded-lg shadow-sm border border-dashed border-gray-300 text-center p-8">
                        <MessageCircle className="w-16 h-16 text-blue-200 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900">{t('community.chat.comingSoon')}</h3>
                        <p className="text-gray-500 max-w-md mt-2">
                            {t('community.chat.desc')}
                        </p>
                    </div>
                )}
            </div>

            {showCreate && (
                <CreateTopic
                    onClose={() => setShowCreate(false)}
                    onCreated={handleCreated}
                />
            )}
        </div>
    );
}
