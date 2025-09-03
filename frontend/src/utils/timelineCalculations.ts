/**
 * Timeline Calculation Utilities
 * Single source of truth for all time-to-pixel conversions
 */

export interface TimelineConfig {
  timelineWidth: number;
  duration: number;
  zoomLevel: number;
  pixelsPerSecond: number;
}

/**
 * Convert time in seconds to pixel position on timeline
 * @param time - Time in seconds
 * @param config - Timeline configuration
 * @returns Pixel position
 */
export const timeToPixels = (time: number, config: TimelineConfig): number => {
  if (config.duration === 0) return 0;
  
  // Use pixelsPerSecond as the primary calculation method
  // This ensures consistency across all timeline elements
  const basePixels = time * config.pixelsPerSecond * config.zoomLevel;
  return Math.round(basePixels * 100) / 100; // Round to 2 decimal places for precision
};

/**
 * Convert pixel position to time in seconds
 * @param pixels - Pixel position
 * @param config - Timeline configuration
 * @returns Time in seconds
 */
export const pixelsToTime = (pixels: number, config: TimelineConfig): number => {
  if (config.pixelsPerSecond === 0 || config.zoomLevel === 0) return 0;
  
  // Inverse of timeToPixels calculation
  const time = pixels / (config.pixelsPerSecond * config.zoomLevel);
  return Math.max(0, Math.min(config.duration, time)); // Clamp between 0 and duration
};

/**
 * Convert normalized position (0-1) to pixel position
 * @param normalized - Normalized position (0-1)
 * @param config - Timeline configuration
 * @returns Pixel position
 */
export const normalizedToPixels = (normalized: number, config: TimelineConfig): number => {
  const time = normalized * config.duration;
  return timeToPixels(time, config);
};

/**
 * Convert pixel position to normalized position (0-1)
 * @param pixels - Pixel position
 * @param config - Timeline configuration
 * @returns Normalized position (0-1)
 */
export const pixelsToNormalized = (pixels: number, config: TimelineConfig): number => {
  const time = pixelsToTime(pixels, config);
  return config.duration > 0 ? time / config.duration : 0;
};

/**
 * Format time in seconds to HH:MM:SS:CS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds % 1) * 100);
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${centiseconds.toString().padStart(2, '0')}`;
};

/**
 * Format time in seconds to MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export const formatTimeShort = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Calculate the visible time range based on scroll position
 * @param scrollLeft - Current scroll position
 * @param viewportWidth - Width of the visible viewport
 * @param config - Timeline configuration
 * @returns Object with startTime and endTime in seconds
 */
export const getVisibleTimeRange = (
  scrollLeft: number,
  viewportWidth: number,
  config: TimelineConfig
): { startTime: number; endTime: number } => {
  const startTime = pixelsToTime(scrollLeft, config);
  const endTime = pixelsToTime(scrollLeft + viewportWidth, config);
  
  return {
    startTime: Math.max(0, startTime),
    endTime: Math.min(config.duration, endTime)
  };
};

/**
 * Calculate timeline width based on duration and zoom
 * @param duration - Duration in seconds
 * @param pixelsPerSecond - Base pixels per second
 * @param zoomLevel - Zoom level multiplier
 * @returns Total timeline width in pixels
 */
export const calculateTimelineWidth = (
  duration: number,
  pixelsPerSecond: number,
  zoomLevel: number
): number => {
  return Math.ceil(duration * pixelsPerSecond * zoomLevel);
};

/**
 * Get optimal pixels per second based on viewport width
 * @param viewportWidth - Width of the viewport
 * @param duration - Duration in seconds
 * @returns Optimal pixels per second
 */
export const getOptimalPixelsPerSecond = (
  viewportWidth: number,
  duration: number
): number => {
  if (duration === 0) return 100;
  
  // Aim to show the entire duration in the viewport initially
  const basePixelsPerSecond = viewportWidth / duration;
  
  // Ensure a minimum of 50 pixels per second for usability
  // and a maximum of 200 for reasonable zoom levels
  return Math.max(50, Math.min(200, basePixelsPerSecond));
};