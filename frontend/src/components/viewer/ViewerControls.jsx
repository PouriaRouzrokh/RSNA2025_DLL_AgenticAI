'use client';

export default function ViewerControls({ 
  currentSlice, 
  totalSlices, 
  onSliceChange,
  windowLevel,
  onWindowLevelChange,
  onMaximize,
  isMaximized = false
}) {
  const windowLevelPresets = [
    { id: 'brain', label: 'Brain' },
    { id: 'soft_tissue', label: 'Soft Tissue' },
    { id: 'bone', label: 'Bone' },
    { id: 'lung', label: 'Lung' }
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0.5rem',
      borderTop: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-tertiary)',
      flexWrap: 'wrap',
      minHeight: '48px',
      flexShrink: 0
    }}>
      {/* Window/Level Presets */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <label style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap'
        }}>
          W/L:
        </label>
        <select
          value={windowLevel}
          onChange={(e) => onWindowLevelChange(e.target.value)}
          style={{
            padding: '0.25rem 0.5rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.75rem',
            cursor: 'pointer'
          }}
        >
          {windowLevelPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {/* Slice Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => onSliceChange(Math.max(1, currentSlice - 1))}
          disabled={currentSlice === 1}
          style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.75rem',
            cursor: currentSlice === 1 ? 'not-allowed' : 'pointer',
            opacity: currentSlice === 1 ? 0.5 : 1,
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            if (currentSlice !== 1) {
              e.target.style.borderColor = 'var(--accent-blue)';
              e.target.style.backgroundColor = 'var(--hover-bg)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'var(--border-subtle)';
            e.target.style.backgroundColor = 'var(--bg-secondary)';
          }}
        >
          ← Prev
        </button>
        <span style={{ 
          fontSize: '0.75rem', 
          color: 'var(--text-secondary)',
          minWidth: '60px',
          textAlign: 'center',
          fontFamily: 'monospace'
        }}>
          {currentSlice} / {totalSlices}
        </span>
        <button
          onClick={() => onSliceChange(Math.min(totalSlices, currentSlice + 1))}
          disabled={currentSlice === totalSlices}
          style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.75rem',
            cursor: currentSlice === totalSlices ? 'not-allowed' : 'pointer',
            opacity: currentSlice === totalSlices ? 0.5 : 1,
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            if (currentSlice !== totalSlices) {
              e.target.style.borderColor = 'var(--accent-blue)';
              e.target.style.backgroundColor = 'var(--hover-bg)';
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'var(--border-subtle)';
            e.target.style.backgroundColor = 'var(--bg-secondary)';
          }}
        >
          Next →
        </button>
      </div>

      {/* Zoom Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
        <button
          style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.75rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = 'var(--accent-blue)';
            e.target.style.backgroundColor = 'var(--hover-bg)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = 'var(--border-subtle)';
            e.target.style.backgroundColor = 'var(--bg-secondary)';
          }}
        >
          Reset
        </button>
        <button
          onClick={onMaximize}
          style={{
            padding: '0.25rem 0.75rem',
            backgroundColor: 'var(--accent-blue)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '0.75rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = 'var(--accent-blue-hover)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'var(--accent-blue)';
          }}
        >
          {isMaximized ? 'Minimize' : 'Maximize'}
        </button>
      </div>
    </div>
  );
}
