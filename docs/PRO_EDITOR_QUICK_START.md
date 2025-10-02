# Pro Video Editor - Quick Start Guide

## 📚 Documentation Overview

This is your quick reference guide for implementing the Pro Video Editor with segment-based lip-sync functionality.

### **Available Documents**

1. **PRO_VIDEO_EDITOR_IMPLEMENTATION_PLAN.md** ⭐ Main Plan
   - Complete technical architecture
   - Frontend/Backend implementation details
   - Database schema updates
   - 14-day implementation roadmap
   - TypeScript interfaces and store design

2. **PRO_EDITOR_UI_MOCKUPS.md** 🎨 Design Reference
   - Visual mockups and layouts
   - Interaction patterns
   - Responsive design breakpoints
   - Component styling guidelines
   - Accessibility features

3. **This Document** 🚀 Quick Reference
   - Quick summary and key decisions
   - File checklist
   - Common patterns

---

## 🎯 Core Concept Summary

### **Current State: Basic Video Editor**
```
User Flow:
1. Upload 1 video file
2. Upload 1 audio file (optional)
3. Draw text removal regions
4. Process entire video with single audio
```

### **New State: Pro Video Editor**
```
User Flow:
1. Upload 1 video file
2. Select multiple segments (time ranges)
3. Upload different audio for each segment
4. Configure per-segment audio options
5. Process video with segment-specific lip-sync
```

### **Key Difference**
- **Basic**: Entire video + one audio → uniform lip-sync
- **Pro**: Multiple segments + multiple audios → targeted lip-sync per segment

---

## 🏗️ Architecture Overview

### **Frontend Structure**

```
New Files to Create (17 files):
frontend/src/
├── pages/
│   └── ProVideoEditorPage.tsx              # Main route component
├── components/VideoEditor/Pro/
│   ├── ProVideoEditor.tsx                  # Main editor component
│   ├── SegmentManager.tsx                  # Segment list/CRUD
│   ├── SegmentDialog.tsx                   # Add/edit segment dialog
│   ├── SegmentTimeline.tsx                 # Visual timeline
│   ├── AudioUploadCard.tsx                 # Audio upload per segment
│   └── SegmentPreview.tsx                  # Preview component
├── store/
│   └── segmentsStore.ts                    # Zustand state management
├── types/
│   └── segments.ts                         # TypeScript interfaces
└── utils/
    └── segmentValidation.ts                # Validation helpers
```

### **Backend Structure**

```
Files to Modify/Create (5 files):
backend/
├── api/routes/
│   └── sync_api.py                         # Add pro-sync-process endpoint
├── services/
│   └── s3_service.py                       # Add multi-audio upload
├── models/
│   ├── user.py                             # Add subscription_tier field
│   └── job.py                              # Add segments_data field
└── utils/
    └── segment_processor.py                # Segment processing logic
```

---

## 🔑 Key Technical Decisions

### **1. Data Structure**

```typescript
// Core segment interface
interface VideoSegment {
  id: string;                  // UUID for frontend tracking
  startTime: number;           // Seconds (e.g., 15.5)
  endTime: number;             // Seconds (e.g., 30.0)
  audioInput: {
    refId: string;             // Reference ID for S3 mapping
    file: File;                // File object for upload
    url: string;               // S3 URL after upload
    startTime?: number;        // Optional audio crop start
    endTime?: number;          // Optional audio crop end
  };
  label?: string;              // Optional display name
}
```

### **2. API Payload Format**

```javascript
// FormData structure for submission
const formData = new FormData();
formData.append('file', videoFile);                    // Single video
formData.append('audio_files', audioFile1);            // Multiple audios
formData.append('audio_files', audioFile2);
formData.append('audio_files', audioFile3);
formData.append('segments_data', JSON.stringify([      // Segments metadata
  {
    startTime: 0,
    endTime: 15,
    audioInput: { refId: 'audio-uuid-1' }
  },
  {
    startTime: 15,
    endTime: 30,
    audioInput: { refId: 'audio-uuid-2' }
  }
]));
formData.append('effects', JSON.stringify(effects));   // Text removal regions
```

### **3. Sync.so API Integration**

```python
# Backend request to Sync.so API
{
  "model": "lipsync-2",
  "input": [
    {"type": "video", "url": "s3://video.mp4"}
  ],
  "segments": [                           # NEW: Segments array
    {
      "startTime": 0,
      "endTime": 15,
      "audioInput": {
        "refId": "audio-1",
        "url": "s3://audio1.mp3",
        "startTime": 5,                   # Optional audio crop
        "endTime": 20
      }
    },
    {
      "startTime": 15,
      "endTime": 30,
      "audioInput": {
        "refId": "audio-2",
        "url": "s3://audio2.mp3"
      }
    }
  ],
  "options": {
    "sync_mode": "loop"
  }
}
```

---

## ✅ Implementation Checklist

### **Phase 1: Frontend Foundation (Days 1-3)**
- [ ] Create TypeScript interfaces (`types/segments.ts`)
- [ ] Implement Zustand segments store (`store/segmentsStore.ts`)
- [ ] Create ProVideoEditorPage route
- [ ] Build SegmentManager component
- [ ] Build SegmentDialog component
- [ ] Add validation logic
- [ ] Update Sidebar navigation with Pro editor link

### **Phase 2: Timeline Visualization (Days 4-5)**
- [ ] Create SegmentTimeline component
- [ ] Implement visual segment blocks
- [ ] Add drag-to-select functionality
- [ ] Implement color-coding
- [ ] Add zoom/pan controls
- [ ] Sync timeline with video player

### **Phase 3: Audio Management (Days 6-7)**
- [ ] Create AudioUploadCard component
- [ ] Implement multi-file audio upload
- [ ] Add audio validation (format, size)
- [ ] Display audio duration vs segment duration
- [ ] Add audio crop options UI
- [ ] Store audio files with refId mapping

### **Phase 4: Backend Integration (Days 8-10)**
- [ ] Add `subscription_tier` to users table
- [ ] Add `segments_data` to jobs table
- [ ] Create `/api/v1/sync/pro-sync-process` endpoint
- [ ] Implement multi-audio S3 upload
- [ ] Build Sync.so API call with segments
- [ ] Add subscription tier validation
- [ ] Update job monitoring for segments

### **Phase 5: Integration & Testing (Days 11-12)**
- [ ] Connect frontend to new API endpoint
- [ ] Implement FormData submission with multiple files
- [ ] Add real-time progress tracking
- [ ] Handle error states and validation
- [ ] Add success/completion notifications
- [ ] Test with various segment configurations

### **Phase 6: Polish (Days 13-14)**
- [ ] Add user onboarding tooltips
- [ ] Implement autosave/draft functionality
- [ ] Add keyboard shortcuts
- [ ] Performance optimization
- [ ] Accessibility improvements
- [ ] Documentation and comments

---

## 🚨 Critical Validations

### **Frontend Validations**
1. **Time Range**: `0 <= startTime < endTime <= videoDuration`
2. **No Overlaps**: Check all existing segments for time overlap
3. **Max Segments**: Pro tier = 5, Enterprise tier = 10
4. **Audio File**: Required for each segment
5. **Audio Format**: MP3, WAV, M4A, AAC only
6. **Audio Size**: Max 100MB per file

### **Backend Validations**
1. **User Tier**: Must be Pro or Enterprise
2. **Credit Balance**: Sufficient credits available
3. **Segments Count**: Within tier limits
4. **File Sizes**: Video < 2GB, Audio < 100MB each
5. **S3 Upload**: All files uploaded successfully
6. **No Gaps**: Optionally validate no large gaps between segments

---

## 🎨 Key UI/UX Principles

1. **Progressive Disclosure**: Show simple options first, advanced in accordion
2. **Visual Feedback**: Always show what's happening (uploading, processing, etc.)
3. **Error Prevention**: Validate before submission, prevent overlaps
4. **Clear CTAs**: Make primary actions obvious (Add Segment, Process All)
5. **Responsive Design**: Mobile-first, adapt to all screen sizes

---

## 💡 Best Practices

### **Code Organization**
- **Max 300 lines** per file → Split into smaller components
- **Strong typing** → Define all TypeScript interfaces upfront
- **Feature folders** → Group related components together
- **Reusable utils** → Extract common logic to utility functions

### **State Management**
- **Zustand store** for segment state (not React Context for performance)
- **Local state** for UI-only concerns (modals, tooltips)
- **Query cache** for server data (React Query if needed)

### **Performance**
- **Lazy load** timeline thumbnails
- **Virtual scrolling** for long segment lists
- **Debounce** user inputs (drag, resize)
- **Memoize** expensive calculations

---

## 🔗 API Endpoints Summary

### **New Endpoints**
```
POST /api/v1/sync/pro-sync-process
- Upload video + multiple audios
- Create segmented lip-sync job
- Returns job_id and sync_generation_id

GET /api/v1/sync/pro-sync-status/{job_id}
- Get real-time status of Pro job
- Returns segment processing progress
```

### **Existing Endpoints (Still Used)**
```
POST /api/v1/direct/direct-process
- Basic editor (text removal only)

POST /api/v1/sync/sync-process
- Basic editor with single lip-sync

GET /api/v1/jobs/{job_id}
- Get job details (works for all job types)
```

---

## 📊 Success Criteria

### **Functional Requirements**
- ✅ Users can add up to 10 segments
- ✅ Each segment has independent audio input
- ✅ Timeline visualizes all segments clearly
- ✅ No segment time overlaps allowed
- ✅ Audio can be cropped per segment
- ✅ Processing works with Sync.so API segments feature

### **Non-Functional Requirements**
- ✅ All files < 300 lines
- ✅ Strong TypeScript typing throughout
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Processing completes in < 5 minutes
- ✅ Error handling for all failure cases
- ✅ Comprehensive user feedback

---

## 🎓 Learning Resources

### **Sync.so API Documentation**
- Segments feature: https://docs.sync.so/api/segments
- Example with multiple segments provided in screenshot

### **React Libraries**
- Zustand: https://github.com/pmndrs/zustand
- react-rnd: https://github.com/bokuweb/react-rnd
- ReactPlayer: https://github.com/cookpete/react-player

### **Backend Libraries**
- FastAPI FormData: https://fastapi.tiangolo.com/tutorial/request-files/
- aiohttp: https://docs.aiohttp.org/en/stable/

---

## 🚀 Next Steps

1. **Review** both implementation plan documents thoroughly
2. **Clarify** any questions about the architecture
3. **Begin Phase 1** with TypeScript interfaces and store setup
4. **Iterate** through phases sequentially
5. **Test** frequently with real video/audio files

---

## 📞 Questions to Resolve

Before starting implementation, confirm:

1. **User Tiers**: What are exact segment limits? (Current: Pro=5, Enterprise=10)
2. **Pricing**: Credit cost per segment? (Current: ~20 credits per segment)
3. **Audio Limits**: Max audio file size? (Current: 100MB)
4. **Video Limits**: Max video duration? (Current: no specific limit)
5. **Gap Handling**: Can segments have gaps? (Current: Yes, gaps keep original audio)
6. **Overlap Behavior**: Hard block or warning? (Current: Hard block)

---

**Ready to implement? Start with Phase 1!** 🚀

**Estimated Total Time**: 14 days (2 weeks)
**Complexity**: Medium-High
**Impact**: High (Premium feature for Pro users)

---

**Document Version**: 1.0
**Created**: 2025-10-01
**Last Updated**: 2025-10-01
