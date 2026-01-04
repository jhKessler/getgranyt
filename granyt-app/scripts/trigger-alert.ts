/**
 * Script to ingest DAG data that SHOULD trigger a row count drop alert.
 * 
 * This script:
 * 1. Creates 15 historical runs with ~1000 rows each (establishes baseline)
 * 2. Creates a final run with 0 rows (triggers ROW_COUNT_DROP alert)
 * 
 * Requirements for alert to trigger:
 * - At least 14 historical runs (MIN_HISTORY_RUNS)
 * - Baseline >= 100 rows (MIN_BASELINE_ROWS)
 * - Current row count below threshold (5% of baseline for MEDIUM sensitivity)
 * 
 * Usage:
 *   npx tsx scripts/trigger-alert.ts
 * 
 * Environment:
 *   API_KEY - Your Granyt API key (required)
 *   BASE_URL - API base URL (default: http://localhost:3000)
 * 
 * Note: The alert evaluation runs after a 1-minute delay by default.
 * To test faster, you can temporarily reduce DEFAULT_DELAY_MS in
 * src/server/services/alerts/engine/schedule-evaluation.ts
 */

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

const DAG_ID = "alert_test_pipeline";
const TASK_ID = "process_data";
const CAPTURE_ID = "output_dataset";
const HISTORICAL_RUNS = 15;
const BASELINE_ROW_COUNT = 1000;

// Helper to create ISO timestamp
function isoTimestamp(date: Date): string {
  return date.toISOString();
}

// Helper to create Airflow-style run ID
function createRunId(date: Date): string {
  return `scheduled__${date.toISOString().replace(/\.\d{3}Z$/, "+00:00")}`;
}

// Send a request to the API
async function sendRequest(endpoint: string, payload: object): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/v1/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error (${response.status}): ${error}`);
  }

  const result = await response.json();
  console.log(`  ✓ ${endpoint}:`, result.status || result.eventType || "ok");
}

// Send OpenLineage START event
async function sendStartEvent(runId: string, eventTime: string): Promise<void> {
  await sendRequest("lineage", {
    eventType: "START",
    eventTime,
    producer: "https://airflow.apache.org",
    schemaURL: "https://openlineage.io/spec/1-0-5/OpenLineage.json",
    job: {
      namespace: "airflow",
      name: DAG_ID,
    },
    run: {
      runId,
    },
  });
}

// Send OpenLineage COMPLETE event
async function sendCompleteEvent(runId: string, eventTime: string): Promise<void> {
  await sendRequest("lineage", {
    eventType: "COMPLETE",
    eventTime,
    producer: "https://airflow.apache.org",
    schemaURL: "https://openlineage.io/spec/1-0-5/OpenLineage.json",
    job: {
      namespace: "airflow",
      name: DAG_ID,
    },
    run: {
      runId,
    },
  });
}

// Send data metrics
async function sendDataMetrics(
  runId: string, 
  capturedAt: string, 
  rowCount: number
): Promise<void> {
  await sendRequest("data-metrics", {
    capture_id: CAPTURE_ID,
    captured_at: capturedAt,
    row_count: rowCount,
    column_count: 5,
    columns: [
      { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
      { name: "name", dtype: "string", null_count: 10, empty_string_count: 5 },
      { name: "value", dtype: "float64", null_count: 0, empty_string_count: null },
      { name: "created_at", dtype: "datetime64", null_count: 0, empty_string_count: null },
      { name: "status", dtype: "string", null_count: 0, empty_string_count: 0 },
    ],
    memory_bytes: rowCount * 200, // Approximate
    dataframe_type: "pandas",
    dag_id: DAG_ID,
    task_id: TASK_ID,
    run_id: runId,
    upstream: null,
    custom_metrics: null,
  });
}

// Main function
async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Alert Trigger Script");
  console.log("=".repeat(60));
  console.log(`\nTarget: ${BASE_URL}`);
  console.log(`DAG ID: ${DAG_ID}`);
  console.log(`Task ID: ${TASK_ID}`);
  console.log(`Capture ID: ${CAPTURE_ID}`);
  console.log(`Historical runs: ${HISTORICAL_RUNS}`);
  console.log(`Baseline row count: ${BASELINE_ROW_COUNT}`);
  console.log();

  if (!API_KEY) {
    console.error("❌ Please set your API_KEY environment variable");
    console.error("   Example: $env:API_KEY='your-api-key'; npx tsx scripts/trigger-alert.ts");
    process.exit(1);
  }

  const now = Date.now();
  
  // Phase 1: Create historical runs with normal row counts
  console.log("Phase 1: Creating historical runs with normal row counts...\n");
  
  for (let i = HISTORICAL_RUNS; i >= 1; i--) {
    // Each run is 1 hour apart, going backwards from now
    const startTime = new Date(now - (i * 60 * 60 * 1000));
    const endTime = new Date(startTime.getTime() + 5 * 60 * 1000); // 5 min duration
    const runId = createRunId(startTime);
    
    console.log(`Run ${HISTORICAL_RUNS - i + 1}/${HISTORICAL_RUNS}: ${runId}`);
    
    // Add some variance to row count (±10%)
    const variance = Math.floor(BASELINE_ROW_COUNT * 0.1 * (Math.random() - 0.5));
    const rowCount = BASELINE_ROW_COUNT + variance;
    
    try {
      await sendStartEvent(runId, isoTimestamp(startTime));
      await sendDataMetrics(runId, isoTimestamp(endTime), rowCount);
      await sendCompleteEvent(runId, isoTimestamp(endTime));
    } catch (error) {
      console.error(`  ❌ Error:`, error);
      process.exit(1);
    }
  }

  console.log("\n" + "-".repeat(60));
  console.log("Phase 2: Creating ANOMALOUS run with 0 rows (should trigger alert)...\n");

  // Phase 2: Create the anomalous run with 0 rows
  const anomalyTime = new Date(now);
  const anomalyEndTime = new Date(now + 5 * 60 * 1000);
  const anomalyRunId = createRunId(anomalyTime);

  console.log(`Anomaly Run: ${anomalyRunId}`);
  console.log(`Row count: 0 (100% drop from baseline of ~${BASELINE_ROW_COUNT})`);

  try {
    await sendStartEvent(anomalyRunId, isoTimestamp(anomalyTime));
    await sendDataMetrics(anomalyRunId, isoTimestamp(anomalyEndTime), 0); // Zero rows!
    await sendCompleteEvent(anomalyRunId, isoTimestamp(anomalyEndTime));
  } catch (error) {
    console.error(`  ❌ Error:`, error);
    process.exit(1);
  }

  console.log("\n" + "=".repeat(60));
  console.log("✅ All data ingested successfully!");
  console.log();
  console.log("The alert evaluation job has been scheduled.");
  console.log("It will run after 1 minute delay (configurable).");
  console.log();
  console.log("Expected alert:");
  console.log("  - Type: ROW_COUNT_DROP");
  console.log("  - Severity: critical (0 rows)");
  console.log(`  - Baseline: ~${BASELINE_ROW_COUNT} rows`);
  console.log("  - Current: 0 rows");
  console.log("  - Drop: 100%");
  console.log("=".repeat(60));
}

main().catch(console.error);
