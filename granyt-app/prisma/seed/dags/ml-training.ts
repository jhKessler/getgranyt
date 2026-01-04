import { PrismaClient, DagRunStatus } from "@prisma/client";
import { hoursAgo } from "../utils";

/**
 * DAG 4: ML Training DAG
 * Demonstrates custom metrics for model performance tracking
 */
export async function seedMlTrainingDAG(
  prisma: PrismaClient,
  organizationId: string
): Promise<void> {
  const dag = await prisma.dag.create({
    data: {
      organizationId,
      srcDagId: "ml_training_pipeline",
      namespace: "airflow",
      description: "ML Training Pipeline - demonstrates custom metrics for model performance",
      schedule: "@daily",
    },
  });

  for (const env of ["production", "development", "staging"]) {
    const envOffset = env === "production" ? 6 : env === "staging" ? 3 : 0;

    for (let runIndex = 0; runIndex < 3; runIndex++) {
      const runStartTime = hoursAgo(24 * (3 - runIndex) + envOffset);
      const runId = `scheduled__${runStartTime.toISOString()}`;

      // Custom metrics for this run (will be added to Metric.metrics)
      const baseAccuracy = 0.85 + runIndex * 0.03;
      const baseF1Score = 0.82 + runIndex * 0.04;

      const endTime = new Date(runStartTime.getTime() + 45 * 60 * 1000);
      const dagRun = await prisma.dagRun.create({
        data: {
          organizationId,
          srcDagId: dag.srcDagId,
          srcRunId: runId,
          namespace: "airflow",
          environment: env,
          startTime: runStartTime,
          endTime,
          duration: 2700,
          runType: "scheduled",
          status: DagRunStatus.SUCCESS,
        },
      });

      // Store training metrics for the final capture
      const trainingMetrics = {
        total_training_samples: 50000 + runIndex * 5000,
        total_validation_samples: 10000,
        training_time_seconds: 2400 + runIndex * 100,
        final_model_accuracy: baseAccuracy + 0.02,
        final_model_f1_score: baseF1Score + 0.02,
      };

      // Task 1: Data Preprocessing
      const task1Start = new Date(runStartTime.getTime() + 1000);
      const taskRun1 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "preprocess_data",
          environment: env,
          status: "success",
          startTime: task1Start,
          endTime: new Date(task1Start.getTime() + 10 * 60 * 1000),
          duration: 600,
          operator: "PythonOperator",
        },
      });

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "ml_training_pipeline.preprocess_data",
          taskRunId: taskRun1.id,
          metrics: {
            row_count: 50000 + runIndex * 5000,
            column_count: 25,
            memory_bytes: (50000 + runIndex * 5000) * 200,
            dataframe_type: "pandas",
            columns: [
              { name: "sample_id", dtype: "int64", null_count: 0, empty_string_count: null },
              { name: "feature_1", dtype: "float64", null_count: Math.floor(runIndex * 10), empty_string_count: null },
              { name: "feature_2", dtype: "float64", null_count: Math.floor(runIndex * 5), empty_string_count: null },
              { name: "feature_3", dtype: "float64", null_count: 0, empty_string_count: null },
              { name: "target", dtype: "int64", null_count: 0, empty_string_count: null },
            ],
            upstream: null,
            outliers_removed: 120 + runIndex * 30,
            missing_values_filled: 250 + runIndex * 50,
            feature_scaling_time_ms: 1500 - runIndex * 100,
            data_quality_score: 0.92 + runIndex * 0.02,
          },
          capturedAt: new Date(task1Start.getTime() + 9 * 60 * 1000),
        },
      });

      // Task 2: Feature Engineering
      const task2Start = new Date(task1Start.getTime() + 10 * 60 * 1000 + 5000);
      const taskRun2 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "feature_engineering",
          environment: env,
          status: "success",
          startTime: task2Start,
          endTime: new Date(task2Start.getTime() + 8 * 60 * 1000),
          duration: 480,
          operator: "PythonOperator",
        },
      });

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "ml_training_pipeline.feature_engineering",
          taskRunId: taskRun2.id,
          metrics: {
            row_count: 50000 + runIndex * 5000,
            column_count: 45,
            memory_bytes: (50000 + runIndex * 5000) * 360,
            dataframe_type: "pandas",
            columns: [
              { name: "sample_id", dtype: "int64", null_count: 0, empty_string_count: null },
              { name: "feature_1", dtype: "float64", null_count: 0, empty_string_count: null },
              { name: "feature_2", dtype: "float64", null_count: 0, empty_string_count: null },
              { name: "feature_1_squared", dtype: "float64", null_count: 0, empty_string_count: null },
              { name: "feature_1_2_interaction", dtype: "float64", null_count: 0, empty_string_count: null },
              { name: "target", dtype: "int64", null_count: 0, empty_string_count: null },
            ],
            upstream: ["ml_training_pipeline.preprocess_data"],
            new_features_created: 20 + runIndex * 2,
            correlation_threshold: 0.7,
            selected_features: 35 + runIndex * 3,
            feature_importance_computed: 1,
            pca_variance_explained: 0.95 + runIndex * 0.01,
          },
          capturedAt: new Date(task2Start.getTime() + 7 * 60 * 1000),
        },
      });

      // Task 3: Model Training
      const task3Start = new Date(task2Start.getTime() + 8 * 60 * 1000 + 5000);
      const taskRun3 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "train_model",
          environment: env,
          status: "success",
          startTime: task3Start,
          endTime: new Date(task3Start.getTime() + 20 * 60 * 1000),
          duration: 1200,
          operator: "PythonOperator",
        },
      });

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "ml_training_pipeline.train_model",
          taskRunId: taskRun3.id,
          metrics: {
            row_count: 40000 + runIndex * 4000,
            column_count: 35 + runIndex * 3,
            memory_bytes: (40000 + runIndex * 4000) * 280,
            dataframe_type: "pandas",
            columns: [
              { name: "sample_id", dtype: "int64", null_count: 0, empty_string_count: null },
              { name: "prediction", dtype: "float64", null_count: 0, empty_string_count: null },
              { name: "actual", dtype: "int64", null_count: 0, empty_string_count: null },
              { name: "confidence", dtype: "float64", null_count: 0, empty_string_count: null },
            ],
            upstream: ["ml_training_pipeline.feature_engineering"],
            training_accuracy: baseAccuracy,
            training_loss: 0.35 - runIndex * 0.05,
            epochs_completed: 50,
            learning_rate: 0.001,
            batch_size: 32,
            early_stopping_epoch: 42 + runIndex * 2,
          },
          capturedAt: new Date(task3Start.getTime() + 19 * 60 * 1000),
        },
      });

      // Task 4: Model Evaluation
      const task4Start = new Date(task3Start.getTime() + 20 * 60 * 1000 + 5000);
      const taskRun4 = await prisma.taskRun.create({
        data: {
          organizationId,
          dagRunId: dagRun.id,
          srcTaskId: "evaluate_model",
          environment: env,
          status: "success",
          startTime: task4Start,
          endTime: new Date(task4Start.getTime() + 5 * 60 * 1000),
          duration: 300,
          operator: "PythonOperator",
        },
      });

      await prisma.metric.create({
        data: {
          organizationId,
          captureId: "ml_training_pipeline.evaluate_model",
          taskRunId: taskRun4.id,
          metrics: {
            row_count: 10000,
            column_count: 6,
            memory_bytes: 10000 * 48,
            dataframe_type: "pandas",
            columns: [
              { name: "sample_id", dtype: "int64", null_count: 0, empty_string_count: null },
              { name: "prediction", dtype: "int64", null_count: 0, empty_string_count: null },
              { name: "actual", dtype: "int64", null_count: 0, empty_string_count: null },
              { name: "confidence", dtype: "float64", null_count: 0, empty_string_count: null },
              { name: "is_correct", dtype: "bool", null_count: 0, empty_string_count: null },
            ],
            upstream: ["ml_training_pipeline.train_model"],
            validation_accuracy: baseAccuracy + 0.02,
            validation_loss: 0.32 - runIndex * 0.04,
            precision: 0.88 + runIndex * 0.03,
            recall: 0.85 + runIndex * 0.04,
            f1_score: baseF1Score + 0.02,
            auc_roc: 0.91 + runIndex * 0.02,
            confusion_matrix_tn: 4500 + runIndex * 100,
            confusion_matrix_fp: 300 - runIndex * 20,
            confusion_matrix_fn: 350 - runIndex * 25,
            confusion_matrix_tp: 4850 + runIndex * 150,
            // Include run-level metrics here
            ...trainingMetrics,
          },
          capturedAt: new Date(task4Start.getTime() + 4 * 60 * 1000),
        },
      });
    }
  }

  console.log("✅ Created DAG 4 (ml_training_dag) with custom metrics:");
  console.log("   - Task-level custom metrics: accuracy, loss, precision, recall, etc.");
}
