'use client';

import { useState } from 'react';

export default function StyleSettingsTab() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [customInstructions, setCustomInstructions] = useState('');

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

  const dummyTemplates = [
    {
      id: 1,
      name: 'Standard Report Template',
      description: 'Standard radiology reporting format with structured findings and impression.'
    },
    {
      id: 2,
      name: 'Detailed Report Template',
      description: 'Comprehensive reporting template with extensive findings description.'
    },
    {
      id: 3,
      name: 'Brief Report Template',
      description: 'Concise reporting template for routine studies.'
    }
  ];

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

      {/* Report Templates */}
      <div>
        <h3 style={{
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--text-primary)',
          marginBottom: '0.75rem'
        }}>
          Report Templates
        </h3>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {dummyTemplates.map((template) => (
            <div
              key={template.id}
              style={{
                padding: '1rem',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
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
                marginBottom: '0.25rem'
              }}>
                {template.name}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.5'
              }}>
                {template.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
