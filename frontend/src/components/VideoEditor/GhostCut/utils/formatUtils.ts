/**
 * Formatting utility functions for GhostCut Editor
 */

import { formatTime as formatTimeUtil } from '../../../../utils/timelineUtils';

/**
 * Format time in MM:SS or MM:SS.mmm format
 */
export const formatTime = (seconds: number, includeMs: boolean = false): string => {
  if (includeMs) {
    return formatTimeUtil(seconds);
  }
  // For simple MM:SS format
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
