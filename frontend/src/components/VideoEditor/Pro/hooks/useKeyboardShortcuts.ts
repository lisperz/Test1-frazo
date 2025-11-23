/**
 * Keyboard Shortcuts Hook
 * Manages global keyboard shortcuts for undo/redo, delete, and split operations
 */

import { useEffect } from 'react';

export interface KeyboardShortcutsConfig {
  // Undo/Redo - Effects
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Undo/Redo - Segments
  canUndoSegment: boolean;
  canRedoSegment: boolean;
  undoSegment: () => void;
  redoSegment: () => void;

  // Delete operations
  deleteSegment: (id: string) => void;
  deleteEffect: (id: string) => void;
  currentSegmentId: string | null;
  editingEffectId: string | null;

  // Split operation
  handleSplitSegment: () => void;
}

export const useKeyboardShortcuts = (
  config: KeyboardShortcutsConfig
): void => {
  const {
    canUndo,
    canRedo,
    undo,
    redo,
    canUndoSegment,
    canRedoSegment,
    undoSegment,
    redoSegment,
    deleteSegment,
    deleteEffect,
    currentSegmentId,
    editingEffectId,
    handleSplitSegment,
  } = config;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Handle undo/redo shortcuts (Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z)
      if (event.ctrlKey || event.metaKey) {
        if (event.key === 'z' && !event.shiftKey) {
          event.preventDefault();
          // Try to undo segments first, then effects
          if (canUndoSegment) {
            console.log('🔄 Undoing segment operation');
            undoSegment();
          } else if (canUndo) {
            console.log('🔄 Undoing effect operation');
            undo();
          }
        } else if (event.key === 'y' || (event.key === 'z' && event.shiftKey)) {
          event.preventDefault();
          // Try to redo segments first, then effects
          if (canRedoSegment) {
            console.log('🔄 Redoing segment operation');
            redoSegment();
          } else if (canRedo) {
            console.log('🔄 Redoing effect operation');
            redo();
          }
        } else if (event.key === 'k' || event.key === 'K') {
          // Split segment at current time (Ctrl+K)
          event.preventDefault();
          handleSplitSegment();
        }
      }

      // Handle Delete key for segments and effects
      if (event.key === 'Delete' || event.key === 'Backspace') {
        // Check if user is typing in an input field
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return; // Don't intercept delete in input fields
        }

        event.preventDefault();

        // Delete currently selected segment instantly (no confirmation)
        if (currentSegmentId) {
          console.log('🗑️ Deleting segment via keyboard:', currentSegmentId);
          deleteSegment(currentSegmentId);
        }
        // Delete currently editing effect instantly
        else if (editingEffectId) {
          console.log('🗑️ Deleting effect via keyboard:', editingEffectId);
          deleteEffect(editingEffectId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    canUndo,
    canRedo,
    undoSegment,
    redoSegment,
    canUndoSegment,
    canRedoSegment,
    deleteSegment,
    currentSegmentId,
    editingEffectId,
    deleteEffect,
    handleSplitSegment,
  ]);
};
