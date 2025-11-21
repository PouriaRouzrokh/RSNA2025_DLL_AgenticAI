'use client';

import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function FocusModal({ isOpen, onClose, content }) {
  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !content) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-tertiary)'
        }}>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: '500',
            color: 'var(--text-primary)',
            margin: 0
          }}>
            {content.title || 'Document'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '0.25rem 0.75rem',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
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
            Close (ESC)
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem'
        }}>
          {content.type === 'markdown' && (
            <div style={{
              color: 'var(--text-primary)',
              lineHeight: '1.8'
            }}>
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }} {...props} />,
                  h2: ({node, ...props}) => <h2 style={{ fontSize: '1.25rem', marginTop: '1.5rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }} {...props} />,
                  p: ({node, ...props}) => <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }} {...props} />,
                  strong: ({node, ...props}) => <strong style={{ color: 'var(--text-primary)', fontWeight: '500' }} {...props} />,
                  ul: ({node, ...props}) => <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem', color: 'var(--text-secondary)' }} {...props} />,
                  li: ({node, ...props}) => <li style={{ marginBottom: '0.5rem' }} {...props} />
                }}
              >
                {content.content}
              </ReactMarkdown>
            </div>
          )}
          {content.type === 'pdf' && (
            <div style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--text-tertiary)'
            }}>
              PDF viewer will be implemented here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

