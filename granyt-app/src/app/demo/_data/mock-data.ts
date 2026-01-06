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
    totalRuns: 15,
    activeDags: 10,
    failedRuns: 1,
    rowsProcessed: 1250000,
  },
  [Timeframe.Week]: {
    totalRuns: 105,
    activeDags: 10,
    failedRuns: 4,
    rowsProcessed: 8750000,
  },
  [Timeframe.Month]: {
    totalRuns: 450,
    activeDags: 10,
    failedRuns: 12,
    rowsProcessed: 37500000,
  },
  [Timeframe.AllTime]: {
    totalRuns: 1200,
    activeDags: 10,
    failedRuns: 25,
    rowsProcessed: 100000000,
  },
}

// ============================================================================
// MOCK DAGS
// ============================================================================

export const mockDags = [
  {
    id: "dag-1",
    dagId: "marketing_analytics_pipeline",
    lastStatus: "failed",
    successRate: 92.5,
    totalRuns: 15,
    avgDuration: 420,
    avgRows: 100000,
    schedule: "@daily",
    lastRunTime: subHours(new Date(), 2).toISOString(),
    lastRunId: "run-1",
    alertInfo: {
      count: 1,
      hasCritical: false,
      alertId: "alert-1"
    }
  },
  {
    id: "dag-2",
    dagId: "sales_reporting_pipeline",
    lastStatus: "success",
    successRate: 98.0,
    totalRuns: 6,
    avgDuration: 300,
    avgRows: 50000,
    schedule: "@daily",
    lastRunTime: subHours(new Date(), 4).toISOString(),
    lastRunId: "run-2",
  },
  {
    id: "dag-3",
    dagId: "customer_churn_prediction",
    lastStatus: "success",
    successRate: 100,
    totalRuns: 7,
    avgDuration: 360,
    avgRows: 50000,
    schedule: "@daily",
    lastRunTime: subHours(new Date(), 1).toISOString(),
    lastRunId: "run-3",
  },
  {
    id: "dag-4",
    dagId: "daily_inventory_update",
    lastStatus: "success",
    successRate: 100,
    totalRuns: 7,
    avgDuration: 180,
    avgRows: 100000,
    schedule: "@daily",
    lastRunTime: subHours(new Date(), 3).toISOString(),
    lastRunId: "run-4",
  },
  {
    id: "dag-5",
    dagId: "marketing_campaign_sync",
    lastStatus: "success",
    successRate: 100,
    totalRuns: 24,
    avgDuration: 120,
    avgRows: 5000,
    schedule: "@hourly",
    lastRunTime: subMinutes(new Date(), 30).toISOString(),
    lastRunId: "run-5",
  },
  {
    id: "dag-6",
    dagId: "financial_reconciliation",
    lastStatus: "success",
    successRate: 100,
    totalRuns: 7,
    avgDuration: 240,
    avgRows: 25000,
    schedule: "@daily",
    lastRunTime: subHours(new Date(), 5).toISOString(),
    lastRunId: "run-6",
  },
  {
    id: "dag-7",
    dagId: "user_behavior_analysis",
    lastStatus: "success",
    successRate: 100,
    totalRuns: 7,
    avgDuration: 520,
    avgRows: 1000000,
    schedule: "@daily",
    lastRunTime: subHours(new Date(), 6).toISOString(),
    lastRunId: "run-7",
  },
  {
    id: "dag-8",
    dagId: "log_aggregation_pipeline",
    lastStatus: "success",
    successRate: 100,
    totalRuns: 24,
    avgDuration: 210,
    avgRows: 500000,
    schedule: "@hourly",
    lastRunTime: subMinutes(new Date(), 15).toISOString(),
    lastRunId: "run-8",
  },
  {
    id: "dag-9",
    dagId: "real_time_fraud_detection",
    lastStatus: "success",
    successRate: 100,
    totalRuns: 24,
    avgDuration: 15,
    avgRows: 100,
    schedule: "@hourly",
    lastRunTime: subMinutes(new Date(), 5).toISOString(),
    lastRunId: "run-9",
  },
  {
    id: "dag-10",
    dagId: "user_analytics_pipeline",
    lastStatus: "success",
    successRate: 100,
    totalRuns: 30,
    avgDuration: 600,
    avgRows: 150000,
    schedule: "@daily",
    lastRunTime: subHours(new Date(), 12).toISOString(),
    lastRunId: "run-10",
  },
]

// ============================================================================
// MOCK DAG RUNS
// ============================================================================

export const mockDagRuns = [
  {
    id: "run-1",
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-30T06:00:00",
    status: "failed",
    startTime: subHours(new Date(), 2).toISOString(),
    endTime: subHours(new Date(), 1.9).toISOString(),
    duration: 420,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 45000,
    taskCount: 8,
    errorCount: 1,
    schedule: "@daily",
  },
  {
    id: "run-2",
    srcDagId: "sales_reporting_pipeline",
    srcRunId: "scheduled__2024-12-30T04:00:00",
    status: "success",
    startTime: subHours(new Date(), 1).toISOString(),
    endTime: subMinutes(new Date(), 57).toISOString(),
    duration: 180,
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
    status: "success",
    startTime: subHours(new Date(), 4).toISOString(),
    endTime: subHours(new Date(), 3.8).toISOString(),
    duration: 720,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 890000,
    taskCount: 12,
    errorCount: 0,
    schedule: "0 8 * * 1-5",
  },
  {
    id: "run-4",
    srcDagId: "data_quality_checks",
    srcRunId: "scheduled__2024-12-30T12:15:00",
    status: "success",
    startTime: subMinutes(new Date(), 12).toISOString(),
    endTime: subMinutes(new Date(), 11).toISOString(),
    duration: 42,
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
    duration: 240,
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
    duration: 58,
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
    duration: 390,
    runType: "manual",
    environment: "production",
    rowsProcessed: 356000,
    taskCount: 10,
    errorCount: 0,
    schedule: "0 */2 * * *",
  },
  {
    id: "run-9",
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "backfill__2024-12-29",
    status: "success",
    startTime: subHours(new Date(), 8).toISOString(),
    endTime: subHours(new Date(), 7.9).toISOString(),
    duration: 380,
    runType: "backfill",
    environment: "staging",
    rowsProcessed: 118000,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-10",
    srcDagId: "sales_reporting_pipeline",
    srcRunId: "manual__2024-12-30T09:00:00",
    status: "success",
    startTime: subHours(new Date(), 3).toISOString(),
    endTime: subHours(new Date(), 2.95).toISOString(),
    duration: 180,
    runType: "manual",
    environment: "staging",
    rowsProcessed: 45000,
    taskCount: 5,
    errorCount: 0,
    schedule: "0 */4 * * *",
  },
  {
    id: "run-11",
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-30T05:00:00",
    status: "failed",
    startTime: subHours(new Date(), 7).toISOString(),
    endTime: subHours(new Date(), 6.9).toISOString(),
    duration: 420,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 45000,
    taskCount: 8,
    errorCount: 1,
    schedule: "0 6 * * *",
  },
  {
    id: "run-12",
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-30T11:00:00",
    status: "failed",
    startTime: subHours(new Date(), 1).toISOString(),
    endTime: subHours(new Date(), 0.9).toISOString(),
    duration: 360,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    taskCount: 8,
    errorCount: 1,
    schedule: "0 6 * * *",
  },
  {
    id: "run-13",
    srcDagId: "sales_reporting_pipeline",
    srcRunId: "scheduled__2024-12-30T12:00:00",
    status: "success",
    startTime: subMinutes(new Date(), 30).toISOString(),
    endTime: subMinutes(new Date(), 25).toISOString(),
    duration: 300,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 45000,
    taskCount: 5,
    errorCount: 0,
    schedule: "0 */4 * * *",
  },
  {
    id: "run-14",
    srcDagId: "fraud_detection_batch",
    srcRunId: "scheduled__2024-12-30T10:00:00",
    status: "success",
    startTime: subHours(new Date(), 2).toISOString(),
    endTime: subHours(new Date(), 1.9).toISOString(),
    duration: 360,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 340000,
    taskCount: 10,
    errorCount: 0,
    schedule: "0 */2 * * *",
  },
  {
    id: "run-15",
    srcDagId: "clickstream_aggregator",
    srcRunId: "scheduled__2024-12-30T07:00:00",
    status: "success",
    startTime: subHours(new Date(), 5).toISOString(),
    endTime: subHours(new Date(), 4.9).toISOString(),
    duration: 360,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 780000,
    taskCount: 6,
    errorCount: 0,
    schedule: "0 * * * *",
  },
  {
    id: "run-16",
    srcDagId: "ml_feature_pipeline",
    srcRunId: "scheduled__2024-12-30T02:00:00",
    status: "success",
    startTime: subHours(new Date(), 10).toISOString(),
    endTime: subHours(new Date(), 9.9).toISOString(),
    duration: 360,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 2500000,
    taskCount: 24,
    errorCount: 0,
    schedule: "0 2 * * *",
  },
  // Historical runs - Day 1 (yesterday)
  {
    id: "run-17",
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-29T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 1).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -0.1).toISOString(),
    duration: 340,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 132000,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-18",
    srcDagId: "sales_reporting_pipeline",
    srcRunId: "scheduled__2024-12-29T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 1), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -2.05).toISOString(),
    duration: 175,
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
    duration: 250,
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
    duration: 400,
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
    duration: 700,
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
    duration: 1750,
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
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-28T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 2).toISOString(),
    endTime: subHours(subDays(new Date(), 2), -0.1).toISOString(),
    duration: 355,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 129500,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-24",
    srcDagId: "sales_reporting_pipeline",
    srcRunId: "scheduled__2024-12-28T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 2), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 2), -2.05).toISOString(),
    duration: 182,
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
    duration: 350,
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
    duration: 410,
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
    duration: 720,
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
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-27T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 3).toISOString(),
    endTime: subHours(subDays(new Date(), 3), -0.1).toISOString(),
    duration: 338,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 131200,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-29",
    srcDagId: "sales_reporting_pipeline",
    srcRunId: "scheduled__2024-12-27T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 3), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 3), -2.05).toISOString(),
    duration: 178,
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
    duration: 1100,
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
    duration: 695,
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
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-26T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 4).toISOString(),
    endTime: subHours(subDays(new Date(), 4), -0.1).toISOString(),
    duration: 345,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 128700,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-33",
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-25T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 5).toISOString(),
    endTime: subHours(subDays(new Date(), 5), -0.1).toISOString(),
    duration: 320,
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
    duration: 395,
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
    duration: 245,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 805000,
    taskCount: 6,
    errorCount: 0,
    schedule: "0 * * * *",
  },
  {
    id: "run-36",
    srcDagId: "sales_reporting_pipeline",
    srcRunId: "scheduled__2024-12-26T12:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 4), -6).toISOString(),
    endTime: subHours(subDays(new Date(), 4), -6.05).toISOString(),
    duration: 185,
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
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-23T06:00:00",
    status: "failed",
    startTime: subDays(new Date(), 7).toISOString(),
    endTime: subHours(subDays(new Date(), 7), -0.15).toISOString(),
    duration: 520,
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
    duration: 1820,
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
    duration: 45,
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
    duration: 55,
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
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-16T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 14).toISOString(),
    endTime: subHours(subDays(new Date(), 14), -0.1).toISOString(),
    duration: 348,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 135000,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-42",
    srcDagId: "sales_reporting_pipeline",
    srcRunId: "scheduled__2024-12-16T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 14), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 14), -2.05).toISOString(),
    duration: 176,
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
    duration: 290,
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
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-29T06:00:00",
    status: "success",
    startTime: subDays(new Date(), 1).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -0.12).toISOString(),
    duration: 420,
    runType: "scheduled",
    environment: "staging",
    rowsProcessed: 52000,
    taskCount: 8,
    errorCount: 0,
    schedule: "0 6 * * *",
  },
  {
    id: "run-45",
    srcDagId: "sales_reporting_pipeline",
    srcRunId: "scheduled__2024-12-29T08:00:00",
    status: "success",
    startTime: subHours(subDays(new Date(), 1), -2).toISOString(),
    endTime: subHours(subDays(new Date(), 1), -2.06).toISOString(),
    duration: 210,
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
    duration: 2100,
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
    duration: 280,
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
    duration: 450,
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
    srcDagId: "marketing_analytics_pipeline",
    captureId: "marketing_analytics_pipeline.extract_marketing_data",
    status: "OPEN",
    severity: "warning",
    metadata: {
      current: 45000,
      baseline: 100000,
      dropPercentage: 55,
      confidence: "high",
      baselineType: "cohort",
      runsAnalyzed: 14,
      threshold: "MEDIUM",
    },
    createdAt: subHours(new Date(), 2).toISOString(),
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
    status: "resolved",
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
    status: "resolved",
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
    srcDagId: "marketing_analytics_pipeline",
    captureId: "capture-999",
    status: "resolved",
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
    srcDagId: "marketing_analytics_pipeline",
    captureId: "marketing_analytics_pipeline.extract_orders",
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
    srcDagId: "sales_reporting_pipeline",
    captureId: "sales_reporting_pipeline.load_customers",
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
    status: "resolved",
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
    status: "resolved",
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
  [Timeframe.Day]: { total: 1, critical: 0 },
  [Timeframe.Week]: { total: 5, critical: 1 },
  [Timeframe.Month]: { total: 10, critical: 2 },
  [Timeframe.AllTime]: { total: 25, critical: 5 },
}

// ============================================================================
// MOCK RECENT ERRORS
// ============================================================================

export const mockRecentErrors = [
  {
    id: "err-1",
    exceptionType: "pyspark.sql.utils.AnalysisException",
    message: "[TABLE_OR_VIEW_NOT_FOUND] The table or view `raw_data`.`incoming_events` cannot be found. Verify the spelling and correctness of the schema and catalog. If you did not qualify the name with a schema, verify the current_schema() output, or qualify the name with the correct schema and catalog. To tolerate the error on drop use DROP VIEW IF EXISTS or DROP TABLE IF EXISTS.",
    occurrenceCount: 2,
    dagCount: 2,
    lastSeenAt: subHours(new Date(), 2).toISOString(),
    firstSeenAt: subHours(new Date(), 4).toISOString(),
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
    status: "resolved",
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
    status: "resolved",
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
    status: "resolved",
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
    status: "resolved",
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
    status: "resolved",
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
    status: "resolved",
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
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-30T06:00:00",
    status: "failed",
    startTime: subHours(new Date(), 2).toISOString(),
    endTime: subHours(new Date(), 1.9).toISOString(),
    duration: 360,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 127500,
    tasks: [
      { taskId: "extract_orders", status: "success", startTime: subHours(new Date(), 2).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -5).toISOString(), duration: 45, upstreamTaskIds: [], errorId: null },
      { taskId: "extract_customers", status: "success", startTime: subHours(new Date(), 2).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -3).toISOString(), duration: 30, upstreamTaskIds: [], errorId: null },
      { taskId: "transform_orders", status: "success", startTime: subMinutes(subHours(new Date(), 2), -5).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -8).toISOString(), duration: 60, upstreamTaskIds: ["extract_orders", "extract_customers"], errorId: null },
      { taskId: "validate_data", status: "success", startTime: subMinutes(subHours(new Date(), 2), -8).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -9).toISOString(), duration: 15, upstreamTaskIds: ["transform_orders"], errorId: null },
      { taskId: "load_staging", status: "success", startTime: subMinutes(subHours(new Date(), 2), -9).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -11).toISOString(), duration: 45, upstreamTaskIds: ["validate_data"], errorId: null },
      { taskId: "load_production", status: "failed", startTime: subMinutes(subHours(new Date(), 2), -11).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -13).toISOString(), duration: 60, upstreamTaskIds: ["load_staging"], errorId: "err-1" },
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
    status: "success",
    startTime: subHours(new Date(), 4).toISOString(),
    endTime: subHours(new Date(), 3.8).toISOString(),
    duration: 720,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 890000,
    tasks: [
      { taskId: "fetch_data", status: "success", startTime: subHours(new Date(), 4).toISOString(), endTime: subMinutes(subHours(new Date(), 4), -3).toISOString(), duration: 60, upstreamTaskIds: [], errorId: null },
      { taskId: "aggregate_metrics", status: "success", startTime: subMinutes(subHours(new Date(), 4), -3).toISOString(), endTime: subMinutes(subHours(new Date(), 4), -6).toISOString(), duration: 120, upstreamTaskIds: ["fetch_data"], errorId: null },
      { taskId: "generate_report", status: "success", startTime: subMinutes(subHours(new Date(), 4), -6).toISOString(), endTime: subMinutes(subHours(new Date(), 4), -8).toISOString(), duration: 90, upstreamTaskIds: ["aggregate_metrics"], errorId: null },
      { taskId: "send_email", status: "success", startTime: subMinutes(subHours(new Date(), 4), -8).toISOString(), endTime: subMinutes(subHours(new Date(), 4), -9).toISOString(), duration: 30, upstreamTaskIds: ["generate_report"], errorId: null },
    ],
    captures: [
      { id: "cap-4", capturePointId: "raw_metrics", rowCount: 89000, capturedAt: subMinutes(subHours(new Date(), 4), -3).toISOString(), position: "source" },
    ],
  },
  "run-2": {
    id: "run-2",
    srcDagId: "sales_reporting_pipeline",
    srcRunId: "scheduled__2024-12-30T04:00:00",
    status: "success",
    startTime: subHours(new Date(), 1).toISOString(),
    endTime: subMinutes(new Date(), 57).toISOString(),
    duration: 180,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 43200,
    tasks: [
      { taskId: "extract_crm", status: "success", startTime: subHours(new Date(), 1).toISOString(), endTime: subMinutes(subHours(new Date(), 1), -2).toISOString(), duration: 60, upstreamTaskIds: [], errorId: null },
      { taskId: "transform_customers", status: "success", startTime: subMinutes(subHours(new Date(), 1), -2).toISOString(), endTime: subMinutes(subHours(new Date(), 1), -4).toISOString(), duration: 45, upstreamTaskIds: ["extract_crm"], errorId: null },
      { taskId: "load_customers", status: "success", startTime: subMinutes(subHours(new Date(), 1), -4).toISOString(), endTime: subMinutes(new Date(), 57).toISOString(), duration: 75, upstreamTaskIds: ["transform_customers"], errorId: null },
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
    duration: 42,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    tasks: [
      { taskId: "check_nulls", status: "success", startTime: subMinutes(new Date(), 12).toISOString(), endTime: subMinutes(new Date(), 11.5).toISOString(), duration: 15, upstreamTaskIds: [], errorId: null },
      { taskId: "check_duplicates", status: "success", startTime: subMinutes(new Date(), 11.5).toISOString(), endTime: subMinutes(new Date(), 11).toISOString(), duration: 27, upstreamTaskIds: ["check_nulls"], errorId: null },
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
      { taskId: "extract_events", status: "success", startTime: subMinutes(new Date(), 15).toISOString(), endTime: subMinutes(new Date(), 10).toISOString(), duration: 300, upstreamTaskIds: [], errorId: null },
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
    duration: 240,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 812000,
    tasks: [
      { taskId: "read_clickstream", status: "success", startTime: subMinutes(new Date(), 45).toISOString(), endTime: subMinutes(new Date(), 43).toISOString(), duration: 120, upstreamTaskIds: [], errorId: null },
      { taskId: "aggregate_sessions", status: "success", startTime: subMinutes(new Date(), 43).toISOString(), endTime: subMinutes(new Date(), 41).toISOString(), duration: 120, upstreamTaskIds: ["read_clickstream"], errorId: null },
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
    duration: 58,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 11800,
    tasks: [
      { taskId: "fetch_inventory", status: "success", startTime: subMinutes(new Date(), 3).toISOString(), endTime: subMinutes(new Date(), 2.5).toISOString(), duration: 30, upstreamTaskIds: [], errorId: null },
      { taskId: "sync_warehouse", status: "success", startTime: subMinutes(new Date(), 2.5).toISOString(), endTime: subMinutes(new Date(), 2).toISOString(), duration: 28, upstreamTaskIds: ["fetch_inventory"], errorId: null },
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
    duration: 390,
    runType: "manual",
    environment: "production",
    rowsProcessed: 356000,
    tasks: [
      { taskId: "load_transactions", status: "success", startTime: subHours(new Date(), 1.5).toISOString(), endTime: subMinutes(subHours(new Date(), 1.5), -3).toISOString(), duration: 120, upstreamTaskIds: [], errorId: null },
      { taskId: "score_fraud", status: "success", startTime: subMinutes(subHours(new Date(), 1.5), -3).toISOString(), endTime: subMinutes(subHours(new Date(), 1.5), -5).toISOString(), duration: 180, upstreamTaskIds: ["load_transactions"], errorId: null },
      { taskId: "flag_suspicious", status: "success", startTime: subMinutes(subHours(new Date(), 1.5), -5).toISOString(), endTime: subHours(new Date(), 1.4).toISOString(), duration: 90, upstreamTaskIds: ["score_fraud"], errorId: null },
    ],
    captures: [
      { id: "cap-12", capturePointId: "transactions", rowCount: 400000, capturedAt: subMinutes(subHours(new Date(), 1.5), -3).toISOString(), position: "source" },
      { id: "cap-13", capturePointId: "scored_transactions", rowCount: 356000, capturedAt: subHours(new Date(), 1.4).toISOString(), position: "destination" },
    ],
  },
  "run-12": {
    id: "run-12",
    srcDagId: "marketing_analytics_pipeline",
    srcRunId: "scheduled__2024-12-30T11:00:00",
    status: "failed",
    startTime: subHours(new Date(), 1).toISOString(),
    endTime: subHours(new Date(), 0.9).toISOString(),
    duration: 360,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 0,
    tasks: [
      { taskId: "extract_orders", status: "failed", startTime: subHours(new Date(), 1).toISOString(), endTime: subMinutes(subHours(new Date(), 1), -3).toISOString(), duration: 180, upstreamTaskIds: [], errorId: "err-1" },
      { taskId: "extract_customers", status: "upstream_failed", startTime: null, endTime: null, duration: null, upstreamTaskIds: [], errorId: null },
      { taskId: "transform_orders", status: "upstream_failed", startTime: null, endTime: null, duration: null, upstreamTaskIds: ["extract_orders", "extract_customers"], errorId: null },
    ],
    captures: [],
  },
  "run-13": {
    id: "run-13",
    srcDagId: "sales_reporting_pipeline",
    srcRunId: "scheduled__2024-12-30T12:00:00",
    status: "success",
    startTime: subMinutes(new Date(), 30).toISOString(),
    endTime: subMinutes(new Date(), 25).toISOString(),
    duration: 300,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 45000,
    tasks: [
      { taskId: "extract_crm", status: "success", startTime: subMinutes(new Date(), 30).toISOString(), endTime: subMinutes(new Date(), 28).toISOString(), duration: 120, upstreamTaskIds: [], errorId: null },
      { taskId: "transform_customers", status: "success", startTime: subMinutes(new Date(), 28).toISOString(), endTime: subMinutes(new Date(), 26).toISOString(), duration: 120, upstreamTaskIds: ["extract_crm"], errorId: null },
      { taskId: "load_customers", status: "success", startTime: subMinutes(new Date(), 26).toISOString(), endTime: subMinutes(new Date(), 25).toISOString(), duration: 60, upstreamTaskIds: ["transform_customers"], errorId: null },
    ],
    captures: [
      { id: "cap-14", capturePointId: "raw_customers", rowCount: 45000, capturedAt: subMinutes(new Date(), 28).toISOString(), position: "source" },
    ],
  },
  "run-14": {
    id: "run-14",
    srcDagId: "fraud_detection_batch",
    srcRunId: "scheduled__2024-12-30T10:00:00",
    status: "success",
    startTime: subHours(new Date(), 2).toISOString(),
    endTime: subHours(new Date(), 1.9).toISOString(),
    duration: 360,
    runType: "scheduled",
    environment: "production",
    rowsProcessed: 340000,
    tasks: [
      { taskId: "load_transactions", status: "success", startTime: subHours(new Date(), 2).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -2).toISOString(), duration: 120, upstreamTaskIds: [], errorId: null },
      { taskId: "load_events", status: "success", startTime: subMinutes(subHours(new Date(), 2), -2).toISOString(), endTime: subMinutes(subHours(new Date(), 2), -4).toISOString(), duration: 120, upstreamTaskIds: [], errorId: null },
      { taskId: "score_fraud", status: "success", startTime: subMinutes(subHours(new Date(), 2), -4).toISOString(), endTime: subHours(new Date(), 1.9).toISOString(), duration: 120, upstreamTaskIds: ["load_transactions", "load_events"], errorId: null },
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
    status: "resolved",
    stacktrace: `Traceback (most recent call last):
  File "/opt/airflow/dags/marketing_analytics_pipeline.py", line 142, in execute
    connection = psycopg2.connect(**db_config)
  File "/usr/local/lib/python3.10/site-packages/psycopg2/__init__.py", line 122, in connect
    conn = _connect(dsn, connection_factory=connection_factory, **kwasync)
psycopg2.OperationalError: could not connect to server: Connection refused
    Is the server running on host "db-prod.internal" and accepting
    TCP/IP connections on port 5432?`,
    occurrences: [
      { id: "occ-1", dagId: "marketing_analytics_pipeline", runId: "run-12", taskId: "extract_orders", environment: "production", timestamp: subHours(new Date(), 1).toISOString() },
      { id: "occ-2", dagId: "sales_reporting_pipeline", runId: "run-13", taskId: "load_customers", environment: "production", timestamp: subMinutes(new Date(), 30).toISOString() },
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
    status: "resolved",
    stacktrace: `Traceback (most recent call last):
  File "/opt/airflow/dags/tasks/validation.py", line 89, in validate_schema
    raise DataValidationError(f"Column '{col}' contains null values in {null_count} rows, expected non-null")
tasks.validation.DataValidationError: Column 'revenue' contains null values in 234 rows, expected non-null`,
    occurrences: [
      { id: "occ-4", dagId: "marketing_analytics_pipeline", runId: "run-12", taskId: "validate_data", environment: "production", timestamp: subHours(new Date(), 1).toISOString() },
      { id: "occ-5", dagId: "marketing_analytics_pipeline", runId: "run-11", taskId: "validate_data", environment: "staging", timestamp: subHours(new Date(), 7).toISOString() },
    ],
  },
  "err-3": {
    id: "err-3",
    exceptionType: "TimeoutError",
    message: "Query execution exceeded 300s timeout limit on table 'events_raw'",
    occurrenceCount: 8,
    firstSeenAt: subDays(new Date(), 3).toISOString(),
    lastSeenAt: subHours(new Date(), 6).toISOString(),
    status: "resolved",
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
    status: "resolved",
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
  "marketing_analytics_pipeline": {
    dagId: "marketing_analytics_pipeline",
    description: "Extract, transform, and load daily sales data from multiple sources",
    owner: "data-team",
    schedule: "0 6 * * *",
    lastStatus: "failed",
    successRate: 94.2,
    totalRuns: 847,
    avgDuration: 342,
    avgRows: 125000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "marketing_analytics_pipeline"),
    errors: mockRecentErrors.slice(0, 2),
    envStatuses: [
      { environment: "production", lastStatus: "failed", lastRunTime: subHours(new Date(), 1).toISOString(), openErrorCount: 1, openAlertCount: 1 },
      { environment: "staging", lastStatus: "success", lastRunTime: subHours(new Date(), 7).toISOString(), openErrorCount: 0, openAlertCount: 0 },
    ],
  },
  "sales_reporting_pipeline": {
    dagId: "sales_reporting_pipeline",
    description: "Synchronize customer data from CRM to data warehouse",
    owner: "crm-team",
    schedule: "0 */4 * * *",
    lastStatus: "success",
    successRate: 98.5,
    totalRuns: 412,
    avgDuration: 180,
    avgRows: 45000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "sales_reporting_pipeline"),
    errors: [],
    envStatuses: [
      { environment: "production", lastStatus: "success", lastRunTime: subMinutes(new Date(), 30).toISOString(), openErrorCount: 0, openAlertCount: 0 },
      { environment: "staging", lastStatus: "success", lastRunTime: subHours(new Date(), 3).toISOString(), openErrorCount: 0, openAlertCount: 0 },
    ],
  },
  "report_generator": {
    dagId: "report_generator",
    description: "Generate and distribute daily business reports",
    owner: "analytics-team",
    schedule: "0 8 * * 1-5",
    lastStatus: "success",
    successRate: 78.3,
    totalRuns: 156,
    avgDuration: 720,
    avgRows: 890000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "report_generator"),
    errors: mockRecentErrors.slice(0, 1),
    envStatuses: [
      { environment: "production", lastStatus: "success", lastRunTime: subHours(new Date(), 4).toISOString(), openErrorCount: 0, openAlertCount: 0 },
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
    avgDuration: 45,
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
    avgDuration: 1800,
    avgRows: 2500000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "ml_feature_pipeline"),
    errors: mockRecentErrors.slice(2, 3),
    envStatuses: [
      { environment: "production", lastStatus: "running", lastRunTime: subMinutes(new Date(), 15).toISOString(), openErrorCount: 0, openAlertCount: 0 },
      { environment: "staging", lastStatus: "success", lastRunTime: subHours(new Date(), 10).toISOString(), openErrorCount: 0, openAlertCount: 0 },
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
    avgDuration: 240,
    avgRows: 780000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "clickstream_aggregator"),
    errors: mockRecentErrors.slice(2, 3),
    envStatuses: [
      { environment: "production", lastStatus: "success", lastRunTime: subMinutes(new Date(), 45).toISOString(), openErrorCount: 0, openAlertCount: 0 },
      { environment: "staging", lastStatus: "success", lastRunTime: subHours(new Date(), 5).toISOString(), openErrorCount: 0, openAlertCount: 0 },
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
    avgDuration: 60,
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
    avgDuration: 420,
    avgRows: 340000,
    recentRuns: mockDagRuns.filter(r => r.srcDagId === "fraud_detection_batch"),
    errors: mockRecentErrors.slice(3, 4),
    envStatuses: [
      { environment: "production", lastStatus: "success", lastRunTime: subHours(new Date(), 1.5).toISOString(), openErrorCount: 0, openAlertCount: 0 },
      { environment: "staging", lastStatus: "success", lastRunTime: subHours(new Date(), 10).toISOString(), openErrorCount: 0, openAlertCount: 0 },
    ],
  },
}

// ============================================================================
// MOCK DAG ALERTS (for DagsTable component)
// ============================================================================

export const mockDagAlerts: Record<string, { count: number; hasCritical: boolean; alertId: string }> = {
  "marketing_analytics_pipeline": {
    count: 1,
    hasCritical: true,
    alertId: "alert-6"
  },
  "sales_reporting_pipeline": {
    count: 1,
    hasCritical: false,
    alertId: "alert-1"
  },
}
