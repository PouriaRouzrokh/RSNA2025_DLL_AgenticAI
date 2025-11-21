'use client';

export default function AppHeader() {
  return (
    <div style={{
      height: '48px',
      minHeight: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0 2rem'
    }}>
      <div style={{
        fontSize: '0.875rem',
        fontWeight: '500',
        color: 'var(--text-secondary)',
        letterSpacing: '0.05em'
      }}>
        RSNA 2025 DLL • An Introduction to Agentic AI in Radiology
      </div>
    </div>
  );
}

