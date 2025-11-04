import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Project, TimeEntry, ActiveTimer, ProposalItem } from "../types/inventory";

interface TimeTrackerState {
  projects: Project[];
  timeEntries: TimeEntry[];
  activeTimer: ActiveTimer | null;

  addProject: (project: Omit<Project, "id" | "createdAt" | "totalTime">) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addProjectWithProposal: (
    project: Omit<Project, "id" | "createdAt" | "totalTime">,
    proposalItems: ProposalItem[]
  ) => void;

  startTimer: (projectId: string) => void;
  stopTimer: () => void;

  getProjectEntries: (projectId: string) => TimeEntry[];
  getProjectTotalTime: (projectId: string) => number;
}

export const useTimeTrackerStore = create<TimeTrackerState>()(
  persist(
    (set, get) => ({
      projects: [],
      timeEntries: [],
      activeTimer: null,

      addProject: (project) => {
        const newProject: Project = {
          ...project,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          createdAt: Date.now(),
          totalTime: 0,
        };
        set((state) => ({ projects: [...state.projects, newProject] }));
      },

      addProjectWithProposal: (project, proposalItems) => {
        const newProject: Project = {
          ...project,
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          createdAt: Date.now(),
          totalTime: 0,
          proposalItems,
          proposalDate: Date.now(),
          proposalStatus: "pending",
        };
        set((state) => ({ projects: [...state.projects, newProject] }));
      },

      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id ? { ...project, ...updates } : project
          ),
        }));
      },

      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          timeEntries: state.timeEntries.filter((entry) => entry.projectId !== id),
          activeTimer: state.activeTimer?.projectId === id ? null : state.activeTimer,
        }));
      },

      startTimer: (projectId) => {
        const { activeTimer } = get();
        if (activeTimer) {
          get().stopTimer();
        }
        set({ activeTimer: { projectId, startTime: Date.now() } });
      },

      stopTimer: () => {
        const { activeTimer, timeEntries, projects } = get();
        if (!activeTimer) return;

        const duration = Math.floor((Date.now() - activeTimer.startTime) / 1000);
        const newEntry: TimeEntry = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          projectId: activeTimer.projectId,
          startTime: activeTimer.startTime,
          endTime: Date.now(),
          duration,
        };

        set((state) => ({
          timeEntries: [...state.timeEntries, newEntry],
          activeTimer: null,
          projects: state.projects.map((project) =>
            project.id === activeTimer.projectId
              ? { ...project, totalTime: project.totalTime + duration }
              : project
          ),
        }));
      },

      getProjectEntries: (projectId) => {
        return get().timeEntries.filter((entry) => entry.projectId === projectId);
      },

      getProjectTotalTime: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        return project?.totalTime || 0;
      },
    }),
    {
      name: "time-tracker-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
