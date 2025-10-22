export interface Job {
  id: string;
  display_name: string;
  original_filename: string;
  file_size: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  credits_used?: number;
  estimated_credits?: number;
  created_at: string;
  duration?: number;
  output_url?: string;
  is_pro_job?: boolean;
  segments_data?: {
    total_segments: number;
  };
}

export interface JobsData {
  jobs: Job[];
  total: number;
}

export interface JobsQueryParams {
  offset: number;
  limit: number;
  search?: string;
  status?: string;
}
