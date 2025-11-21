# Frontend Implementation Plan

## ✅ Implementation Status Summary

**Last Updated:** Current implementation reflects all recent frontend changes

### Completed Phases:
- ✅ **Phase 1**: Project Setup & Foundation
- ✅ **Phase 2**: Layout Infrastructure (Zone System)
- ✅ **Phase 3**: CT Viewer Implementation (using nifti-reader-js)
- ✅ **Phase 4**: Report Editor
- ✅ **Phase 5**: Command Bar Functionality (with macro checkboxes)
- ✅ **Phase 6**: Reference Tray Tabs
- ✅ **Phase 7**: Modals (FocusModal, FullScreenViewer)
- ✅ **Phase 9**: Data Loading & Management (NIfTI utilities)
- ✅ **Phase 10**: Polish & UX Enhancements

### Key Implementation Details:
- **CT Viewer**: Uses `nifti-reader-js` (not Cornerstone.js)
- **Macro Controls**: Checkboxes (not buttons) allowing multiple selection
- **Slice Management**: Preserves slice position per view (axial/sagittal/coronal)
- **Configuration**: JSON file for CT scan rescale values (`ct_scan_config.json`)
- **Performance**: Supports preprocessed JSON files for faster loading
- **UI Elements**: ViewSelector with thumbnails, resizable Zone C, updated titles

---

## Phase 1: Project Setup & Foundation (Priority: HIGHEST) ✅ COMPLETED

### 1.1 Initialize Next.js Project ✅ COMPLETED
**Tasks:**
- ✅ Created Next.js app in `frontend/` directory using Next.js 16 (App Router)
- ✅ Configured for JavaScript only (no TypeScript)
- ✅ Set up directory structure as per project-structure.md
- ✅ Installed core dependencies

**Dependencies to Install:**
```bash
# Core
npm install react react-dom next

# UI & Styling
npm install @emotion/react @emotion/styled
npm install clsx

# HTTP Client
npm install axios

# State Management
npm install zustand

# Markdown Rendering
npm install react-markdown remark-gfm

# PDF Viewing
npm install react-pdf

# Medical Imaging (CT Viewer)
npm install nifti-reader-js
# Note: cornerstone-core, cornerstone-tools, cornerstone-wado-image-loader, dicom-parser, and vtk.js are installed but not currently used
```

### 1.2 Configure Dark Theme ✅ COMPLETED
**Tasks:**
- ✅ Created `globals.css` with dark theme CSS variables
- ✅ Created `dark-theme.css` with radiology-specific color palette
- ✅ Set up responsive layout foundation
- ✅ Configured fonts (Inter font family)

**Color Palette:**
```css
/* Dark Theme Colors */
--bg-primary: #0a0a0a
--bg-secondary: #1a1a1a
--bg-tertiary: #2a2a2a
--text-primary: #e0e0e0
--text-secondary: #b0b0b0
--accent-blue: #4a9eff
--accent-green: #4ade80
--accent-red: #f87171
--border-subtle: #333333
```

---

## Phase 2: Layout Infrastructure (Zone System)

### 2.1 Main Page Layout ✅ COMPLETED
**File:** `app/page.js` ✅

**Implementation:**
- ✅ Created main page component in `app/page.js` (Next.js App Router)
- ✅ Implemented three-zone vertical layout
- ✅ Zone C (Reference Tray) is collapsible with localStorage persistence
- ✅ Zone C has resizable height (15%-60% range)
- ✅ Keyboard shortcuts (ESC to close modals, Ctrl/Cmd+S for save, Ctrl/Cmd+K for focus)
- ✅ App Header with title: "RSNA 2025 DLL • An Introduction to Agentic AI in Radiology"

**Layout Structure:**
```javascript
<MainContainer>
  <AppHeader />            {/* 48px fixed */}
  <ZoneA_Workspace />      {/* Flexible height */}
  <ZoneB_CommandBar />     {/* ~64px */}
  <ZoneC_ReferenceTray />  {/* Resizable 15-60vh, collapsible */}
</MainContainer>
```

### 2.2 Zone A: Workspace Component
**File:** `components/layout/ZoneA_Workspace.jsx` ✅

**Implementation:**
- ✅ Split-panel layout (50% / 50%)
- ✅ Left Panel: CT Viewer with controls
- ✅ Right Panel: Report Editor
- ✅ NIfTI data loaded once and shared between regular and fullscreen views
- ✅ Slice position preserved per view (axial, sagittal, coronal)
- ✅ FullScreenViewer modal integration

**Component Structure:**
```javascript
<ZoneA_Workspace>
  <LeftPanel>
    <CTViewer />
    <ViewerControls />
  </LeftPanel>
  <RightPanel>
    <ReportEditor />
  </RightPanel>
  <FullScreenViewer /> {/* Modal when maximized */}
</ZoneA_Workspace>
```

**State Management:**
- Tracks current slice, view, window level
- Manages slice positions per view (remembers last slice for each)
- Handles fullscreen state

### 2.3 Zone B: Command Bar Component
**File:** `components/layout/ZoneB_CommandBar.jsx` ✅

**Implementation:**
- ✅ Horizontal control strip
- ✅ Custom instruction text input with placeholder
- ✅ Macro checkboxes (not buttons) - allows multiple selection
- ✅ Execute button with processing state
- ✅ Processing indicator (spinner animation)

**Macro Checkboxes:**
- ✅ "Add Further Clinical Background" (`add_background`)
- ✅ "Proofread" (`proofread`)
- ✅ "Make Impressions" (`make_impressions`)
- ✅ "Compare to Priors" (`compare_priors`)
- ✅ "Check References" (`check_references`)

**Features:**
- Multiple macros can be selected simultaneously
- Checkboxes disabled during processing
- Execute button disabled when no instruction and no macros selected
- Ctrl/Cmd + Enter keyboard shortcut to execute

### 2.4 Zone C: Reference Tray Component
**File:** `components/layout/ZoneC_ReferenceTray.jsx` ✅

**Implementation:**
- ✅ Collapsible drawer component with smooth animation
- ✅ Tab navigation (4 tabs) with active state styling
- ✅ Resizable height (15%-60% range) with drag handle
- ✅ Stores collapse state in localStorage
- ✅ Stores height preference in localStorage
- ✅ Resizer handle with visual feedback

**Tabs:**
1. ✅ Prior Reports (`PriorImagingTab.jsx`)
2. ✅ EHR Data (`EHRTab.jsx`)
3. ✅ Guidelines (`GuidelinesTab.jsx`)
4. ✅ Style Settings (`StyleSettingsTab.jsx`)

**Features:**
- Collapse button (▼) rotates when collapsed
- Resizer handle changes color on hover
- Smooth transitions for collapse/expand
- FocusModal integration for viewing documents

---

## Phase 3: CT Viewer Implementation ✅ COMPLETED

### 3.1 Basic CT Viewer Setup
**File:** `components/viewer/CTViewer.jsx` ✅

**Implementation:**
- ✅ Uses `nifti-reader-js` library (not Cornerstone.js)
- ✅ Loads NIfTI volume from `/demo-data/medical_imaging/ct_scan.nii.gz`
- ✅ Supports preprocessed JSON files (`_preprocessed.json`) for faster loading
- ✅ Implements scroll-through-slices functionality (mouse wheel)
- ✅ Responsive canvas sizing (adapts to container size)
- ✅ Slice indicator (only shows when data is fully loaded)
- ✅ Supports three views: Axial, Sagittal, Coronal
- ✅ Preserves slice position per view (remembers last slice for each view)
- ✅ Starts at mid-slice for each view on initial load

**Key Features:**
- Canvas-based rendering with hardware acceleration
- Proper window/level presets (Brain, Soft Tissue, Bone, Lung)
- Crosshair overlay
- Loading states and error handling

### 3.2 Viewer Controls
**File:** `components/viewer/ViewerControls.jsx` ✅

**Implementation:**
- ✅ Window/Level presets dropdown (Brain, Soft Tissue, Bone, Lung)
- ✅ Slice navigation controls (Previous/Next buttons)
- ✅ Slice counter display
- ✅ Reset button
- ✅ "Maximize" button → Opens FullScreenViewer modal
- ✅ All controls properly styled with dark theme

### 3.3 View Selector Component
**File:** `components/viewer/ViewSelector.jsx` ✅

**Implementation:**
- ✅ Vertical stack of view selection buttons
- ✅ Thumbnail previews showing mid-slice for each view
- ✅ Visual feedback for selected view
- ✅ Positioned in top-left corner of viewer

### 3.4 Full Screen Viewer Modal
**File:** `components/modals/FullScreenViewer.jsx` ✅

**Implementation:**
- ✅ Full-screen overlay modal (z-index: 9999)
- ✅ Displays CT viewer in full-screen mode
- ✅ Canvas automatically resizes to fullscreen dimensions
- ✅ ESC key handler to close
- ✅ Close button in header
- ✅ Preserves current slice when maximizing (no reload)
- ✅ Shares same NIfTI data (no reload on maximize)

### 3.5 NIfTI Loading Utilities
**Files:** `utils/niftiLoader.js`, `utils/ctScanConfig.js` ✅

**Implementation:**
- ✅ `loadNiftiFile()` - Loads NIfTI or preprocessed JSON files
- ✅ `extractSlice()` - Extracts slices for axial/sagittal/coronal views
- ✅ `normalizeSlice()` - Applies window/level transformations
- ✅ `applyWindowLevel()` - CT windowing calculations
- ✅ JSON configuration file (`ct_scan_config.json`) for rescale intercept/slope
- ✅ Supports multiple CT scans with different rescale values
- ✅ Proper handling of sagittal/coronal view orientation (flipped correctly)

---

## Phase 4: Report Editor

### 4.1 Report Editor Component
**File:** `components/report/ReportEditor.jsx` ✅

**Implementation:**
- ✅ Structured form with 4 fields:
  - Indication (textarea, editable)
  - Technique (textarea, read-only with default text)
  - Findings (large textarea, editable)
  - Impression (textarea, editable)
- ✅ Live text editing with real-time updates
- ✅ Cursor position tracking for text insertion
- ✅ Character/word count per field
- ✅ Auto-save to localStorage every 5 seconds
- ✅ Loads saved report on mount
- ✅ Header title: "Sample Chest CT scan Report"

### 4.2 Report State Management
**File:** `hooks/useReportState.js`

**Tasks:**
- [ ] Create Zustand store for report state
- [ ] Implement state structure:
```javascript
{
  indication: "",
  technique: "",
  findings: "",
  impression: "",
  cursorPosition: { field: "", position: 0 }
}
```
- [ ] Add actions: updateField, setCursorPosition, resetReport

---

## Phase 5: Command Bar Functionality

### 5.1 Instruction Input Component
**File:** `components/command/InstructionInput.jsx`

**Tasks:**
- [ ] Create text input field
- [ ] Add placeholder text: "Enter custom instruction..."
- [ ] Clear input after execution
- [ ] Add speech-to-text button (for future STT integration)

### 5.2 Macro Checkboxes Component ✅ COMPLETED
**File:** `components/layout/ZoneB_CommandBar.jsx` (integrated)

**Implementation:**
- ✅ Checkbox group with 5 macros (not buttons)
- ✅ Multiple macros can be selected simultaneously
- ✅ Styled with dark theme
- ✅ Disabled during processing
- ✅ Visual feedback (checked/unchecked states)

**Macro Options:**
- "Add Further Clinical Background" (`add_background`)
- "Proofread" (`proofread`)
- "Make Impressions" (`make_impressions`)
- "Compare to Priors" (`compare_priors`)
- "Check References" (`check_references`)

**Behavior:**
- Checkboxes allow multiple selection
- Selected macros are tracked in state
- Execute button works with custom instruction and/or selected macros

### 5.3 Processing Indicator ✅ COMPLETED
**File:** `components/layout/ZoneB_CommandBar.jsx` (integrated)

**Implementation:**
- ✅ Animated loading spinner (CSS animation)
- ✅ "Processing..." text display
- ✅ Shown next to Execute button during processing
- ✅ Execute button shows "Processing..." when active
- ✅ All controls disabled during processing

---

## Phase 6: Reference Tray Tabs ✅ COMPLETED

### 6.1 Prior Imaging Tab
**File:** `components/tray/PriorImagingTab.jsx` ✅

**Implementation:**
- ✅ Displays list of prior reports from `/demo-data/prior_reports/`
- ✅ Shows report date and title
- ✅ Click opens FocusModal with full report content
- ✅ Supports Markdown format (rendered with react-markdown)

### 6.2 EHR Data Tab
**File:** `components/tray/EHRTab.jsx` ✅

**Implementation:**
- ✅ Loads `patient_context.json` from `/demo-data/ehr_data/`
- ✅ Displays in structured format:
  - Patient Demographics
  - Lab Results (table format)
  - Medications (list)
  - Clinical Notes (expandable sections)

### 6.3 Guidelines Tab
**File:** `components/tray/GuidelinesTab.jsx` ✅

**Implementation:**
- ✅ Lists available guidelines from `/demo-data/guidelines/`
- ✅ Displays guideline titles
- ✅ Click opens FocusModal with full guideline content
- ✅ Supports Markdown format

### 6.4 Style Settings Tab
**File:** `components/tray/StyleSettingsTab.jsx` ✅

**Implementation:**
- ✅ Basic tab structure created
- ✅ Placeholder for future file upload functionality

---

## Phase 7: Modals ✅ COMPLETED

### 7.1 Focus Modal
**File:** `components/modals/FocusModal.jsx` ✅

**Implementation:**
- ✅ Centered overlay modal (large, z-index: 9999)
- ✅ Supports displaying Markdown files (using react-markdown)
- ✅ Close button (X) in header
- ✅ ESC key handler to close
- ✅ Scroll functionality for long content
- ✅ Dark theme styling

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: function,
  content: object (with title and content fields)
}
```

### 7.2 Full Screen Viewer Modal
**File:** `components/modals/FullScreenViewer.jsx` ✅

**Implementation:**
- ✅ Full-screen overlay modal (z-index: 9999)
- ✅ Displays CT viewer in full-screen mode
- ✅ Canvas automatically resizes to fullscreen dimensions
- ✅ ESC key handler to close
- ✅ Close button in header
- ✅ Preserves current slice when maximizing (no reload)
- ✅ Shares same NIfTI data (no reload on maximize)

---

## Phase 8: API Integration

### 8.1 API Utility Setup
**File:** `utils/api.js`

**Tasks:**
- [ ] Create axios instance with base URL from env
- [ ] Implement error handling wrapper
- [ ] Add request/response interceptors
- [ ] Implement timeout handling (30 seconds)

### 8.2 Agent API Hook
**File:** `hooks/useAgentAPI.js`

**Tasks:**
- [ ] Create custom hook for agent interaction
- [ ] Implement `processReport` function:
```javascript
async function processReport({
  currentReport,
  instruction,
  modeButton
}) {
  // POST to /agent/process
  // Return response with diff and agent_thoughts
}
```
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Store agent thoughts for display

### 8.3 Execute Flow Implementation
**Integration across components**

**Tasks:**
- [ ] Wire up Execute button to `processReport`
- [ ] Display processing indicator during API call
- [ ] Apply diff to report fields upon success
- [ ] Show agent thoughts in command bar (expandable)
- [ ] Handle errors gracefully with user-friendly messages

---

## Phase 9: Data Loading & Management

### 9.1 Demo Data Setup
**Tasks:**
- [ ] Create all dummy data files in `frontend/public/demo-data/`
- [ ] Ensure proper JSON structure for `patient_context.json`
- [ ] Create sample markdown prior reports
- [ ] Add sample PDF guidelines
- [ ] Test file loading from public directory

### 9.2 File Loading Utilities ✅ COMPLETED
**Files:** `utils/niftiLoader.js`, `utils/ctScanConfig.js`, `utils/api.js`

**Implementation:**
- ✅ `loadNiftiFile()` - Loads NIfTI files or preprocessed JSON
- ✅ `loadCTScanConfig()` - Loads JSON configuration for rescale values
- ✅ `getRescaleValues()` - Gets rescale intercept/slope for specific CT scan
- ✅ `extractSlice()` - Extracts slices from volume
- ✅ `normalizeSlice()` - Applies window/level transformations
- ✅ `applyWindowLevel()` - CT windowing calculations
- ✅ Error handling for missing files
- ✅ Support for preprocessed JSON files (faster loading)

**CT Scan Configuration:**
- JSON file: `/demo-data/medical_imaging/ct_scan_config.json`
- Format: Array of objects with `file_path`, `rescale_intercept`, `rescale_slope`
- Allows manual configuration of rescale values per CT scan

---

## Phase 10: Polish & UX Enhancements

### 10.1 Keyboard Shortcuts ✅ COMPLETED
**Implementation:**
- ✅ ESC: Close any open modal (FullScreenViewer, FocusModal)
- ✅ Ctrl/Cmd + Enter: Execute current instruction (in ZoneB_CommandBar)
- ✅ Keyboard navigation for slice scrolling (mouse wheel)

### 10.2 Responsive Design ✅ COMPLETED
**Implementation:**
- ✅ Layout works on various desktop screen sizes
- ✅ Canvas viewer adapts to container size (ResizeObserver)
- ✅ Zone C is resizable (15%-60% range)
- ✅ FullScreenViewer adapts to fullscreen dimensions
- ✅ Desktop-only design (no mobile support)

### 10.3 Loading States & Animations ✅ COMPLETED
**Implementation:**
- ✅ Loading spinner in CT viewer during NIfTI load
- ✅ Smooth collapse/expand animations for Zone C
- ✅ Fade transitions for modals
- ✅ Button hover/active states throughout
- ✅ Processing indicator in Command Bar
- ✅ Slice indicator only shows when data is fully loaded

### 10.4 Error Handling ✅ COMPLETED
**Implementation:**
- ✅ Error handling for missing NIfTI files
- ✅ Graceful fallback when preprocessed file not found
- ✅ Console error logging for debugging
- ✅ Loading states prevent interaction during processing

---

## Phase 11: Testing & Documentation

### 11.1 Component Testing
**Tasks:**
- [ ] Test all components in isolation
- [ ] Verify dark theme consistency
- [ ] Test all interactive elements (buttons, inputs, modals)
- [ ] Test keyboard shortcuts

### 11.2 Integration Testing
**Tasks:**
- [ ] Test complete user flow: Instruction → Execute → Response → Update Report
- [ ] Test all macro buttons
- [ ] Test data loading from demo files
- [ ] Test modal open/close behaviors

### 11.3 Frontend Documentation
**Tasks:**
- [ ] Document component API (props, events)
- [ ] Document state management structure
- [ ] Document API integration patterns
- [ ] Create setup guide for local development

---

## Implementation Timeline

### Week 1: Foundation
- Complete Phases 1-2 (Setup & Layout)

### Week 2: Core Components
- Complete Phases 3-4 (CT Viewer & Report Editor)

### Week 3: Interactive Features
- Complete Phases 5-6 (Command Bar & Reference Tray)

### Week 4: Integration & Polish
- Complete Phases 7-11 (Modals, API, Polish, Testing)

---

## Critical Success Factors

1. **Dark Theme Consistency**: Every component must use the dark theme color palette
2. **Performance**: CT viewer must load and scroll smoothly (60fps)
3. **User Experience**: All interactions should feel immediate and responsive
4. **Error Resilience**: Graceful degradation when backend is unavailable
5. **Accessibility**: Proper focus management, keyboard navigation, ARIA labels

---

## Dependencies on Backend

- Backend API must be available at `/agent/process` endpoint
- Response format must match:
```javascript
{
  status: "success",
  diff: {
    indication: "...",
    technique: "...",
    findings: "...",
    impression: "..."
  },
  agent_thoughts: ["...", "...", "..."]
}
```

---

## Future Enhancements (Post-Workshop)

- [ ] Speech-to-text integration for dictation
- [ ] Real-time collaboration features
- [ ] Advanced CT viewing (MPR, 3D rendering)
- [ ] Report templates library
- [ ] Export report to PDF
- [ ] Integration with PACS systems


