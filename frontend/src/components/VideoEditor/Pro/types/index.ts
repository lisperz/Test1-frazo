/**
 * Type Definitions for Pro Video Editor
 *
 * This module contains all TypeScript interfaces and types used in the
 * Pro Video Editor component.
 */

/**
 * Props for the ProVideoEditor component
 */
export interface ProVideoEditorProps {
  /** URL of the video to edit */
  videoUrl: string;
  /** The original video file */
  videoFile: File | null;
  /** Optional callback when user navigates back */
  onBack?: () => void;
}

/**
 * Represents an effect displayed on the timeline
 */
export interface TimelineEffect {
  /** Unique identifier for the effect */
  id: string;
  /** Type of effect */
  type: 'erasure' | 'protection' | 'text';
  /** Start position as percentage (0-100) */
  startFrame: number;
  /** End position as percentage (0-100) */
  endFrame: number;
  /** Color used for visualization */
  color: string;
  /** Human-readable label */
  label: string;
}

/**
 * Video display bounds within the container
 * Used for calculating proper overlay positions
 */
export interface VideoBounds {
  /** X offset from container left edge */
  x: number;
  /** Y offset from container top edge */
  y: number;
  /** Actual displayed width of video */
  width: number;
  /** Actual displayed height of video */
  height: number;
}

/**
 * Rectangle region for effect overlays
 * All values are normalized (0-1) relative to video dimensions
 */
export interface RectRegion {
  /** X position as fraction of video width */
  x: number;
  /** Y position as fraction of video height */
  y: number;
  /** Width as fraction of video width */
  width: number;
  /** Height as fraction of video height */
  height: number;
}

/**
 * Effect type union for type-safe operations
 */
export type EffectType = 'erasure' | 'protection' | 'text';

/**
 * Drag operation types for timeline effects
 */
export type DragType = 'start' | 'end' | 'move';
