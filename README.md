# RSNA 2025 DLL - An Introduction to Agentic AI in Radiology

A multi-agent AI system for radiology reporting, featuring an integrated CT scan viewer and AI-powered report generation workflow.

## Project Overview

This project demonstrates the application of agentic AI in radiology through a complete workflow system that combines medical imaging visualization with intelligent report generation. The system uses a multi-agent architecture powered by Google's Agentic ADK to assist radiologists in creating structured radiology reports.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Zone A: CT Viewer (50%) | Report Editor (50%)      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Zone B: Command Bar + Macro Checkboxes              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  Zone C: Reference Tray (Collapsible)                │  │
│  │    - Prior Imaging | EHR | Guidelines | Style        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTP POST
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI + Google ADK)            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Agent 1: Orchestrator (Route & Clarify)             │  │
│  │         ↓                                             │  │
│  │  Agent 2: Researcher (Call Sub-Agents as Tools)      │  │
│  │         ↓                                             │  │
│  │  Agent 3: Synthesizer (Draft/Modify Report)          │  │
│  │         ↓                                             │  │
│  │  Agent 4: Formatter (Validate & Structure)           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Frontend

The frontend is a fully functional Next.js application providing:

### Key Features
- **CT Scan Viewer**: NIfTI file loading and visualization with multi-view support (Axial, Sagittal, Coronal)
- **Report Editor**: Structured report editing with auto-save functionality
- **AI Command Interface**: Macro checkboxes and custom instruction input for AI-powered assistance
- **Reference Tray**: Access to prior reports, EHR data, guidelines, and style settings
- **Dark Theme**: Optimized for radiology viewing environments

### Technology Stack
- Next.js 16 (App Router)
- React 19
- nifti-reader-js for medical imaging
- Zustand for state management
- Axios for API communication

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

The backend architecture is fully documented in `/docs/backend-implementation-plan.md` with detailed specifications for:
- API endpoints and request/response models
- Agent pipeline implementation
- Sub-agent tool definitions
- Data loading utilities
- Model configuration

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

### Frontend ✅
- ✅ Three-zone layout (CT Viewer, Report Editor, Reference Tray)
- ✅ NIfTI file loading and visualization
- ✅ Multi-view CT scan viewing (Axial, Sagittal, Coronal)
- ✅ Structured report editor with auto-save
- ✅ Macro checkboxes for AI operations
- ✅ Custom instruction input
- ✅ Reference tray with prior reports, EHR data, and guidelines
- ✅ Dark theme optimized for radiology
- ✅ Responsive design with resizable panels

### Backend ⚠️ (Planned)
- ⚠️ Multi-agent pipeline using Google Agentic ADK
- ⚠️ Four main agents (Orchestrator, Researcher, Synthesizer, Formatter)
- ⚠️ Three sub-agents as tools (EHR, Prior Reports, Guidelines)
- ⚠️ REST API endpoints for report processing
- ⚠️ Model configuration via JSON file
- ⚠️ File-based data access

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
- ✅ CT viewer implementation
- ✅ Report editor
- ✅ Command bar with macro checkboxes
- ✅ Reference tray with tabs
- ✅ Modal components
- ✅ Data loading utilities

### Phase 2: Backend ⚠️ IN DEVELOPMENT
- ⚠️ FastAPI setup and configuration
- ⚠️ Pydantic models for requests/responses
- ⚠️ Sub-agent implementation (EHR, Prior Reports, Guidelines)
- ⚠️ Main agent pipeline (Orchestrator, Researcher, Synthesizer, Formatter)
- ⚠️ API endpoints
- ⚠️ Model configuration system

### Phase 3: Integration (Planned)
- Integration testing
- End-to-end workflow testing
- Performance optimization
- Deployment preparation

## Technology Choices

### Frontend
- **Next.js**: React framework with App Router for modern development
- **nifti-reader-js**: Lightweight NIfTI file parser (no heavy dependencies)
- **Zustand**: Lightweight state management
- **CSS Variables**: Flexible theming system

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

