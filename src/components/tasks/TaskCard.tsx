
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { TaskWithStatus } from '../../lib/tasks';
import { configLoader } from '../../lib/config';
import { useI18n } from '../../contexts/I18nContext';

type TaskCardProps = {
  task: TaskWithStatus;
  onClick: () => void;
};

const statusIcons = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  blocked: AlertCircle
};

const importanceColors = {
  critical: 'border-l-red-500 bg-red-50',
  high: 'border-l-orange-500 bg-orange-50',
  medium: 'border-l-blue-500 bg-blue-50'
};

const moduleColors = {
  housing: 'bg-green-100 text-green-800',
  bureaucracy: 'bg-blue-100 text-blue-800',
  work: 'bg-purple-100 text-purple-800',
  social: 'bg-pink-100 text-pink-800'
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { t } = useI18n();
  const module = configLoader.getModule(task.module);
  const timeWindow = configLoader.getTimeWindow(task.timeWindow);
  const status = task.userTask?.status || 'todo';

  const StatusIcon = statusIcons[status];

  return (
    <div
      onClick={onClick}
      className={`border-l-4 ${importanceColors[task.importance]} p-4 rounded-lg cursor-pointer hover:shadow-md transition-shadow bg-white`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <StatusIcon className={`w-5 h-5 ${
              status === 'done' ? 'text-green-600' :
              status === 'blocked' ? 'text-red-600' :
              status === 'in_progress' ? 'text-blue-600' :
              'text-gray-400'
            }`} />
            <h3 className="font-semibold text-gray-900">{task.title}</h3>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${moduleColors[task.module]}`}>
              {module?.id && t(`modules.${module.id}`)}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              {timeWindow?.id && t(`timeWindows.${timeWindow.id}`)}
            </span>
            {task.importance === 'critical' && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {t('tasks.critical')}
              </span>
            )}
            {task.dependencies.length > 0 && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                {task.dependencies.length} dependencies
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
