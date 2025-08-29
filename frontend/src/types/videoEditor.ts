export interface VideoAnnotation {
  id: string;
  label: 'Erase' | 'Protect' | 'Text';
  startTime: number;  // seconds
  endTime: number;    // seconds
  rectangle: {
    x: number;      // normalized 0-1
    y: number;      // normalized 0-1
    width: number;  // normalized 0-1
    height: number; // normalized 0-1
  };
}

export interface GhostCutBox {
  start: number;
  end: number;
  rect: [number, number, number, number]; // [x, y, width, height] normalized 0-1
}

export interface GhostCutRequest {
  videoUrl: string;
  videoId?: string;
  language?: string;
  erasures: GhostCutBox[];
  protectedAreas?: GhostCutBox[];
  textAreas?: GhostCutBox[];
  autoDetectText?: boolean;
}

export interface GhostCutJobResponse {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  message?: string;
  outputUrl?: string;
  error?: string;
}

export interface LSFAnnotation {
  id: string;
  type: string;
  value: {
    start: number;
    end: number;
    x: number;
    y: number;
    width: number;
    height: number;
    rectanglelabels?: string[];
  };
  from_name: string;
  to_name: string;
}

export interface LSFTask {
  id: number;
  data: {
    video: string;
    fps?: number;
  };
  annotations?: Array<{
    id: number;
    result: LSFAnnotation[];
  }>;
}

export interface VideoEditorState {
  videoFile: File | null;
  videoUrl: string | null;
  annotations: VideoAnnotation[];
  isProcessing: boolean;
  currentJobId: string | null;
  error: string | null;
}