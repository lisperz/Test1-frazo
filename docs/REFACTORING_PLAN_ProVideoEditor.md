# ProVideoEditor.tsx Refactoring Plan

**Created**: 2025-11-21
**Status**: 🔴 CRITICAL - Violates CLAUDE.md Standards
**Current Size**: 2,526 lines (CLAUDE.md limit: 300 lines per file)

---

## 🎯 Refactoring Objectives

1. **Comply with CLAUDE.md**: Reduce file size to ≤300 lines
2. **Improve Maintainability**: Extract logical components
3. **Enable Future Features**: Prepare for drag-and-drop audio implementation
4. **Eliminate Code Smells**:
   - ❌ **Needless Complexity**: Single file doing too much
   - ❌ **Obscurity**: Hard to navigate 2,500+ lines
   - ❌ **Rigidity**: Changes cause cascading effects

---

## 📊 Current Architecture Analysis

### **File Structure Breakdown**

| Section | Lines | Responsibility | Target Component |
|---------|-------|----------------|------------------|
| Imports & Types | 1-45 | Dependencies, interfaces | Keep in main file |
| State Management | 46-100 | Hooks, refs, state | Extract to custom hooks |
| Event Handlers | 101-700 | Split, keyboard, effects | Extract to hook modules |
| Video Handlers | 349-476 | Thumbnails, bounds, playback | `useVideoHandlers.ts` |
| Effect Handlers | 479-685 | Drawing, dragging effects | `useEffectHandlers.ts` |
| Segment Handlers | 130-288 | Split, add, edit segments | `useSegmentHandlers.ts` |
| Submission Logic | 792-1200 | Form data, API upload | `SubmissionManager.tsx` |
| Main Render | 740-2526 | UI layout, nested JSX | Extract sub-components |

### **Existing Components** (already extracted)

✅ `/components/DrawingRectangle.tsx` (4,940 lines - **EXCEEDS LIMIT**)
✅ `/components/EditorHeader.tsx` (3,289 lines - **EXCEEDS LIMIT**)
✅ `/components/EffectOverlay.tsx` (8,017 lines - **EXCEEDS LIMIT**)
✅ `/components/FrameStrip.tsx` (3,250 lines - **EXCEEDS LIMIT**)
✅ `/components/TimeRuler.tsx` (4,957 lines - **EXCEEDS LIMIT**)
✅ `/components/TimelineControls.tsx` (6,550 lines - **EXCEEDS LIMIT**)
✅ `/components/TimelineEffectsTrack.tsx` (8,464 lines - **EXCEEDS LIMIT**)
✅ `/components/VideoPlayerContainer.tsx` (2,423 lines - **EXCEEDS LIMIT**)

**⚠️ ALL EXISTING COMPONENTS EXCEED 300-LINE LIMIT**

---

## 🏗️ Proposed Architecture

### **Phase 1: Extract Custom Hooks** (Reduces main file to ~1,200 lines)

#### 1.1 **`hooks/useVideoHandlers.ts`** (~150 lines)
**Responsibilities**:
- Thumbnail generation (`generateThumbnails()`)
- Video bounds calculation (`calculateVideoBounds()`)
- Ready, progress, duration handlers
- Playback controls (play/pause, seek, volume)

**Exports**:
```typescript
export const useVideoHandlers = (
  playerRef: RefObject<ReactPlayer>,
  videoContainerRef: RefObject<HTMLDivElement>,
  videoUrl: string,
  duration: number
) => {
  return {
    thumbnails,
    videoBounds,
    isVideoReady,
    handleReady,
    handleProgress,
    handleDuration,
    handlePlayPause,
    handleSeek,
    handleVolumeToggle,
    isMuted,
  };
};
```

---

#### 1.2 **`hooks/useSegmentHandlers.ts`** (~180 lines)
**Responsibilities**:
- Split segment logic (`handleSplitSegment()`)
- Add segment dialog management
- Segment selection and deletion
- Timeline segment drag handlers (start/end/move)

**Exports**:
```typescript
export const useSegmentHandlers = (
  segments: VideoSegment[],
  currentTime: number,
  duration: number
) => {
  return {
    handleSplitSegment,
    handleAddSegment,
    handleCloseDialog,
    handleSegmentDrag,
    isSegmentDialogOpen,
    editingSegmentId,
  };
};
```

---

#### 1.3 **`hooks/useEffectHandlers.ts`** (~200 lines)
**Responsibilities**:
- Drawing mode management
- Effect creation/editing
- Effect drag handlers (start/end/move)
- Effect selection and deletion

**Exports**:
```typescript
export const useEffectHandlers = (
  effects: VideoEffect[],
  currentTime: number,
  duration: number
) => {
  return {
    isDrawingMode,
    currentRect,
    selectedType,
    editingEffectId,
    handleAddEffect,
    handleSaveRect,
    handleCancelDrawing,
    handleEffectDrag,
    handleEffectClick,
    handleStopEditing,
  };
};
```

---

#### 1.4 **`hooks/useKeyboardShortcuts.ts`** (~120 lines)
**Responsibilities**:
- Undo/Redo shortcuts (Ctrl+Z/Y)
- Delete key handling (segments & effects)
- Split shortcut (Ctrl+K)
- Input field detection (prevent conflicts)

**Exports**:
```typescript
export const useKeyboardShortcuts = (
  canUndo: boolean,
  canRedo: boolean,
  undo: () => void,
  redo: () => void,
  deleteSegment: (id: string) => void,
  deleteEffect: (id: string) => void,
  currentSegmentId: string | null,
  editingEffectId: string | null,
  splitSegmentAtTime: (time: number) => boolean,
  currentTime: number
) => {
  // Returns nothing - just sets up event listeners
};
```

---

#### 1.5 **`hooks/useAutoLogin.ts`** (~80 lines)
**Responsibilities**:
- Check existing token validity
- Auto-login with demo account
- Token storage management

**Exports**:
```typescript
export const useAutoLogin = () => {
  // Returns nothing - runs once on mount
};
```

---

### **Phase 2: Extract Submission Logic** (Reduces main file to ~800 lines)

#### 2.1 **`components/SubmissionManager.tsx`** (~250 lines)
**Responsibilities**:
- Form data preparation
- Audio file upload to S3
- Segment payload construction
- API submission with progress tracking
- Success/error handling

**Props**:
```typescript
interface SubmissionManagerProps {
  segments: VideoSegment[];
  effects: VideoEffect[];
  videoFile: File | null;
  videoDuration: number;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  setSubmissionProgress: (message: string) => void;
}
```

**Usage in ProVideoEditor**:
```typescript
<SubmissionManager
  segments={segments}
  effects={effects}
  videoFile={videoFile}
  videoDuration={duration}
  isSubmitting={isSubmitting}
  setIsSubmitting={setIsSubmitting}
  setSubmissionProgress={setSubmissionProgress}
/>
```

---

### **Phase 3: Refactor Existing Components** (All to ≤300 lines each)

These components already exist but exceed the 300-line limit:

#### 3.1 **`components/EditorHeader.tsx`** (currently 3,289 lines)
**Target**: 150 lines
**Actions**:
- Extract submission button to `SubmissionManager`
- Extract segment counter to separate component
- Simplify props

#### 3.2 **`components/VideoPlayerContainer.tsx`** (currently 2,423 lines)
**Target**: 180 lines
**Actions**:
- Extract drawing overlay logic to `DrawingOverlay.tsx`
- Extract effect overlays to `EffectOverlaysRenderer.tsx`
- Use `useVideoHandlers` hook

#### 3.3 **`components/TimelineEffectsTrack.tsx`** (currently 8,464 lines)
**Target**: 250 lines
**Actions**:
- Extract segment rendering to `SegmentRenderer.tsx`
- Extract effect rendering to `EffectRenderer.tsx`
- Simplify drag handlers using extracted hooks

#### 3.4 **`components/TimelineControls.tsx`** (currently 6,550 lines)
**Target**: 200 lines
**Actions**:
- Extract zoom controls to separate component
- Extract playback controls to separate component
- Use `useVideoHandlers` hook

---

### **Phase 4: Main File Simplification**

**Target**: `ProVideoEditor.tsx` ≤ 280 lines

**Remaining responsibilities**:
1. Import all hooks and components
2. Initialize stores (segments, effects)
3. Coordinate state between hooks
4. Render layout structure (no inline JSX complexity)

**Final structure**:
```typescript
// ProVideoEditor.tsx (~280 lines)

import React from 'react';
import { Box } from '@mui/material';
import {
  useVideoHandlers,
  useSegmentHandlers,
  useEffectHandlers,
  useKeyboardShortcuts,
  useAutoLogin,
} from './hooks';
import {
  EditorHeader,
  VideoPlayerContainer,
  TimelineControls,
  TimelineEffectsTrack,
  SegmentDialog,
  SubmissionManager,
} from './components';

const ProVideoEditor: React.FC<ProVideoEditorProps> = ({
  videoUrl,
  videoFile,
  onBack,
}) => {
  // Stores
  const segments = useSegmentsStore();
  const effects = useEffectsStore();

  // Custom hooks
  const videoHandlers = useVideoHandlers(...);
  const segmentHandlers = useSegmentHandlers(...);
  const effectHandlers = useEffectHandlers(...);
  useKeyboardShortcuts(...);
  useAutoLogin();

  // Simple render with extracted components
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <EditorHeader {...headerProps} />

      <VideoPlayerContainer {...videoProps} />

      <TimelineControls {...timelineProps} />

      <TimelineEffectsTrack {...effectsTrackProps} />

      <SegmentDialog {...dialogProps} />

      <SubmissionManager {...submissionProps} />
    </Box>
  );
};

export default ProVideoEditor;
```

---

## 📋 Implementation Checklist

### **Phase 1: Extract Hooks** (~2 hours)
- [ ] Create `hooks/useVideoHandlers.ts`
- [ ] Create `hooks/useSegmentHandlers.ts`
- [ ] Create `hooks/useEffectHandlers.ts`
- [ ] Create `hooks/useKeyboardShortcuts.ts`
- [ ] Create `hooks/useAutoLogin.ts`
- [ ] Create `hooks/index.ts` (barrel export)
- [ ] Update ProVideoEditor.tsx to use hooks
- [ ] Test: Verify all functionality works

### **Phase 2: Extract Submission Logic** (~1 hour)
- [ ] Create `components/SubmissionManager.tsx`
- [ ] Move submission handler from ProVideoEditor
- [ ] Move submission state management
- [ ] Update EditorHeader to trigger submission via callback
- [ ] Test: Verify submission flow works

### **Phase 3: Refactor Existing Components** (~3 hours)
- [ ] Refactor `EditorHeader.tsx` (3,289 → 150 lines)
- [ ] Refactor `VideoPlayerContainer.tsx` (2,423 → 180 lines)
- [ ] Refactor `TimelineEffectsTrack.tsx` (8,464 → 250 lines)
- [ ] Refactor `TimelineControls.tsx` (6,550 → 200 lines)
- [ ] Refactor `EffectOverlay.tsx` (8,017 → 200 lines)
- [ ] Refactor `TimeRuler.tsx` (4,957 → 150 lines)
- [ ] Refactor `FrameStrip.tsx` (3,250 → 180 lines)
- [ ] Refactor `DrawingRectangle.tsx` (4,940 → 150 lines)
- [ ] Test: Verify all UI interactions work

### **Phase 4: Main File Simplification** (~1 hour)
- [ ] Simplify ProVideoEditor.tsx main render
- [ ] Remove inline handlers (use hook exports)
- [ ] Verify ProVideoEditor.tsx ≤ 300 lines
- [ ] Test: Full end-to-end workflow

### **Phase 5: Quality Assurance** (~1 hour)
- [ ] Run `npm run build` - verify no TypeScript errors
- [ ] Check all files ≤ 300 lines (`wc -l **/*.tsx`)
- [ ] Check all folders ≤ 8 files
- [ ] Test all features: split, drag, undo/redo, submit
- [ ] Verify no circular dependencies
- [ ] Update imports in related files

---

## 🎯 Success Metrics

✅ **ProVideoEditor.tsx**: 2,526 lines → **≤280 lines**
✅ **All components**: ≤300 lines each
✅ **All folders**: ≤8 files
✅ **Type safety**: 100% (no `any` types)
✅ **Functionality**: All features work identically
✅ **Build**: Zero TypeScript errors
✅ **Code smells**: Eliminated complexity, obscurity, rigidity

---

## 🚀 Post-Refactoring Benefits

1. **Easier to Add Drag-and-Drop**: New `AudioDropZone` component can be added cleanly
2. **Improved Testing**: Each hook and component can be unit tested
3. **Better Collaboration**: Developers can work on different hooks/components independently
4. **Faster Debugging**: Smaller files = easier to find bugs
5. **CLAUDE.md Compliant**: No more code smell violations

---

## 📝 Notes for Implementation

### **Important Considerations**

1. **State Coordination**: Hooks need to share state - use stores (Zustand) or props drilling
2. **Ref Passing**: `playerRef`, `videoContainerRef`, `frameStripRef` need careful handling
3. **Event Handlers**: Ensure proper cleanup in `useEffect` return statements
4. **TypeScript**: Maintain strong typing throughout - no `any` types
5. **Testing**: Test after each phase, not just at the end

### **Potential Risks**

⚠️ **Risk**: Breaking existing functionality during extraction
**Mitigation**: Test thoroughly after each phase, commit working code

⚠️ **Risk**: Circular dependencies between hooks
**Mitigation**: Design clear dependency flow (video → effects → segments)

⚠️ **Risk**: Props drilling becoming complex
**Mitigation**: Use Zustand stores for shared state where appropriate

---

## 🔄 Next Steps After Refactoring

Once refactoring is complete and verified:

1. **Implement Drag-and-Drop Audio**:
   - Create `components/AudioDropZone.tsx` (~150 lines)
   - Create `hooks/useAudioDrop.ts` (~120 lines)
   - Add safety buffer validation (100ms from video end)
   - Add visual drop indicators (green/red zones)

2. **Add User Warnings** (from NEXT_SESSION_PROMPT.md):
   - Warning about last 50-100ms of video/audio
   - Warning about 10-50ms gap between segments
   - Tooltips in SegmentDialog

---

**Total Estimated Effort**: 8 hours
**Recommended Approach**: Implement in phases, test after each phase
**Team Collaboration**: Can parallelize Phase 3 (different developers on different components)
