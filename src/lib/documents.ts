import { supabase } from './supabase';
import { logAuditEvent } from './auth';

export type Document = {
  id: string;
  userId: string;
  taskId: string | null;
  storageKey: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const BUCKET_NAME = 'documents';

export async function uploadDocument(
  userId: string,
  file: File,
  taskId?: string
): Promise<Document> {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit.');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      task_id: taskId || null,
      storage_key: fileName,
      file_name: file.name,
      mime_type: file.type,
      size: file.size
    })
    .select()
    .single();

  if (error) {
    await supabase.storage.from(BUCKET_NAME).remove([fileName]);
    throw new Error(error.message);
  }

  await logAuditEvent(userId, 'document_upload', {
    documentId: data.id,
    fileName: file.name,
    taskId
  });

  return mapDbToDocument(data);
}

export async function getDocuments(userId: string, taskId?: string): Promise<Document[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId);

  if (taskId) {
    query = query.eq('task_id', taskId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapDbToDocument);
}

export async function getDocument(userId: string, documentId: string): Promise<Document | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapDbToDocument(data) : null;
}

export async function getDocumentUrl(userId: string, documentId: string): Promise<string> {
  const document = await getDocument(userId, documentId);

  if (!document) {
    throw new Error('Document not found');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(document.storageKey, 3600);

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}

export async function deleteDocument(userId: string, documentId: string): Promise<void> {
  const document = await getDocument(userId, documentId);

  if (!document) {
    throw new Error('Document not found');
  }

  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([document.storageKey]);

  if (storageError) {
    console.error('Failed to delete file from storage:', storageError);
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

function mapDbToDocument(data: any): Document {
  return {
    id: data.id,
    userId: data.user_id,
    taskId: data.task_id,
    storageKey: data.storage_key,
    fileName: data.file_name,
    mimeType: data.mime_type,
    size: data.size,
    uploadedAt: data.uploaded_at
  };
}
