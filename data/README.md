# Final Data Directory

## Purpose

This directory is reserved for **FINAL, PRODUCTION-READY** files that you will provide in the final phase of the project.

During frontend and backend development, we will use SHORT dummy data in:
- `frontend/public/demo-data/` (for frontend)
- `backend/data/` (for backend)

Once development is complete and you're ready to use real data, place your files here following the structure below.

---

## Directory Structure

```
data/
├── medical_imaging/
│   └── ct_scan.nii.gz              # Your real CT scan in NIfTI format
├── clinical_data/
│   ├── patient_history.md          # Patient history as markdown
│   ├── lab_results.md              # Laboratory results as markdown
│   ├── medications.md              # Current medications as markdown
│   └── clinical_notes.md           # Clinical notes as markdown
├── prior_imaging/
│   ├── report_2024_01_15.md        # Prior imaging report 1
│   ├── report_2024_06_20.md        # Prior imaging report 2
│   └── ...                         # Additional prior reports
└── guidelines/
    ├── acr_guidelines.md           # ACR guidelines as markdown
    └── institutional_protocols.md  # Institutional protocols as markdown
```

---

## File Format Requirements

### 1. CT Scan (`medical_imaging/ct_scan.nii.gz`)

- **Format**: NIfTI (.nii or .nii.gz)
- **Modality**: CT (Abdomen/Pelvis preferred for demo)
- **Size**: Any size (will be loaded by Cornerstone.js)
- **Notes**: Make sure the file is valid and can be viewed in standard DICOM/NIfTI viewers

### 2. Clinical Data (Markdown files in `clinical_data/`)

All clinical data should be formatted as **Markdown** (.md) files for easy reading and parsing.

#### `patient_history.md`
```markdown
# Patient History

**Patient ID:** [Your ID]
**Date of Birth:** MM/DD/YYYY
**Sex:** M/F

## Chief Complaint
[Describe the main complaint]

## History of Present Illness
[Detailed history]

## Past Medical History
- [Condition 1]
- [Condition 2]
```

#### `lab_results.md`
```markdown
# Laboratory Results

## Date: YYYY-MM-DD

### [Test Name]
- [Parameter]: [Value] ([Normal range])
```

#### `medications.md`
```markdown
# Current Medications

1. **[Drug Name]** [Dose] [Route] [Frequency] - [Indication]
```

#### `clinical_notes.md`
```markdown
# Clinical Notes

## Date: YYYY-MM-DD - Provider Name

[Note content]
```

### 3. Prior Imaging Reports (`prior_imaging/*.md`)

Each prior report should be a separate markdown file named with the date:

```markdown
# [Modality] [Body Part]
**Date:** Month DD, YYYY
**Indication:** [Reason for exam]

## Findings:
[Findings organized by organ system]

## Impression:
1. [Key finding 1]
2. [Key finding 2]
```

### 4. Guidelines (`guidelines/*.md`)

Medical guidelines and protocols as markdown:

```markdown
# [Guideline Title]

## [Section]
[Content]
```

---

## How to Use

### During Development (Phase 1-2)
- **Don't touch this directory**
- Use dummy data in `frontend/public/demo-data/` and `backend/data/`

### In Final Phase (Phase 3)
1. Create the directory structure above
2. Place your real CT scan in `medical_imaging/`
3. Convert your clinical data to markdown format and place in `clinical_data/`
4. Convert prior reports to markdown and place in `prior_imaging/`
5. Add guidelines as markdown in `guidelines/`

### Configuration Update
When switching to real data, update environment variables:
- Frontend: No change needed (files accessed via public directory or API)
- Backend: Update `DATA_DIR` environment variable to point to `/data/`

---

## Data Privacy & Security

⚠️ **IMPORTANT**: 
- **De-identify all patient data** before placing in this directory
- Remove all PHI (Protected Health Information)
- Use synthetic patient IDs and dates
- This is for DEMO/WORKSHOP purposes only
- Do NOT use real patient data without proper IRB approval and de-identification

---

## File Size Recommendations

- **CT Scan**: <100MB (consider downsampling if larger)
- **Each markdown file**: <50KB
- **Total data directory**: <200MB

This ensures fast loading and good performance during the workshop demo.

---

## Questions?

If you need help:
1. Converting DICOM to NIfTI: Use tools like `dcm2niix`
2. Converting clinical data to markdown: Use any text editor
3. File format issues: Check the examples in `/docs/data-structure-plan.md`

---

## Status

- [ ] CT scan provided (`medical_imaging/ct_scan.nii.gz`)
- [ ] Patient history created (`clinical_data/patient_history.md`)
- [ ] Lab results created (`clinical_data/lab_results.md`)
- [ ] Medications created (`clinical_data/medications.md`)
- [ ] Clinical notes created (`clinical_data/clinical_notes.md`)
- [ ] Prior reports created (`prior_imaging/*.md`)
- [ ] Guidelines created (`guidelines/*.md`)

---

**When you're ready to add real data, simply create the directories above and place your files. The application will automatically load them!**


