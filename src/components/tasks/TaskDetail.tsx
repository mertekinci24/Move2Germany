import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, Trash2, AlertCircle } from 'lucide-react';
import { TaskWithStatus, updateUserTask, checkDependencies, getUserTasks } from '../../lib/tasks';
import { configLoader, Task } from '../../lib/config';
import { uploadDocument, getDocuments, deleteDocument, Document } from '../../lib/documents';
import { useAuth } from '../../contexts/AuthContext';

type TaskDetailProps = {
  task: TaskWithStatus;
  onClose: () => void;
  onUpdate: () => void;
};

export function TaskDetail({ task, onClose, onUpdate }: TaskDetailProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState(task.userTask?.status || 'todo');
  const [notes, setNotes] = useState(task.userTask?.notes || '');
  const [saving, setSaving] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
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

  async function handleSave() {
    if (!user) return;

    setSaving(true);
    try {
      await updateUserTask(user.id, task.id, { status, notes });
      onUpdate();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      await uploadDocument(user.id, file, task.id);
      await loadDocuments();
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(docId: string) {
    if (!user || !confirm('Are you sure you want to delete this document?')) return;

    try {
      await deleteDocument(user.id, docId);
      await loadDocuments();
    } catch (error) {
      alert((error as Error).message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{task.title}</h2>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {module?.label}
              </span>
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {timeWindow?.label}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.importance === 'critical' ? 'bg-red-100 text-red-700' :
                task.importance === 'high' ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {task.importance}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {dependencies.blockedBy.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">This task has dependencies</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Complete these tasks first: {dependencies.blockedBy.map(d => d.title).join(', ')}
                </p>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700">{task.description}</p>
            {task.cityNote && (
              <p className="mt-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">{task.cityNote}</p>
            )}
          </div>

          {taskDependencies.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dependencies</h3>
              <ul className="space-y-1">
                {taskDependencies.map(dep => (
                  <li key={dep.id} className="text-sm text-gray-600">• {dep.title}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Status</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add your notes here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-700">{doc.fileName}</span>
                    <span className="text-xs text-gray-500">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <label className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {uploading ? 'Uploading...' : 'Upload document (PDF, JPG, PNG, max 10MB)'}
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

          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
