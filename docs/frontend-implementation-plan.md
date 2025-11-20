# Frontend Implementation Plan
## Phase 1: Project Setup & Foundation (Priority: HIGHEST)

### 1.1 Initialize Next.js Project
**Tasks:**
- [ ] Create Next.js app in `frontend/` directory using `npx create-next-app@latest`
- [ ] Configure for JavaScript only (no TypeScript)
- [ ] Set up directory structure as per project-structure.md
- [ ] Install core dependencies

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
npm install cornerstone-core cornerstone-tools cornerstone-wado-image-loader
npm install dicom-parser
npm install vtk.js
```

### 1.2 Configure Dark Theme
**Tasks:**
- [ ] Create `globals.css` with dark theme CSS variables
- [ ] Create `dark-theme.css` with radiology-specific color palette
- [ ] Set up responsive layout foundation
- [ ] Configure fonts (professional medical UI fonts)

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

### 2.1 Main Page Layout (index.js)
**Tasks:**
- [ ] Create main page component in `pages/index.js`
- [ ] Implement three-zone vertical layout (60% / 10% / 30%)
- [ ] Make Zone C (Reference Tray) collapsible
- [ ] Add keyboard shortcuts (ESC to close modals, etc.)

**Layout Structure:**
```javascript
<MainContainer>
  <ZoneA_Workspace />      {/* 60vh */}
  <ZoneB_CommandBar />     {/* 10vh */}
  <ZoneC_ReferenceTray />  {/* 30vh - collapsible */}
</MainContainer>
```

### 2.2 Zone A: Workspace Component
**File:** `components/layout/ZoneA_Workspace.jsx`

**Tasks:**
- [ ] Create split-panel layout (50% / 50%)
- [ ] Left Panel: CT Viewer container
- [ ] Right Panel: Structured Report Editor
- [ ] Add resize handle between panels (optional nice-to-have)

**Component Structure:**
```javascript
<ZoneA_Workspace>
  <LeftPanel>
    <CTViewer />
  </LeftPanel>
  <RightPanel>
    <ReportEditor />
  </RightPanel>
</ZoneA_Workspace>
```

### 2.3 Zone B: Command Bar Component
**File:** `components/layout/ZoneB_CommandBar.jsx`

**Tasks:**
- [ ] Create horizontal control strip
- [ ] Add custom instruction text input
- [ ] Add macro buttons row
- [ ] Add execute button
- [ ] Add processing indicator (spinner/progress)

**Macro Buttons:**
- "Add Clinical History"
- "Proofread"
- "Check Completeness"
- "Summarize Priors"

### 2.4 Zone C: Reference Tray Component
**File:** `components/layout/ZoneC_ReferenceTray.jsx`

**Tasks:**
- [ ] Create collapsible drawer component
- [ ] Implement tab navigation (4 tabs)
- [ ] Add collapse/expand animation
- [ ] Store collapse state in localStorage

**Tabs:**
1. Prior Imaging
2. EHR Data
3. Guidelines
4. Style Settings

---

## Phase 3: CT Viewer Implementation

### 3.1 Basic CT Viewer Setup
**File:** `components/viewer/CTViewer.jsx`

**Tasks:**
- [ ] Initialize Cornerstone.js
- [ ] Load NIfTI volume from `/demo-data/medical_imaging/`
- [ ] Implement scroll-through-slices functionality
- [ ] Add slice number indicator

### 3.2 Viewer Controls
**File:** `components/viewer/ViewerControls.jsx`

**Tasks:**
- [ ] Window/Level presets dropdown (Brain, Soft Tissue, Bone, Lung)
- [ ] Slice navigation controls (Previous/Next)
- [ ] Zoom controls
- [ ] Pan/Reset tools
- [ ] "Maximize" button → Opens FullScreenViewer modal

### 3.3 Full Screen Viewer Modal
**File:** `components/modals/FullScreenViewer.jsx`

**Tasks:**
- [ ] Create full-screen overlay modal
- [ ] Display CT viewer in full-screen mode
- [ ] Add ESC key handler to close
- [ ] Add close button (X)

---

## Phase 4: Report Editor

### 4.1 Report Editor Component
**File:** `components/report/ReportEditor.jsx`

**Tasks:**
- [ ] Create structured form with 4 fields:
  - Indication (textarea)
  - Technique (textarea)
  - Findings (large textarea)
  - Impression (textarea)
- [ ] Implement live text editing
- [ ] Track cursor position for text insertion
- [ ] Add character/word count per field
- [ ] Auto-save to localStorage every 5 seconds

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

### 5.2 Macro Buttons Component
**File:** `components/command/MacroButtons.jsx`

**Tasks:**
- [ ] Create button group with 4 macros
- [ ] Style as prominent action buttons
- [ ] Add hover states and tooltips
- [ ] Disable buttons during processing

**Button Actions:**
- Each button sets a specific `mode_button` value
- Triggers the same execute flow with different parameters

### 5.3 Processing Indicator
**File:** `components/command/ProcessingIndicator.jsx`

**Tasks:**
- [ ] Create animated loading spinner
- [ ] Display agent status messages:
  - "Agent 1: Understanding request..."
  - "Agent 2: Gathering data..."
  - "Agent 3: Drafting content..."
  - "Agent 4: Formatting response..."
- [ ] Add progress bar (optional)
- [ ] Show estimated time remaining

---

## Phase 6: Reference Tray Tabs

### 6.1 Prior Imaging Tab
**File:** `components/tray/PriorImagingTab.jsx`

**Tasks:**
- [ ] Display list of prior reports from `/demo-data/prior_reports/`
- [ ] Show report date, modality, brief summary
- [ ] Implement click → Opens FocusModal with full report
- [ ] Support both PDF and Markdown formats

### 6.2 EHR Data Tab
**File:** `components/tray/EHRTab.jsx`

**Tasks:**
- [ ] Load `patient_context.json`
- [ ] Display in tabular/structured format:
  - Patient Demographics
  - Lab Results (table)
  - Medications (list)
  - Clinical Notes (expandable sections)
- [ ] Add search/filter functionality

### 6.3 Guidelines Tab
**File:** `components/tray/GuidelinesTab.jsx`

**Tasks:**
- [ ] List available guidelines from `/demo-data/guidelines/`
- [ ] Display guideline titles and descriptions
- [ ] Click → Opens FocusModal with PDF viewer
- [ ] Add search functionality

### 6.4 Style Settings Tab
**File:** `components/tray/StyleSettingsTab.jsx`

**Tasks:**
- [ ] File upload area for user's prior reports
- [ ] Display uploaded files as examples
- [ ] Show preview of writing style analysis (future feature)
- [ ] Add delete uploaded file functionality

---

## Phase 7: Modals

### 7.1 Focus Modal
**File:** `components/modals/FocusModal.jsx`

**Tasks:**
- [ ] Create centered overlay modal (large)
- [ ] Support displaying:
  - Markdown files (using react-markdown)
  - PDF files (using react-pdf)
- [ ] Add close button (X) and ESC key handler
- [ ] Add zoom controls for PDFs
- [ ] Add scroll functionality

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: function,
  content: object,
  contentType: "markdown" | "pdf"
}
```

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

### 9.2 File Loading Utilities
**File:** `utils/loaders.js`

**Tasks:**
- [ ] Create function to load patient context JSON
- [ ] Create function to list files in a directory
- [ ] Create function to load markdown content
- [ ] Create function to handle PDF loading
- [ ] Implement error handling for missing files

---

## Phase 10: Polish & UX Enhancements

### 10.1 Keyboard Shortcuts
**Tasks:**
- [ ] ESC: Close any open modal
- [ ] Ctrl/Cmd + S: Save report (localStorage)
- [ ] Ctrl/Cmd + Enter: Execute current instruction
- [ ] Ctrl/Cmd + K: Focus on instruction input

### 10.2 Responsive Design
**Tasks:**
- [ ] Ensure layout works on various desktop screen sizes (1920x1080, 2560x1440)
- [ ] Add min-width constraint (desktop only, no mobile)
- [ ] Test on different browsers (Chrome, Firefox, Safari, Edge)

### 10.3 Loading States & Animations
**Tasks:**
- [ ] Skeleton loaders for CT viewer initialization
- [ ] Smooth collapse/expand animations for Zone C
- [ ] Fade transitions for modals
- [ ] Button hover/active states

### 10.4 Error Handling
**Tasks:**
- [ ] Display user-friendly error messages
- [ ] Add retry functionality for failed API calls
- [ ] Handle missing demo data gracefully
- [ ] Show fallback UI when CT viewer fails to load

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


