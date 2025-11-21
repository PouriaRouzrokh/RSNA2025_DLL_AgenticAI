# Data Structure Plan & Dummy Data Specifications

## Overview

This document outlines the structure of all data files needed for the application, with **SHORT** dummy data examples for UI testing only.

---

## 1. Patient Context (EHR Data)

**Location:** `/data/patient_context.json` (used for both dummy data and final data)

**File:** `patient_context.json`

```json
{
  "demographics": {
    "patient_id": "P123456",
    "name": "John Doe",
    "age": 58,
    "sex": "M",
    "mrn": "MRN-2024-001"
  },
  "chief_complaint": "Abdominal pain, weight loss",
  "labs": [
    {
      "date": "2024-11-15",
      "test": "Complete Blood Count",
      "results": {
        "WBC": "7.2 K/uL (Normal)",
        "Hemoglobin": "11.5 g/dL (Low)",
        "Platelets": "245 K/uL (Normal)"
      }
    },
    {
      "date": "2024-11-15",
      "test": "Liver Function",
      "results": {
        "ALT": "42 U/L (Normal)",
        "AST": "38 U/L (Normal)"
      }
    }
  ],
  "medications": [
    "Lisinopril 10mg daily",
    "Metformin 500mg BID",
    "Aspirin 81mg daily"
  ],
  "clinical_notes": [
    {
      "date": "2024-11-10",
      "provider": "Dr. Smith",
      "note": "Patient presents with 3-month history of intermittent RUQ pain. No fever. PMH significant for hypertension and Type 2 diabetes."
    }
  ],
  "past_medical_history": [
    "Hypertension",
    "Type 2 Diabetes Mellitus",
    "Prior cholecystectomy (2019)"
  ]
}
```

---

## 2. Prior Imaging Reports

**Location (Final):** `/data/prior_imaging/`
**Location (Demo):** `/frontend/public/demo-data/prior_reports/` and `/backend/data/prior_reports/`

### Example 1: `report_2024_01_15.md`

```markdown
# CT Abdomen/Pelvis with Contrast
**Date:** January 15, 2024
**Indication:** Follow-up liver lesion

## Findings:
- Liver: 1.2 cm hypodense lesion in segment 7, unchanged from prior. Likely simple cyst.
- Pancreas: Normal size and attenuation.
- Kidneys: Bilateral simple renal cysts, stable.

## Impression:
1. Stable 1.2 cm liver cyst, segment 7.
2. No acute abdominal pathology.
```

### Example 2: `report_2024_06_20.md`

```markdown
# CT Chest without Contrast
**Date:** June 20, 2024
**Indication:** Screening

## Findings:
- Lungs: Clear. No nodules or masses.
- Mediastinum: Normal.

## Impression:
Normal chest CT.
```

---

## 3. Clinical Data as Markdown (For Final Phase)

**Location:** `/data/clinical_data/`

### `patient_history.md`

```markdown
# Patient History

**Patient ID:** P123456
**Date of Birth:** 05/12/1966
**Sex:** Male

## Chief Complaint
Abdominal pain and weight loss over 3 months.

## History of Present Illness
58-year-old male with gradual onset RUQ pain, associated with 10lb weight loss.

## Past Medical History
- Hypertension (2015)
- Type 2 Diabetes (2018)
- Cholecystectomy (2019)
```

### `lab_results.md`

```markdown
# Laboratory Results

## Date: November 15, 2024

### Complete Blood Count
- WBC: 7.2 K/uL (Normal: 4.5-11.0)
- Hemoglobin: 11.5 g/dL (Low: Normal 13.5-17.5)
- Platelets: 245 K/uL (Normal: 150-400)

### Liver Function Tests
- ALT: 42 U/L (Normal: 7-56)
- AST: 38 U/L (Normal: 10-40)
```

### `medications.md`

```markdown
# Current Medications

1. **Lisinopril** 10mg PO daily - Hypertension
2. **Metformin** 500mg PO BID - Type 2 Diabetes
3. **Aspirin** 81mg PO daily - Cardiovascular prophylaxis
```

### `clinical_notes.md`

```markdown
# Clinical Notes

## November 10, 2024 - Dr. Smith (Primary Care)
Patient presents with 3-month history of intermittent RUQ pain. No fever or jaundice. 
PMH significant for hypertension and diabetes. Ordered CT abdomen/pelvis.
```

---

## 4. Medical Guidelines

**Location (Final):** `/data/guidelines/`
**Location (Demo):** `/frontend/public/demo-data/guidelines/` and `/backend/data/guidelines/`

### `acr_guidelines.md`

```markdown
# ACR Appropriateness Criteria - Liver Lesion Characterization

## Indication
Characterization of incidental liver lesions found on imaging.

## Recommendations
1. **Simple Cyst (<1cm):** No follow-up required.
2. **Simple Cyst (>1cm):** Consider ultrasound follow-up in 6-12 months.
3. **Complex Cyst or Solid Lesion:** MRI with hepatocyte-specific contrast agent recommended.

## Reporting Standards
- Size and location of lesion
- Enhancement characteristics
- Comparison with prior studies when available
```

### `institutional_protocols.md`

```markdown
# Institutional CT Protocols

## CT Abdomen/Pelvis with Contrast

### Technique
- 100mL IV contrast (Omnipaque 350)
- Portal venous phase imaging (70 seconds delay)
- 3mm slice thickness

### Standard Reporting Sections
1. Indication
2. Technique
3. Findings (by organ system)
4. Impression (numbered list)
```

---

## 5. CT Scan Data

**Location (Final):** `/data/medical_imaging/ct_scan.nii.gz`
**Location (Demo):** `/frontend/public/demo-data/medical_imaging/ct_scan.nii.gz`

**Note:** You will provide a real NIfTI file. For initial development, we can use a sample/dummy NIfTI file from public datasets or you can provide one.

**Dummy Data Strategy:**
- Use a small sample CT scan (e.g., 10-20 slices instead of full volume)
- Can be downloaded from: https://www.slicer.org/wiki/SampleData (or similar)
- File size should be <10MB for fast loading during development

**Preprocessed Files (Optional):**
- For faster loading, you can create `ct_scan_preprocessed.json` files
- Contains pre-parsed volume data as Float32Array
- Automatically detected and loaded if present (much faster than NIfTI)

## 6. CT Scan Configuration

**Location:** `/frontend/public/demo-data/medical_imaging/ct_scan_config.json`

**Format:**
```json
[
  {
    "file_path": "/demo-data/medical_imaging/ct_scan.nii.gz",
    "rescale_intercept": -8192,
    "rescale_slope": 1
  }
]
```

**Purpose:**
- Allows manual configuration of rescale intercept and slope values
- Overrides values from NIfTI file header
- Supports multiple CT scans with different rescale values
- Essential for correct CT windowing display

---

## 7. Style Guide (User Uploaded Examples)

**Location (Final):** User uploads these
**Location (Demo):** `/frontend/public/demo-data/style_guide/`

### `example_report_style.md`

```markdown
# Example Report - User's Writing Style

**Indication:** Abdominal pain.

**Technique:** CT abdomen/pelvis with IV contrast.

**Findings:**
The liver demonstrates normal size and contour. A 1.5 cm well-circumscribed hypodense lesion is noted in segment 6, consistent with a simple cyst. No other hepatic abnormality.

The pancreas, spleen, and adrenal glands are unremarkable.

**Impression:**
1. 1.5 cm simple hepatic cyst, segment 6.
2. Otherwise unremarkable examination.
```

---

## Directory Structure for Data

### Dummy Data (Created During Implementation Phase)
**Location:** `/frontend/public/demo-data/` (for frontend access)

```
frontend/public/demo-data/
├── ehr_data/
│   └── patient_context.json
├── prior_reports/
│   ├── report_2023_11_10.md
│   ├── report_2024_01_15.md
│   └── report_2024_06_20.md
├── guidelines/
│   ├── acr_guidelines.md
│   └── institutional_protocols.md
├── style_guide/
│   └── (user uploaded examples)
└── medical_imaging/
    ├── ct_scan.nii.gz
    ├── ct_scan_config.json
    └── ct_scan_preprocessed.json (optional)
```

**Note:** All dummy data will be created in `/data/` during implementation. This same directory will later contain your final real data files (you'll just replace the dummy files).

### Final Data (For Production Phase)
```
data/
├── clinical_data/
│   ├── patient_history.md
│   ├── lab_results.md
│   ├── medications.md
│   └── clinical_notes.md
├── prior_imaging/
│   ├── report_2024_01_15.md
│   └── report_2024_06_20.md
├── guidelines/
│   ├── acr_guidelines.md
│   └── institutional_protocols.md
└── medical_imaging/
    └── ct_scan.nii.gz  (Real CT scan from you)
```

---

## Data File Specifications Summary

| File | Format | Size Estimate | Purpose |
|------|--------|---------------|---------|
| patient_context.json | JSON | <5KB | EHR data for Agent 2 queries |
| prior reports | Markdown | <2KB each | Historical imaging reports |
| guidelines | Markdown | <5KB each | Medical protocols for Agent 2 |
| clinical data | Markdown | <3KB each | Final phase structured data |
| ct_scan.nii.gz | NIfTI | <10MB (demo) | CT imaging for viewer |

---

## Notes for Implementation

1. **Keep It Simple**: All dummy data is intentionally SHORT for UI testing
2. **Realistic but Minimal**: Just enough content to test each UI component
3. **Easy to Replace**: When you provide real data, simply swap files in `/data/` directory
4. **Consistent Formatting**: All dates in YYYY-MM-DD format, all medical terminology realistic

---

## Dummy Data Creation Checklist

- [ ] Create `patient_context.json` with 2-3 lab results
- [ ] Create 2 prior report markdown files
- [ ] Create 2 guideline markdown files
- [ ] Create 1 style example markdown file
- [ ] Create corresponding clinical data markdown files for final phase
- [ ] Document where to place the NIfTI file you provide
- [ ] Create README in `/data/` explaining the final data structure


