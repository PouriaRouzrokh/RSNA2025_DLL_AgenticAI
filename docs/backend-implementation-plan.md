# Backend Implementation Plan
## Phase 1: Project Setup & Foundation (Priority: SECOND - After Frontend)

### 1.1 Initialize FastAPI Project
**Tasks:**
- [ ] Create `backend/` directory structure as per project-structure.md
- [ ] Set up Python virtual environment
- [ ] Create `requirements.txt` with all dependencies (no version pinning)
- [ ] Initialize FastAPI application in `app/main.py`
- [ ] Configure CORS for frontend communication

**Requirements.txt:**
```txt
# Core Framework
fastapi
uvicorn[standard]
pydantic

# Google Agentic ADK (Latest Version)
google-generativeai

# File Processing
pypdf2
pdfplumber
python-multipart

# Data Processing
python-dotenv
pandas

# Additional
aiofiles
```

### 1.2 Environment Configuration
**File:** `.env`

**Tasks:**
- [ ] Create `.env.example` template
- [ ] Set up Google API credentials
- [ ] Configure data directory paths
- [ ] Set CORS origins

**Environment Variables:**
```
# Google AI Configuration
GOOGLE_API_KEY=your_key_here

# Data Configuration
DATA_DIR=./data
DEMO_MODE=true

# API Configuration
CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
API_PORT=8000

# Logging
LOG_LEVEL=INFO
```

**Note:** Model configuration (which specific Gemini models to use) will be handled via the `agent_config.json` file, not environment variables.

### 1.3 Model Configuration File
**File:** `app/config/agent_config.json`

**Tasks:**
- [ ] Create configuration file for agent model selection
- [ ] Allow users to configure which Gemini models each agent uses
- [ ] Support different models for different agents
- [ ] Include temperature and other model parameters

**Configuration Structure:**
```json
{
  "orchestrator": {
    "model": "gemini-pro",
    "temperature": 0.3
  },
  "researcher": {
    "model": "gemini-pro",
    "temperature": 0.1
  },
  "synthesizer": {
    "model": "gemini-pro",
    "temperature": 0.4
  },
  "formatter": {
    "model": "gemini-pro",
    "temperature": 0.0
  },
  "sub_agents": {
    "ehr_agent": {
      "model": "gemini-pro",
      "temperature": 0.2
    },
    "prior_report_agent": {
      "model": "gemini-pro",
      "temperature": 0.2
    },
    "guideline_agent": {
      "model": "gemini-pro",
      "temperature": 0.1
    }
  }
}
```

**Implementation Notes:**
- This file should be easily editable by users
- Default to latest stable Gemini models
- Support model switching without code changes
- Load configuration at application startup

---

## Phase 2: Data Models (Pydantic Schemas)

### 2.1 Job State Model
**File:** `app/models/job_state.py`

**Tasks:**
- [ ] Create `JobState` Pydantic model
- [ ] Define all fields with proper types and validation
- [ ] Add methods for state manipulation

**JobState Structure:**
- `report_content: Dict[str, str]` - Current report sections (indication, technique, findings, impression)
- `user_instruction: str` - Custom instruction from user
- `active_mode: str` - Mode: 'add_history', 'proofread', 'check_completeness', 'custom'
- `gathered_data: Dict[str, any]` - Context collected by Researcher agent
- `logs: List[str]` - Trace of agent thoughts for debugging
- `cursor_position: Optional[Dict[str, any]]` - Cursor position for text insertion

**Methods:**
- `add_log(agent_name: str, message: str)` - Add log entry to state

### 2.2 Request Models
**File:** `app/models/request_models.py`

**Tasks:**
- [ ] Create request models for all endpoints
- [ ] Add validation rules

**ProcessReportRequest:**
- `current_report: Dict[str, str]` - Current report content with fields: indication, technique, findings, impression
- `instruction: str` - Custom instruction from user
- `mode_button: str` - Macro button pressed: add_history, proofread, check_completeness, custom
- `cursor_position: Optional[Dict[str, any]]` - Current cursor position in report

**DictateRequest:**
- `audio_data: str` - Base64 encoded audio data
- `audio_format: str` - Audio format: wav, mp3, ogg

### 2.3 Response Models
**File:** `app/models/response_models.py`

**Tasks:**
- [ ] Create response models for all endpoints
- [ ] Ensure strict schema adherence

**ProcessReportResponse:**
- `status: str` - "success" or "error"
- `diff: Dict[str, str]` - Modified report sections
- `agent_thoughts: List[str]` - Step-by-step agent reasoning for demo purposes
- `error_message: Optional[str]` - Error message if status is error

**DictateResponse:**
- `status: str`
- `text: str`
- `confidence: Optional[float]`

---

## Phase 3: File System Utilities

### 3.1 File Readers
**File:** `app/utils/file_readers.py`

**Tasks:**
- [ ] Create functions to read JSON files
- [ ] Create functions to read and parse PDF files
- [ ] Create functions to read Markdown files
- [ ] Implement error handling for missing files

**Functions to Implement:**
- `load_patient_context(data_dir: str) -> Dict` - Load patient_context.json
- `list_prior_reports(data_dir: str) -> List[Dict]` - List all prior reports with metadata
- `read_pdf_content(file_path: str) -> str` - Extract text from PDF
- `read_markdown_file(file_path: str) -> str` - Read markdown file content
- `search_guidelines(data_dir: str, query: str) -> List[str]` - Search through guideline documents

### 3.2 Data Validators
**File:** `app/utils/validators.py`

**Tasks:**
- [ ] Create validation functions for report structure
- [ ] Create validation for API responses
- [ ] Implement medical data validators (future: check for required anatomy mentions)

---

## Phase 4: Sub-Agents (Tools for Agent 2)

### 4.1 EHR Sub-Agent
**File:** `app/sub_agents/ehr_agent.py`

**Tasks:**
- [ ] Create EHR sub-agent using Google Agentic ADK
- [ ] Implement query parsing for EHR data
- [ ] Extract relevant information based on query
- [ ] Return structured response

**Functionality:**
- Query patient demographics
- Query lab results by date range
- Query medications
- Query clinical notes by keyword
- Summarize relevant EHR data for report context

**Input:**
- `query: str` - Natural language query (e.g., "Find recent lab results", "Get medication list")
- `data_dir: str` - Path to data directory containing patient_context.json

**Output:**
- `str` - Structured text response with relevant EHR data

**Implementation Approach:**
- Use Google Agentic ADK to create a function/tool that Agent 2 can call
- Load patient_context.json from data directory
- Use Gemini model (configured in agent_config.json) to parse query and extract relevant data
- Return formatted text response

### 4.2 Prior Report Sub-Agent
**File:** `app/sub_agents/prior_report_agent.py`

**Tasks:**
- [ ] Create prior report sub-agent using Google Agentic ADK
- [ ] List available prior reports
- [ ] Read and summarize prior reports
- [ ] Extract key findings from priors
- [ ] Compare with current study (if applicable)

**Input:**
- `query: str` - Natural language query (e.g., "Summarize last CT", "Find mention of liver lesion")
- `data_dir: str` - Path to data directory containing prior_reports/

**Output:**
- `str` - Relevant information from prior reports

**Implementation Approach:**
- Use Google Agentic ADK to create a function/tool
- List markdown files in prior_reports directory
- Use Gemini model to parse query, read relevant reports, and summarize findings
- Return formatted text response

### 4.3 Guideline Sub-Agent
**File:** `app/sub_agents/guideline_agent.py`

**Tasks:**
- [ ] Create guideline sub-agent using Google Agentic ADK
- [ ] Implement basic search functionality (keyword or semantic search)
- [ ] Retrieve relevant guideline sections
- [ ] Format guideline references

**Input:**
- `query: str` - Question or topic (e.g., "CT contrast protocol", "Reporting standards for liver lesions")
- `data_dir: str` - Path to data directory containing guidelines/

**Output:**
- `str` - Relevant guideline excerpts

**Implementation Approach:**
- Use Google Agentic ADK to create a function/tool
- Load guideline markdown files
- Use Gemini model to search and retrieve relevant sections
- Return formatted text response

---

## Phase 5: The Four Main Agents

### 5.1 Agent 1: Orchestrator (Router)
**File:** `app/agents/orchestrator.py`

**Tasks:**
- [ ] Create Orchestrator agent using Google Agentic ADK
- [ ] Implement intent classification logic
- [ ] Update JobState with clarified instructions
- [ ] Determine which sub-agents Agent 2 should call

**Input:**
- `state: JobState` - Current job state with:
  - `report_content`: Current report sections
  - `user_instruction`: User's instruction
  - `active_mode`: Active mode (add_history, proofread, etc.)

**Output:**
- `JobState` - Updated state with:
  - Clarified instructions for Agent 2
  - Updated `logs` with orchestrator's analysis
  - `gathered_data` may be initialized with routing information

**Responsibilities:**
- Analyze user_instruction and active_mode
- Determine what information is needed:
  - Does Agent 2 need to query EHR?
  - Does Agent 2 need to check prior reports?
  - Does Agent 2 need to consult guidelines?
  - Is this just proofreading (no data needed)?
- Update the state with clear instructions for the next agent

**Implementation Approach:**
- Use Google Agentic ADK with Gemini model (from agent_config.json)
- Build prompt with current report, user instruction, and active mode
- Use model to analyze intent and determine routing
- Update state.logs with analysis
- Return updated state

### 5.2 Agent 2: Researcher (Tool User)
**File:** `app/agents/researcher.py`

**Tasks:**
- [ ] Create Researcher agent using Google Agentic ADK
- [ ] Register all three sub-agents as tools/functions
- [ ] Implement "Agents as Tools" pattern using Google ADK
- [ ] Collect data and store in state.gathered_data

**Input:**
- `state: JobState` - Current job state with orchestrator's instructions
- `data_dir: str` - Path to data directory

**Output:**
- `JobState` - Updated state with:
  - `gathered_data`: Dictionary containing all collected information from sub-agents
  - Updated `logs` with researcher's actions

**Responsibilities:**
- Based on Agent 1's instructions, call appropriate sub-agents:
  - EHR sub-agent (if EHR data needed)
  - Prior report sub-agent (if prior reports needed)
  - Guideline sub-agent (if guidelines needed)
- Collect all relevant data
- Store in state.gathered_data

**Implementation Approach:**
- Use Google Agentic ADK to create an agent that can call functions
- Register the three sub-agents as callable functions/tools
- Use Gemini model (from agent_config.json) with function calling capabilities
- Based on orchestrator's instructions, invoke appropriate sub-agents
- Aggregate results into state.gathered_data
- Update state.logs

### 5.3 Agent 3: Synthesizer (Writer)
**File:** `app/agents/synthesizer.py`

**Tasks:**
- [ ] Create Synthesizer agent using Google Agentic ADK
- [ ] Implement report generation/modification logic
- [ ] Apply medical reasoning to integrate gathered data
- [ ] Handle different modes (add history, proofread, etc.)

**Input:**
- `state: JobState` - Current job state with:
  - `report_content`: Current report sections
  - `gathered_data`: Data collected by Agent 2
  - `user_instruction`: User's instruction
  - `active_mode`: Active mode

**Output:**
- `JobState` - Updated state with:
  - `report_content`: Modified report sections
  - Updated `logs` with synthesizer's actions

**Responsibilities:**
- Read current report content
- Read gathered data from Agent 2
- Apply medical reasoning to integrate relevant information
- Generate new/modified report text
- Handle cursor position for targeted insertion (if applicable)
- Maintain professional medical language
- Be concise and accurate
- Only modify sections that need updating

**Implementation Approach:**
- Use Google Agentic ADK with Gemini model (from agent_config.json)
- Build comprehensive prompt with:
  - Current report content
  - Gathered data from Agent 2
  - User instruction
  - Active mode
  - Medical writing guidelines
- Use model to generate modified report sections
- Parse response and update state.report_content
- Update state.logs

### 5.4 Agent 4: Formatter (Quality Assurance)
**File:** `app/agents/formatter.py`

**Tasks:**
- [ ] Create Formatter agent using Google Agentic ADK
- [ ] Ensure output matches Pydantic schema
- [ ] Split text into correct fields
- [ ] Validate medical report structure

**Input:**
- `state: JobState` - Current job state with:
  - `report_content`: Synthesized report content from Agent 3

**Output:**
- `ProcessReportResponse` - Final formatted response with:
  - `status`: "success" or "error"
  - `diff`: Properly structured report sections (indication, technique, findings, impression)
  - `agent_thoughts`: All logs from all agents
  - `error_message`: None if success, error message if error

**Responsibilities:**
- Validate report structure
- Ensure all fields are properly populated (indication, technique, findings, impression)
- Validate medical terminology (basic checks)
- Format according to Pydantic schema
- Return final ProcessReportResponse

**Implementation Approach:**
- Use Google Agentic ADK with Gemini model (from agent_config.json, temperature=0 for consistency)
- Build prompt with synthesized report content
- Use model with structured output to ensure proper JSON format
- Parse to ensure it matches ProcessReportResponse schema
- Validate all required fields are present
- Return ProcessReportResponse object

---

## Phase 6: Agent Pipeline (Google Agentic ADK)

### 6.1 Pipeline Structure
**File:** `app/pipeline/pipeline.py`

**Tasks:**
- [ ] Create sequential pipeline using Google Agentic ADK
- [ ] Connect all four agents in sequence
- [ ] Implement state transitions
- [ ] Add error handling for each agent

**Pipeline Flow:**
```
Initial JobState
    ↓
Agent 1: Orchestrator
    ↓ (updates state with routing instructions)
Agent 2: Researcher
    ↓ (updates state with gathered_data)
Agent 3: Synthesizer
    ↓ (updates state with modified report_content)
Agent 4: Formatter
    ↓
ProcessReportResponse
```

**Implementation Approach:**
- Use Google Agentic ADK to create a sequential workflow
- Each agent receives JobState, processes it, and returns updated JobState
- Agent 4 returns ProcessReportResponse instead of JobState
- Implement error handling at each step
- Log all agent actions in state.logs

### 6.2 Pipeline Execution
**File:** `app/pipeline/executor.py`

**Tasks:**
- [ ] Create pipeline executor function
- [ ] Handle initialization of JobState
- [ ] Execute pipeline sequentially
- [ ] Implement timeout handling

**Function Signature:**
- `execute_pipeline(request: ProcessReportRequest, data_dir: str, config: dict) -> ProcessReportResponse`

**Execution Flow:**
1. Initialize JobState from ProcessReportRequest
2. Load agent configuration from agent_config.json
3. Execute Agent 1 (Orchestrator)
4. Execute Agent 2 (Researcher) with data_dir
5. Execute Agent 3 (Synthesizer)
6. Execute Agent 4 (Formatter) - returns ProcessReportResponse
7. Handle any errors and return appropriate response

---

## Phase 7: API Endpoints (FastAPI Routers)

### 7.1 Agent Router
**File:** `app/routers/agent.py`

**Tasks:**
- [ ] Create `/agent/process` POST endpoint
- [ ] Integrate pipeline executor
- [ ] Add request validation
- [ ] Implement error handling and logging

**Endpoint:**
- `POST /agent/process`
- **Request Body:** ProcessReportRequest
- **Response:** ProcessReportResponse
- **Error Handling:** Return ProcessReportResponse with status="error" and error_message

**Implementation:**
- Load agent configuration from agent_config.json
- Get data_dir from environment variable
- Call execute_pipeline with request, data_dir, and config
- Return ProcessReportResponse

### 7.2 STT Router
**File:** `app/routers/stt.py`

**Tasks:**
- [ ] Create `/stt/dictate` POST endpoint
- [ ] Implement speech-to-text using Google STT or Whisper
- [ ] Handle audio upload and processing
- [ ] Return transcribed text

**Endpoint:**
- `POST /stt/dictate`
- **Request:** Multipart form data with audio file
- **Response:** DictateResponse

**Note:** This is a placeholder for future implementation. For now, return a simple response.

### 7.3 Health Check Router
**File:** `app/routers/health.py`

**Tasks:**
- [ ] Create `/health` GET endpoint
- [ ] Return API status and version
- [ ] Check data directory availability

---

## Phase 8: Main Application Setup

### 8.1 FastAPI App Configuration
**File:** `app/main.py`

**Tasks:**
- [ ] Initialize FastAPI app
- [ ] Configure CORS middleware
- [ ] Include all routers
- [ ] Add startup/shutdown events
- [ ] Configure logging
- [ ] Load agent configuration on startup

**Startup Events:**
- Load agent_config.json
- Verify data directory exists
- Validate Google API key is set
- Log configuration

**Shutdown Events:**
- Clean up any resources

---

## Phase 9: Dummy Data Creation

### 9.1 Data Directory Setup
**Location:** `/data/` (root directory)

**Tasks:**
- [ ] Create all dummy data files in `/data/` directory
- [ ] Follow structure from data-structure-plan.md
- [ ] Keep all data SHORT for UI testing

**Files to Create:**
- `data/patient_context.json` - EHR data (short, 2-3 labs, 3-4 meds)
- `data/prior_reports/report_2024_01_15.md` - Prior report 1 (10-15 lines)
- `data/prior_reports/report_2024_06_20.md` - Prior report 2 (10-15 lines)
- `data/guidelines/acr_guidelines.md` - Guideline 1 (15-20 lines)
- `data/guidelines/institutional_protocols.md` - Guideline 2 (15-20 lines)
- `data/medical_imaging/ct_scan.nii.gz` - Sample CT scan (or placeholder)

**Note:** This phase will be completed during actual implementation. Do not create files now, just plan for it.

---

## Phase 10: Testing & Validation

### 10.1 Unit Tests
**Tasks:**
- [ ] Test each agent independently
- [ ] Test sub-agents (tools)
- [ ] Test data loading utilities
- [ ] Test Pydantic model validation
- [ ] Test configuration loading

### 10.2 Integration Tests
**Tasks:**
- [ ] Test complete pipeline execution
- [ ] Test API endpoints
- [ ] Test error handling
- [ ] Test timeout scenarios
- [ ] Test with different model configurations

### 10.3 End-to-End Tests
**Tasks:**
- [ ] Test with frontend integration
- [ ] Test all macro button flows
- [ ] Test with various report states
- [ ] Performance testing (< 5s response time)

---

## Phase 11: Local Development Setup

### 11.1 Development Configuration
**Tasks:**
- [ ] Create development setup instructions
- [ ] Ensure application works completely locally
- [ ] Document local data directory setup
- [ ] Create README for local development

**Local Setup Requirements:**
- Application must run entirely locally without external dependencies (except Google API)
- Data files should be accessible from `/data/` directory
- Frontend should be able to connect to local backend (localhost:8000)
- All dummy data should be in `/data/` for easy sharing via GitHub

---

## Implementation Timeline

### Week 1: Foundation & Models
- Complete Phases 1-3 (Setup, Models, File Utils, Configuration)

### Week 2: Sub-Agents & Core Agents
- Complete Phases 4-5 (Sub-agents, Main Agents)

### Week 3: Pipeline & API
- Complete Phases 6-8 (Pipeline, API Endpoints, Main App)

### Week 4: Data, Testing, Local Setup
- Complete Phases 9-11 (Dummy Data, Testing, Local Development)

---

## Critical Success Factors

1. **Google ADK Integration**: Proper implementation using only Google Agentic ADK (no LangChain/LangGraph)
2. **Response Time**: Must complete pipeline in < 5 seconds
3. **Error Handling**: Robust error handling at every stage
4. **Model Configuration**: Easy-to-edit config file for model selection
5. **Local Development**: Must work completely locally for GitHub sharing
6. **Data Location**: All dummy data in `/data/` directory initially

---

## Dependencies on Frontend

- Frontend must send requests in the format specified in ProcessReportRequest
- Frontend must handle agent_thoughts array for display
- Frontend must apply diff to report fields correctly

---

## Future Enhancements

- [ ] Advanced medical NLP for better report understanding
- [ ] Style learning from uploaded prior reports
- [ ] Streaming responses for real-time feedback
- [ ] Integration with actual PACS/EHR systems
- [ ] Multi-modal inputs (DICOM metadata analysis)
- [ ] Vector database for guideline RAG
