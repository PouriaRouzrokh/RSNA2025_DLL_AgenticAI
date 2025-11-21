# RSNA 2025 DLL - Frontend Application

A Next.js-based radiology AI workflow application for the RSNA 2025 workshop: "An Introduction to Agentic AI in Radiology".

## Overview

This frontend application provides a comprehensive radiology reporting interface with integrated CT scan viewing, structured report editing, and AI-powered assistance. The application features a three-zone layout optimized for radiology workflows.

## Features

### 🏥 CT Viewer

- **NIfTI File Support**: Load and display CT scans in NIfTI format using `nifti-reader-js`
- **Multi-View Support**: Axial, Sagittal, and Coronal views with thumbnail previews
- **Window/Level Presets**: Brain, Soft Tissue, Bone, and Lung presets
- **Slice Navigation**: Mouse wheel scrolling through slices
- **Slice Preservation**: Remembers last-viewed slice for each view orientation
- **Fullscreen Mode**: Maximize viewer with responsive canvas sizing
- **Preprocessed Files**: Support for faster loading via preprocessed JSON files
- **Configuration**: JSON-based rescale intercept/slope configuration per CT scan

### 📝 Report Editor

- **Structured Fields**: Indication, Technique, Findings, and Impression sections
- **Auto-save**: Automatic saving to localStorage every 5 seconds
- **Character/Word Count**: Real-time counts for each field
- **Cursor Tracking**: Tracks cursor position for text insertion

### 🤖 Command Bar

- **Macro Checkboxes**: Five predefined operations:
  - Add Further Clinical Background
  - Proofread
  - Make Impressions
  - Compare to Priors
  - Check References
- **Custom Instructions**: Free-form text input for custom AI requests
- **Multiple Selection**: Select multiple macros simultaneously
- **Processing Indicator**: Visual feedback during AI processing

### 📚 Reference Tray

- **Collapsible Design**: Resizable panel (15%-60% height range)
- **Four Tabs**:
  - **Prior Reports**: View historical imaging reports
  - **EHR Data**: Patient demographics, lab results, medications, clinical notes
  - **Guidelines**: Medical guidelines and protocols
  - **Style Settings**: User-uploaded report examples (future)
- **Focus Modal**: Full-screen document viewing with markdown rendering

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: JavaScript (no TypeScript)
- **Styling**: CSS with dark theme variables
- **State Management**: Zustand
- **Medical Imaging**: nifti-reader-js
- **HTTP Client**: Axios
- **Markdown**: react-markdown
- **PDF**: react-pdf

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.js          # Root layout
│   │   ├── page.js            # Main page
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   ├── layout/            # Zone components
│   │   ├── viewer/            # CT viewer components
│   │   ├── report/            # Report editor
│   │   ├── tray/              # Reference tray tabs
│   │   └── modals/            # Modal components
│   ├── hooks/                 # Custom React hooks
│   ├── utils/                 # Utility functions
│   │   ├── niftiLoader.js    # NIfTI file loading
│   │   ├── ctScanConfig.js   # CT scan configuration
│   │   └── api.js            # API client
│   └── styles/                # Theme and zone styles
├── public/
│   └── demo-data/            # Demo data files
│       ├── medical_imaging/  # CT scans and config
│       ├── ehr_data/         # Patient context
│       ├── prior_reports/    # Historical reports
│       └── guidelines/       # Medical guidelines
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## Configuration

### CT Scan Configuration

CT scan rescale values are configured in `/public/demo-data/medical_imaging/ct_scan_config.json`:

```json
[
  {
    "file_path": "/demo-data/medical_imaging/ct_scan.nii.gz",
    "rescale_intercept": -8192,
    "rescale_slope": 1
  }
]
```

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Key Components

### ZoneA_Workspace

Main workspace containing CT viewer and report editor side-by-side. Manages NIfTI data loading and slice state.

### CTViewer

Canvas-based CT scan viewer with:

- Responsive sizing via ResizeObserver
- Window/level presets
- Slice navigation
- View selector with thumbnails

### ReportEditor

Structured report editor with four fields, auto-save, and character counting.

### ZoneB_CommandBar

Command interface with macro checkboxes and custom instruction input.

### ZoneC_ReferenceTray

Collapsible reference tray with four tabs for accessing prior reports, EHR data, guidelines, and style settings.

## Data Files

Demo data is located in `/public/demo-data/`:

- **CT Scans**: NIfTI format (`.nii.gz`) with optional preprocessed JSON
- **EHR Data**: JSON format (`patient_context.json`)
- **Prior Reports**: Markdown files
- **Guidelines**: Markdown files

## Features in Detail

### NIfTI Loading

- Supports standard NIfTI files (`.nii.gz`)
- Optional preprocessed JSON files for faster loading (`_preprocessed.json`)
- Automatic rescale value loading from configuration
- Proper handling of sagittal/coronal view orientation

### Slice Management

- Preserves slice position per view (axial, sagittal, coronal)
- Starts at mid-slice for each view on initial load
- Smooth scrolling with mouse wheel

### Window/Level Presets

- Brain: Window 80, Level 40
- Soft Tissue: Window 400, Level 50
- Bone: Window 2000, Level 400
- Lung: Window 1500, Level -600

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

**Note**: Desktop only - mobile support is not implemented.

## Development Notes

- Uses Next.js App Router (not Pages Router)
- Dark theme is mandatory for radiology environment
- All components use CSS variables for theming
- State management is handled at component level (Zustand available but not extensively used)

## API Integration

The frontend communicates with the backend via REST API:

- **POST /agent/process**: Process report with AI agents
  - Request: `{ current_report, instruction, mode_button }`
  - Response: `{ status, diff, agent_thoughts }`

See `src/utils/api.js` for API client implementation.

## Future Enhancements

- Speech-to-text integration
- Real-time collaboration
- Advanced CT viewing (MPR, 3D rendering)
- Report templates library
- Export report to PDF
- Integration with PACS systems

## Documentation

For detailed implementation plans and architecture, see:

- `/docs/frontend-implementation-plan.md`
- `/docs/implementation-summary.md`
- `/docs/project-structure.md`

## License

This project is part of the RSNA 2025 workshop materials.
