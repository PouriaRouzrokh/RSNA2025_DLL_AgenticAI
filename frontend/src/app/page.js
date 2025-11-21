'use client';

import { useEffect } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import ZoneA_Workspace from '@/components/layout/ZoneA_Workspace';
import ZoneB_CommandBar from '@/components/layout/ZoneB_CommandBar';
import ZoneC_ReferenceTray from '@/components/layout/ZoneC_ReferenceTray';

export default function Home() {
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC: Close any open modal (will be implemented in Phase 7)
      if (e.key === 'Escape') {
        // TODO: Close modals
      }
      
      // Ctrl/Cmd + S: Save report (will be implemented in Phase 4)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // TODO: Save report
      }
      
      // Ctrl/Cmd + K: Focus on instruction input (will be implemented in Phase 5)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // TODO: Focus instruction input
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="main-container">
      <AppHeader />
      <ZoneA_Workspace />
      <ZoneB_CommandBar />
      <ZoneC_ReferenceTray />
    </div>
  );
}
