# Project Structure Plan

## Root Directory Structure

```
RSNA2025_DLL_AgenticAI/
├── frontend/                          # Next.js Application
│   ├── public/
│   │   ├── demo-data/                # Static demo data accessible by frontend
│   │   │   ├── patient_context.json
│   │   │   ├── prior_reports/        # Previous imaging reports (MD/PDF)
│   │   │   ├── ehr_data/             # Electronic Health Records
│   │   │   ├── guidelines/           # Medical guidelines (PDFs)
│   │   │   └── style_guide/          # User uploaded report examples
│   │   └── assets/                   # Static images, icons
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── ZoneA_Workspace.jsx
│   │   │   │   ├── ZoneB_CommandBar.jsx
│   │   │   │   └── ZoneC_ReferenceTray.jsx
│   │   │   ├── viewer/
│   │   │   │   ├── CTViewer.jsx
│   │   │   │   ├── ViewerControls.jsx
│   │   │   │   └── ViewSelector.jsx
│   │   │   ├── report/
│   │   │   │   └── ReportEditor.jsx
│   │   │   ├── command/
│   │   │   │   └── (Macro functionality integrated into ZoneB_CommandBar.jsx)
│   │   │   ├── tray/
│   │   │   │   ├── PriorImagingTab.jsx
│   │   │   │   ├── EHRTab.jsx
│   │   │   │   ├── GuidelinesTab.jsx
│   │   │   │   └── StyleSettingsTab.jsx
│   │   │   └── modals/
│   │   │       ├── FocusModal.jsx
│   │   │       └── FullScreenViewer.jsx
│   │   ├── app/
│   │   │   ├── layout.js           # Root layout
│   │   │   ├── page.js             # Main page (App Router)
│   │   │   └── globals.css         # Global styles
│   │   ├── styles/
│   │   │   ├── zones.css
│   │   │   └── dark-theme.css
│   │   ├── hooks/
│   │   │   ├── useReportState.js
│   │   │   └── useAgentAPI.js
│   │   └── utils/
│   │       ├── api.js               # Backend API calls
│   │       ├── niftiLoader.js      # NIfTI file loading and processing
│   │       └── ctScanConfig.js     # CT scan rescale configuration loader
│   ├── package.json
│   └── next.config.js
│
├── backend/                           # FastAPI Application
│   ├── app/
│   │   ├── main.py                   # FastAPI entry point
│   │   ├── routers/
│   │   │   ├── agent.py             # /agent/process endpoint
│   │   │   └── stt.py               # /stt/dictate endpoint
│   │   ├── agents/
│   │   │   ├── orchestrator.py      # Agent 1: Router
│   │   │   ├── researcher.py        # Agent 2: Tool User
│   │   │   ├── synthesizer.py       # Agent 3: Writer
│   │   │   └── formatter.py         # Agent 4: Quality Assurance
│   │   ├── sub_agents/
│   │   │   ├── ehr_agent.py
│   │   │   ├── prior_report_agent.py
│   │   │   └── guideline_agent.py
│   │   ├── models/
│   │   │   ├── job_state.py         # JobState Pydantic model
│   │   │   ├── request_models.py    # API request schemas
│   │   │   └── response_models.py   # API response schemas
│   │   ├── config/
│   │   │   └── agent_config.json    # Model configuration file
│   │   ├── pipeline/
│   │   │   ├── pipeline.py         # Google ADK Pipeline
│   │   │   └── executor.py          # Pipeline executor
│   │   └── utils/
│   │       ├── file_readers.py      # PDF/MD parsers
│   │       └── validators.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── public/
│   │   └── demo-data/                # **DEMO DATA (Frontend Accessible)**
│   │       ├── ehr_data/
│   │       │   └── patient_context.json
│   │       ├── medical_imaging/
│   │       │   ├── ct_scan.nii.gz
│   │       │   ├── ct_scan_config.json
│   │       │   └── ct_scan_preprocessed.json (optional)
│   │       ├── prior_reports/        # Prior imaging reports
│   │       │   ├── report_2023_11_10.md
│   │       │   ├── report_2024_01_15.md
│   │       │   └── report_2024_06_20.md
│   │       ├── guidelines/           # Medical guidelines
│   │       │   ├── acr_guidelines.md
│   │       │   └── institutional_protocols.md
│   │       └── style_guide/          # User uploaded examples
│
├── docs/                             # Documentation
│   ├── prd.md
│   ├── project-structure.md
│   ├── frontend-implementation-plan.md
│   ├── backend-implementation-plan.md
│   ├── data-structure-plan.md
│   └── deployment-guide.md
│
└── README.md

```

## Key Design Decisions

### 1. **Data Directory Strategy**
- **`/data/`** (Root): Used for BOTH dummy data (during development) AND final production-ready files
  - Initially: Contains SHORT dummy data for UI testing
  - Later: You will replace dummy files with your real data
  - CT scan in NIfTI format
  - Clinical data as markdown files
  - Prior imaging reports
  - Guidelines

### 2. **Frontend Architecture**
- Single Page Application (SPA) using Next.js with JavaScript (no TypeScript)
- Component-based architecture organized by zones
- Dark theme mandatory for radiology environment
- No mobile support (desktop only)

### 3. **Backend Architecture**
- FastAPI for REST API
- Google Agentic ADK (latest version) for multi-agent pipeline
- Sequential pipeline pattern with shared JobState
- Agents as Tools pattern for sub-agents
- Model configuration via JSON file (agent_config.json)

### 4. **Data Flow**
```
Frontend → POST /agent/process → Agent 1 → Agent 2 → Agent 3 → Agent 4 → Response → Frontend
```

### 5. **Deployment Strategy**
- Frontend: Vercel
- Backend: Vultr Server (or local development for workshop sharing)

## File Access Patterns

### During Development (Phase 1-2):
- Both frontend and backend read from: `/data/` (root directory)
- Dummy data files will be created in `/data/` during implementation
- Frontend may access via API or direct file serving

### In Production (Phase 3):
- Same `/data/` directory, but you replace dummy files with real ones
- No code changes needed - just swap the files

## Environment Configuration

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_DEMO_MODE=true
```

### Backend (.env)
```
GOOGLE_API_KEY=your_key_here
DATA_DIR=../data
CORS_ORIGINS=http://localhost:3000
API_PORT=8000
```


