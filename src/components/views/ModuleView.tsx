import { useState, useEffect } from 'react';
import { TaskWithStatus, getTasksWithStatus } from '../../lib/tasks';
import { useAuth } from '../../contexts/AuthContext';
import { TaskCard } from '../tasks/TaskCard';
import { TaskDetail } from '../tasks/TaskDetail';
import { configLoader } from '../../lib/config';

type ModuleViewProps = {
  moduleId: 'housing' | 'bureaucracy' | 'work' | 'social';
  cityId: string;
  timeWindowId: string;
  searchQuery: string;
};

export function ModuleView({ moduleId, cityId, timeWindowId, searchQuery }: ModuleViewProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskWithStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const module = configLoader.getModule(moduleId);

  useEffect(() => {
    loadTasks();
  }, [moduleId, cityId, timeWindowId, searchQuery, statusFilter]);

  async function loadTasks() {
    if (!user) return;

    setLoading(true);
    try {
      const allTasks = await getTasksWithStatus(user.id, {
        moduleId,
        cityId,
        timeWindowId,
        search: searchQuery,
        status: statusFilter !== 'all' ? statusFilter as any : undefined
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
    pending: tasks.filter(t => !t.userTask || t.userTask.status === 'todo').length
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{module?.label}</h1>
          <p className="text-gray-600 mt-2">
            {stats.completed} of {stats.total} tasks completed
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-4 mb-2">
          <span className="text-sm text-gray-600">Progress</span>
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
          <p className="text-gray-600">No tasks found for the current filters</p>
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
