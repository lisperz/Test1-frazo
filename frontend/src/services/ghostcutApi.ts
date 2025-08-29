import axios from 'axios';
import {
  VideoAnnotation,
  GhostCutRequest,
  GhostCutJobResponse,
  GhostCutBox,
} from '../types/videoEditor';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests (temporarily disabled for testing)
api.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem('access_token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Convert VideoAnnotation to GhostCutBox format
const convertAnnotationToBox = (annotation: VideoAnnotation): GhostCutBox => {
  return {
    start: annotation.startTime,
    end: annotation.endTime,
    rect: [
      annotation.rectangle.x,
      annotation.rectangle.y,
      annotation.rectangle.width,
      annotation.rectangle.height,
    ],
  };
};

// Group annotations by label type
const groupAnnotations = (annotations: VideoAnnotation[]) => {
  const erasures: GhostCutBox[] = [];
  const protectedAreas: GhostCutBox[] = [];
  const textAreas: GhostCutBox[] = [];

  annotations.forEach((annotation) => {
    const box = convertAnnotationToBox(annotation);
    
    switch (annotation.label) {
      case 'Erase':
        erasures.push(box);
        break;
      case 'Protect':
        protectedAreas.push(box);
        break;
      case 'Text':
        textAreas.push(box);
        break;
    }
  });

  return { erasures, protectedAreas, textAreas };
};

export const submitGhostCutJob = async (params: {
  videoUrl: string;
  annotations: VideoAnnotation[];
  language?: string;
  autoDetectText?: boolean;
}): Promise<GhostCutJobResponse> => {
  try {
    const { erasures, protectedAreas, textAreas } = groupAnnotations(params.annotations);

    const request = {
      video_url: params.videoUrl,
      language: params.language || 'auto',
      erasures,
      protected_areas: protectedAreas,
      text_areas: textAreas,
      auto_detect_text: params.autoDetectText || false,
    };

    const response = await api.post<GhostCutJobResponse>('/ghostcut/render', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to submit job');
    }
    throw error;
  }
};

export const getJobStatus = async (jobId: string): Promise<GhostCutJobResponse> => {
  try {
    const response = await api.get<GhostCutJobResponse>(`/ghostcut/jobs/${jobId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch job status');
    }
    throw error;
  }
};

export const cancelJob = async (jobId: string): Promise<void> => {
  try {
    await api.post(`/ghostcut/jobs/${jobId}/cancel`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to cancel job');
    }
    throw error;
  }
};

export const getJobHistory = async (params?: {
  page?: number;
  pageSize?: number;
}): Promise<{
  jobs: GhostCutJobResponse[];
  total: number;
  page: number;
  pageSize: number;
}> => {
  try {
    const response = await api.get('/ghostcut/jobs', {
      params: {
        page: params?.page || 1,
        page_size: params?.pageSize || 10,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || 'Failed to fetch job history');
    }
    throw error;
  }
};