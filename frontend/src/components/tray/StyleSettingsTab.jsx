'use client';

import { useState, useEffect } from 'react';

export default function StyleSettingsTab({ onOpenModal }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [priorRadiologistReports, setPriorRadiologistReports] = useState([]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map((file, idx) => ({
      id: Date.now() + idx,
      name: file.name,
      size: file.size,
      uploadDate: new Date().toLocaleDateString()
    }));
    setUploadedFiles([...uploadedFiles, ...newFiles]);
  };

  const handleDeleteFile = (fileId) => {
    setUploadedFiles(uploadedFiles.filter(f => f.id !== fileId));
  };

  // Load prior radiologist reports from demo-data
  useEffect(() => {
    const loadPriorRadiologistReports = async () => {
      try {
        // Use the same reports as prior imaging, but these represent radiologist's prior reports
        const reports = [
          { filename: 'report_2025_07_10.md' },
          { filename: 'report_2025_01_15.md' },
          { filename: 'report_2024_03_20.md' },
          { filename: 'report_2023_08_05.md' },
          { filename: 'report_2022_12_10.md' },
          { filename: 'report_2020_05_01.md' }
        ];

        const loadedReports = await Promise.all(
          reports.map(async (report, idx) => {
            try {
              const response = await fetch(`/demo-data/prior_reports/${report.filename}`);
              const content = await response.text();
              const lines = content.split('\n').filter(l => l.trim());
              
              // Extract modality from first line (remove # and trim)
              const modality = lines[0]?.replace(/^#\s*/, '').trim() || 'Unknown';
              
              // Extract date from third line (format: **Date:** Month Day, Year)
              let date = '';
              const dateLine = lines.find(l => l.includes('**Date:**'));
              if (dateLine) {
                const dateMatch = dateLine.match(/\*\*Date:\*\*\s*(.+)/);
                if (dateMatch) {
                  const dateStr = dateMatch[1].trim();
                  // Convert "Month Day, Year" to "YYYY-MM-DD"
                  try {
                    const parsedDate = new Date(dateStr);
                    if (!isNaN(parsedDate.getTime())) {
                      date = parsedDate.toISOString().split('T')[0];
                    } else {
                      // Fallback: extract from filename
                      const filenameMatch = report.filename.match(/report_(\d{4})_(\d{2})_(\d{2})/);
                      if (filenameMatch) {
                        date = `${filenameMatch[1]}-${filenameMatch[2]}-${filenameMatch[3]}`;
                      }
                    }
                  } catch (e) {
                    // Fallback: extract from filename
                    const filenameMatch = report.filename.match(/report_(\d{4})_(\d{2})_(\d{2})/);
                    if (filenameMatch) {
                      date = `${filenameMatch[1]}-${filenameMatch[2]}-${filenameMatch[3]}`;
                    }
                  }
                }
              } else {
                // Fallback: extract from filename
                const filenameMatch = report.filename.match(/report_(\d{4})_(\d{2})_(\d{2})/);
                if (filenameMatch) {
                  date = `${filenameMatch[1]}-${filenameMatch[2]}-${filenameMatch[3]}`;
                }
              }
              
              // Extract summary from findings section
              const findingsIndex = lines.findIndex(l => l.includes('## Findings:') || l.includes('## FINDINGS:'));
              const summaryLines = findingsIndex >= 0 
                ? lines.slice(findingsIndex + 1, findingsIndex + 4)
                : lines.slice(3, 6);
              const summary = summaryLines.join(' ').replace(/\*\*/g, '').substring(0, 100) + '...';
              
              return {
                id: idx + 1,
                filename: report.filename,
                date: date,
                modality: modality,
                summary: summary,
                content: content
              };
            } catch (e) {
              console.error(`Failed to load ${report.filename}:`, e);
              return null;
            }
          })
        );

        // Sort by date descending (most recent first)
        const sortedReports = loadedReports
          .filter(r => r !== null)
          .sort((a, b) => b.date.localeCompare(a.date));

        setPriorRadiologistReports(sortedReports);
      } catch (error) {
        console.error('Failed to load prior radiologist reports:', error);
        setPriorRadiologistReports([]);
      }
    };

    loadPriorRadiologistReports();
  }, []);

  const handleRadiologistReportClick = (report) => {
    if (onOpenModal) {
      onOpenModal({
        type: 'markdown',
        title: `${report.modality} - ${report.date}`,
        content: report.content || `# ${report.modality}\n\n**Date:** ${report.date}\n\n**Summary:**\n${report.summary}`
      });
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem'
    }}>
      {/* Custom Style Instructions */}
      <div>
        <label
          htmlFor="custom-instructions"
          style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}
        >
          Custom Style Instructions
        </label>
        <textarea
          id="custom-instructions"
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="Enter custom style instructions for report generation..."
          rows={3}
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
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent-blue)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-subtle)';
          }}
        />
      </div>

      {/* Prior Radiologist Reports */}
      {priorRadiologistReports.length > 0 && (
        <div>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
            marginBottom: '0.75rem'
          }}>
            Prior Radiologist Reports
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            {priorRadiologistReports.map((report) => (
              <div
                key={report.id}
                onClick={() => handleRadiologistReportClick(report)}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-blue)';
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <div>
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: 'var(--text-primary)',
                      marginBottom: '0.25rem'
                    }}>
                      {report.modality}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)'
                    }}>
                      {report.date}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.5'
                }}>
                  {report.summary}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div>
        <div style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '0.75rem'
        }}>
          Click to upload prior reports for adopting a style
        </div>
        <label
          htmlFor="file-upload"
          style={{
            display: 'block',
            padding: '2rem',
            border: '2px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            backgroundColor: 'var(--bg-tertiary)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-blue)';
            e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
          }}
        >
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.md,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <div style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}>
            PDF, Markdown, or Text files
          </div>
        </label>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div>
          <h3 style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
            marginBottom: '0.75rem'
          }}>
            Uploaded Files ({uploadedFiles.length})
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  backgroundColor: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)'
                  }}>
                    {file.name}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                  }}>
                    {(file.size / 1024).toFixed(2)} KB • {file.uploadDate}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--accent-red)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'var(--hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
