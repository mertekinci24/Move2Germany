import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Trash2, AlertCircle, Save } from 'lucide-react';
import { TaskWithStatus, updateUserTask, checkDependencies, getUserTasks, updateUserTaskMetadata } from '../../lib/tasks';
import { configLoader, Task } from '../../lib/config';
import { uploadDocument, getDocuments, deleteDocument, Document } from '../../lib/documents';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { ActionBlock } from './ActionBlock';
import { SubtaskList } from './SubtaskList';
import { SubtaskEditor } from './SubtaskEditor';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { toast } from 'sonner';

type TaskDetailProps = {
  task: TaskWithStatus;
  onClose: () => void;
  onUpdate: () => void;
  onNavigate?: (taskId: string) => void;
};

export function TaskDetail({ task, onClose, onUpdate, onNavigate }: TaskDetailProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [status, setStatus] = useState(task.userTask?.status || 'todo');
  const [notes, setNotes] = useState(task.userTask?.notes || '');
  const handleNotesChange = (e: any) => {
    setNotes(e.target.value);
  };
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [subtaskProgress, setSubtaskProgress] = useState<Record<string, boolean>>(task.userTask?.subtaskProgress || {});
  const [metadata, setMetadata] = useState<Record<string, any>>(task.userTask?.metadata || {});
  const [linkedSubtaskStatus, setLinkedSubtaskStatus] = useState<Record<string, boolean>>({});
  const [dependencies, setDependencies] = useState<{ canComplete: boolean; blockedBy: Task[] }>({
    canComplete: true,
    blockedBy: []
  });

  const module = configLoader.getModule(task.module);
  const timeWindow = configLoader.getTimeWindow(task.timeWindow);
  const taskDependencies = configLoader.getTaskDependencies(task.id);

  useEffect(() => {
    loadDocuments();
    checkTaskDependencies();
    checkLinkedTasks();
  }, [task.id]);

  async function loadDocuments() {
    if (!user) return;
    const docs = await getDocuments(user.id, task.id);
    setDocuments(docs);
  }

  async function checkTaskDependencies() {
    if (!user) return;
    const userTasks = await getUserTasks(user.id);
    const depCheck = checkDependencies(task, userTasks);
    setDependencies(depCheck);
  }

  async function checkLinkedTasks() {
    if (!user || !task.subtasks) return;
    const linkedSubtasks = task.subtasks.filter(s => s.type === 'linked_task');
    if (linkedSubtasks.length === 0) return;

    const userTasks = await getUserTasks(user.id);
    const statusMap: Record<string, boolean> = {};

    for (const subtask of linkedSubtasks) {
      if (subtask.type === 'linked_task') {
        const linkedTask = userTasks.find(t => t.taskId === subtask.linkedTaskId);
        statusMap[subtask.id] = linkedTask?.status === 'done';
      }
    }
    setLinkedSubtaskStatus(statusMap);
  }

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    try {
      await updateUserTask(user.id, task.id, { status, notes, metadata });
      toast.success(t('common.success'));
      onUpdate();
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error(t('common.error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSubtask(subtaskId: string, completed: boolean) {
    if (!user) return;

    const newProgress = { ...subtaskProgress, [subtaskId]: completed };
    setSubtaskProgress(newProgress);

    try {
      const updatedTask = await updateUserTask(user.id, task.id, { subtaskProgress: newProgress });
      if (updatedTask.status !== status) {
        setStatus(updatedTask.status);
        toast.success(t('tasks.detail.statusUpdated', { status: t(`overview.${updatedTask.status}`) }));
      }
    } catch (error) {
      console.error('Failed to update subtask:', error);
      toast.error(t('common.error'));
      setSubtaskProgress(prev => ({ ...prev, [subtaskId]: !completed }));
    }
  }

  async function handleMetadataChange(key: string, value: any) {
    if (!user) return;

    const newMetadata = { ...metadata, [key]: value };
    setMetadata(newMetadata);

    try {
      const updatedTask = await updateUserTaskMetadata(user.id, task.id, { [key]: value });
      if (updatedTask.status !== status) {
        setStatus(updatedTask.status);
        toast.success(t('tasks.detail.statusUpdated', { status: t(`overview.${updatedTask.status}`) }));
      }
    } catch (error) {
      console.error('Failed to update metadata:', error);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      await uploadDocument(user.id, file, task.id);
      await loadDocuments();
      toast.success(t('common.success'));
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(docId: string) {
    if (!user || !confirm(t('tasks.detail.deleteDocConfirm'))) return;

    try {
      await deleteDocument(user.id, docId);
      await loadDocuments();
      toast.success(t('common.success'));
    } catch (error) {
      toast.error((error as Error).message);
    }
  }

  const importanceVariants: Record<string, "danger" | "warning" | "secondary" | "primary" | "success" | "neutral"> = {
    critical: 'danger',
    high: 'warning',
    medium: 'secondary',
    low: 'secondary'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0 shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 p-6 flex items-start justify-between z-10">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{task.title}</h2>
            <div className="flex flex-wrap gap-2">
              {module?.id && (
                <Badge variant="secondary">
                  {t(`modules.${module.id}`)}
                </Badge>
              )}
              {timeWindow?.id && (
                <Badge variant="neutral">
                  {t(`timeWindows.${timeWindow.id}`)}
                </Badge>
              )}
              <Badge variant={importanceVariants[task.importance] || 'secondary'}>
                {t(`tasks.importance.${task.importance}`)}
              </Badge>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {dependencies.blockedBy.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{t('tasks.detail.blockedBy')}</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  {t('tasks.detail.completeFirst')} {dependencies.blockedBy.map(d => d.title).join(', ')}
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('tasks.detail.description')}</h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{task.description}</p>
            {task.cityNote && (
              <div className="mt-3 text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-3 rounded-lg">
                {task.cityNote}
              </div>
            )}
          </div>

          {taskDependencies.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('tasks.detail.dependencies')}</h3>
              <ul className="space-y-2">
                {taskDependencies.map(dep => (
                  <li key={dep.id} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    {dep.title}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('tasks.detail.status')}</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'todo' | 'in_progress' | 'done' | 'blocked')}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="todo">{t('overview.todo')}</option>
              <option value="in_progress">{t('overview.inProgress')}</option>
              <option value="done">{t('overview.completed')}</option>
              <option value="blocked">{t('overview.blocked')}</option>
            </select>
          </div>

          <SubtaskList
            task={task}
            userTask={{ ...task.userTask, subtaskProgress, metadata } as any}
            linkedSubtaskStatus={linkedSubtaskStatus}
            onToggle={handleToggleSubtask}
            onNavigate={onNavigate}
            onMetadataChange={handleMetadataChange}
          />

          {user && (
            <SubtaskEditor userId={user.id} taskId={task.id} />
          )}

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('tasks.detail.notes')}</h3>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              rows={4}
              placeholder={t('tasks.detail.notesPlaceholder')}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <ActionBlock task={task} userCity={user?.primaryCityId || undefined} metadata={metadata} />

          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">{t('tasks.detail.documents')}</h3>
            <div className="space-y-3">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc.fileName}</span>
                    <span className="text-xs text-slate-500">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <label className="flex items-center justify-center space-x-2 p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-medium">
                  {uploading ? t('tasks.detail.uploading') : t('tasks.detail.upload')}
                </span>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex space-x-4 pt-6 border-t border-slate-200 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-950 pb-0">
            <Button
              onClick={handleSave}
              isLoading={saving}
              className="flex-1"
              leftIcon={<Save className="w-4 h-4" />}
            >
              {t('tasks.detail.saveChanges')}
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
            >
              {t('tasks.detail.close')}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
