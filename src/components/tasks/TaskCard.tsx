import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { TaskWithStatus } from '../../lib/tasks';
import { configLoader } from '../../lib/config';
import { useI18n } from '../../contexts/I18nContext';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

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

const moduleVariants = {
  housing: 'success',
  bureaucracy: 'info',
  work: 'warning',
  social: 'secondary'
} as const;

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { t } = useI18n();
  const module = configLoader.getModule(task.module);
  const timeWindow = configLoader.getTimeWindow(task.timeWindow);
  const status = task.userTask?.status || 'todo';

  const StatusIcon = statusIcons[status];

  const getStatusColor = () => {
    switch (status) {
      case 'done': return 'text-emerald-600 dark:text-emerald-400';
      case 'blocked': return 'text-red-600 dark:text-red-400';
      case 'in_progress': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-slate-400 dark:text-slate-500';
    }
  };

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer hover:shadow-md transition-all border-l-4 ${task.importance === 'critical' ? 'border-l-red-500' :
        task.importance === 'high' ? 'border-l-orange-500' :
          'border-l-transparent'
        }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <StatusIcon className={`w-5 h-5 flex-shrink-0 ${getStatusColor()}`} />
            <h3 className="font-semibold text-slate-900 dark:text-white truncate">{task.title}</h3>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">{task.description}</p>

          <div className="flex flex-wrap gap-2">
            {module?.id && (
              <Badge variant={moduleVariants[module.id as keyof typeof moduleVariants] || 'secondary'}>
                {t(`modules.${module.id}`)}
              </Badge>
            )}

            {timeWindow?.id && (
              <Badge variant="outline">
                {t(`timeWindows.${timeWindow.id}`)}
              </Badge>
            )}

            {task.importance === 'critical' && (
              <Badge variant="danger">
                {t('tasks.importance.critical')}
              </Badge>
            )}

            {task.dependencies.length > 0 && (
              <Badge variant="warning" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {task.dependencies.length} {t('tasks.card.dependencies')}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
