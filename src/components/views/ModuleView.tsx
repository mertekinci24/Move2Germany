import { useState, useEffect, useCallback } from 'react';
import { TaskWithStatus, getTasksWithStatus } from '../../lib/tasks';
import { useAuth } from '../../contexts/AuthContext';
import { TaskCard } from '../tasks/TaskCard';
import { TaskDetail } from '../tasks/TaskDetail';
// import { configLoader } from '../../lib/config';
import { EventsDiscovery } from '../social/EventsDiscovery';
import { ScamDetector } from '../housing/ScamDetector';
import { cn } from '../../lib/utils';
import { useI18n } from '../../contexts/I18nContext';

type ModuleViewProps = {
  moduleId: 'housing' | 'bureaucracy' | 'work' | 'social';
  cityId: string;
  timeWindowId: string;
  searchQuery: string;
};

export function ModuleView({ moduleId, cityId, timeWindowId, searchQuery }: ModuleViewProps) {
  const { user } = useAuth();
  const { locale, t } = useI18n();
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'tasks' | 'events' | 'scam_detector'>('tasks');

  // const module = configLoader.getModule(moduleId);

  const loadTasks = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const allTasks = await getTasksWithStatus(user.id, {
        moduleId,
        cityId,
        timeWindowId,
        search: searchQuery,
        status: statusFilter !== 'all' ? statusFilter as 'todo' | 'in_progress' | 'done' | 'blocked' : undefined,
        locale,
        personaType: user.personaType || null
      });
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [user, moduleId, cityId, timeWindowId, searchQuery, statusFilter, locale]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.userTask?.status === 'done').length,
    pending: tasks.filter(t => !t.userTask || t.userTask.status === 'todo').length
  };

  if (loading) {
    return <div className="p-6">{t('common.loading')}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t(`modules.${moduleId}`)}</h1>
          <p className="text-gray-600 mt-2">
            {stats.completed} / {stats.total} {t('overview.completed')}
          </p>
        </div>

        {moduleId === 'social' ? (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('tasks')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === 'tasks' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t('common.tasks')}
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === 'events' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t('calendar.events')}
            </button>
          </div>
        ) : moduleId === 'housing' ? (
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('tasks')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === 'tasks' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t('common.tasks')}
            </button>
            <button
              onClick={() => setActiveTab('scam_detector')}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md transition-all",
                activeTab === 'scam_detector' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t('scamDetector.tabName')}
            </button>
          </div>
        ) : (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('common.all') || 'All'}</option>
            <option value="todo">{t('overview.todo')}</option>
            <option value="in_progress">{t('overview.inProgress')}</option>
            <option value="done">{t('overview.completed')}</option>
            <option value="blocked">{t('overview.blocked')}</option>
          </select>
        )}
      </div>

      {moduleId === 'social' && activeTab === 'events' ? (
        <EventsDiscovery />
      ) : moduleId === 'housing' && activeTab === 'scam_detector' ? (
        <ScamDetector />
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-4 mb-2">
              <span className="text-sm text-gray-600">{t('overview.moduleProgress')}</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-900">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
              </span>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow text-center">
              <p className="text-gray-600">{t('actionBlock.noResources')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            setSelectedTask(null);
            loadTasks();
          }}
          onNavigate={(taskId) => {
            const targetTask = tasks.find(t => t.id === taskId);
            if (targetTask) setSelectedTask(targetTask);
          }}
        />
      )}
    </div>
  );
}
