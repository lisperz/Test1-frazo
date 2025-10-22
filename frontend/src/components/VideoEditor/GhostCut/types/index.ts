/**
 * Type definitions for GhostCut Video Editor
 */

import { VideoEffect } from '../../../../store/effectsStore';

export interface GhostCutVideoEditorProps {
  videoUrl: string;
  videoFile: File | null;
  onBack?: () => void;
}

export interface TimelineEffect {
  id: string;
  type: 'erasure' | 'protection' | 'text';
  startFrame: number;
  endFrame: number;
  color: string;
  label: string;
}

export interface VideoBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RectRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type EffectType = 'erasure' | 'protection' | 'text';

export interface EffectData {
  type: EffectType;
  startTime: number;
  endTime: number;
  region: RectRegion;
}

export interface EditState {
  isDrawingMode: boolean;
  currentRect: RectRegion | null;
  selectedType: EffectType;
  editingEffectId: string | null;
}

export interface TimelineState {
  isDragging: string | null;
  isDraggingTimeline: boolean;
}

export interface AudioState {
  isMuted: boolean;
  audioFile: File | null;
}

export interface SubmissionState {
  isSubmitting: boolean;
  submissionProgress: string;
}
