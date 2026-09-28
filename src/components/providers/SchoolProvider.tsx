"use client";

import { useEffect } from 'react';
import { useSchool } from '@/hooks/use-school';

/**
 * SchoolProvider - Fetches available schools and populates the store
 * Should be included in dashboard layout
 */
export function SchoolProvider({ children }: { children: React.ReactNode }) {
  const { setAvailableSchools, setSelectedSchool, selectedSchool, availableSchools } = useSchool();

  useEffect(() => {
    // Only fetch if schools not already loaded
    if (availableSchools.length === 0) {
      fetch('/api/schools')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.length > 0) {
            setAvailableSchools(data.data);
            
            // Set first school as default if none selected
            if (!selectedSchool) {
              setSelectedSchool(data.data[0]);
            }
          }
        })
        .catch((error) => {
          console.error('Failed to fetch schools:', error);
        });
    }
  }, []); // Empty deps - only run once on mount

  return <>{children}</>;
}
