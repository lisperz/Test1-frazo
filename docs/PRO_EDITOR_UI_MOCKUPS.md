# Pro Video Editor - UI/UX Design Mockups

## 🎨 Visual Design Specifications

### Color Palette

```css
/* Pro Feature Colors */
--pro-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
--pro-accent: #fbbf24
--pro-badge: #f59e0b

/* Segment Colors */
--segment-1: #3b82f6  /* Blue */
--segment-2: #10b981  /* Green */
--segment-3: #f59e0b  /* Amber */
--segment-4: #ef4444  /* Red */
--segment-5: #8b5cf6  /* Purple */
--segment-alternate: Auto-rotate through palette

/* Status Colors */
--processing: #3b82f6
--completed: #10b981
--error: #ef4444
--pending: #6b7280
```

---

## 📱 Screen-by-Screen Mockups

### **1. Sidebar Navigation (Enhanced)**

```
┌─────────────────────────┐
│  MetaFrazo              │
│  100 credits  [⚙️]      │
├─────────────────────────┤
│                         │
│ 🌐 TRANSLATE            │
│  └─ Translate           │
│  └─ Translation History │
│                         │
│ 🎬 VIDEO EDITOR         │
│  ├─ 📹 Basic Editor     │
│  └─ ⭐ Pro Editor       │  ← New!
│                         │
│ 💳 CREDITS              │
│  └─ Credits             │
│                         │
│ 📚 HELP & SUPPORT       │
│  ├─ Documentation       │
│  ├─ FAQ                 │
│  └─ Support             │
│                         │
├─────────────────────────┤
│ Account                 │
│ demo@example.com        │
└─────────────────────────┘
```

**Implementation Notes**:
- Pro Editor has gold star icon (⭐)
- Tooltip: "Pro feature - Advanced segment control"
- Free users see lock icon with upgrade CTA

---

### **2. Pro Editor - Main View (Full Layout)**

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard    Pro Video Editor ⭐            👤 Pro User | 💰 850 credits│
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │  Progress: Upload Video → Add Segments → Configure Audio → Process        │   │
│ │  [●━━━○━━━○━━━○]  Step 1 of 4                                            │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│ ┌─────────────────────────────────────┐  ┌───────────────────────────────────┐ │
│ │                                     │  │  📊 Segments Overview            │ │
│ │                                     │  │  ──────────────────────────────  │ │
│ │         Video Preview               │  │                                  │ │
│ │        (ReactPlayer)                │  │  Total Segments: 3 / 10          │ │
│ │                                     │  │  Total Duration: 45s / 180s      │ │
│ │     [1920x1080, 01:30:00]          │  │  Coverage: 25%                   │ │
│ │                                     │  │                                  │ │
│ │  [◀️] [▶️] [⏸️] [🔊] [⚙️]          │  │  ➕ Add New Segment              │ │
│ │  00:15:23 / 01:30:00                │  │                                  │ │
│ │  ═══════○════════════════════       │  │  ─────────────────────────────  │ │
│ │                                     │  │                                  │ │
│ └─────────────────────────────────────┘  │  📝 Segment List:               │ │
│                                           │                                  │ │
│ ┌───────────────────────────────────────┐│  ┌────────────────────────────┐ │ │
│ │  Timeline with Segments               ││  │ 🟦 Segment 1               │ │ │
│ │                                       ││  │ ⏱️ 00:00 → 00:15 (15s)      │ │ │
│ │  ┌─────────────────────────────────┐ ││  │ 🎵 interview_audio.mp3     │ │ │
│ │  │ ▼                               │ ││  │ [✏️ Edit] [🗑️ Delete]       │ │ │
│ │  │ ███████████░░░░░░░░░░░█████████ │ ││  └────────────────────────────┘ │ │
│ │  │ Seg 1     │No sync│ Seg 2│      │ ││                                  │ │
│ │  │ 00:00   00:15   00:30   00:45   │ ││  ┌────────────────────────────┐ │ │
│ │  └─────────────────────────────────┘ ││  │ 🟩 Segment 2               │ │ │
│ │                                       ││  │ ⏱️ 00:30 → 00:45 (15s)      │ │ │
│ │  Legend:                              ││  │ 🎵 narrator_voice.mp3      │ │ │
│ │  ███ Lip-sync segment                ││  │ [✏️ Edit] [🗑️ Delete]       │ │ │
│ │  ░░░ Original audio                  ││  └────────────────────────────┘ │ │
│ │  [🔍+] [🔍-] [⏸️]                     ││                                  │ │
│ └───────────────────────────────────────┘│  ┌────────────────────────────┐ │ │
│                                           │  │ 🟨 Segment 3               │ │ │
│ ┌───────────────────────────────────────┐│  │ ⏱️ 01:00 → 01:15 (15s)      │ │ │
│ │  💡 Tips & Suggestions                ││  │ 🎵 outro_music.wav         │ │ │
│ │                                       ││  │ [✏️ Edit] [🗑️ Delete]       │ │ │
│ │  • Segments cannot overlap            ││  └────────────────────────────┘ │ │
│ │  • Max 10 segments for Pro tier       ││                                  │ │
│ │  • Audio can be cropped per segment   ││                                  │ │
│ └───────────────────────────────────────┘│                                  │ │
│                                           └───────────────────────────────────┘ │
│                                                                                   │
│ ┌───────────────────────────────────────────────────────────────────────────┐   │
│ │  [💾 Save Draft]  [👁️ Preview Segments]           [🚀 Process All Segments] │   │
│ └───────────────────────────────────────────────────────────────────────────┘   │
│                                                                                   │
│ ⚠️ Estimated Credits: 60 credits (20 per segment)                                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### **3. Add Segment Dialog (Detailed)**

```
┌──────────────────────────────────────────────────────────────┐
│  Add Lip-Sync Segment                               [X]      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Define Time Range                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  📍 Segment Time Range                                 │ │
│  │                                                        │ │
│  │  Start Time                                            │ │
│  │  ┌──────────┐  ┌──────────────────────────────────┐   │ │
│  │  │ 00:15:30 │  │ 🎯 Pick on Timeline              │   │ │
│  │  └──────────┘  └──────────────────────────────────┘   │ │
│  │  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] 00:15:30       │ │
│  │                                                        │ │
│  │  End Time                                              │ │
│  │  ┌──────────┐  ┌──────────────────────────────────┐   │ │
│  │  │ 00:30:00 │  │ 🎯 Pick on Timeline              │   │ │
│  │  └──────────┘  └──────────────────────────────────┘   │ │
│  │  [━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━] 00:30:00       │ │
│  │                                                        │ │
│  │  ⏱️ Duration: 14.5 seconds                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Step 2: Upload Audio                                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  🎵 Audio Input                                        │ │
│  │                                                        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │                                                  │ │ │
│  │  │         📎 Drop audio file here or click         │ │ │
│  │  │                                                  │ │ │
│  │  │     Supported: MP3, WAV, M4A, AAC                │ │ │
│  │  │     Max size: 100MB                               │ │ │
│  │  │                                                  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  Selected: interview_audio.mp3 (2.3MB, 00:20:00)      │ │
│  │  ✅ Audio is longer than segment                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Step 3: Advanced Options (Optional)                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ⚙️ Audio Configuration                                │ │
│  │                                                        │ │
│  │  ☑️ Crop audio to fit segment                         │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Audio Start: [00:05:00]  End: [00:19:30]       │ │ │
│  │  │  [━━━━━━━━━━━━━━━━━━━━━━━━━] Crop duration: 14.5s│ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │                                                        │ │
│  │  ☐ Loop audio if shorter than segment                │ │
│  │  ☐ Fade in/out edges (0.5s)                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Step 4: Label (Optional)                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Segment Label (for your reference)                   │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ Interview Section - John Doe                     │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ⚠️ This segment will cost ~20 credits                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  [Cancel]                        [Add Segment ➕]      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

### **4. Timeline Component (Zoomed In)**

```
┌─────────────────────────────────────────────────────────────────┐
│  Video Timeline - Pro Editor                     [🔍+] [🔍-]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Current Time: 00:15:23                                          │
│  ▼                                                               │
│  ├──────────────────────────────────────────────────────────────│
│  │                                                              │
│  │ ████████████████░░░░░░░░░░░░░░░████████████░░░░░░░░░░░░░░  │
│  │ 🟦 Segment 1    │  No Sync    │🟩 Segment 2│   No Sync     │
│  │                 │             │            │                │
│  │ 00:00         00:15         00:30        00:45            01:00│
│  │   ▲             ▲             ▲            ▲                │
│  │   │             │             │            │                │
│  │   └─ Drag to adjust          └─ Gap between segments       │
│  │                                                              │
│  ├──────────────────────────────────────────────────────────────│
│                                                                  │
│  [Segment Details on Hover]                                     │
│  ┌────────────────────────┐                                     │
│  │ 🟦 Segment 1           │                                     │
│  │ 00:00 → 00:15          │                                     │
│  │ Audio: interview.mp3   │                                     │
│  │ Click to edit →        │                                     │
│  └────────────────────────┘                                     │
│                                                                  │
│  Controls:                                                       │
│  • Click segment to select/edit                                 │
│  • Drag edges to resize                                          │
│  • Drag segment to move (if no overlap)                         │
│  • Click gap to add new segment                                 │
│  • [Space] to play/pause                                        │
│  • [Delete] to remove selected segment                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### **5. Processing Status Screen**

```
┌─────────────────────────────────────────────────────────────────┐
│  Pro Video Editor - Processing                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│              Processing Your Segmented Video...                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                                                            │ │
│  │                    [●●●●●●○○○○]                           │ │
│  │                                                            │ │
│  │               Overall Progress: 60%                        │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Pipeline Status:                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  ✅ Step 1: Video uploaded to cloud                       │ │
│  │  ✅ Step 2: Audio files uploaded (3/3)                    │ │
│  │  🔄 Step 3: Generating lip-sync for segments...           │ │
│  │     • Segment 1: ✅ Completed                             │ │
│  │     • Segment 2: 🔄 Processing (45%)                      │ │
│  │     • Segment 3: ⏳ Queued                                │ │
│  │  ⏳ Step 4: Applying text removal (pending)               │ │
│  │  ⏳ Step 5: Final rendering (pending)                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  Estimated Time Remaining: 3-5 minutes                           │
│                                                                  │
│  💡 Tip: You can leave this page and check status later          │
│      in the Jobs page.                                           │
│                                                                  │
│  [View Full Logs] [Cancel Processing] [Go to Jobs Page]         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### **6. Upgrade Dialog (For Free Users)**

```
┌────────────────────────────────────────────────┐
│  Unlock Pro Video Editor ⭐                    │
├────────────────────────────────────────────────┤
│                                                │
│  🚀 Advanced Segment Control                   │
│                                                │
│  Pro Video Editor includes:                    │
│                                                │
│  ✅ Up to 5 custom segments                    │
│  ✅ Multiple audio inputs                      │
│  ✅ Timeline-based editing                     │
│  ✅ Audio cropping & looping                   │
│  ✅ Priority processing queue                  │
│  ✅ 1,000 credits per month                    │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │                                          │ │
│  │       Pro Plan - $29/month               │ │
│  │                                          │ │
│  │   [🚀 Upgrade to Pro]                    │ │
│  │                                          │ │
│  │   30-day money-back guarantee            │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Need more? Enterprise plan available          │
│  (Up to 10 segments, 5,000 credits)            │
│                                                │
│  [Maybe Later] [Compare Plans] [Upgrade Now]  │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 🎯 Interaction Patterns

### **Timeline Interactions**

| Action | Result |
|--------|--------|
| Click empty space | Set current time / Add segment dialog |
| Click segment | Select segment (highlight) |
| Double-click segment | Open edit dialog |
| Drag segment edge | Resize segment (with validation) |
| Drag segment body | Move segment (if no overlap) |
| Right-click segment | Context menu (Edit, Delete, Duplicate) |
| [Delete] key | Remove selected segment |
| [Space] key | Play/Pause video |
| Mouse wheel | Zoom in/out timeline |

---

### **Segment Card Interactions**

| Action | Result |
|--------|--------|
| Click segment card | Highlight on timeline + scroll into view |
| Click "Edit" | Open edit dialog |
| Click "Delete" | Confirmation dialog → Remove segment |
| Drag segment card | Reorder in list (updates timeline) |
| Hover segment card | Show preview on timeline |

---

## 📐 Responsive Design Breakpoints

```
Desktop (> 1280px):
- Side-by-side layout (video + segments panel)
- Full timeline visible
- All controls visible

Tablet (768px - 1280px):
- Stacked layout (video top, segments bottom)
- Collapsible segments panel
- Scrollable timeline

Mobile (< 768px):
- Full-screen video
- Tabs: [Video] [Segments] [Timeline]
- Touch-optimized controls
- Simplified timeline
```

---

## 🎨 Component Styling Guidelines

### **Segment Cards**

```css
.segment-card {
  border-left: 4px solid var(--segment-color);
  border-radius: 8px;
  padding: 16px;
  background: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

.segment-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.segment-card.selected {
  border-left-width: 6px;
  background: linear-gradient(to right,
    rgba(102,126,234,0.05),
    white
  );
}
```

### **Timeline Segments**

```css
.timeline-segment {
  position: absolute;
  height: 60px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: white;
  user-select: none;
}

.timeline-segment:hover {
  filter: brightness(1.1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.timeline-segment.selected {
  border: 3px solid #fbbf24;
  box-shadow: 0 4px 12px rgba(251,191,36,0.5);
}
```

---

## ♿ Accessibility Features

1. **Keyboard Navigation**:
   - Tab through segments
   - Arrow keys to navigate timeline
   - Enter to edit selected segment
   - Delete to remove selected segment

2. **Screen Reader Support**:
   - Descriptive ARIA labels
   - Live regions for status updates
   - Semantic HTML structure

3. **Visual Indicators**:
   - High contrast colors
   - Clear focus states
   - Progress indicators
   - Error messages with icons

4. **Touch Support**:
   - Large touch targets (min 44x44px)
   - Swipe gestures for timeline navigation
   - Long-press for context menus

---

## 📱 Mobile-First Considerations

```
Mobile Layout (< 768px):

┌─────────────────────────┐
│ ← Pro Editor            │
├─────────────────────────┤
│                         │
│   [Video Preview]       │
│                         │
├─────────────────────────┤
│ [Video] [Segments] [⏱️] │ ← Tabs
├─────────────────────────┤
│                         │
│  Segment 1              │
│  00:00 - 00:15          │
│  [Edit] [Delete]        │
│                         │
│  Segment 2              │
│  00:15 - 00:30          │
│  [Edit] [Delete]        │
│                         │
│  [+ Add Segment]        │
│                         │
├─────────────────────────┤
│ [Process All Segments]  │
└─────────────────────────┘
```

---

**Document Version**: 1.0
**Created**: 2025-10-01
**Purpose**: UI/UX reference for Pro Video Editor implementation
