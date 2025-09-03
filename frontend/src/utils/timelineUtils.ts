/**
 * Shared timeline calculation utilities
 * Single source of truth for all time-to-pixel conversions
 */

export interface TimelineState {
  currentTime: number;      // in seconds
  duration: number;         // in seconds
  zoomLevel: number;        // 1 = 100%, 2 = 200%, etc
  containerWidth?: number;  // pixel width of container
}

/**
 * Converts time in seconds to pixel position
 * @param time - Time in seconds
 * @param state - Current timeline state
 * @returns Pixel position
 */
export function timeToPixels(
  time: number, 
  state: TimelineState
): number {
  const { duration, zoomLevel, containerWidth = 1000 } = state;
  if (duration <= 0) return 0;
  
  const percentage = (time / duration) * 100;
  const effectiveWidth = containerWidth * zoomLevel;
  return (percentage / 100) * effectiveWidth;
}

/**
 * Converts pixel position to time in seconds
 * @param pixels - Pixel position
 * @param state - Current timeline state
 * @returns Time in seconds
 */
export function pixelsToTime(
  pixels: number,
  state: TimelineState
): number {
  const { duration, zoomLevel, containerWidth = 1000 } = state;
  if (duration <= 0) return 0;
  
  const effectiveWidth = containerWidth * zoomLevel;
  const percentage = (pixels / effectiveWidth) * 100;
  return (percentage / 100) * duration;
}

/**
 * Calculates progress percentage (0-100)
 * @param time - Current time in seconds
 * @param duration - Total duration in seconds
 * @returns Progress percentage
 */
export function calculateProgressPercentage(
  time: number,
  duration: number
): number {
  if (duration <= 0) return 0;
  return Math.min(100, Math.max(0, (time / duration) * 100));
}

/**
 * Formats time in MM:SS:CS format (centiseconds)
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export function formatTime(seconds: number): string {
  const totalCentiseconds = Math.floor(seconds * 100);
  const minutes = Math.floor(totalCentiseconds / 6000);
  const secs = Math.floor((totalCentiseconds % 6000) / 100);
  const centisecs = totalCentiseconds % 100;
  
  return `${minutes.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}:${centisecs.toString().padStart(2, '0')}`;
}

/**
 * Snaps time to nearest frame based on FPS
 * @param time - Time in seconds
 * @param fps - Frames per second (default 30)
 * @returns Snapped time in seconds
 */
export function snapToFrame(time: number, fps: number = 30): number {
  const frameTime = 1 / fps;
  return Math.round(time / frameTime) * frameTime;
}

/**
 * Clamps time within valid bounds
 * @param time - Time in seconds
 * @param duration - Maximum duration in seconds
 * @returns Clamped time
 */
export function clampTime(time: number, duration: number): number {
  return Math.min(duration, Math.max(0, time));
}

/**
 * Calculates the position for timeline elements with zoom
 * Ensures all elements use the same calculation
 * @param currentTime - Current time in seconds
 * @param duration - Total duration in seconds
 * @param zoomLevel - Timeline zoom level
 * @returns Position percentage for CSS left property
 */
export function getTimelinePosition(
  currentTime: number,
  duration: number,
  zoomLevel: number = 1
): string {
  const percentage = calculateProgressPercentage(currentTime, duration);
  // When zoomed, we need to adjust the percentage based on visible portion
  // For now, return the base percentage - zoom handling should be in scroll position
  return `${percentage}%`;
}

/**
 * Handles timeline click/drag to seek
 * @param event - Mouse event
 * @param containerElement - Timeline container element
 * @param duration - Total duration
 * @param zoomLevel - Current zoom level
 * @returns New time in seconds
 */
export function handleTimelineInteraction(
  event: MouseEvent | React.MouseEvent,
  containerElement: HTMLElement,
  duration: number,
  zoomLevel: number = 1
): number {
  const rect = containerElement.getBoundingClientRect();
  const x = 'clientX' in event ? event.clientX - rect.left : 0;
  const percentage = (x / rect.width) * 100;
  const time = (percentage / 100) * duration;
  return clampTime(time, duration);
}