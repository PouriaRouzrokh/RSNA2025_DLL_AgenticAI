'use client';

import { useState, useEffect } from 'react';

export default function EHRTab({ onOpenModal }) {
  const [ehrData, setEhrData] = useState(null);

  useEffect(() => {
    // Load EHR data from demo-data
    const loadEHRData = async () => {
      try {
        const response = await fetch('/demo-data/ehr_data/patient_context.json');
        const data = await response.json();
        setEhrData(data);
      } catch (error) {
        console.error('Failed to load EHR data:', error);
        // Fallback to placeholder data
        setEhrData({
          demographics: {
            age: 65,
            sex: 'Male',
            mrn: 'MRN-12345'
          },
          labResults: [
            { test: 'WBC', value: '7.2', unit: 'K/μL', date: '2024-01-10' },
            { test: 'Hemoglobin', value: '14.5', unit: 'g/dL', date: '2024-01-10' },
            { test: 'Creatinine', value: '1.1', unit: 'mg/dL', date: '2024-01-10' }
          ],
          medications: [
            'Aspirin 81mg daily',
            'Metformin 500mg twice daily',
            'Lisinopril 10mg daily'
          ],
          clinicalNotes: [
            {
              date: '2024-01-08',
              provider: 'Dr. Smith',
              note: 'Patient reports stable condition. Continue current medications.'
            }
          ]
        });
      }
    };

    loadEHRData();
  }, []);

  // Generate lab trends data with multiple dates
  const generateLabTrends = () => {
    const dates = [
      '2023-06-15',
      '2023-09-20',
      '2023-12-10',
      '2024-01-10',
      '2024-03-05',
      '2024-05-18',
      '2024-08-22'
    ];

    const tests = [
      { name: 'WBC', unit: 'K/μL', normalRange: '4.0-11.0' },
      { name: 'Hemoglobin', unit: 'g/dL', normalRange: '13.5-17.5' },
      { name: 'Creatinine', unit: 'mg/dL', normalRange: '0.7-1.3' },
      { name: 'Glucose', unit: 'mg/dL', normalRange: '70-100' },
      { name: 'Platelets', unit: 'K/μL', normalRange: '150-450' }
    ];

    // Generate trend values (some missing at certain dates)
    const trends = tests.map(test => {
      const values = dates.map((date, idx) => {
        // Some values missing randomly
        if (Math.random() < 0.15) return null;
        
        // Generate realistic trend values
        let baseValue;
        switch (test.name) {
          case 'WBC':
            baseValue = 7.0 + (Math.sin(idx * 0.5) * 1.5);
            break;
          case 'Hemoglobin':
            baseValue = 14.5 + (Math.sin(idx * 0.3) * 0.8);
            break;
          case 'Creatinine':
            baseValue = 1.1 + (Math.sin(idx * 0.4) * 0.2);
            break;
          case 'Glucose':
            baseValue = 95 + (Math.sin(idx * 0.6) * 10);
            break;
          case 'Platelets':
            baseValue = 250 + (Math.sin(idx * 0.4) * 50);
            break;
          default:
            baseValue = 10;
        }
        
        return {
          date,
          value: baseValue.toFixed(1)
        };
      });
      
      return {
        ...test,
        values
      };
    });

    return { dates, trends };
  };

  if (!ehrData) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading EHR data...
      </div>
    );
  }

  const labTrends = generateLabTrends();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Demographics */}
      <div>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '0.75rem'
        }}>
          Demographics
        </h3>
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
          color: 'var(--text-secondary)'
        }}>
          <div>Age: {ehrData.demographics.age} years</div>
          <div>Sex: {ehrData.demographics.sex}</div>
          <div>MRN: {ehrData.demographics.mrn}</div>
        </div>
      </div>

      {/* Lab Results - Trends Table */}
      <div>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '0.75rem'
        }}>
          Lab Results
        </h3>
        <div style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <th style={{ 
                  padding: '0.5rem', 
                  textAlign: 'left', 
                  color: 'var(--text-primary)', 
                  fontWeight: '500',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: 'var(--bg-tertiary)',
                  zIndex: 1
                }}>
                  Test
                </th>
                {labTrends.dates.map((date) => (
                  <th key={date} style={{ 
                    padding: '0.5rem', 
                    textAlign: 'center', 
                    color: 'var(--text-primary)', 
                    fontWeight: '500',
                    minWidth: '80px'
                  }}>
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {labTrends.trends.map((test, idx) => (
                <tr key={idx} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td style={{ 
                    padding: '0.5rem', 
                    color: 'var(--text-secondary)',
                    position: 'sticky',
                    left: 0,
                    backgroundColor: 'var(--bg-secondary)',
                    zIndex: 1
                  }}>
                    <div style={{ fontWeight: '500' }}>{test.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                      {test.unit} ({test.normalRange})
                    </div>
                  </td>
                  {test.values.map((val, valIdx) => (
                    <td key={valIdx} style={{ 
                      padding: '0.5rem', 
                      textAlign: 'center',
                      color: val ? 'var(--text-primary)' : 'var(--text-tertiary)'
                    }}>
                      {val ? `${val.value} ${test.unit}` : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Medications */}
      <div>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '0.75rem'
        }}>
          Medications
        </h3>
        <div style={{
          padding: '0.75rem',
          backgroundColor: 'var(--bg-tertiary)',
          borderRadius: 'var(--radius-md)'
        }}>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {ehrData.medications.map((med, idx) => (
              <li key={idx} style={{ marginBottom: '0.5rem' }}>
                {typeof med === 'string' ? med : `${med.name} ${med.dose} ${med.frequency} - ${med.indication}`}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Clinical Notes */}
      <div>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '0.75rem'
        }}>
          Clinical Notes
        </h3>
        {ehrData.clinicalNotes.map((note, idx) => {
          // Truncate note for preview (show first 150 characters)
          const previewLength = 150;
          const noteText = note.note || '';
          const isLongNote = noteText.length > previewLength;
          const previewText = isLongNote ? noteText.substring(0, previewLength) + '...' : noteText;
          
          const handleNoteClick = () => {
            if (onOpenModal) {
              // Format the note content for the modal
              const formattedContent = `# Clinical Note\n\n**Date:** ${note.date}\n**Provider:** ${note.provider}${note.specialty ? ` (${note.specialty})` : ''}\n\n---\n\n${note.note}`;
              
              onOpenModal({
                type: 'markdown',
                title: `Clinical Note - ${note.date}`,
                content: formattedContent
              });
            }
          };

          return (
            <div
              key={idx}
              onClick={handleNoteClick}
              style={{
                padding: '0.75rem',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '0.5rem',
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
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                marginBottom: '0.5rem'
              }}>
                {note.date} - {note.provider}{note.specialty ? ` (${note.specialty})` : ''}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: 'var(--text-primary)',
                lineHeight: '1.5'
              }}>
                {previewText}
              </div>
              {isLongNote && (
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-blue)',
                  marginTop: '0.5rem',
                  fontStyle: 'italic'
                }}>
                  Click to view full note...
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
