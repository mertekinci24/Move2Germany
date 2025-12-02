import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getTasksWithStatus, type TaskWithStatus } from '../../lib/tasks';
import { TaskCard } from '../tasks/TaskCard';
import { TaskDetail } from '../tasks/TaskDetail';
import { configLoader } from '../../lib/config';
import { useI18n } from '../../contexts/I18nContext';
import { useJourneyPhase } from '../../contexts/JourneyPhaseContext';
import { PageHeader } from '../ui/PageHeader';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { CheckCircle2, Clock, AlertCircle, Layout } from 'lucide-react';

export function OverviewView() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const { currentPhase } = useJourneyPhase();
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskWithStatus | null>(null);

  async function loadTasks() {
    if (!user) return;
    try {
      const userTasks = await getTasksWithStatus(user.id, {
        cityId: user.primaryCityId || 'berlin',
        locale,
        personaType: user.personaType || null
      });
      setTasks(userTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }

  useEffect(() => {
    loadTasks();
  }, [user, locale]);

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.userTask?.status === 'done').length,
    inProgress: tasks.filter(t => t.userTask?.status === 'in_progress').length,
    blocked: tasks.filter(t => t.userTask?.status === 'blocked').length
  };

  const journeyPhases = configLoader.getJourneyPhases();
  const timeWindowOrder = Object.fromEntries(
    journeyPhases.map(p => [p.id, p.order])
  );

  const criticalTasks = tasks
    .filter(t => t.importance === 'critical' && t.userTask?.status !== 'done')
    .sort((a, b) => {
      const timeA = timeWindowOrder[a.timeWindow] || 999;
      const timeB = timeWindowOrder[b.timeWindow] || 999;
      return timeA - timeB;
    });

  const modules = configLoader.getModules();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title={t('overview.title')}
        subtitle={t('overview.subtitle')}
        action={
          <div className="hidden md:flex items-center px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium border border-indigo-100 dark:border-indigo-800">
            <Clock className="w-4 h-4 mr-2" />
            {t('journey.currentPhase')}: {t(`timeWindows.${currentPhase.id}`)}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center space-x-4 border-l-4 border-l-indigo-500">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
            <Layout className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('overview.totalTasks')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-4 border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('overview.completed')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-4 border-l-4 border-l-blue-500">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('overview.inProgress')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.inProgress}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center space-x-4 border-l-4 border-l-red-500">
          <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('overview.blocked')}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.blocked}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            {t('overview.criticalTasks')}
          </h3>

          {criticalTasks.length > 0 ? (
            <div className="grid gap-4">
              {criticalTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title={t('overview.noCriticalTasks')}
              description={t('overview.noCriticalTasksDesc')}
            />
          )}
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('overview.moduleProgress')}</h3>
          <div className="space-y-4">
            {modules.map(module => {
              const moduleTasks = tasks.filter(t => t.module === module.id);
              const completedModuleTasks = moduleTasks.filter(t => t.userTask?.status === 'done').length;
              const progress = moduleTasks.length > 0
                ? Math.round((completedModuleTasks / moduleTasks.length) * 100)
                : 0;

              return (
                <Card key={module.id} className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{t(`modules.${module.id}`)}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            loadTasks();
            setSelectedTask(null);
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
