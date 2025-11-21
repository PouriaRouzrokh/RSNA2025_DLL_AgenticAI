'use client';

import { useState, useEffect, useRef } from 'react';
import { useReportStore } from '@/hooks/useReportState';

export default function ReportEditor() {
  const {
    indication,
    technique,
    findings,
    impression,
    updateField,
    setCursorPosition
  } = useReportStore();

  // Initialize indication with placeholder if empty
  useEffect(() => {
    if (!indication) {
      updateField('indication', 'To rule out nodules');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save to localStorage every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const reportData = {
        indication,
        technique,
        findings,
        impression
      };
      localStorage.setItem('report_draft', JSON.stringify(reportData));
    }, 5000);

    return () => clearInterval(interval);
  }, [indication, technique, findings, impression]);

  // Load saved report on mount
  useEffect(() => {
    const saved = localStorage.getItem('report_draft');
    if (saved) {
      try {
        const reportData = JSON.parse(saved);
        Object.keys(reportData).forEach((field) => {
          if (reportData[field]) {
            updateField(field, reportData[field]);
          }
        });
      } catch (e) {
        console.error('Failed to load saved report:', e);
      }
    }
  }, []);

  const handleFieldChange = (fieldId, value) => {
    updateField(fieldId, value);
  };

  const handleFieldFocus = (fieldId, e) => {
    const position = e.target.selectionStart || 0;
    setCursorPosition(fieldId, position);
  };

  const getWordCount = (text) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const getCharCount = (text) => {
    return text.length;
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-tertiary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          margin: 0
        }}>
          Sample Chest CT scan Report
        </h2>
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--text-secondary)'
        }}>
          Auto-saved
        </div>
      </div>

      {/* Form Fields */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '1.5rem'
      }}>
        {/* Indication Field */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="indication"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}
          >
            Indication
          </label>
          <textarea
            id="indication"
            value={indication || 'To rule out nodules'}
            onChange={(e) => handleFieldChange('indication', e.target.value)}
            onFocus={(e) => handleFieldFocus('indication', e)}
            placeholder="Enter further clinical indication to be included in the report if necessary"
            rows={2}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              lineHeight: '1.6',
              resize: 'vertical',
              transition: 'border-color var(--transition-fast)'
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
              }
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)'
          }}>
            <span>{getWordCount(indication)} words</span>
            <span>{getCharCount(indication)} characters</span>
          </div>
        </div>

        {/* Technique Field - Non-editable */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}
          >
            Technique
          </label>
          <div style={{
            padding: '0.75rem',
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            lineHeight: '1.6'
          }}>
            CT Chest with contrast. 100mL of non-ionic contrast material (Iohexol 350 mgI/mL) administered intravenously. Images acquired in portal venous phase.
          </div>
        </div>

        {/* Findings Field */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="findings"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}
          >
            Findings
          </label>
          <textarea
            id="findings"
            value={findings}
            onChange={(e) => handleFieldChange('findings', e.target.value)}
            onFocus={(e) => handleFieldFocus('findings', e)}
            placeholder="Describe the imaging findings in detail..."
            rows={12}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              lineHeight: '1.6',
              resize: 'vertical',
              transition: 'border-color var(--transition-fast)'
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
              }
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)'
          }}>
            <span>{getWordCount(findings)} words</span>
            <span>{getCharCount(findings)} characters</span>
          </div>
        </div>

        {/* Impression Field */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="impression"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}
          >
            Impression
          </label>
          <textarea
            id="impression"
            value={impression}
            onChange={(e) => handleFieldChange('impression', e.target.value)}
            onFocus={(e) => handleFieldFocus('impression', e)}
            placeholder="Provide clinical impression and recommendations..."
            rows={4}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontFamily: 'inherit',
              lineHeight: '1.6',
              resize: 'vertical',
              transition: 'border-color var(--transition-fast)'
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
              }
            }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '0.25rem',
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)'
          }}>
            <span>{getWordCount(impression)} words</span>
            <span>{getCharCount(impression)} characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}

