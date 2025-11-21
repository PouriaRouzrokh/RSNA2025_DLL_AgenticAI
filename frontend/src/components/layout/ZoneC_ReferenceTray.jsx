'use client';

import { useState, useEffect, useRef } from 'react';
import PriorImagingTab from '@/components/tray/PriorImagingTab';
import EHRTab from '@/components/tray/EHRTab';
import GuidelinesTab from '@/components/tray/GuidelinesTab';
import StyleSettingsTab from '@/components/tray/StyleSettingsTab';
import FocusModal from '@/components/modals/FocusModal';

export default function ZoneC_ReferenceTray() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('prior_imaging');
  const [modalContent, setModalContent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [height, setHeight] = useState(30); // Percentage of viewport height
  const resizerRef = useRef(null);
  const isResizingRef = useRef(false);

  // Load collapse state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('zoneC_collapsed');
    if (savedState !== null) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  // Save collapse state to localStorage
  useEffect(() => {
    localStorage.setItem('zoneC_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Load saved height from localStorage
  useEffect(() => {
    const savedHeight = localStorage.getItem('zoneC_height');
    if (savedHeight !== null) {
      setHeight(parseFloat(savedHeight));
    }
  }, []);

  // Save height to localStorage
  useEffect(() => {
    localStorage.setItem('zoneC_height', height.toString());
  }, [height]);

  // Handle resizing - set up event listeners properly
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      
      const containerHeight = window.innerHeight;
      const headerHeight = 48; // App header height
      const commandBarHeight = 64; // Zone B height
      const availableHeight = containerHeight - headerHeight - commandBarHeight;
      
      const mouseY = e.clientY;
      const zoneAHeight = mouseY - headerHeight;
      const newZoneCHeight = availableHeight - zoneAHeight;
      const newHeightPercent = (newZoneCHeight / availableHeight) * 100;
      
      // Constrain between 15% and 60%
      const constrainedHeight = Math.max(15, Math.min(60, newHeightPercent));
      setHeight(constrainedHeight);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    // Always have listeners ready, they check isResizingRef internally
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const handleResizerMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizingRef.current = true;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  };

  const tabs = [
    { id: 'prior_imaging', label: 'Prior Reports' },
    { id: 'ehr_data', label: 'EHR Data' },
    { id: 'guidelines', label: 'Guidelines' },
    { id: 'style_settings', label: 'Style Settings' }
  ];

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleOpenModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  return (
    <>
      {/* Resizer Handle */}
      {!isCollapsed && (
        <div
          ref={resizerRef}
          className="zone-resizer"
          onMouseDown={handleResizerMouseDown}
          style={{
            height: '4px',
            backgroundColor: 'var(--border-subtle)',
            cursor: 'ns-resize',
            position: 'relative',
            transition: 'background-color var(--transition-fast)',
            flexShrink: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-blue)';
          }}
          onMouseLeave={(e) => {
            if (!isResizingRef.current) {
              e.currentTarget.style.backgroundColor = 'var(--border-subtle)';
            }
          }}
        >
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '40px',
            height: '2px',
            backgroundColor: 'var(--border-medium)',
            borderRadius: '2px'
          }} />
        </div>
      )}
      
      <div 
        className={`zone-c ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          height: isCollapsed ? 0 : `${height}vh`,
          minHeight: isCollapsed ? 0 : '200px',
          maxHeight: isCollapsed ? 0 : '60vh'
        }}
      >
        {/* Header with Tabs and Collapse Button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-tertiary)',
          minHeight: '48px'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            flex: 1,
            height: '100%'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  fontWeight: activeTab === tab.id ? '500' : '400',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = 'var(--hover-bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Collapse Button */}
          <button
            onClick={toggleCollapse}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'transform var(--transition-normal)',
              transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
            aria-label={isCollapsed ? 'Expand Reference Tray' : 'Collapse Reference Tray'}
          >
            ▼
          </button>
        </div>

        {/* Tab Content */}
        {!isCollapsed && (
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '1rem',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            {activeTab === 'prior_imaging' && (
              <PriorImagingTab onOpenModal={handleOpenModal} />
            )}
            {activeTab === 'ehr_data' && (
              <EHRTab />
            )}
            {activeTab === 'guidelines' && (
              <GuidelinesTab onOpenModal={handleOpenModal} />
            )}
            {activeTab === 'style_settings' && (
              <StyleSettingsTab />
            )}
          </div>
        )}
      </div>

      {/* Focus Modal */}
      <FocusModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        content={modalContent}
      />
    </>
  );
}

