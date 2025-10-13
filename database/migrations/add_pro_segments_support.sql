-- Migration: Add Pro Video Editor Segments Support
-- Date: 2025-10-09
-- Description: Add segments_data JSONB column and is_pro_job flag to video_jobs table

-- Add segments_data column to store segment configurations
ALTER TABLE video_jobs
ADD COLUMN segments_data JSONB DEFAULT NULL;

-- Add is_pro_job flag to differentiate Pro jobs from Basic jobs
ALTER TABLE video_jobs
ADD COLUMN is_pro_job BOOLEAN DEFAULT FALSE;

-- Add index on is_pro_job for faster queries
CREATE INDEX idx_video_jobs_is_pro_job ON video_jobs(is_pro_job);

-- Add index on segments_data for JSONB queries
CREATE INDEX idx_video_jobs_segments_data ON video_jobs USING GIN (segments_data);

-- Add comments for documentation
COMMENT ON COLUMN video_jobs.segments_data IS 'JSONB array of segments with time ranges and audio inputs for Pro lip-sync processing';
COMMENT ON COLUMN video_jobs.is_pro_job IS 'Boolean flag to indicate if this is a Pro Video Editor job (true) or Basic Editor job (false)';

-- Example segments_data structure:
-- {
--   "segments": [
--     {
--       "id": "segment-uuid-1",
--       "startTime": 0.0,
--       "endTime": 15.0,
--       "audioInput": {
--         "refId": "audio-uuid-1",
--         "s3_url": "https://s3.amazonaws.com/...",
--         "fileName": "audio1.mp3",
--         "fileSize": 1024000,
--         "startTime": null,
--         "endTime": null
--       },
--       "label": "Intro Segment"
--     },
--     {
--       "id": "segment-uuid-2",
--       "startTime": 15.0,
--       "endTime": 30.0,
--       "audioInput": {
--         "refId": "audio-uuid-2",
--         "s3_url": "https://s3.amazonaws.com/...",
--         "fileName": "audio2.mp3",
--         "fileSize": 2048000,
--         "startTime": 5.0,
--         "endTime": 20.0
--       },
--       "label": "Main Segment"
--     }
--   ],
--   "total_segments": 2,
--   "total_duration": 30.0
-- }
