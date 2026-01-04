import { create } from "zustand"
import { persist } from "zustand/middleware"
import { Timeframe, RunStatusFilter, RunType } from "@/server/services/dashboard/types"

// Filter types for each page
export interface DashboardFilters {
  selectedEnvironment: string | null
  timeframe: Timeframe
  _envInitialized: boolean
}

export interface DagsFilters {
  search: string
  timeframe: Timeframe
  statusFilter: RunStatusFilter
  selectedEnvironment: string | null
  _envInitialized: boolean
}

export interface RunsFilters {
  search: string
  timeframe: Timeframe
  statusFilter: RunStatusFilter
  runTypeFilter: RunType | "all"
  selectedEnvironment: string | null
  _envInitialized: boolean
  // Custom date range (overrides timeframe when set)
  startTime: string | null
  endTime: string | null
}

export interface DagDetailFilters {
  // Selected run history metric per dagId
  selectedRunHistoryMetric: Record<string, string>
}

// Store state and actions
interface FiltersState {
  dashboard: DashboardFilters
  dags: DagsFilters
  runs: RunsFilters
  dagDetail: DagDetailFilters
  _hasHydrated: boolean
  
  // Actions
  setDashboardFilter: <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => void
  setDagsFilter: <K extends keyof DagsFilters>(key: K, value: DagsFilters[K]) => void
  setRunsFilter: <K extends keyof RunsFilters>(key: K, value: RunsFilters[K]) => void
  setDagDetailRunHistoryMetric: (dagId: string, metric: string) => void
  setHasHydrated: (state: boolean) => void
}

// Default values
const defaultDashboard: DashboardFilters = {
  selectedEnvironment: null,
  timeframe: Timeframe.Day,
  _envInitialized: false,
}

const defaultDags: DagsFilters = {
  search: "",
  timeframe: Timeframe.Day,
  statusFilter: RunStatusFilter.All,
  selectedEnvironment: null,
  _envInitialized: false,
}

const defaultRuns: RunsFilters = {
  search: "",
  timeframe: Timeframe.Day,
  statusFilter: RunStatusFilter.All,
  runTypeFilter: "all",
  selectedEnvironment: null,
  _envInitialized: false,
  startTime: null,
  endTime: null,
}

const defaultDagDetail: DagDetailFilters = {
  selectedRunHistoryMetric: {},
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      dashboard: defaultDashboard,
      dags: defaultDags,
      runs: defaultRuns,
      dagDetail: defaultDagDetail,
      _hasHydrated: false,

      setDashboardFilter: (key, value) =>
        set((state) => ({
          dashboard: { ...state.dashboard, [key]: value },
        })),

      setDagsFilter: (key, value) =>
        set((state) => ({
          dags: { ...state.dags, [key]: value },
        })),

      setRunsFilter: (key, value) =>
        set((state) => ({
          runs: { ...state.runs, [key]: value },
        })),

      setDagDetailRunHistoryMetric: (dagId, metric) =>
        set((state) => ({
          dagDetail: {
            ...state.dagDetail,
            selectedRunHistoryMetric: {
              ...state.dagDetail.selectedRunHistoryMetric,
              [dagId]: metric,
            },
          },
        })),

      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
    }),
    {
      name: "granyt-filters",
      partialize: (state) => ({
        dashboard: state.dashboard,
        dags: state.dags,
        runs: state.runs,
        dagDetail: state.dagDetail,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// Convenience hooks for each page
export function useDashboardFilters() {
  const filters = useFiltersStore((state) => state.dashboard)
  const setFilter = useFiltersStore((state) => state.setDashboardFilter)
  const isHydrated = useFiltersStore((state) => state._hasHydrated)
  return { filters, setFilter, isHydrated }
}

export function useDagsFilters() {
  const filters = useFiltersStore((state) => state.dags)
  const setFilter = useFiltersStore((state) => state.setDagsFilter)
  const isHydrated = useFiltersStore((state) => state._hasHydrated)
  return { filters, setFilter, isHydrated }
}

export function useRunsFilters() {
  const filters = useFiltersStore((state) => state.runs)
  const setFilter = useFiltersStore((state) => state.setRunsFilter)
  const isHydrated = useFiltersStore((state) => state._hasHydrated)
  return { filters, setFilter, isHydrated }
}

export function useDagDetailFilters(dagId: string) {
  const selectedRunHistoryMetric = useFiltersStore(
    (state) => state.dagDetail.selectedRunHistoryMetric[dagId] ?? "duration"
  )
  const setRunHistoryMetric = useFiltersStore((state) => state.setDagDetailRunHistoryMetric)
  const isHydrated = useFiltersStore((state) => state._hasHydrated)
  
  return {
    selectedRunHistoryMetric,
    setRunHistoryMetric: (metric: string) => setRunHistoryMetric(dagId, metric),
    isHydrated,
  }
}
