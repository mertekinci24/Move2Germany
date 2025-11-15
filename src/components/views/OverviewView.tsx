import { useState, useEffect } from 'react';
import { TaskWithStatus, getTasksWithStatus } from '../../lib/tasks';
import { useAuth } from '../../contexts/AuthContext';
import { TaskCard } from '../tasks/TaskCard';
import { TaskDetail } from '../tasks/TaskDetail';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { configLoader } from '../../lib/config';

type OverviewViewProps = {
  cityId: string;
  timeWindowId: string;
  searchQuery: string;
};

export function OverviewView({ cityId, timeWindowId, searchQuery }: OverviewViewProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithStatus | null>(null);

  const modules = configLoader.getModules();

  useEffect(() => {
    loadTasks();
  }, [cityId, timeWindowId, searchQuery]);

  async function loadTasks() {
    if (!user) return;

    setLoading(true);
    try {
      const allTasks = await getTasksWithStatus(user.id, {
        cityId,
        timeWindowId,
        search: searchQuery
      });
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.userTask?.status === 'done').length,
    inProgress: tasks.filter(t => t.userTask?.status === 'in_progress').length,
    blocked: tasks.filter(t => t.userTask?.status === 'blocked').length
  };

  const criticalTasks = tasks.filter(t =>
    t.importance === 'critical' &&
    t.userTask?.status !== 'done'
  ).slice(0, 5);

  const moduleStats = modules.map(module => {
    const moduleTasks = tasks.filter(t => t.module === module.id);
    const completed = moduleTasks.filter(t => t.userTask?.status === 'done').length;
    return {
      module,
      total: moduleTasks.length,
      completed,
      percentage: moduleTasks.length > 0 ? Math.round((completed / moduleTasks.length) * 100) : 0
    };
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Overview</h1>
        <p className="text-gray-600 mt-2">Your 90-day journey at a glance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tasks</p>
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blocked</p>
              <p className="text-3xl font-bold text-red-600">{stats.blocked}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Module Progress</h2>
          <div className="space-y-4">
            {moduleStats.map(stat => (
              <div key={stat.module.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{stat.module.label}</span>
                  <span className="text-sm text-gray-600">
                    {stat.completed} / {stat.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Critical Tasks</h2>
          {criticalTasks.length === 0 ? (
            <p className="text-gray-600">No critical tasks pending</p>
          ) : (
            <div className="space-y-3">
              {criticalTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => setSelectedTask(task)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            setSelectedTask(null);
            loadTasks();
          }}
        />
      )}
    </div>
  );
}
