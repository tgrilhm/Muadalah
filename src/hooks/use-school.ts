"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface School {
  id: string;
  name: string;
  level: "SMP" | "SMA";
  institutionId: string;
}

interface SchoolStore {
  selectedSchool: School | null;
  availableSchools: School[];
  setSelectedSchool: (school: School) => void;
  setAvailableSchools: (schools: School[]) => void;
}

export const useSchoolStore = create<SchoolStore>()(
  persist(
    (set) => ({
      selectedSchool: null,
      availableSchools: [],
      setSelectedSchool: (school) => set({ selectedSchool: school }),
      setAvailableSchools: (schools) => set({ availableSchools: schools }),
    }),
    {
      name: "school-storage",
    }
  )
);

export function useSchool() {
  const { selectedSchool, availableSchools, setSelectedSchool, setAvailableSchools } = useSchoolStore();

  const switchSchool = (schoolId: string) => {
    const school = availableSchools.find((s) => s.id === schoolId);
    if (school) {
      setSelectedSchool(school);
    }
  };

  return {
    selectedSchool,
    availableSchools,
    setSelectedSchool,
    setAvailableSchools,
    switchSchool,
  };
}
