# RSNA 2025 DLL - An Introduction to Agentic AI in Radiology

A multi-agent AI system for radiology reporting, featuring an integrated CT scan viewer, voice transcription, and AI-powered report generation workflow.

## Project Overview

This project demonstrates the application of agentic AI in radiology through a complete workflow system that combines medical imaging visualization with intelligent report generation. The frontend provides a fully functional radiology workstation interface with CT scan viewing, structured report editing, voice input capabilities, and reference data access. The backend (planned) will use a multi-agent architecture powered by Google's Agentic ADK to assist radiologists in creating structured radiology reports.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Zone A: CT Viewer (50%) | Report Editor (50%)       │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Zone B: Command Bar + Macro Checkboxes              │   │
│  ├──────────────────────────────────────────────────────┤   │
│  │  Zone C: Reference Tray (Collapsible)                │   │
│  │    - Prior Imaging | EHR | Guidelines | Style        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP POST
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI + Google ADK)           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Agent 1: Orchestrator (Route & Clarify)             │   │
│  │         ↓                                            │   │
│  │  Agent 2: Researcher (Call Sub-Agents as Tools)      │   │
│  │         ↓                                            │   │
│  │  Agent 3: Synthesizer (Draft/Modify Report)          │   │
│  │         ↓                                            │   │
│  │  Agent 4: Formatter (Validate & Structure)           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Frontend ✅ COMPLETED

The frontend is a fully functional Next.js application providing:

### Key Features

- **CT Scan Viewer**:

  - NIfTI file loading and visualization with multi-view support (Axial, Sagittal, Coronal)
  - Zoom and pan controls (Ctrl/Cmd + scroll to zoom, right-click drag to pan)
  - Window/Level presets (Soft Tissue, Bone, Lung)
  - Slice navigation with mouse wheel and drag controls
  - Fullscreen viewing mode
  - View selector with thumbnail previews
  - IndexedDB caching for faster subsequent loads
  - Support for cloud storage (Cloudflare R2) configuration
  - Help dialog with navigation instructions
  - Slice position preservation per view orientation

- **Report Editor**:

  - Structured report editing with four fields (Indication, Technique, Findings, Impression)
  - Auto-save to localStorage every 5 seconds
  - Character and word count per field
  - Voice input via microphone button (speech-to-text using Gemini API)
  - Patient information display (name, study date, radiologist name)
  - Cursor position tracking for text insertion

- **AI Command Interface**:

  - Five macro checkboxes allowing multiple selection:
    - Add Further Clinical Background
    - Proofread
    - Make Impressions
    - Compare to Priors
    - Check References
  - Custom instruction text input with voice input support
  - Execute button with processing state indicator
  - Keyboard shortcut: Ctrl/Cmd + Enter to execute

- **Reference Tray**:

  - Collapsible panel with resizable height (15%-60% range)
  - Four tabs:
    - **Prior Reports**: Historical imaging reports with date sorting
    - **EHR Data**: Patient demographics, lab results with trends table, medications, clinical notes
    - **Guidelines**: Medical guidelines and protocols (ACR Guidelines, Institutional Protocols)
    - **Style Settings**: Custom style instructions with voice input, prior radiologist reports, file upload area
  - Focus modal for viewing full documents with markdown rendering
  - Persistent collapse state and height preferences in localStorage

- **Voice Transcription**:

  - Real-time audio recording (up to 30 seconds)
  - Speech-to-text using Google Gemini API
  - Available in report fields and custom instruction input
  - Rate limiting (10 req/min normal, 60 req/min workshop mode)
  - Audio format conversion (WebM to WAV) for API compatibility

- **Dark Theme**: Optimized for radiology viewing environments with professional color palette

### Technology Stack

- Next.js 16 (App Router)
- React 19
- nifti-reader-js for medical imaging
- Zustand for state management
- Axios for API communication
- react-markdown for document rendering
- IndexedDB for NIfTI data caching
- Web Audio API for voice recording

**For detailed frontend documentation, see [frontend/README.md](./frontend/README.md)**

## Backend

The backend is designed as a multi-agent system using Google's Agentic ADK:

### Architecture Overview

**Agent 1: Orchestrator**

- Analyzes user instructions and active mode
- Determines which sub-agents need to be called
- Routes requests to appropriate data sources

**Agent 2: Researcher**

- Calls sub-agents as tools to gather information:
  - EHR Sub-Agent: Queries patient context, lab results, medications
  - Prior Report Sub-Agent: Retrieves and summarizes historical imaging reports
  - Guideline Sub-Agent: Searches medical guidelines and protocols
- Aggregates gathered data for report generation

**Agent 3: Synthesizer**

- Integrates gathered data with current report
- Applies medical reasoning
- Generates/modifies report content based on mode:
  - Add clinical history
  - Proofread and correct
  - Complete impressions section
  - Compare to prior studies
  - Check references

**Agent 4: Formatter**

- Validates report structure
- Ensures proper field formatting
- Returns structured response matching API schema

### Technology Stack

- FastAPI (Python web framework)
- Google Agentic ADK (Latest version, Gemini models)
- Pydantic for data validation
- File-based data storage (JSON, Markdown, PDF)

### Status

**⚠️ Backend is currently under development and not yet implemented.**

The backend currently contains only a placeholder `main.py` file. The backend architecture is fully documented in `/docs/backend-implementation-plan.md` with detailed specifications for:

- API endpoints and request/response models
- Agent pipeline implementation
- Sub-agent tool definitions
- Data loading utilities
- Model configuration

**Note**: The frontend includes a voice transcription API route (`/api/transcribe-audio`) that uses Google Gemini API directly. This is a frontend-only feature that works independently of the backend agent pipeline.

## Project Structure

```
RSNA2025_DLL_AgenticAI/
├── frontend/              # Next.js frontend application ✅ COMPLETED
│   ├── src/              # Source code
│   ├── public/           # Static assets and demo data
│   └── README.md         # Frontend documentation
├── backend/              # FastAPI backend application ⚠️ IN DEVELOPMENT
│   ├── app/              # Application code
│   └── requirements.txt # Python dependencies
├── docs/                 # Project documentation
│   ├── prd.md                           # Product requirements
│   ├── frontend-implementation-plan.md  # Frontend specs
│   ├── backend-implementation-plan.md    # Backend specs
│   ├── implementation-summary.md        # Quick start guide
│   ├── project-structure.md             # Directory structure
│   └── data-structure-plan.md           # Data file formats
└── README.md             # This file
```

## Getting Started

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

See [frontend/README.md](./frontend/README.md) for detailed frontend documentation.

### Backend Setup

**Note**: Backend is not yet implemented. When ready:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Demo Data

Demo data is located in `frontend/public/demo-data/`:

- **CT Scans**: NIfTI format files
- **EHR Data**: Patient context JSON
- **Prior Reports**: Markdown files
- **Guidelines**: Markdown files

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[PRD](./docs/prd.md)**: Product requirements document
- **[Frontend Implementation Plan](./docs/frontend-implementation-plan.md)**: Detailed frontend specifications
- **[Backend Implementation Plan](./docs/backend-implementation-plan.md)**: Backend architecture and implementation guide
- **[Implementation Summary](./docs/implementation-summary.md)**: Quick start and overview
- **[Project Structure](./docs/project-structure.md)**: Directory organization
- **[Data Structure Plan](./docs/data-structure-plan.md)**: Data file formats and examples

## Key Features

### Frontend ✅ COMPLETED

- ✅ Three-zone layout (CT Viewer, Report Editor, Reference Tray)
- ✅ NIfTI file loading and visualization with IndexedDB caching
- ✅ Multi-view CT scan viewing (Axial, Sagittal, Coronal) with thumbnail previews
- ✅ Zoom and pan controls (Ctrl/Cmd + scroll, right-click drag)
- ✅ Window/Level presets (Soft Tissue, Bone, Lung)
- ✅ Fullscreen viewer modal
- ✅ Structured report editor with auto-save (localStorage)
- ✅ Voice input via microphone button (speech-to-text)
- ✅ Macro checkboxes for AI operations (multiple selection supported)
- ✅ Custom instruction input with voice support
- ✅ Reference tray with four tabs (Prior Reports, EHR Data, Guidelines, Style Settings)
- ✅ Resizable and collapsible reference tray
- ✅ Focus modal for document viewing
- ✅ Patient information display in report editor
- ✅ Dark theme optimized for radiology
- ✅ Responsive design with resizable panels
- ✅ Help dialog in CT viewer
- ✅ Cloud storage support (Cloudflare R2) configuration
- ✅ Rate limiting for audio transcription API
- ✅ View selector with live thumbnail previews

### Backend ⚠️ (Planned)

- ⚠️ Multi-agent pipeline using Google Agentic ADK
- ⚠️ Four main agents (Orchestrator, Researcher, Synthesizer, Formatter)
- ⚠️ Three sub-agents as tools (EHR, Prior Reports, Guidelines)
- ⚠️ REST API endpoints for report processing (`/agent/process`)
- ⚠️ Model configuration via JSON file
- ⚠️ File-based data access

**Note**: Voice transcription is currently implemented as a frontend API route using Gemini API directly, independent of the backend agent pipeline.

## API Specification

### POST /agent/process

Process a radiology report with AI agents.

**Request:**

```json
{
  "current_report": {
    "indication": "...",
    "technique": "...",
    "findings": "...",
    "impression": "..."
  },
  "instruction": "Add clinical history",
  "mode_button": "add_history"
}
```

**Response:**

```json
{
  "status": "success",
  "diff": {
    "indication": "Updated indication...",
    "findings": "Updated findings..."
  },
  "agent_thoughts": [
    "Agent 1: Routing to EHR sub-agent...",
    "Agent 2: Found 3 lab results...",
    "Agent 3: Integrating clinical history..."
  ]
}
```

**Mode Values:**

- `add_history`: Add further clinical background
- `proofread`: Proofread and correct the report
- `check_completeness`: Make impressions section complete
- `summarize_priors`: Compare to prior imaging studies
- `check_references`: Check references and guidelines
- `custom`: Custom user instruction

## Development Roadmap

### Phase 1: Frontend ✅ COMPLETED

- ✅ Project setup and foundation
- ✅ CT viewer implementation with NIfTI support
- ✅ Multi-view support (Axial, Sagittal, Coronal)
- ✅ Zoom, pan, and window/level controls
- ✅ Fullscreen viewer modal
- ✅ Report editor with auto-save
- ✅ Voice input integration (microphone button)
- ✅ Command bar with macro checkboxes
- ✅ Reference tray with four tabs
- ✅ Modal components (FocusModal, FullScreenViewer)
- ✅ Data loading utilities
- ✅ IndexedDB caching for NIfTI files
- ✅ Cloud storage configuration support
- ✅ Audio transcription API route
- ✅ Rate limiting implementation
- ✅ View selector with thumbnails
- ✅ Help dialog and user guidance

### Phase 2: Backend ⚠️ IN DEVELOPMENT

- ⚠️ FastAPI setup and configuration
- ⚠️ Pydantic models for requests/responses
- ⚠️ Sub-agent implementation (EHR, Prior Reports, Guidelines)
- ⚠️ Main agent pipeline (Orchestrator, Researcher, Synthesizer, Formatter)
- ⚠️ API endpoints (`/agent/process`)
- ⚠️ Model configuration system

### Phase 3: Integration (Planned)

- Integration testing between frontend and backend
- End-to-end workflow testing
- Performance optimization
- Deployment preparation

## Technology Choices

### Frontend

- **Next.js**: React framework with App Router for modern development
- **nifti-reader-js**: Lightweight NIfTI file parser (no heavy dependencies)
- **Zustand**: Lightweight state management
- **CSS Variables**: Flexible theming system
- **IndexedDB**: Browser-based caching for large NIfTI files
- **Web Audio API**: Voice recording and audio processing
- **react-markdown**: Markdown rendering for documents
- **Google Gemini API**: Speech-to-text transcription (via frontend API route)

### Backend (Planned)

- **FastAPI**: Modern Python web framework with automatic API documentation
- **Google Agentic ADK**: Latest agent framework for multi-agent systems
- **Pydantic**: Data validation and serialization
- **File-based Storage**: Simple, portable data access

## Contributing

This project is part of the RSNA 2025 workshop materials. For questions or contributions, please refer to the documentation in `/docs`.

## License

This project is part of the RSNA 2025 workshop: "An Introduction to Agentic AI in Radiology".

## Contact

For questions about the project, please refer to the documentation in the `/docs` directory.
