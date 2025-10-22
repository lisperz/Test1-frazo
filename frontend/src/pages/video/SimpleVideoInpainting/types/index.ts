export interface ProcessingJob {
  id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  taskId?: string;
  downloadUrl?: string;
  error?: string;
  fileSize?: string;
}

export type JobStatus = ProcessingJob['status'];
