/**
 * Effect Helper Utilities
 *
 * This module contains utility functions for working with video effects
 * and timeline synchronization.
 */

import { VideoEffect } from '../../../../store/effectsStore';
import { TimelineEffect, EffectType } from '../types';
import { EFFECT_COLORS, EFFECT_LABELS } from '../constants/editorConstants';

/**
 * Synchronizes video effects with timeline representation
 *
 * @param effects - Array of video effects from the store
 * @param duration - Total video duration in seconds
 * @returns Array of timeline effects with calculated positions
 */
export const syncTimelineEffects = (
  effects: VideoEffect[],
  duration: number
): TimelineEffect[] => {
  return effects.map(effect => ({
    id: effect.id,
    type: effect.type,
    // Calculate precise percentage without rounding for accurate positioning
    startFrame: (effect.startTime / duration) * 100,
    endFrame: (effect.endTime / duration) * 100,
    color: getEffectColor(effect.type),
    label: getEffectLabel(effect.type),
  }));
};

/**
 * Gets the color for a specific effect type
 *
 * @param type - Effect type
 * @returns Hex color string
 */
export const getEffectColor = (type: EffectType): string => {
  return EFFECT_COLORS[type];
};

/**
 * Gets the human-readable label for a specific effect type
 *
 * @param type - Effect type
 * @returns Label string
 */
export const getEffectLabel = (type: EffectType): string => {
  return EFFECT_LABELS[type];
};

/**
 * Combines video effects and segments into a unified timeline
 *
 * @param effects - Array of video effects
 * @param segments - Array of segments from segment store
 * @param duration - Total video duration in seconds
 * @returns Combined array of timeline effects
 */
export const combineTimelineEffects = (
  effects: VideoEffect[],
  segments: Array<{
    id: string;
    startTime: number;
    endTime: number;
    color: string;
    label?: string;
  }>,
  duration: number
): TimelineEffect[] => {
  // Map video effects
  const videoEffects = syncTimelineEffects(effects, duration);

  // Map segments to timeline effects
  const segmentEffects: TimelineEffect[] = segments.map((segment, index) => ({
    id: segment.id,
    type: 'text' as const, // Use 'text' type for compatibility
    startFrame: (segment.startTime / duration) * 100,
    endFrame: (segment.endTime / duration) * 100,
    color: segment.color,
    label: segment.label || `Segment ${index + 1}`,
  }));

  // Combine and return
  return [...videoEffects, ...segmentEffects];
};

/**
 * Checks if an effect is active at a given time
 *
 * @param effect - Video effect to check
 * @param currentTime - Current playback time in seconds
 * @returns True if effect is active at the given time
 */
export const isEffectActive = (
  effect: VideoEffect,
  currentTime: number
): boolean => {
  return currentTime >= effect.startTime && currentTime <= effect.endTime;
};

/**
 * Sorts effects by area (larger first) for proper z-index layering
 *
 * @param effects - Array of video effects
 * @returns Sorted array with larger effects first
 */
export const sortEffectsByArea = (effects: VideoEffect[]): VideoEffect[] => {
  return [...effects].sort((a, b) => {
    const areaA = a.region.width * a.region.height;
    const areaB = b.region.width * b.region.height;
    return areaB - areaA; // Larger areas first
  });
};
