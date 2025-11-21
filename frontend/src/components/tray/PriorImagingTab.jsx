'use client';

import { useState, useEffect } from 'react';

export default function PriorImagingTab({ onOpenModal }) {
  const [priorReports, setPriorReports] = useState([]);

  useEffect(() => {
    // Load prior reports from demo-data
    const loadPriorReports = async () => {
      try {
        const reports = [
          { filename: 'report_2024_01_15.md', date: '2024-01-15', modality: 'CT Head' },
          { filename: 'report_2024_06_20.md', date: '2024-06-20', modality: 'CT Chest' },
          { filename: 'report_2023_11_10.md', date: '2023-11-10', modality: 'CT Abdomen/Pelvis' }
        ];

        const loadedReports = await Promise.all(
          reports.map(async (report, idx) => {
            try {
              const response = await fetch(`/demo-data/prior_reports/${report.filename}`);
              const content = await response.text();
              // Extract summary from first few lines
              const lines = content.split('\n').filter(l => l.trim());
              const summary = lines.slice(3, 6).join(' ').substring(0, 100) + '...';
              return {
                id: idx + 1,
                filename: report.filename,
                date: report.date,
                modality: report.modality,
                summary: summary,
                content: content
              };
            } catch (e) {
              console.error(`Failed to load ${report.filename}:`, e);
              return null;
            }
          })
        );

        setPriorReports(loadedReports.filter(r => r !== null));
      } catch (error) {
        console.error('Failed to load prior reports:', error);
        // Fallback to empty array
        setPriorReports([]);
      }
    };

    loadPriorReports();
  }, []);

  const handleReportClick = (report) => {
    onOpenModal({
      type: 'markdown',
      title: `${report.modality} - ${report.date}`,
      content: report.content || `# ${report.modality}\n\n**Date:** ${report.date}\n\n**Summary:**\n${report.summary}`
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      {priorReports.length === 0 ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-tertiary)'
        }}>
          No prior reports available
        </div>
      ) : (
        priorReports.map((report) => (
          <div
            key={report.id}
            onClick={() => handleReportClick(report)}
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
        ))
      )}
    </div>
  );
}

