"use client";

import { create } from "zustand";

interface AppState {
  /** ID sekolah yang sedang aktif/dipilih */
  activeSchoolId: string | null;
  /** ID semester yang sedang aktif */
  activeSemesterId: string | null;
  /** Sidebar collapsed state */
  sidebarOpen: boolean;

  /** Actions */
  setActiveSchool: (schoolId: string) => void;
  setActiveSemester: (semesterId: string) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSchoolId: null,
  activeSemesterId: null,
  sidebarOpen: true,

  setActiveSchool: (schoolId) => set({ activeSchoolId: schoolId }),
  setActiveSemester: (semesterId) => set({ activeSemesterId: semesterId }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
