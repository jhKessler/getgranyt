import { Timeframe } from "@/server/services/dashboard/types"
import { subDays, subHours, subMinutes } from "date-fns"

// ============================================================================
// MOCK OVERVIEW METRICS
// ============================================================================

export const mockMetrics: Record<Timeframe, {
  totalRuns: number
  activeDags: number
  failedRuns: number
  rowsProcessed: number
}> = {
  [Timeframe.Day]: {
    totalRuns: 248,
    activeDags: 12,
    failedRuns: 5,
    rowsProcessed: 2345678,
  },
  [Timeframe.Week]: {
    totalRuns: 1847,
    activeDags: 24,
    failedRuns: 18,
    rowsProcessed: 15456789,
  },
  [Timeframe.Month]: {
    totalRuns: 7532,
    activeDags: 28,
    failedRuns: 67,
    rowsProcessed: 58234567,
  },
  [Timeframe.AllTime]: {
    totalRuns: 45678,
    activeDags: 32,
    failedRuns: 412,
    rowsProcessed: 289456789,
  },
}

// ============================================================================
// MOCK DAGS
// ============================================================================

export const mockDags = [
  {
    id: "dag-1",
    dagId: "etl_daily_sales",
    lastStatus: "failed",
    successRate: 94.2,
    totalRuns: 847,
    avgDuration: 342000, // 5.7 minutes in ms
    avgRows: 125000,
    schedule: "0 6 * * *",
    lastRunTime: subHours(new Date(), 1).toISOString(),
    lastRunId: "run-12",
    alertInfo: {
      count: 1,
      hasCritical: true,
      alertId: "alert-6"
    }
  },
  {
    id: "dag-2",
    dagId: "sync_customer_data",
    lastStatus: "failed",
    successRate: 98.5,
    totalRuns: 412,
    avgDuration: 180000, // 3 minutes
    avgRows: 45000,
    schedule: "0 */4 * * *",
    lastRunTime: subMinutes(new Date(), 30).toISOString(),
    lastRunId: "run-13",
    alertInfo: {
      count: 1,
      hasCritical: false,
      alertId: "alert-1"
    }
  },
  {
    id: "dag-3",
    dagId: "report_generator",
    lastStatus: "failed",
    successRate: 78.3,
    totalRuns: 156,
    avgDuration: 720000, // 12 minutes
    avgRows: 890000,
    schedule: "0 8 * * 1-5",
    lastRunTime: subHours(new Date(), 4).toISOString(),
    lastRunId: "run-3",
  },
  {
    id: "dag-4",
    dagId: "data_quality_checks",
    lastStatus: "success",
    successRate: 99.1,
    totalRuns: 1200,
    avgDuration: 45000, // 45 seconds
    avgRows: 0,
    schedule: "*/15 * * * *",
    lastRunTime: subMinutes(new Date(), 12).toISOString(),
    lastRunId: "run-4",
  },
  {
    id: "dag-5",
    dagId: "ml_feature_pipeline",
    lastStatus: "running",
    successRate: 92.8,
    totalRuns: 89,
    avgDuration: 1800000, // 30 minutes
    avgRows: 2500000,
    schedule: "0 2 * * *",
    lastRunTime: subMinutes(new Date(), 15).toISOString(),
    lastRunId: "run-5",
    alertInfo: undefined
  },
  {
    id: "dag-6",
    dagId: "clickstream_aggregator",
    lastStatus: "success",
    successRate: 96.4,
    totalRuns: 672,
    avgDuration: 240000, // 4 minutes
    avgRows: 780000,
    schedule: "0 * * * *",
    lastRunTime: subMinutes(new Date(), 45).toISOString(),
    lastRunId: "run-6",
    alertInfo: undefined
  },
  {
    id: "dag-7",
    dagId: "inventory_sync",
    lastStatus: "success",
    successRate: 99.8,
    totalRuns: 2100,
    avgDuration: 60000, // 1 minute
    avgRows: 12000,
    schedule: "*/5 * * * *",
    lastRunTime: subMinutes(new Date(), 3).toISOString(),
    lastRunId: "run-7",
    alertInfo: undefined
  },
  {
    id: "dag-8",
    dagId: "fraud_detection_batch",
    lastStatus: "success",
    successRate: 97.2,
    totalRuns: 336,
    avgDuration: 420000, // 7 minutes
    avgRows: 340000,
    schedule: "0 */2 * * *",
    lastRunTime: subHours(new Date(), 1.5).toISOString(),
    lastRunId: "run-8",
    alertInfo: undefined
  },
]

// ============================================================================
// MOCK DAG RUNS
// ============================================================================

export const mockDagRuns = [
  {
    id: "run-1",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-30T06:00:00",
    status: "success",
    startTime: subHours(new Date(), 2).toISOString(),
    endTime: subHours(new Date(), 1.9).toISOString(),
    duration: 360000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 127500,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-2",
    srcDagId: "sync_customer_data",
    srcRunId: "scheduled__2024-12-30T04:00:00",
    status: "success",
    startTime: subHours(new Date(), 1).toISOString(),
    endTime: subMinutes(new Date(), 57).toISOString(),
    duration: 180000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 43200,
    taskCount: 5,
    errorCount: 0,
    schedule: "0 */4 * * *",
  },
  {
    id: "run-3",
    srcDagId: "report_generator",
    srcRunId: "scheduled__2024-12-30T08:00:00",
    status: "failed",
    startTime: subHours(new Date(), 4).toISOString(),
    endTime: subHours(new Date(), 3.8).toISOString(),
    duration: 720000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    taskCount: 12,
    errorCount: 3,
    schedule: "0 8 * * 1-5",
  },
  {
    id: "run-4",
    srcDagId: "data_quality_checks",
    srcRunId: "scheduled__2024-12-30T12:15:00",
    status: "success",
    startTime: subMinutes(new Date(), 12).toISOString(),
    endTime: subMinutes(new Date(), 11).toISOString(),
    duration: 42000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    taskCount: 15,
    errorCount: 0,
    schedule: "*/15 * * * *",
  },
  {
    id: "run-5",
    srcDagId: "ml_feature_pipeline",
    srcRunId: "scheduled__2024-12-30T02:00:00",
    status: "running",
    startTime: subMinutes(new Date(), 15).toISOString(),
    endTime: null,
    duration: null,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 1250000,
    taskCount: 24,
    errorCount: 0,
    schedule: "0 2 * * *",
  },
  {
    id: "run-6",
    srcDagId: "clickstream_aggregator",
    srcRunId: "scheduled__2024-12-30T11:00:00",
    status: "success",
    startTime: subMinutes(new Date(), 45).toISOString(),
    endTime: subMinutes(new Date(), 41).toISOString(),
    duration: 240000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 812000,
    taskCount: 6,
    errorCount: 0,
    schedule: "0 * * * *",
  },
  {
    id: "run-7",
    srcDagId: "inventory_sync",
    srcRunId: "scheduled__2024-12-30T12:25:00",
    status: "success",
    startTime: subMinutes(new Date(), 3).toISOString(),
    endTime: subMinutes(new Date(), 2).toISOString(),
    duration: 58000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 11800,
    taskCount: 3,
    errorCount: 0,
    schedule: "*/5 * * * *",
  },
  {
    id: "run-8",
    srcDagId: "fraud_detection_batch",
    srcRunId: "manual__2024-12-30T10:30:00",
    status: "success",
    startTime: subHours(new Date(), 1.5).toISOString(),
    endTime: subHours(new Date(), 1.4).toISOString(),
    duration: 390000,
    runType: "manual",
    environment: "production",
    rowsProcessed: 356000,
    taskCount: 10,
    errorCount: 0,
    schedule: "0 */2 * * *",
  },
  {
    id: "run-9",
    srcDagId: "etl_daily_sales",
    srcRunId: "backfill__2024-12-29",
    status: "success",
    startTime: subHours(new Date(), 8).toISOString(),
    endTime: subHours(new Date(), 7.9).toISOString(),
    duration: 380000,
    runType: "backfill",
    environment: "staging",
    rowsProcessed: 118000,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-10",
    srcDagId: "sync_customer_data",
    srcRunId: "manual__2024-12-30T09:00:00",
    status: "failed",
    startTime: subHours(new Date(), 3).toISOString(),
    endTime: subHours(new Date(), 2.95).toISOString(),
    duration: 180000,
    runType: "manual",
    environment: "staging",
    rowsProcessed: 0,
    taskCount: 5,
    errorCount: 1,
    schedule: "0 */4 * * *",
  },
  {
    id: "run-11",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-30T05:00:00",
    status: "failed",
    startTime: subHours(new Date(), 7).toISOString(),
    endTime: subHours(new Date(), 6.9).toISOString(),
    duration: 420000,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 45000,
    taskCount: 8,
    errorCount: 1,
    schedule: "0 6 * * *",
  },
  {
    id: "run-12",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-30T11:00:00",
    status: "failed",
    startTime: subHours(new Date(), 1).toISOString(),
    endTime: subHours(new Date(), 0.9).toISOString(),
    duration: 360000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    taskCount: 8,
    errorCount: 1,
    schedule: "0 6 * * *",
  },
  {
    id: "run-13",
    srcDagId: "sync_customer_data",
    srcRunId: "scheduled__2024-12-30T12:00:00",
    status: "failed",
    startTime: subMinutes(new Date(), 30).toISOString(),
    endTime: subMinutes(new Date(), 25).toISOString(),
    duration: 300000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    taskCount: 5,
    errorCount: 1,
    schedule: "0 */4 * * *",
  },
  {
    id: "run-14",
    srcDagId: "fraud_detection_batch",
    srcRunId: "scheduled__2024-12-30T10:00:00",
    status: "failed",
    startTime: subHours(new Date(), 2).toISOString(),
    endTime: subHours(new Date(), 1.9).toISOString(),
    duration: 360000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    taskCount: 10,
    errorCount: 1,
    schedule: "0 */2 * * *",
  },
  {
    id: "run-15",
    srcDagId: "clickstream_aggregator",
    srcRunId: "scheduled__2024-12-30T07:00:00",
    status: "failed",
    startTime: subHours(new Date(), 5).toISOString(),
    endTime: subHours(new Date(), 4.9).toISOString(),
    duration: 360000,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 0,
    taskCount: 6,
    errorCount: 1,
    schedule: "0 * * * *",
  },
  {
    id: "run-16",
    srcDagId: "ml_feature_pipeline",
    srcRunId: "scheduled__2024-12-30T02:00:00",
    status: "failed",
    startTime: subHours(new Date(), 10).toISOString(),
    endTime: subHours(new Date(), 9.9).toISOString(),
    duration: 360000,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 0,
    taskCount: 24,
    errorCount: 1,
    schedule: "0 2 * * *",
  },
  // Historical runs - Day 1 (yesterday)
  {
    id: "run-17",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-29T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 1).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -0.1).toISOString(),
    duration: 340000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 132000,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-18",
    srcDagId: "sync_customer_data",
    srcRunId: "scheduled__2024-12-29T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 1), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -2.05).toISOString(),
    duration: 175000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 44800,
    taskCount: 5,
    errorCount: 0,
    schedule: "0 */4 * * *",
  },
  {
    id: "run-19",
    srcDagId: "clickstream_aggregator",
    srcRunId: "scheduled__2024-12-29T10:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 1), -4).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -4.07).toISOString(),
    duration: 250000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 798000,
    taskCount: 6,
    errorCount: 0,
    schedule: "0 * * * *",
  },
  {
    id: "run-20",
    srcDagId: "fraud_detection_batch",
    srcRunId: "scheduled__2024-12-29T12:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 1), -6).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -6.1).toISOString(),
    duration: 400000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 362000,
    taskCount: 10,
    errorCount: 0,
    schedule: "0 */2 * * *",
  },
  {
    id: "run-21",
    srcDagId: "report_generator",
    srcRunId: "scheduled__2024-12-29T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 1), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -2.2).toISOString(),
    duration: 700000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 910000,
    taskCount: 12,
    errorCount: 0,
    schedule: "0 8 * * 1-5",
  },
  {
    id: "run-22",
    srcDagId: "ml_feature_pipeline",
    srcRunId: "scheduled__2024-12-29T02:00:00",
    status: "success",
    startTime: subDays(new Date(), 1).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -0.5).toISOString(),
    duration: 1750000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 2480000,
    taskCount: 24,
    errorCount: 0,
    schedule: "0 2 * * *",
  },
  // Historical runs - Day 2 (2 days ago)
  {
    id: "run-23",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-28T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 2).toISOString(),
    endTime: subHours(subDays(new Date(), 2), -0.1).toISOString(),
    duration: 355000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 129500,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-24",
    srcDagId: "sync_customer_data",
    srcRunId: "scheduled__2024-12-28T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 2), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 2), -2.05).toISOString(),
    duration: 182000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 43900,
    taskCount: 5,
    errorCount: 0,
    schedule: "0 */4 * * *",
  },
  {
    id: "run-25",
    srcDagId: "clickstream_aggregator",
    srcRunId: "scheduled__2024-12-28T14:00:00",
    status: "failed",
    startTime: subHours(subDays(new Date(), 2), -8).toISOString(),
    endTime: subHours(subDays(new Date(), 2), -8.1).toISOString(),
    duration: 350000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    taskCount: 6,
    errorCount: 1,
    schedule: "0 * * * *",
  },
  {
    id: "run-26",
    srcDagId: "fraud_detection_batch",
    srcRunId: "scheduled__2024-12-28T10:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 2), -4).toISOString(),
    endTime: subHours(subDays(new Date(), 2), -4.1).toISOString(),
    duration: 410000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 348000,
    taskCount: 10,
    errorCount: 0,
    schedule: "0 */2 * * *",
  },
  {
    id: "run-27",
    srcDagId: "report_generator",
    srcRunId: "scheduled__2024-12-28T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 2), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 2), -2.2).toISOString(),
    duration: 720000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 885000,
    taskCount: 12,
    errorCount: 0,
    schedule: "0 8 * * 1-5",
  },
  // Historical runs - Day 3 (3 days ago)
  {
    id: "run-28",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-27T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 3).toISOString(),
    endTime: subHours(subDays(new Date(), 3), -0.1).toISOString(),
    duration: 338000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 131200,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-29",
    srcDagId: "sync_customer_data",
    srcRunId: "scheduled__2024-12-27T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 3), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 3), -2.05).toISOString(),
    duration: 178000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 45100,
    taskCount: 5,
    errorCount: 0,
    schedule: "0 */4 * * *",
  },
  {
    id: "run-30",
    srcDagId: "ml_feature_pipeline",
    srcRunId: "scheduled__2024-12-27T02:00:00",
    status: "failed",
    startTime: subDays(new Date(), 3).toISOString(),
    endTime: subHours(subDays(new Date(), 3), -0.3).toISOString(),
    duration: 1100000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 1200000,
    taskCount: 24,
    errorCount: 2,
    schedule: "0 2 * * *",
  },
  {
    id: "run-31",
    srcDagId: "report_generator",
    srcRunId: "scheduled__2024-12-27T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 3), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 3), -2.2).toISOString(),
    duration: 695000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 892000,
    taskCount: 12,
    errorCount: 0,
    schedule: "0 8 * * 1-5",
  },
  // Historical runs - Day 4-5 (older)
  {
    id: "run-32",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-26T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 4).toISOString(),
    endTime: subHours(subDays(new Date(), 4), -0.1).toISOString(),
    duration: 345000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 128700,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-33",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-25T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 5).toISOString(),
    endTime: subHours(subDays(new Date(), 5), -0.1).toISOString(),
    duration: 320000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 98500,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-34",
    srcDagId: "fraud_detection_batch",
    srcRunId: "scheduled__2024-12-26T14:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 4), -8).toISOString(),
    endTime: subHours(subDays(new Date(), 4), -8.1).toISOString(),
    duration: 395000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 341000,
    taskCount: 10,
    errorCount: 0,
    schedule: "0 */2 * * *",
  },
  {
    id: "run-35",
    srcDagId: "clickstream_aggregator",
    srcRunId: "scheduled__2024-12-26T10:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 4), -4).toISOString(),
    endTime: subHours(subDays(new Date(), 4), -4.07).toISOString(),
    duration: 245000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 805000,
    taskCount: 6,
    errorCount: 0,
    schedule: "0 * * * *",
  },
  {
    id: "run-36",
    srcDagId: "sync_customer_data",
    srcRunId: "scheduled__2024-12-26T12:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 4), -6).toISOString(),
    endTime: subHours(subDays(new Date(), 4), -6.05).toISOString(),
    duration: 185000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 44200,
    taskCount: 5,
    errorCount: 0,
    schedule: "0 */4 * * *",
  },
  // Week-old runs
  {
    id: "run-37",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-23T06:00:00",
    status: "failed",
    startTime: subDays(new Date(), 7).toISOString(),
    endTime: subHours(subDays(new Date(), 7), -0.15).toISOString(),
    duration: 520000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 45000,
    taskCount: 8,
    errorCount: 1,
    schedule: "0 6 * * *",
  },
  {
    id: "run-38",
    srcDagId: "ml_feature_pipeline",
    srcRunId: "scheduled__2024-12-23T02:00:00",
    status: "success",
    startTime: subDays(new Date(), 7).toISOString(),
    endTime: subHours(subDays(new Date(), 7), -0.5).toISOString(),
    duration: 1820000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 2510000,
    taskCount: 24,
    errorCount: 0,
    schedule: "0 2 * * *",
  },
  {
    id: "run-39",
    srcDagId: "data_quality_checks",
    srcRunId: "scheduled__2024-12-23T12:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 7), -6).toISOString(),
    endTime: subHours(subDays(new Date(), 7), -6.01).toISOString(),
    duration: 45000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    taskCount: 15,
    errorCount: 0,
    schedule: "*/15 * * * *",
  },
  {
    id: "run-40",
    srcDagId: "inventory_sync",
    srcRunId: "scheduled__2024-12-23T14:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 7), -8).toISOString(),
    endTime: subHours(subDays(new Date(), 7), -8.01).toISOString(),
    duration: 55000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 11500,
    taskCount: 3,
    errorCount: 0,
    schedule: "*/5 * * * *",
  },
  // Two weeks old
  {
    id: "run-41",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-16T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 14).toISOString(),
    endTime: subHours(subDays(new Date(), 14), -0.1).toISOString(),
    duration: 348000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 135000,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-42",
    srcDagId: "sync_customer_data",
    srcRunId: "scheduled__2024-12-16T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 14), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 14), -2.05).toISOString(),
    duration: 176000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 42800,
    taskCount: 5,
    errorCount: 0,
    schedule: "0 */4 * * *",
  },
  {
    id: "run-43",
    srcDagId: "fraud_detection_batch",
    srcRunId: "scheduled__2024-12-16T10:00:00",
    status: "failed",
    startTime: subHours(subDays(new Date(), 14), -4).toISOString(),
    endTime: subHours(subDays(new Date(), 14), -4.08).toISOString(),
    duration: 290000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 120000,
    taskCount: 10,
    errorCount: 1,
    schedule: "0 */2 * * *",
  },
  // Staging historical runs
  {
    id: "run-44",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-29T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 1).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -0.12).toISOString(),
    duration: 420000,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 52000,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-45",
    srcDagId: "sync_customer_data",
    srcRunId: "scheduled__2024-12-29T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 1), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -2.06).toISOString(),
    duration: 210000,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 18500,
    taskCount: 5,
    errorCount: 0,
    schedule: "0 */4 * * *",
  },
  {
    id: "run-46",
    srcDagId: "ml_feature_pipeline",
    srcRunId: "scheduled__2024-12-28T02:00:00",
    status: "success",
    startTime: subDays(new Date(), 2).toISOString(),
    endTime: subHours(subDays(new Date(), 2), -0.6).toISOString(),
    duration: 2100000,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 980000,
    taskCount: 24,
    errorCount: 0,
    schedule: "0 2 * * *",
  },
  {
    id: "run-47",
    srcDagId: "clickstream_aggregator",
    srcRunId: "scheduled__2024-12-28T10:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 2), -4).toISOString(),
    endTime: subHours(subDays(new Date(), 2), -4.08).toISOString(),
    duration: 280000,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 320000,
    taskCount: 6,
    errorCount: 0,
    schedule: "0 * * * *",
  },
  {
    id: "run-48",
    srcDagId: "fraud_detection_batch",
    srcRunId: "scheduled__2024-12-27T14:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 3), -8).toISOString(),
    endTime: subHours(subDays(new Date(), 3), -8.12).toISOString(),
    duration: 450000,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 145000,
    taskCount: 10,
    errorCount: 0,
    schedule: "0 */2 * * *",
  },
]

// ============================================================================
// MOCK CHART DATA - Generates realistic-looking run stats
// ============================================================================

function generateRunStats(timeframe: Timeframe) {
  const now = new Date()
  const data: { date: string; success: number; failed: number; rowsProcessed: number; manual: number; scheduled: number }[] = []

  if (timeframe === Timeframe.Day) {
    // Hourly data for last 24 hours
    for (let i = 23; i >= 0; i--) {
      const date = subHours(now, i)
      const baseRuns = Math.floor(Math.random() * 15) + 5
      const failedRuns = Math.random() > 0.7 ? Math.floor(Math.random() * 3) : 0
      const totalRuns = baseRuns
      const manualRuns = Math.floor(Math.random() * Math.min(3, totalRuns))
      const scheduledRuns = totalRuns - manualRuns
      data.push({
        date: date.toISOString(),
        success: baseRuns - failedRuns,
        failed: failedRuns,
        rowsProcessed: Math.floor(Math.random() * 150_000) + 50_000,
        manual: manualRuns,
        scheduled: scheduledRuns,
      })
    }
  } else {
    // Daily data
    const days = timeframe === Timeframe.Week ? 7 : timeframe === Timeframe.Month ? 28 : 30
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(now, i)
      const baseRuns = Math.floor(Math.random() * 80) + 40
      const failedRuns = Math.random() > 0.6 ? Math.floor(Math.random() * 8) : 0
      const totalRuns = baseRuns
      const manualRuns = Math.floor(Math.random() * Math.min(15, totalRuns))
      const scheduledRuns = totalRuns - manualRuns
      data.push({
        date: date.toISOString(),
        success: baseRuns - failedRuns,
        failed: failedRuns,
        rowsProcessed: Math.floor(Math.random() * 500_000) + 100_000,
        manual: manualRuns,
        scheduled: scheduledRuns,
      })
    }
  }

  return data
}

export const mockRunStats = {
  [Timeframe.Day]: generateRunStats(Timeframe.Day),
  [Timeframe.Week]: generateRunStats(Timeframe.Week),
  [Timeframe.Month]: generateRunStats(Timeframe.Month),
  [Timeframe.AllTime]: generateRunStats(Timeframe.AllTime),
}

// ============================================================================
// MOCK ALERTS (for alerts page with full data)
// ============================================================================

export const mockAlertsForPage = [
  {
    id: "alert-1",
    alertType: "ROW_COUNT_DROP",
    srcDagId: "sync_customer_data",
    captureId: "sync_customer_data.extract_users",
    status: "OPEN",
    severity: "warning",
    metadata: {
      current: 7500,
      baseline: 10000,
      dropPercentage: 25,
      confidence: "high",
      baselineType: "cohort",
      runsAnalyzed: 45,
      threshold: "MEDIUM",
    },
    createdAt: subDays(new Date(), 2).toISOString(),
    acknowledgedAt: null,
    dismissedAt: null,
    environment: "production",
  },
  {
    id: "alert-2",
    alertType: "SCHEMA_CHANGE",
    srcDagId: "inventory_sync",
    captureId: "inventory_sync.load_warehouse",
    status: "DISMISSED",
    severity: "warning",
    metadata: {
      summary: {
        addedCount: 2,
        removedCount: 1,
        typeChangedCount: 1,
        totalChanges: 4,
      },
      addedColumns: [{ name: "loyalty_tier", type: "VARCHAR" }, { name: "preferred_contact", type: "VARCHAR" }],
      removedColumns: [{ name: "old_id", type: "INTEGER" }],
      typeChangedColumns: [{ name: "risk_score", previousType: "INTEGER", currentType: "FLOAT" }],
    },
    createdAt: subDays(new Date(), 3).toISOString(),
    acknowledgedAt: null,
    dismissedAt: subDays(new Date(), 2).toISOString(),
    environment: "production",
  },
  {
    id: "alert-3",
    alertType: "NULL_OCCURRENCE",
    srcDagId: "data_quality_checks",
    captureId: "data_quality_checks.transform_data",
    status: "ACKNOWLEDGED",
    severity: "warning",
    metadata: {
      affectedColumns: [
        { name: "email", nullCount: 150, dtype: "VARCHAR" },
        { name: "phone_number", nullCount: 85, dtype: "VARCHAR" }
      ],
      columnCount: 2,
      totalNullCount: 235,
    },
    createdAt: subDays(new Date(), 2).toISOString(),
    acknowledgedAt: subDays(new Date(), 2).toISOString(),
    dismissedAt: null,
    environment: "staging",
  },
  {
    id: "alert-4",
    alertType: "ROW_COUNT_DROP",
    srcDagId: "clickstream_aggregator",
    captureId: "capture-789",
    status: "ACKNOWLEDGED",
    severity: "warning",
    metadata: {
      current: 650000,
      baseline: 800000,
      dropPercentage: 18.75,
      confidence: "medium",
      baselineType: "overall",
      runsAnalyzed: 120,
    },
    createdAt: subDays(new Date(), 1).toISOString(),
    acknowledgedAt: subHours(new Date(), 20).toISOString(),
    dismissedAt: null,
    environment: "production",
  },
  {
    id: "alert-5",
    alertType: "SCHEMA_CHANGE",
    srcDagId: "fraud_detection_batch",
    captureId: "capture-321",
    status: "DISMISSED",
    severity: "warning",
    metadata: {
      summary: {
        addedCount: 1,
        removedCount: 1,
        typeChangedCount: 0,
        totalChanges: 2,
      },
      addedColumns: [{ name: "risk_score_v2", type: "FLOAT" }],
      removedColumns: [{ name: "risk_score", type: "FLOAT" }],
    },
    createdAt: subDays(new Date(), 3).toISOString(),
    acknowledgedAt: null,
    dismissedAt: subDays(new Date(), 2).toISOString(),
    environment: "production",
  },
  {
    id: "alert-6",
    alertType: "NULL_OCCURRENCE",
    srcDagId: "etl_daily_sales",
    captureId: "capture-999",
    status: "OPEN",
    severity: "critical",
    metadata: {
      affectedColumns: [{ name: "customer_id", nullCount: 150, dtype: "VARCHAR" }],
      columnCount: 1,
      totalNullCount: 150,
    },
    createdAt: subHours(new Date(), 1).toISOString(),
    acknowledgedAt: null,
    dismissedAt: null,
    environment: "staging",
  },
  // Historical alerts
  {
    id: "alert-7",
    alertType: "ROW_COUNT_DROP",
    srcDagId: "etl_daily_sales",
    captureId: "etl_daily_sales.extract_orders",
    status: "DISMISSED",
    severity: "warning",
    metadata: {
      current: 95000,
      baseline: 125000,
      dropPercentage: 24,
      confidence: "high",
      baselineType: "cohort",
      runsAnalyzed: 30,
      threshold: "MEDIUM",
    },
    createdAt: subDays(new Date(), 5).toISOString(),
    acknowledgedAt: subDays(new Date(), 5).toISOString(),
    dismissedAt: subDays(new Date(), 4).toISOString(),
    environment: "production",
  },
  {
    id: "alert-8",
    alertType: "SCHEMA_CHANGE",
    srcDagId: "sync_customer_data",
    captureId: "sync_customer_data.load_customers",
    status: "DISMISSED",
    severity: "warning",
    metadata: {
      summary: {
        addedCount: 3,
        removedCount: 0,
        typeChangedCount: 0,
        totalChanges: 3,
      },
      addedColumns: [
        { name: "created_at", type: "TIMESTAMP" },
        { name: "updated_at", type: "TIMESTAMP" },
        { name: "source_system", type: "VARCHAR" }
      ],
      removedColumns: [],
      typeChangedColumns: [],
    },
    createdAt: subDays(new Date(), 7).toISOString(),
    acknowledgedAt: null,
    dismissedAt: subDays(new Date(), 6).toISOString(),
    environment: "production",
  },
  {
    id: "alert-9",
    alertType: "ROW_COUNT_DROP",
    srcDagId: "ml_feature_pipeline",
    captureId: "ml_feature_pipeline.build_features",
    status: "DISMISSED",
    severity: "critical",
    metadata: {
      current: 1200000,
      baseline: 2400000,
      dropPercentage: 50,
      confidence: "high",
      baselineType: "overall",
      runsAnalyzed: 15,
      threshold: "HIGH",
    },
    createdAt: subDays(new Date(), 3).toISOString(),
    acknowledgedAt: subDays(new Date(), 3).toISOString(),
    dismissedAt: subDays(new Date(), 2).toISOString(),
    environment: "production",
  },
  {
    id: "alert-10",
    alertType: "NULL_OCCURRENCE",
    srcDagId: "fraud_detection_batch",
    captureId: "fraud_detection_batch.score_transactions",
    status: "DISMISSED",
    severity: "warning",
    metadata: {
      affectedColumns: [
        { name: "transaction_amount", nullCount: 45, dtype: "DECIMAL" },
        { name: "merchant_id", nullCount: 12, dtype: "VARCHAR" }
      ],
      columnCount: 2,
      totalNullCount: 57,
    },
    createdAt: subDays(new Date(), 10).toISOString(),
    acknowledgedAt: subDays(new Date(), 10).toISOString(),
    dismissedAt: subDays(new Date(), 9).toISOString(),
    environment: "production",
  },
  {
    id: "alert-11",
    alertType: "SCHEMA_CHANGE",
    srcDagId: "clickstream_aggregator",
    captureId: "clickstream_aggregator.aggregate_sessions",
    status: "ACKNOWLEDGED",
    severity: "warning",
    metadata: {
      summary: {
        addedCount: 1,
        removedCount: 0,
        typeChangedCount: 2,
        totalChanges: 3,
      },
      addedColumns: [{ name: "device_fingerprint", type: "VARCHAR" }],
      removedColumns: [],
      typeChangedColumns: [
        { name: "session_duration", previousType: "INTEGER", currentType: "BIGINT" },
        { name: "page_views", previousType: "SMALLINT", currentType: "INTEGER" }
      ],
    },
    createdAt: subDays(new Date(), 4).toISOString(),
    acknowledgedAt: subDays(new Date(), 3).toISOString(),
    dismissedAt: null,
    environment: "production",
  },
  {
    id: "alert-12",
    alertType: "ROW_COUNT_DROP",
    srcDagId: "report_generator",
    captureId: "report_generator.aggregate_metrics",
    status: "DISMISSED",
    severity: "critical",
    metadata: {
      current: 0,
      baseline: 890000,
      dropPercentage: 100,
      confidence: "high",
      baselineType: "cohort",
      runsAnalyzed: 20,
      threshold: "HIGH",
    },
    createdAt: subDays(new Date(), 1).toISOString(),
    acknowledgedAt: subHours(new Date(), 20).toISOString(),
    dismissedAt: subHours(new Date(), 18).toISOString(),
    environment: "production",
  },
  {
    id: "alert-13",
    alertType: "NULL_OCCURRENCE",
    srcDagId: "inventory_sync",
    captureId: "inventory_sync.sync_warehouse",
    status: "DISMISSED",
    severity: "warning",
    metadata: {
      affectedColumns: [{ name: "sku", nullCount: 8, dtype: "VARCHAR" }],
      columnCount: 1,
      totalNullCount: 8,
    },
    createdAt: subDays(new Date(), 14).toISOString(),
    acknowledgedAt: subDays(new Date(), 14).toISOString(),
    dismissedAt: subDays(new Date(), 13).toISOString(),
    environment: "staging",
  },
  {
    id: "alert-14",
    alertType: "ROW_COUNT_DROP",
    srcDagId: "data_quality_checks",
    captureId: "data_quality_checks.check_nulls",
    status: "OPEN",
    severity: "warning",
    metadata: {
      current: 12,
      baseline: 0,
      dropPercentage: -100, // This is an increase in failures
      confidence: "high",
      baselineType: "overall",
      runsAnalyzed: 100,
      threshold: "LOW",
    },
    createdAt: subHours(new Date(), 6).toISOString(),
    acknowledgedAt: null,
    dismissedAt: null,
    environment: "production",
  },
]

// Dashboard alerts (simplified)
export const mockAlerts = mockAlertsForPage.filter(a => a.status === "OPEN").map(a => ({
  id: a.id,
  alertType: a.alertType,
  srcDagId: a.srcDagId,
  environment: (a as { environment?: string }).environment || "production",
  severity: a.severity,
  metadata: a.metadata,
  createdAt: a.createdAt,
}))

export const mockAlertsSummary: Record<Timeframe, { total: number; critical: number }> = {
  [Timeframe.Day]: { total: 3, critical: 1 },
  [Timeframe.Week]: { total: 8, critical: 2 },
  [Timeframe.Month]: { total: 14, critical: 4 },
  [Timeframe.AllTime]: { total: 42, critical: 12 },
}

// ============================================================================
// MOCK RECENT ERRORS
// ============================================================================

export const mockRecentErrors = [
  {
    id: "err-1",
    exceptionType: "ConnectionError",
    message: "Failed to connect to PostgreSQL: Connection refused (host: db-prod.internal, port: 5432)",
    occurrenceCount: 47,
    dagCount: 3,
    lastSeenAt: subHours(new Date(), 1).toISOString(),
    firstSeenAt: subDays(new Date(), 2).toISOString(),
    status: "open",
    environments: ["production"],
  },
  {
    id: "err-2",
    exceptionType: "DataValidationError",
    message: "Column 'revenue' contains null values in 234 rows, expected non-null",
    occurrenceCount: 12,
    dagCount: 1,
    lastSeenAt: subHours(new Date(), 3).toISOString(),
    firstSeenAt: subDays(new Date(), 1).toISOString(),
    status: "open",
    environments: ["production", "staging"],
  },
  {
    id: "err-3",
    exceptionType: "TimeoutError",
    message: "Query execution exceeded 300s timeout limit on table 'events_raw'",
    occurrenceCount: 8,
    dagCount: 2,
    lastSeenAt: subHours(new Date(), 6).toISOString(),
    firstSeenAt: subDays(new Date(), 3).toISOString(),
    status: "open",
    environments: ["staging"],
  },
  {
    id: "err-4",
    exceptionType: "S3AccessDenied",
    message: "Access Denied: Unable to read from s3://data-lake-prod/raw/events/",
    occurrenceCount: 3,
    dagCount: 1,
    lastSeenAt: subHours(new Date(), 12).toISOString(),
    firstSeenAt: subHours(new Date(), 14).toISOString(),
    status: "open",
    environments: ["production"],
  },
  {
    id: "err-5",
    exceptionType: "OutOfMemoryError",
    message: "Java heap space exceeded: Required 8GB, available 4GB during DataFrame transformation",
    occurrenceCount: 23,
    dagCount: 2,
    lastSeenAt: subDays(new Date(), 1).toISOString(),
    firstSeenAt: subDays(new Date(), 5).toISOString(),
    status: "open",
    environments: ["production"],
  },
  {
    id: "err-6",
    exceptionType: "SchemaValidationError",
    message: "Expected column 'user_id' to be INTEGER but found STRING in source data",
    occurrenceCount: 5,
    dagCount: 1,
    lastSeenAt: subDays(new Date(), 2).toISOString(),
    firstSeenAt: subDays(new Date(), 4).toISOString(),
    status: "open",
    environments: ["staging"],
  },
  {
    id: "err-7",
    exceptionType: "RateLimitExceeded",
    message: "API rate limit exceeded: 429 Too Many Requests from external CRM endpoint",
    occurrenceCount: 156,
    dagCount: 1,
    lastSeenAt: subDays(new Date(), 1).toISOString(),
    firstSeenAt: subDays(new Date(), 7).toISOString(),
    status: "resolved",
    environments: ["production", "staging"],
  },
  {
    id: "err-8",
    exceptionType: "PartitionNotFoundError",
    message: "Partition dt=2024-12-28 not found in table analytics.events_partitioned",
    occurrenceCount: 2,
    dagCount: 1,
    lastSeenAt: subDays(new Date(), 2).toISOString(),
    firstSeenAt: subDays(new Date(), 2).toISOString(),
    status: "resolved",
    environments: ["production"],
  },
  {
    id: "err-9",
    exceptionType: "DuplicateKeyError",
    message: "Duplicate key violation on constraint 'pk_transactions': key (transaction_id)=(TXN-2024-12345) already exists",
    occurrenceCount: 34,
    dagCount: 2,
    lastSeenAt: subHours(new Date(), 8).toISOString(),
    firstSeenAt: subDays(new Date(), 6).toISOString(),
    status: "open",
    environments: ["production"],
  },
  {
    id: "err-10",
    exceptionType: "SSLCertificateError",
    message: "SSL certificate verification failed for host: api.payment-gateway.com - certificate expired",
    occurrenceCount: 89,
    dagCount: 1,
    lastSeenAt: subDays(new Date(), 3).toISOString(),
    firstSeenAt: subDays(new Date(), 3).toISOString(),
    status: "resolved",
    environments: ["production"],
  },
]

// ============================================================================
// MOCK ENVIRONMENTS
// ============================================================================

export const mockEnvironments = [
  { name: "production", isDefault: true, createdAt: subDays(new Date(), 100).toISOString(), updatedAt: subDays(new Date(), 100).toISOString() },
  { name: "staging", isDefault: false, createdAt: subDays(new Date(), 100).toISOString(), updatedAt: subDays(new Date(), 100).toISOString() },
  { name: "development", isDefault: false, createdAt: subDays(new Date(), 100).toISOString(), updatedAt: subDays(new Date(), 100).toISOString() },
]

// ============================================================================
// MOCK RUN DETAILS (for individual run pages)
// ============================================================================

export const mockRunDetails: Record<string, {
  id: string
  srcDagId: string
  srcRunId: string
  status: string
  startTime: string
  endTime: string | null
  duration: number | null
  runType: string
  environment: string
  rowsProcessed: number
  tasks: Array<{
    taskId: string
    status: string
    startTime: string | null
    endTime: string | null
    duration: number | null
    upstreamTaskIds: string[]
    errorId: string | null
  }>
  captures: Array<{
    id: string
    capturePointId: string
    rowCount: number
    capturedAt: string
    position: "source" | "intermediate" | "destination"
  }>
}> = {
  "run-1": {
    id: "run-1",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-30T06:00:00",
    status: "success",
    startTime: subHours(new Date(), 2).toISOString(),
    endTime: subHours(new Date(), 1.9).toISOString(),
    duration: 360000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 127500,
    tasks: [
      { taskId: "extract_orders", status: "success", startTime: subHours(new Date(), 2).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -5).toISOString(), duration: 45000, upstreamTaskIds: [], errorId: null },
      { taskId: "extract_customers", status: "success", startTime: subHours(new Date(), 2).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -3).toISOString(), duration: 30000, upstreamTaskIds: [], errorId: null },
      { taskId: "transform_orders", status: "success", startTime: subMinutes(subHours(new Date(), 2), -5).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -8).toISOString(), duration: 60000, upstreamTaskIds: ["extract_orders", "extract_customers"], errorId: null },
      { taskId: "validate_data", status: "success", startTime: subMinutes(subHours(new Date(), 2), -8).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -9).toISOString(), duration: 15000, upstreamTaskIds: ["transform_orders"], errorId: null },
      { taskId: "load_staging", status: "success", startTime: subMinutes(subHours(new Date(), 2), -9).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -11).toISOString(), duration: 45000, upstreamTaskIds: ["validate_data"], errorId: null },
      { taskId: "load_production", status: "success", startTime: subMinutes(subHours(new Date(), 2), -11).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -13).toISOString(), duration: 60000, upstreamTaskIds: ["load_staging"], errorId: null },
    ],
    captures: [
      { id: "cap-1", capturePointId: "raw_orders", rowCount: 150000, capturedAt: subMinutes(subHours(new Date(), 2), -5).toISOString(), position: "source" },
      { id: "cap-2", capturePointId: "transformed_orders", rowCount: 148500, capturedAt: subMinutes(subHours(new Date(), 2), -8).toISOString(), position: "intermediate" },
      { id: "cap-3", capturePointId: "final_orders", rowCount: 127500, capturedAt: subMinutes(subHours(new Date(), 2), -13).toISOString(), position: "destination" },
    ],
  },
  "run-3": {
    id: "run-3",
    srcDagId: "report_generator",
    srcRunId: "scheduled__2024-12-30T08:00:00",
    status: "failed",
    startTime: subHours(new Date(), 4).toISOString(),
    endTime: subHours(new Date(), 3.8).toISOString(),
    duration: 720000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    tasks: [
      { taskId: "fetch_data", status: "success", startTime: subHours(new Date(), 4).toISOString(), endTime: subMinutes(subHours(new Date(), 4), -3).toISOString(), duration: 60000, upstreamTaskIds: [], errorId: null },
      { taskId: "aggregate_metrics", status: "success", startTime: subMinutes(subHours(new Date(), 4), -3).toISOString(), endTime: subMinutes(subHours(new Date(), 4), -6).toISOString(), duration: 120000, upstreamTaskIds: ["fetch_data"], errorId: null },
      { taskId: "generate_report", status: "failed", startTime: subMinutes(subHours(new Date(), 4), -6).toISOString(), endTime: subMinutes(subHours(new Date(), 4), -8).toISOString(), duration: 90000, upstreamTaskIds: ["aggregate_metrics"], errorId: "err-1" },
      { taskId: "send_email", status: "upstream_failed", startTime: null, endTime: null, duration: null, upstreamTaskIds: ["generate_report"], errorId: null },
    ],
    captures: [
      { id: "cap-4", capturePointId: "raw_metrics", rowCount: 89000, capturedAt: subMinutes(subHours(new Date(), 4), -3).toISOString(), position: "source" },
    ],
  },
  "run-2": {
    id: "run-2",
    srcDagId: "sync_customer_data",
    srcRunId: "scheduled__2024-12-30T04:00:00",
    status: "success",
    startTime: subHours(new Date(), 1).toISOString(),
    endTime: subMinutes(new Date(), 57).toISOString(),
    duration: 180000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 43200,
    tasks: [
      { taskId: "extract_crm", status: "success", startTime: subHours(new Date(), 1).toISOString(), endTime: subMinutes(subHours(new Date(), 1), -2).toISOString(), duration: 60000, upstreamTaskIds: [], errorId: null },
      { taskId: "transform_customers", status: "success", startTime: subMinutes(subHours(new Date(), 1), -2).toISOString(), endTime: subMinutes(subHours(new Date(), 1), -4).toISOString(), duration: 45000, upstreamTaskIds: ["extract_crm"], errorId: null },
      { taskId: "load_customers", status: "success", startTime: subMinutes(subHours(new Date(), 1), -4).toISOString(), endTime: subMinutes(new Date(), 57).toISOString(), duration: 75000, upstreamTaskIds: ["transform_customers"], errorId: null },
    ],
    captures: [
      { id: "cap-5", capturePointId: "raw_customers", rowCount: 45000, capturedAt: subMinutes(subHours(new Date(), 1), -2).toISOString(), position: "source" },
      { id: "cap-6", capturePointId: "final_customers", rowCount: 43200, capturedAt: subMinutes(new Date(), 57).toISOString(), position: "destination" },
    ],
  },
  "run-4": {
    id: "run-4",
    srcDagId: "data_quality_checks",
    srcRunId: "scheduled__2024-12-30T12:15:00",
    status: "success",
    startTime: subMinutes(new Date(), 12).toISOString(),
    endTime: subMinutes(new Date(), 11).toISOString(),
    duration: 42000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    tasks: [
      { taskId: "check_nulls", status: "success", startTime: subMinutes(new Date(), 12).toISOString(), endTime: subMinutes(new Date(), 11.5).toISOString(), duration: 15000, upstreamTaskIds: [], errorId: null },
      { taskId: "check_duplicates", status: "success", startTime: subMinutes(new Date(), 11.5).toISOString(), endTime: subMinutes(new Date(), 11).toISOString(), duration: 27000, upstreamTaskIds: ["check_nulls"], errorId: null },
    ],
    captures: [],
  },
  "run-5": {
    id: "run-5",
    srcDagId: "ml_feature_pipeline",
    srcRunId: "scheduled__2024-12-30T02:00:00",
    status: "running",
    startTime: subMinutes(new Date(), 15).toISOString(),
    endTime: null,
    duration: null,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 1250000,
    tasks: [
      { taskId: "extract_events", status: "success", startTime: subMinutes(new Date(), 15).toISOString(), endTime: subMinutes(new Date(), 10).toISOString(), duration: 300000, upstreamTaskIds: [], errorId: null },
      { taskId: "build_features", status: "running", startTime: subMinutes(new Date(), 10).toISOString(), endTime: null, duration: null, upstreamTaskIds: ["extract_events"], errorId: null },
      { taskId: "train_model", status: "pending", startTime: null, endTime: null, duration: null, upstreamTaskIds: ["build_features"], errorId: null },
    ],
    captures: [
      { id: "cap-7", capturePointId: "raw_events", rowCount: 2500000, capturedAt: subMinutes(new Date(), 10).toISOString(), position: "source" },
      { id: "cap-8", capturePointId: "features_partial", rowCount: 1250000, capturedAt: subMinutes(new Date(), 5).toISOString(), position: "intermediate" },
    ],
  },
  "run-6": {
    id: "run-6",
    srcDagId: "clickstream_aggregator",
    srcRunId: "scheduled__2024-12-30T11:00:00",
    status: "success",
    startTime: subMinutes(new Date(), 45).toISOString(),
    endTime: subMinutes(new Date(), 41).toISOString(),
    duration: 240000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 812000,
    tasks: [
      { taskId: "read_clickstream", status: "success", startTime: subMinutes(new Date(), 45).toISOString(), endTime: subMinutes(new Date(), 43).toISOString(), duration: 120000, upstreamTaskIds: [], errorId: null },
      { taskId: "aggregate_sessions", status: "success", startTime: subMinutes(new Date(), 43).toISOString(), endTime: subMinutes(new Date(), 41).toISOString(), duration: 120000, upstreamTaskIds: ["read_clickstream"], errorId: null },
    ],
    captures: [
      { id: "cap-9", capturePointId: "raw_clicks", rowCount: 900000, capturedAt: subMinutes(new Date(), 43).toISOString(), position: "source" },
      { id: "cap-10", capturePointId: "sessions", rowCount: 812000, capturedAt: subMinutes(new Date(), 41).toISOString(), position: "destination" },
    ],
  },
  "run-7": {
    id: "run-7",
    srcDagId: "inventory_sync",
    srcRunId: "scheduled__2024-12-30T12:25:00",
    status: "success",
    startTime: subMinutes(new Date(), 3).toISOString(),
    endTime: subMinutes(new Date(), 2).toISOString(),
    duration: 58000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 11800,
    tasks: [
      { taskId: "fetch_inventory", status: "success", startTime: subMinutes(new Date(), 3).toISOString(), endTime: subMinutes(new Date(), 2.5).toISOString(), duration: 30000, upstreamTaskIds: [], errorId: null },
      { taskId: "sync_warehouse", status: "success", startTime: subMinutes(new Date(), 2.5).toISOString(), endTime: subMinutes(new Date(), 2).toISOString(), duration: 28000, upstreamTaskIds: ["fetch_inventory"], errorId: null },
    ],
    captures: [
      { id: "cap-11", capturePointId: "inventory_items", rowCount: 11800, capturedAt: subMinutes(new Date(), 2).toISOString(), position: "destination" },
    ],
  },
  "run-8": {
    id: "run-8",
    srcDagId: "fraud_detection_batch",
    srcRunId: "manual__2024-12-30T10:30:00",
    status: "success",
    startTime: subHours(new Date(), 1.5).toISOString(),
    endTime: subHours(new Date(), 1.4).toISOString(),
    duration: 390000,
    runType: "manual",
    environment: "production",
    rowsProcessed: 356000,
    tasks: [
      { taskId: "load_transactions", status: "success", startTime: subHours(new Date(), 1.5).toISOString(), endTime: subMinutes(subHours(new Date(), 1.5), -3).toISOString(), duration: 120000, upstreamTaskIds: [], errorId: null },
      { taskId: "score_fraud", status: "success", startTime: subMinutes(subHours(new Date(), 1.5), -3).toISOString(), endTime: subMinutes(subHours(new Date(), 1.5), -5).toISOString(), duration: 180000, upstreamTaskIds: ["load_transactions"], errorId: null },
      { taskId: "flag_suspicious", status: "success", startTime: subMinutes(subHours(new Date(), 1.5), -5).toISOString(), endTime: subHours(new Date(), 1.4).toISOString(), duration: 90000, upstreamTaskIds: ["score_fraud"], errorId: null },
    ],
    captures: [
      { id: "cap-12", capturePointId: "transactions", rowCount: 400000, capturedAt: subMinutes(subHours(new Date(), 1.5), -3).toISOString(), position: "source" },
      { id: "cap-13", capturePointId: "scored_transactions", rowCount: 356000, capturedAt: subHours(new Date(), 1.4).toISOString(), position: "destination" },
    ],
  },
  "run-12": {
    id: "run-12",
    srcDagId: "etl_daily_sales",
    srcRunId: "scheduled__2024-12-30T11:00:00",
    status: "failed",
    startTime: subHours(new Date(), 1).toISOString(),
    endTime: subHours(new Date(), 0.9).toISOString(),
    duration: 360000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    tasks: [
      { taskId: "extract_orders", status: "failed", startTime: subHours(new Date(), 1).toISOString(), endTime: subMinutes(subHours(new Date(), 1), -3).toISOString(), duration: 180000, upstreamTaskIds: [], errorId: "err-1" },
      { taskId: "extract_customers", status: "upstream_failed", startTime: null, endTime: null, duration: null, upstreamTaskIds: [], errorId: null },
      { taskId: "transform_orders", status: "upstream_failed", startTime: null, endTime: null, duration: null, upstreamTaskIds: ["extract_orders", "extract_customers"], errorId: null },
    ],
    captures: [],
  },
  "run-13": {
    id: "run-13",
    srcDagId: "sync_customer_data",
    srcRunId: "scheduled__2024-12-30T12:00:00",
    status: "failed",
    startTime: subMinutes(new Date(), 30).toISOString(),
    endTime: subMinutes(new Date(), 25).toISOString(),
    duration: 300000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    tasks: [
      { taskId: "extract_crm", status: "success", startTime: subMinutes(new Date(), 30).toISOString(), endTime: subMinutes(new Date(), 28).toISOString(), duration: 120000, upstreamTaskIds: [], errorId: null },
      { taskId: "transform_customers", status: "success", startTime: subMinutes(new Date(), 28).toISOString(), endTime: subMinutes(new Date(), 26).toISOString(), duration: 120000, upstreamTaskIds: ["extract_crm"], errorId: null },
      { taskId: "load_customers", status: "failed", startTime: subMinutes(new Date(), 26).toISOString(), endTime: subMinutes(new Date(), 25).toISOString(), duration: 60000, upstreamTaskIds: ["transform_customers"], errorId: "err-1" },
    ],
    captures: [
      { id: "cap-14", capturePointId: "raw_customers", rowCount: 45000, capturedAt: subMinutes(new Date(), 28).toISOString(), position: "source" },
    ],
  },
  "run-14": {
    id: "run-14",
    srcDagId: "fraud_detection_batch",
    srcRunId: "scheduled__2024-12-30T10:00:00",
    status: "failed",
    startTime: subHours(new Date(), 2).toISOString(),
    endTime: subHours(new Date(), 1.9).toISOString(),
    duration: 360000,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    tasks: [
      { taskId: "load_transactions", status: "success", startTime: subHours(new Date(), 2).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -2).toISOString(), duration: 120000, upstreamTaskIds: [], errorId: null },
      { taskId: "load_events", status: "failed", startTime: subMinutes(subHours(new Date(), 2), -2).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -4).toISOString(), duration: 120000, upstreamTaskIds: [], errorId: "err-4" },
      { taskId: "score_fraud", status: "upstream_failed", startTime: null, endTime: null, duration: null, upstreamTaskIds: ["load_transactions", "load_events"], errorId: null },
    ],
    captures: [
      { id: "cap-15", capturePointId: "transactions", rowCount: 380000, capturedAt: subMinutes(subHours(new Date(), 2), -2).toISOString(), position: "source" },
    ],
  },
}

// ============================================================================
// MOCK ERROR DETAILS (for individual error pages)
// ============================================================================

export const mockErrorDetails: Record<string, {
  id: string
  exceptionType: string
  message: string
  occurrenceCount: number
  firstSeenAt: string
  lastSeenAt: string
  status: string
  stacktrace: string
  occurrences: Array<{
    id: string
    dagId: string
    runId: string
    taskId: string
    environment: string
    timestamp: string
  }>
}> = {
  "err-1": {
    id: "err-1",
    exceptionType: "ConnectionError",
    message: "Failed to connect to PostgreSQL: Connection refused (host: db-prod.internal, port: 5432)",
    occurrenceCount: 47,
    firstSeenAt: subDays(new Date(), 2).toISOString(),
    lastSeenAt: subHours(new Date(), 1).toISOString(),
    status: "OPEN",
    stacktrace: `Traceback (most recent call last):
  File "/opt/airflow/dags/etl_daily_sales.py", line 142, in execute
    connection = psycopg2.connect(**db_config)
  File "/usr/local/lib/python3.10/site-packages/psycopg2/__init__.py", line 122, in connect
    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
psycopg2.OperationalError: could not connect to server: Connection refused
    Is the server running on host "db-prod.internal" and accepting
    TCP/IP connections on port 5432?`,
    occurrences: [
      { id: "occ-1", dagId: "etl_daily_sales", runId: "run-12", taskId: "extract_orders", environment: "production", timestamp: subHours(new Date(), 1).toISOString() },
      { id: "occ-2", dagId: "sync_customer_data", runId: "run-13", taskId: "load_customers", environment: "production", timestamp: subMinutes(new Date(), 30).toISOString() },
      { id: "occ-3", dagId: "report_generator", runId: "run-3", taskId: "generate_report", environment: "production", timestamp: subHours(new Date(), 4).toISOString() },
    ],
  },
  "err-2": {
    id: "err-2",
    exceptionType: "DataValidationError",
    message: "Column 'revenue' contains null values in 234 rows, expected non-null",
    occurrenceCount: 12,
    firstSeenAt: subDays(new Date(), 1).toISOString(),
    lastSeenAt: subHours(new Date(), 3).toISOString(),
    status: "OPEN",
    stacktrace: `Traceback (most recent call last):
  File "/opt/airflow/dags/tasks/validation.py", line 89, in validate_schema
    raise DataValidationError(f"Column '{col}' contains null values in {null_count} rows, expected non-null")
tasks.validation.DataValidationError: Column 'revenue' contains null values in 234 rows, expected non-null`,
    occurrences: [
      { id: "occ-4", dagId: "etl_daily_sales", runId: "run-12", taskId: "validate_data", environment: "production", timestamp: subHours(new Date(), 1).toISOString() },
      { id: "occ-5", dagId: "etl_daily_sales", runId: "run-11", taskId: "validate_data", environment: "staging", timestamp: subHours(new Date(), 7).toISOString() },
    ],
  },
  "err-3": {
    id: "err-3",
    exceptionType: "TimeoutError",
    message: "Query execution exceeded 300s timeout limit on table 'events_raw'",
    occurrenceCount: 8,
    firstSeenAt: subDays(new Date(), 3).toISOString(),
    lastSeenAt: subHours(new Date(), 6).toISOString(),
    status: "OPEN",
    stacktrace: `Traceback (most recent call last):
  File "/opt/airflow/dags/clickstream_aggregator.py", line 78, in aggregate_events
    result = cursor.execute(query, timeout=300)
  File "/usr/local/lib/python3.10/site-packages/snowflake/connector/cursor.py", line 891, in execute
    raise TimeoutError("Query execution exceeded timeout limit")
TimeoutError: Query execution exceeded 300s timeout limit on table 'events_raw'`,
    occurrences: [
      { id: "occ-6", dagId: "clickstream_aggregator", runId: "run-15", taskId: "aggregate_events", environment: "staging", timestamp: subHours(new Date(), 5).toISOString() },
      { id: "occ-7", dagId: "ml_feature_pipeline", runId: "run-16", taskId: "build_features", environment: "staging", timestamp: subHours(new Date(), 10).toISOString() },
    ],
  },
  "err-4": {
    id: "err-4",
    exceptionType: "S3AccessDenied",
    message: "Access Denied: Unable to read from s3://data-lake-prod/raw/events/",
    occurrenceCount: 3,
    firstSeenAt: subHours(new Date(), 14).toISOString(),
    lastSeenAt: subHours(new Date(), 12).toISOString(),
    status: "OPEN",
    stacktrace: `Traceback (most recent call last):
  File "/opt/airflow/dags/tasks/s3_utils.py", line 45, in read_from_s3
    response = s3_client.get_object(Bucket=bucket, Key=key)
botocore.exceptions.ClientError: An error occurred (AccessDenied) when calling the GetObject operation: Access Denied`,
    occurrences: [
      { id: "occ-8", dagId: "fraud_detection_batch", runId: "run-14", taskId: "load_events", environment: "production", timestamp: subHours(new Date(), 2).toISOString() },
    ],
  },
}

// ============================================================================
// MOCK API KEYS
// ============================================================================

export const mockApiKeys = [
  {
    id: "key-1",
    name: "Prod Airflow Key",
    type: "airflow",
    environmentId: "env-prod",
    environment: { id: "env-prod", name: "production" },
    keyPrefix: "gr_prod_...",
    createdAt: subDays(new Date(), 30).toISOString(),
    lastUsedAt: subDays(new Date(), 1).toISOString(),
  },
  {
    id: "key-2",
    name: "Staging Airflow Key",
    type: "airflow",
    environmentId: "env-staging",
    environment: { id: "env-staging", name: "staging" },
    keyPrefix: "gr_stag_...",
    createdAt: subDays(new Date(), 15).toISOString(),
    lastUsedAt: null,
  },
]

// ============================================================================
// MOCK DAG DETAILS (for individual dag pages)
// ============================================================================

export const mockDagDetails: Record<string, {
  dagId: string
  description: string
  owner: string
  schedule: string
  lastStatus: string
  successRate: number
  totalRuns: number
  avgDuration: number
  avgRows: number
  recentRuns: typeof mockDagRuns
  errors: typeof mockRecentErrors
  envStatuses: Array<{ 
    environment: string; 
    lastStatus: string; 
    lastRunTime: string;
    openErrorCount: number;
    openAlertCount: number;
  }>
}> = {
  "etl_daily_sales": {
    dagId: "etl_daily_sales",
    description: "Extract, transform, and load daily sales data from multiple sources",
    owner: "data-team",
    schedule: "0 6 * * *",
    lastStatus: "failed",
    successRate: 94.2,
    totalRuns: 847,
    avgDuration: 342000,
    avgRows: 125000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "etl_daily_sales"),
    errors: mockRecentErrors.slice(0, 2),
    envStatuses: [
      { environment: "production", lastStatus: "failed", lastRunTime: subHours(new Date(), 1).toISOString(), openErrorCount: 2, openAlertCount: 0 },
      { environment: "staging", lastStatus: "failed", lastRunTime: subHours(new Date(), 7).toISOString(), openErrorCount: 1, openAlertCount: 1 },
    ],
  },
  "sync_customer_data": {
    dagId: "sync_customer_data",
    description: "Synchronize customer data from CRM to data warehouse",
    owner: "crm-team",
    schedule: "0 */4 * * *",
    lastStatus: "failed",
    successRate: 98.5,
    totalRuns: 412,
    avgDuration: 180000,
    avgRows: 45000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "sync_customer_data"),
    errors: [],
    envStatuses: [
      { environment: "production", lastStatus: "failed", lastRunTime: subMinutes(new Date(), 30).toISOString(), openErrorCount: 1, openAlertCount: 1 },
      { environment: "staging", lastStatus: "failed", lastRunTime: subHours(new Date(), 3).toISOString(), openErrorCount: 0, openAlertCount: 0 },
    ],
  },
  "report_generator": {
    dagId: "report_generator",
    description: "Generate and distribute daily business reports",
    owner: "analytics-team",
    schedule: "0 8 * * 1-5",
    lastStatus: "failed",
    successRate: 78.3,
    totalRuns: 156,
    avgDuration: 720000,
    avgRows: 890000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "report_generator"),
    errors: mockRecentErrors.slice(0, 1),
    envStatuses: [
      { environment: "production", lastStatus: "failed", lastRunTime: subHours(new Date(), 4).toISOString(), openErrorCount: 1, openAlertCount: 0 },
      { environment: "staging", lastStatus: "success", lastRunTime: subHours(new Date(), 12).toISOString(), openErrorCount: 0, openAlertCount: 0 },
    ],
  },
  "data_quality_checks": {
    dagId: "data_quality_checks",
    description: "Run data quality and integrity checks across all tables",
    owner: "data-team",
    schedule: "*/15 * * * *",
    lastStatus: "success",
    successRate: 99.1,
    totalRuns: 1200,
    avgDuration: 45000,
    avgRows: 0,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "data_quality_checks"),
    errors: [],
    envStatuses: [
      { environment: "production", lastStatus: "success", lastRunTime: subMinutes(new Date(), 12).toISOString(), openErrorCount: 0, openAlertCount: 0 },
    ],
  },
  "ml_feature_pipeline": {
    dagId: "ml_feature_pipeline",
    description: "Build features for machine learning models",
    owner: "ml-team",
    schedule: "0 2 * * *",
    lastStatus: "running",
    successRate: 92.8,
    totalRuns: 89,
    avgDuration: 1800000,
    avgRows: 2500000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "ml_feature_pipeline"),
    errors: mockRecentErrors.slice(2, 3),
    envStatuses: [
      { environment: "production", lastStatus: "running", lastRunTime: subMinutes(new Date(), 15).toISOString(), openErrorCount: 0, openAlertCount: 0 },
      { environment: "staging", lastStatus: "failed", lastRunTime: subHours(new Date(), 10).toISOString(), openErrorCount: 1, openAlertCount: 0 },
    ],
  },
  "clickstream_aggregator": {
    dagId: "clickstream_aggregator",
    description: "Aggregate raw clickstream events into sessions",
    owner: "analytics-team",
    schedule: "0 * * * *",
    lastStatus: "success",
    successRate: 96.4,
    totalRuns: 672,
    avgDuration: 240000,
    avgRows: 780000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "clickstream_aggregator"),
    errors: mockRecentErrors.slice(2, 3),
    envStatuses: [
      { environment: "production", lastStatus: "success", lastRunTime: subMinutes(new Date(), 45).toISOString(), openErrorCount: 0, openAlertCount: 0 },
      { environment: "staging", lastStatus: "failed", lastRunTime: subHours(new Date(), 5).toISOString(), openErrorCount: 1, openAlertCount: 0 },
    ],
  },
  "inventory_sync": {
    dagId: "inventory_sync",
    description: "Sync inventory levels between warehouse and storefront",
    owner: "ops-team",
    schedule: "*/5 * * * *",
    lastStatus: "success",
    successRate: 99.8,
    totalRuns: 2100,
    avgDuration: 60000,
    avgRows: 12000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "inventory_sync"),
    errors: [],
    envStatuses: [
      { environment: "production", lastStatus: "success", lastRunTime: subMinutes(new Date(), 3).toISOString(), openErrorCount: 0, openAlertCount: 0 },
    ],
  },
  "fraud_detection_batch": {
    dagId: "fraud_detection_batch",
    description: "Batch processing for fraud detection scoring",
    owner: "security-team",
    schedule: "0 */2 * * *",
    lastStatus: "success",
    successRate: 97.2,
    totalRuns: 336,
    avgDuration: 420000,
    avgRows: 340000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "fraud_detection_batch"),
    errors: mockRecentErrors.slice(3, 4),
    envStatuses: [
      { environment: "production", lastStatus: "success", lastRunTime: subHours(new Date(), 1.5).toISOString(), openErrorCount: 1, openAlertCount: 0 },
      { environment: "staging", lastStatus: "success", lastRunTime: subHours(new Date(), 10).toISOString(), openErrorCount: 0, openAlertCount: 0 },
    ],
  },
}

// ============================================================================
// MOCK DAG ALERTS (for DagsTable component)
// ============================================================================

export const mockDagAlerts: Record<string, { count: number; hasCritical: boolean; alertId: string }> = {
  "etl_daily_sales": {
    count: 1,
    hasCritical: true,
    alertId: "alert-6"
  },
  "sync_customer_data": {
    count: 1,
    hasCritical: false,
    alertId: "alert-1"
  },
}
