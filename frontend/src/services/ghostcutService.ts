import axios from 'axios';

interface GhostCutBox {
  start: number;  // Start time in seconds
  end: number;    // End time in seconds
  rect: [number, number, number, number]; // [x, y, width, height] normalized 0-1
}

interface GhostCutRenderRequest {
  video_id: string;  // File ID of the uploaded video
  language?: string;  // Language for text detection (default: "auto")
  erasures: GhostCutBox[];
  protected_areas?: GhostCutBox[];
  text_areas?: GhostCutBox[];
  auto_detect_text?: boolean;
}

interface GhostCutJobResponse {
  job_id: string;
  status: string;
  progress?: number;
  message?: string;
  output_url?: string;
  error?: string;
  created_at: string;
}

class GhostCutService {
  private baseURL: string = '/api/v1/ghostcut';

  private getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    };
  }

  async submitJob(request: GhostCutRenderRequest): Promise<GhostCutJobResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/render`,
        request,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error submitting to GhostCut:', error);
      throw error;
    }
  }

  async getJobStatus(jobId: string): Promise<GhostCutJobResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/jobs/${jobId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting job status:', error);
      throw error;
    }
  }

  async listJobs(page: number = 1, pageSize: number = 10): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}/jobs`,
        {
          params: { page, page_size: pageSize },
          headers: this.getAuthHeaders()
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error listing jobs:', error);
      throw error;
    }
  }

  async cancelJob(jobId: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}/jobs/${jobId}/cancel`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error cancelling job:', error);
      throw error;
    }
  }

  // Helper method to convert from our store format to GhostCut API format
  formatEffectsForAPI(effects: any[], videoId: string): GhostCutRenderRequest {
    const erasures: GhostCutBox[] = [];
    const protected_areas: GhostCutBox[] = [];
    const text_areas: GhostCutBox[] = [];

    effects.forEach(effect => {
      const box: GhostCutBox = {
        start: effect.startTime,
        end: effect.endTime,
        rect: [
          effect.region.x,
          effect.region.y,
          effect.region.width,
          effect.region.height
        ]
      };

      switch (effect.type) {
        case 'erasure':
          erasures.push(box);
          break;
        case 'protection':
          protected_areas.push(box);
          break;
        case 'text':
          text_areas.push(box);
          break;
      }
    });

    return {
      video_id: videoId,
      language: 'auto',
      erasures,
      protected_areas,
      text_areas,
      auto_detect_text: true
    };
  }
}

export const ghostcutService = new GhostCutService();