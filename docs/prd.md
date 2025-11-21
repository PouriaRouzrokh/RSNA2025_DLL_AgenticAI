PRODUCT REQUIREMENTS DOCUMENT (PRD)
Project: Radiology AI "Head-Up" Workflow & Multi-Agent Demo
Frontend: Next.js with JS (no TS needed) (Single Page Application)
Backend: FastAPI + Google Agentic ADK (Python)
Deployment: Vercel (Frontend) + V
1. Executive Summary
This project is a teaching demonstration for a radiology workshop. It showcases a Multi-Agent AI System integrated into a modern, ergonomic Single-Page Application (SPA).
The Core Concept:
Frontend (Head-Up Display): The radiologist works in a single view. Support data (EHR, Priors) sits in a collapsible tray below the main workspace, ensuring the user never leaves the report context. Interaction is driven by specific command buttons ("Macros") rather than open-ended chat.
Backend (Agentic Pipeline): A 4-step sequential multi-agent pipeline built on the Google Agentic ADK. It demonstrates how specialized agents (Router, Researcher, Writer, Formatter) collaborate to process complex medical instructions reliably.
2. System Architecture Overview
The system follows a request-response cycle where the Frontend sends a "Job Object" to the Backend. The Backend processes this through four distinct agents and returns a structured response.
High-Level Pipeline Flow
code
Text
User Action (Frontend) 
   ⬇ (JSON Payload)
Backend Entry Point (FastAPI)
   ⬇
[Agent 1: Orchestrator] -> Updates State, Clarifies Intent
   ⬇
[Agent 2: Researcher] -> Calls Sub-Agents as Tools (EHR, Priors, Guidelines)
   ⬇
[Agent 3: Synthesizer] -> Drafts/Modifies Content
   ⬇
[Agent 4: Formatter] -> Validates against Pydantic Models
   ⬇
JSON Response to Frontend
3. Frontend Specifications (The "Head-Up" Display)
The UI is a Single Page elegant and aesthitically beautiful (even though professional) dark themed Application divided into three vertical zones.
3.1 Zone A: The Workspace (Top 60%)
Left Panel (50%): CT Viewer
Lib: Cornerstone.js / VTK.js.
Features: Scrollable NIfTI volume, Window/Level presets, "Maximize" button (opens full-screen modal).
Right Panel (50%): Structured Report Editor
Fields: Indication, Technique, Findings, Impression.
Features: Live text editing. Cursor position tracking (to insert text exactly where needed).
3.2 Zone B: AI Command Bar (Middle 10%)
Design: A horizontal control strip separating the Workspace and the Reference Tray.
Interaction Model: No streaming chat. Input 
→
→
 Processing Indicator 
→
→
 Result.
Components:
Custom Instruction Input: Text field for specific requests (e.g., "Mention the liver cyst size").
Quick Action Macros (Buttons):
"Add Clinical History": Triggers pipeline to fetch EHR data.
"Proofread": Triggers pipeline to fix grammar/style.
"Check Completeness": Triggers pipeline to verify anatomy coverage.
Execute Button: Submits the current report state + instruction to the backend.
3.3 Zone C: The Reference Tray (Bottom 30% - Collapsible)
Concept: A tabbed drawer that users can expand or collapse.
Tabs:
Prior Imaging: List of PDFs/Markdown. Click 
→
→
 Open in "Focus Modal".
EHR Data: Tabular view of labs, meds, notes (JSON sourced).
Guidelines: PDF Guidelines.
Style Settings: User uploads their own prior reports here to "teach" the AI their voice.
Focus Modal: Since users cannot leave the page, clicking a document in Zone C opens a large centered overlay (Modal) to read the document, which can be closed via "Esc" or a close button.
4. Backend Specifications (Google ADK Multi-Agent Pipeline)
The backend utilizes the Google Agentic ADK framework (Python). It is structured as a State Graph where a shared JobState object is passed and mutated between four sequential agents.
4.1 Shared Data Structure (The State)
Every agent receives and modifies this Pydantic object:
code
Python
class JobState(BaseModel):
    report_content: dict  # { "findings": "...", "impression": "..." }
    user_instruction: str # "Add clinical history" or custom text
    active_mode: str      # "proofread", "generation", "audit"
    gathered_data: dict   # Context collected by Agent 2
    logs: list[str]       # Trace of agent thoughts (for debugging/demo)
4.2 The Agent Pipeline
Agent 1: The Orchestrator (Router)
Role: Intake and Intent Understanding.
Task:
Receives the raw user request and current report text.
Analyzes the user_instruction and active_mode.
Determines what information is missing.
Updates the JobState to clarify the mission for the next agent.
Example Logic: "User pressed 'Add History'. I do not need to check guidelines. I only need to instruct Agent 2 to look at EHR."
Agent 2: The Researcher (Tool User)
Role: Data Aggregation.
Architecture: "Agents as Tools" pattern.
Capabilities: This agent does not "know" things directly; it has access to specific sub-agents registered as tools.
ehr_sub_agent: Can query the patient's JSON chart.
prior_report_sub_agent: Can read/summarize PDF/MD files from the priors directory.
guideline_sub_agent: Can RAG (Retrieve-Augmented Generation) against guideline PDFs.
Execution: Based on Agent 1's instructions, it invokes the necessary sub-agents, collects their text outputs, and stores them in JobState.gathered_data.
Agent 3: The Synthesizer (Writer)
Role: Medical Logic & Drafting.
Task:
Reads JobState.report_content (current draft).
Reads JobState.gathered_data (EHR/Priors found by Agent 2).
Reads JobState.user_instruction.
Action: Generates the new text for the report. It applies medical reasoning (e.g., "Since the EHR says 'history of colon CA', I will update the Indication section").
Note: This agent produces raw text, which might be slightly unstructured.
Agent 4: The Formatter (Quality Assurance)
Role: Structural Enforcement.
Task:
Takes the raw text from Agent 3.
Ensures the output strictly adheres to the API's required JSON schema.
Splits text correctly into "Findings", "Impression", "Indication", etc.
Output: Returns a specific Pydantic object that FastAPI can serialize directly to JSON.
5. API Interface (FastAPI)
The backend exposes endpoints that trigger the pipeline.
5.1 POST /agent/process
Trigger: Clicking "Execute" or any Macro button in Zone B.
Request Body:
```json
{
  "current_report": {
    "indication": "...",
    "technique": "...",
    "findings": "...",
    "impression": "..."
  },
  "instruction": "Summarize priors",
  "mode_button": "summarize_priors" // or "add_history", "proofread", "check_completeness", "check_references", "custom"
}
```

**Note:** The frontend sends `mode_button` mapped from macro checkbox selections:
- `add_background` → `add_history`
- `proofread` → `proofread`
- `make_impressions` → `check_completeness`
- `compare_priors` → `summarize_priors`
- `check_references` → `check_references`
- Custom instruction → `custom`
Process:
FastAPI initializes JobState.
Passes State to Agent 1.
Agent 1 
→
→
 Agent 2 (calls sub-agents) 
→
→
 Agent 3 
→
→
 Agent 4.
Response Body:
code
JSON
{
  "status": "success",
  "diff": {
    "findings": "New text...",
    "impression": "New impression..."
  },
  "agent_thoughts": ["Agent 1: Routing to EHR...", "Agent 2: Found 3 notes..."]
}
5.2 POST /stt/dictate
Input: Audio Blob.
Output: {"text": "Transcribed text"}
Note: Standard speech-to-text (Google STT or Whisper), separate from the agent pipeline.
6. Data Strategy (Static Files)
To keep the demo robust and portable, "Database" data is read from the file system.
Directory: /public/demo-data/ (Frontend) or /app/data/ (Backend).
Files:
patient_context.json (EHR data).
prior_reports/ (PDFs/MDs).
guidelines/ (PDFs).
style_guide/ (User uploaded examples).
7. Development Roadmap (Workshop Steps)
This PRD supports a modular teaching approach:
Step 1: The UI Shell: Build the Next.js SPA. Create the "Head-Up" layout with the collapsible tray.
Step 2: The Viewer: Integrate Cornerstone.js for the CT visualizer.
Step 3: The "Brain" (Agent 1 & 3): Build a simple backend that takes input and writes text using Google ADK.
Step 4: The "Tools" (Agent 2): Implement the complex "Agent-as-a-Tool" logic for EHR and Priors.
Step 5: The "Guardrails" (Agent 4): Implement the Pydantic formatter to ensure the frontend never breaks.
8. Summary of Constraints & Requirements
No User Auth: Open access.
Latency: Backend should aim for <5s response. If slower, Frontend must show a "Processing... Agent 2 is reading chart..." loading state.
Mobile: Not supported (Desktop only).
Dark Mode: Mandatory for radiology environment simulation.