/**
 * Segment Overlap Detection Utilities
 *
 * Detects overlapping segments and provides warnings to users
 */

import { VideoSegment } from '../types/segments';

export interface SegmentOverlap {
  segmentId: string;
  overlappingWithIds: string[];
  overlapRanges: Array<{
    start: number;
    end: number;
    overlappingSegmentId: string;
  }>;
}

/**
 * Check if two segments overlap
 * This includes:
 * - Time range overlaps (segment interiors overlap)
 * - Exact boundary overlaps (one segment ends exactly where another starts)
 */
export const doSegmentsOverlap = (
  segment1: VideoSegment,
  segment2: VideoSegment
): boolean => {
  if (segment1.id === segment2.id) return false;

  // Check for interior overlap (segments overlap in their interior time ranges)
  const hasInteriorOverlap = segment1.startTime < segment2.endTime && segment2.startTime < segment1.endTime;

  // Check for exact boundary overlap (one segment ends exactly where another starts)
  const hasBoundaryOverlap =
    segment1.endTime === segment2.startTime ||
    segment2.endTime === segment1.startTime;

  return hasInteriorOverlap || hasBoundaryOverlap;
};

/**
 * Get the overlap range between two segments
 * For boundary overlaps (segments touching at exact point), returns that point
 */
export const getOverlapRange = (
  segment1: VideoSegment,
  segment2: VideoSegment
): { start: number; end: number } | null => {
  if (!doSegmentsOverlap(segment1, segment2)) return null;

  const start = Math.max(segment1.startTime, segment2.startTime);
  const end = Math.min(segment1.endTime, segment2.endTime);

  // For boundary overlaps, start and end will be the same (the touching point)
  return { start, end };
};

/**
 * Detect all overlapping segments
 */
export const detectOverlappingSegments = (
  segments: VideoSegment[]
): SegmentOverlap[] => {
  const overlaps: Map<string, SegmentOverlap> = new Map();

  // Check each segment against all others
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const seg1 = segments[i];
      const seg2 = segments[j];

      if (doSegmentsOverlap(seg1, seg2)) {
        const range = getOverlapRange(seg1, seg2);
        if (!range) continue;

        // Add overlap for segment 1
        if (!overlaps.has(seg1.id)) {
          overlaps.set(seg1.id, {
            segmentId: seg1.id,
            overlappingWithIds: [],
            overlapRanges: [],
          });
        }
        const overlap1 = overlaps.get(seg1.id)!;
        overlap1.overlappingWithIds.push(seg2.id);
        overlap1.overlapRanges.push({
          ...range,
          overlappingSegmentId: seg2.id,
        });

        // Add overlap for segment 2
        if (!overlaps.has(seg2.id)) {
          overlaps.set(seg2.id, {
            segmentId: seg2.id,
            overlappingWithIds: [],
            overlapRanges: [],
          });
        }
        const overlap2 = overlaps.get(seg2.id)!;
        overlap2.overlappingWithIds.push(seg1.id);
        overlap2.overlapRanges.push({
          ...range,
          overlappingSegmentId: seg1.id,
        });
      }
    }
  }

  return Array.from(overlaps.values());
};

/**
 * Check if a specific segment is overlapping
 */
export const isSegmentOverlapping = (
  segmentId: string,
  segments: VideoSegment[]
): boolean => {
  const overlaps = detectOverlappingSegments(segments);
  return overlaps.some(overlap => overlap.segmentId === segmentId);
};

/**
 * Get overlapping segments for a specific segment
 */
export const getSegmentOverlaps = (
  segmentId: string,
  segments: VideoSegment[]
): SegmentOverlap | null => {
  const overlaps = detectOverlappingSegments(segments);
  return overlaps.find(overlap => overlap.segmentId === segmentId) || null;
};

/**
 * Format overlap warning message
 */
export const formatOverlapWarning = (
  segmentLabel: string,
  overlappingLabels: string[]
): string => {
  if (overlappingLabels.length === 1) {
    return `This segment overlaps with "${overlappingLabels[0]}". This may cause unexpected results.`;
  }

  const labels = overlappingLabels.join('", "');
  return `This segment overlaps with multiple segments: "${labels}". This may cause unexpected results.`;
};
