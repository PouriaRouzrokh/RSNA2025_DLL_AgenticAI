'use client';

import { useState, useEffect, useRef } from 'react';
import CTViewer from '@/components/viewer/CTViewer';
import ViewerControls from '@/components/viewer/ViewerControls';
import ReportEditor from '@/components/report/ReportEditor';
import FullScreenViewer from '@/components/modals/FullScreenViewer';
import { loadNiftiFile } from '@/utils/niftiLoader';

export default function ZoneA_Workspace() {
  const [currentSlice, setCurrentSlice] = useState(1);
  const [windowLevel, setWindowLevel] = useState('soft_tissue');
  const [currentView, setCurrentView] = useState('axial'); // 'axial', 'sagittal', 'coronal'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [totalSlices, setTotalSlices] = useState(20); // Will be updated when NIfTI loads
  const [niftiData, setNiftiData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Track last slice for each view
  const [viewSlices, setViewSlices] = useState({
    axial: null,
    sagittal: null,
    coronal: null
  });

  // Load NIfTI file once and share between regular and fullscreen views
  useEffect(() => {
    let cancelled = false;
    
    const loadFile = async () => {
      try {
        setLoading(true);
        const data = await loadNiftiFile('/demo-data/medical_imaging/ct_scan.nii.gz');
        
        if (cancelled) return;
        
        setNiftiData(data);
        setLoading(false);
        
        const { dimensions } = data;
        let maxSlices = 20;
        
        if (currentView === 'axial') {
          maxSlices = dimensions.z;
        } else if (currentView === 'sagittal') {
          maxSlices = dimensions.x;
        } else if (currentView === 'coronal') {
          maxSlices = dimensions.y;
        }

        setTotalSlices(maxSlices);
        
        // Initialize slices for all views to mid-slice on first load
        const initialSlices = {
          axial: Math.ceil(dimensions.z / 2),
          sagittal: Math.ceil(dimensions.x / 2),
          coronal: Math.ceil(dimensions.y / 2)
        };
        setViewSlices(initialSlices);
        
        // Set current slice to mid-slice for initial view
        setCurrentSlice(initialSlices[currentView]);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load NIfTI file:', err);
        setLoading(false);
      }
    };

    loadFile();
    
    return () => {
      cancelled = true;
    };
  }, []); // Only load once on mount

  // Track current slice per view when it changes (but not when view changes)
  const prevViewRef = useRef(currentView);
  useEffect(() => {
    if (niftiData && currentSlice && prevViewRef.current === currentView) {
      setViewSlices(prev => ({
        ...prev,
        [currentView]: currentSlice
      }));
    }
    prevViewRef.current = currentView;
  }, [currentSlice, currentView, niftiData]);

  // Update total slices and restore last slice when view changes
  const prevViewForSliceRestore = useRef(currentView);
  useEffect(() => {
    if (niftiData) {
      const { dimensions } = niftiData;
      let maxSlices = 20;
      
      if (currentView === 'axial') {
        maxSlices = dimensions.z;
      } else if (currentView === 'sagittal') {
        maxSlices = dimensions.x;
      } else if (currentView === 'coronal') {
        maxSlices = dimensions.y;
      }
      
      setTotalSlices(maxSlices);
      
      // Only restore slice if view actually changed (not on initial load)
      if (prevViewForSliceRestore.current !== currentView) {
        const lastSlice = viewSlices[currentView];
        if (lastSlice) {
          // Clamp to valid range
          const clampedSlice = Math.max(1, Math.min(maxSlices, lastSlice));
          setCurrentSlice(clampedSlice);
        } else {
          // First time viewing this view - use mid-slice
          const midSlice = Math.ceil(maxSlices / 2);
          setCurrentSlice(midSlice);
          setViewSlices(prev => ({
            ...prev,
            [currentView]: midSlice
          }));
        }
        prevViewForSliceRestore.current = currentView;
      }
    }
  }, [currentView, niftiData, viewSlices]);

  const handleMaximize = () => {
    setIsFullScreen(true);
  };

  const handleCloseFullScreen = () => {
    setIsFullScreen(false);
  };

  return (
    <>
      <div className="zone-a">
        {/* Left Panel: CT Viewer */}
        <div 
          className="workspace-panel-left"
          style={{
            width: '50%',
            height: '100%',
            borderRight: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0 // Allow flex shrinking
          }}
        >
          <div style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <CTViewer 
              currentSlice={currentSlice}
              totalSlices={totalSlices}
              onSliceChange={setCurrentSlice}
              onTotalSlicesChange={setTotalSlices}
              currentView={currentView}
              onViewChange={setCurrentView}
              windowLevel={windowLevel}
              onMaximize={handleMaximize}
              niftiData={niftiData}
              loading={loading}
            />
          </div>
          <ViewerControls
            currentSlice={currentSlice}
            totalSlices={totalSlices}
            onSliceChange={setCurrentSlice}
            windowLevel={windowLevel}
            onWindowLevelChange={setWindowLevel}
            onMaximize={handleMaximize}
          />
        </div>

        {/* Right Panel: Report Editor */}
        <div 
          className="workspace-panel-right"
          style={{
            width: '50%',
            height: '100%',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <ReportEditor />
        </div>
      </div>

      {/* Full Screen Viewer Modal */}
      {isFullScreen && (
        <FullScreenViewer
          isOpen={isFullScreen}
          onClose={handleCloseFullScreen}
          currentSlice={currentSlice}
          onSliceChange={setCurrentSlice}
          windowLevel={windowLevel}
          onWindowLevelChange={setWindowLevel}
          currentView={currentView}
          onViewChange={setCurrentView}
          totalSlices={totalSlices}
          niftiData={niftiData}
          loading={loading}
        />
      )}
    </>
  );
}

