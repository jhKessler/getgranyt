import { PrismaClient, DagRunStatus } from "@prisma/client";
import { hoursAgo } from "../utils";

/**
 * DAG 3: Schema Evolution DAG
 * Demonstrates column changes over time (additions, removals, dtype changes)
 */
export async function seedSchemaEvolutionDAG(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  const dag = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "schema_evolution_pipeline",
      namespace: "airflow",
      description: "Schema evolution demo - shows column additions, removals, and dtype changes",
      schedule: "@daily",
    },
  });

  // Schema evolution runs data
  const schemaEvolutionRuns = [
    {
      // Run 1: Initial schema
      offset: 5 * 24,
      columns: [
        { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "name", dtype: "object", null_count: 50, empty_string_count: 10 },
        { name: "value", dtype: "float64", null_count: 100, empty_string_count: null },
        { name: "created_at", dtype: "object", null_count: 0, empty_string_count: null },
      ],
      rowCount: 10000,
    },
    {
      // Run 2: Added 'status' column
      offset: 4 * 24,
      columns: [
        { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "name", dtype: "object", null_count: 45, empty_string_count: 8 },
        { name: "value", dtype: "float64", null_count: 90, empty_string_count: null },
        { name: "created_at", dtype: "object", null_count: 0, empty_string_count: null },
        { name: "status", dtype: "object", null_count: 200, empty_string_count: 50 },
      ],
      rowCount: 10500,
    },
    {
      // Run 3: Changed 'created_at' from object to datetime64
      offset: 3 * 24,
      columns: [
        { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "name", dtype: "object", null_count: 55, empty_string_count: 12 },
        { name: "value", dtype: "float64", null_count: 110, empty_string_count: null },
        { name: "created_at", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
        { name: "status", dtype: "object", null_count: 180, empty_string_count: 40 },
      ],
      rowCount: 11000,
    },
    {
      // Run 4: Added 'updated_at', removed 'value'
      offset: 2 * 24,
      columns: [
        { name: "id", dtype: "int64", null_count: 0, empty_string_count: null },
        { name: "name", dtype: "object", null_count: 60, empty_string_count: 15 },
        { name: "created_at", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
        { name: "status", dtype: "object", null_count: 160, empty_string_count: 35 },
        { name: "updated_at", dtype: "datetime64[ns]", null_count: 500, empty_string_count: null },
      ],
      rowCount: 11500,
    },
    {
      // Run 5: Added 'category', changed 'id' to string type
      offset: 1 * 24,
      columns: [
        { name: "id", dtype: "object", null_count: 0, empty_string_count: 0 },
        { name: "name", dtype: "object", null_count: 65, empty_string_count: 18 },
        { name: "created_at", dtype: "datetime64[ns]", null_count: 0, empty_string_count: null },
        { name: "status", dtype: "object", null_count: 150, empty_string_count: 30 },
        { name: "updated_at", dtype: "datetime64[ns]", null_count: 400, empty_string_count: null },
        { name: "category", dtype: "object", null_count: 100, empty_string_count: 20 },
      ],
      rowCount: 12000,
    },
  ];

  for (const env of ["production", "development", "staging"]) {
    for (const runData of schemaEvolutionRuns) {
      const envOffset = env === "production" ? 6 : env === "staging" ? 3 : 0;
      const runStartTime = hoursAgo(runData.offset + envOffset);
      const runId = `scheduled__${runStartTime.toISOString()}`;

      const endTime = new Date(runStartTime.getTime() + 10 * 60 * 1000);
      const dagRun = await prisma.dagRun.create({
        data: {
          organizationId,
          srcDagId: dag.srcDagId,
          srcRunId: runId,
          namespace: "airflow",
          environment: env,
          startTime: runStartTime,
          endTime,
          duration: 600,
          runType: "scheduled",
          status: DagRunStatus.SUCCESS,
        },
      });

      const taskStart = new Date(runStartTime.getTime() + 1000);
      const taskRun = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "extract_and_transform",
          environment: env,
          status: "success",
          startTime: taskStart,
          endTime: new Date(taskStart.getTime() + 8 * 60 * 1000),
          duration: 480,
          operator: "PythonOperator",
        },
      });

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "schema_evolution_pipeline.extract_and_transform",
          taskRunId: taskRun.id,
          metrics: {
            row_count: runData.rowCount,
            column_count: runData.columns.length,
            memory_bytes: runData.rowCount * 100,
            dataframe_type: "pandas",
            columns: runData.columns,
            upstream: null,
          },
          capturedAt: new Date(taskStart.getTime() + 7 * 60 * 1000),
        },
      });
    }
  }

  console.log("✅ Created DAG 3 (schema_evolution_dag) with schema changes:");
  console.log("   Run 1: Initial schema (4 columns)");
  console.log("   Run 2: Added 'status' column");
  console.log("   Run 3: Changed 'created_at' dtype: object → datetime64[ns]");
  console.log("   Run 4: Removed 'value', added 'updated_at'");
  console.log("   Run 5: Changed 'id' dtype: int64 → object, added 'category'");
}
