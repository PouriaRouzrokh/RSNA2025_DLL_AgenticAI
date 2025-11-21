'use client';

import { useState, useEffect } from 'react';

export default function GuidelinesTab({ onOpenModal }) {
  const [guidelines, setGuidelines] = useState([]);

  useEffect(() => {
    // Load guidelines from demo-data
    const loadGuidelines = async () => {
      try {
        const guidelineFiles = [
          { filename: 'acr_guidelines.md', title: 'ACR Guidelines - CT Head Imaging' },
          { filename: 'institutional_protocols.md', title: 'Institutional Radiology Reporting Protocols' }
        ];

        const loadedGuidelines = await Promise.all(
          guidelineFiles.map(async (guideline, idx) => {
            try {
              const response = await fetch(`/demo-data/guidelines/${guideline.filename}`);
              const content = await response.text();
              // Extract description from first few lines
              const lines = content.split('\n').filter(l => l.trim());
              const description = lines[1] || guideline.title;
              return {
                id: idx + 1,
                filename: guideline.filename,
                title: guideline.title,
                description: description,
                content: content
              };
            } catch (e) {
              console.error(`Failed to load ${guideline.filename}:`, e);
              return null;
            }
          })
        );

        setGuidelines(loadedGuidelines.filter(g => g !== null));
      } catch (error) {
        console.error('Failed to load guidelines:', error);
        // Fallback to empty array
        setGuidelines([]);
      }
    };

    loadGuidelines();
  }, []);

  const handleGuidelineClick = (guideline) => {
    onOpenModal({
      type: 'markdown',
      title: guideline.title,
      content: guideline.content || `# ${guideline.title}\n\n${guideline.description}`
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    }}>
      {guidelines.length === 0 ? (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--text-tertiary)'
        }}>
          No guidelines available
        </div>
      ) : (
        guidelines.map((guideline) => (
          <div
            key={guideline.id}
            onClick={() => handleGuidelineClick(guideline)}
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
              fontSize: '0.875rem',
              fontWeight: '500',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>
              {guideline.title}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.5'
            }}>
              {guideline.description}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

