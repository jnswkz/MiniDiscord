import { create } from "zustand";

interface UIState {
  showSettings: boolean;
  showMemberList: boolean;
  showDmUserPanel: boolean;
  sidebarWidth: number;
  openSettings: () => void;
  closeSettings: () => void;
  toggleMemberList: () => void;
  toggleDmUserPanel: () => void;
  setSidebarWidth: (width: number) => void;
}

const SIDEBAR_MIN = 200;
const SIDEBAR_MAX = 480;

export const useUIStore = create<UIState>((set) => ({
  showSettings: false,
  showMemberList: true,
  showDmUserPanel: true,
  sidebarWidth: 300,
  openSettings: () => set({ showSettings: true }),
  closeSettings: () => set({ showSettings: false }),
  toggleMemberList: () => set((s) => ({ showMemberList: !s.showMemberList })),
  toggleDmUserPanel: () => set((s) => ({ showDmUserPanel: !s.showDmUserPanel })),
  setSidebarWidth: (width) =>
    set({ sidebarWidth: Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, width)) }),
}));

export { SIDEBAR_MIN, SIDEBAR_MAX };
