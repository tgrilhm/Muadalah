"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AcademicYear {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  schoolId: string;
}

interface AcademicYearStore {
  activeAcademicYear: AcademicYear | null;
  setActiveAcademicYear: (year: AcademicYear) => void;
}

export const useAcademicYearStore = create<AcademicYearStore>()(
  persist(
    (set) => ({
      activeAcademicYear: null,
      setActiveAcademicYear: (year) => set({ activeAcademicYear: year }),
    }),
    {
      name: "academic-year-storage",
    }
  )
);

export function useAcademicYear() {
  const { activeAcademicYear, setActiveAcademicYear } = useAcademicYearStore();

  return {
    activeAcademicYear,
    setActiveAcademicYear,
  };
}
