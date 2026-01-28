-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('ROW_COUNT_DROP', 'NULL_OCCURRENCE', 'SCHEMA_CHANGE', 'INTEGRATION_ERROR', 'CUSTOM_METRIC_DROP', 'CUSTOM_METRIC_DEGRADATION');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'DISMISSED', 'AUTO_RESOLVED');

-- CreateEnum
CREATE TYPE "AlertSensitivity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CUSTOM', 'DISABLED');

-- CreateEnum
CREATE TYPE "DagRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ALL_ALERTS', 'NULL_OCCURRENCE_ALERT', 'SCHEMA_CHANGE_ALERT', 'ROW_COUNT_DROP_ALERT', 'ALL_ERRORS', 'NEW_ERRORS_ONLY');

-- CreateEnum
CREATE TYPE "ChannelType" AS ENUM ('SMTP', 'RESEND', 'WEBHOOK');

-- CreateTable
CREATE TABLE "organization_alert_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sensitivity" "AlertSensitivity" NOT NULL DEFAULT 'MEDIUM',
    "customThreshold" INTEGER,
    "enabledEnvironments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_alert_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dag_alert_settings" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "srcDagId" TEXT NOT NULL,
    "captureId" TEXT,
    "alertType" "AlertType" NOT NULL,
    "enabled" BOOLEAN,
    "sensitivity" "AlertSensitivity",
    "customThreshold" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dag_alert_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "severity" TEXT NOT NULL,
    "srcDagId" TEXT,
    "captureId" TEXT,
    "dagRunId" TEXT,
    "taskRunId" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "dismissedBy" TEXT,
    "dismissReason" TEXT,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_evaluation_jobs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dagRunId" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "alert_evaluation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_metric_monitors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "srcDagId" TEXT NOT NULL,
    "metricName" TEXT NOT NULL,
    "alertType" "AlertType" NOT NULL,
    "sensitivity" "AlertSensitivity" NOT NULL DEFAULT 'MEDIUM',
    "customThreshold" INTEGER,
    "windowDays" INTEGER NOT NULL DEFAULT 14,
    "minDeclinePercent" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_metric_monitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dag_metrics_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dagId" TEXT,
    "selectedMetrics" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dag_metrics_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dag_computed_metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dagId" TEXT NOT NULL,
    "environment" TEXT,
    "timeframe" TEXT NOT NULL,
    "totalRuns" INTEGER NOT NULL DEFAULT 0,
    "successfulRuns" INTEGER NOT NULL DEFAULT 0,
    "failedRuns" INTEGER NOT NULL DEFAULT 0,
    "totalRows" BIGINT NOT NULL DEFAULT 0,
    "totalDuration" BIGINT NOT NULL DEFAULT 0,
    "customMetrics" JSONB,
    "lastComputedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dag_computed_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dag_run_metric_snapshots" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dagRunId" TEXT NOT NULL,
    "srcDagId" TEXT NOT NULL,
    "environment" TEXT,
    "duration" INTEGER,
    "rowsProcessed" BIGINT NOT NULL DEFAULT 0,
    "taskCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION,
    "customMetrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dag_run_metric_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dags" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "srcDagId" TEXT NOT NULL,
    "namespace" TEXT NOT NULL DEFAULT 'airflow',
    "description" TEXT,
    "schedule" TEXT,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dag_runs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "srcDagId" TEXT NOT NULL,
    "srcRunId" TEXT NOT NULL,
    "namespace" TEXT NOT NULL DEFAULT 'airflow',
    "environment" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "runType" TEXT,
    "status" "DagRunStatus" NOT NULL DEFAULT 'RUNNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dag_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_runs" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dagRunId" TEXT NOT NULL,
    "srcTaskId" TEXT NOT NULL,
    "srcRunId" TEXT,
    "environment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "duration" INTEGER,
    "operator" TEXT,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "general_errors" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "exceptionType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "occurrenceCount" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "general_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_occurrences" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "generalErrorId" TEXT NOT NULL,
    "taskRunId" TEXT NOT NULL,
    "errorId" TEXT NOT NULL,
    "operator" TEXT,
    "tryNumber" INTEGER,
    "stacktrace" JSONB,
    "systemInfo" JSONB,
    "sdkVersion" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineage_events" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "jobNamespace" TEXT NOT NULL,
    "srcRunId" TEXT NOT NULL,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "producer" TEXT,
    "inputs" JSONB,
    "outputs" JSONB,
    "facets" JSONB,
    "rawEvent" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lineage_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "captureId" TEXT NOT NULL,
    "taskRunId" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "schema" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_channel_config" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "channelType" "ChannelType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "lastTestAt" TIMESTAMP(3),
    "lastTestSuccess" BOOLEAN,
    "lastTestError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_channel_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_filters" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "environmentFilter" TEXT NOT NULL DEFAULT 'all',
    "includeManualRuns" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_filters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "environments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "airflowUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "environmentId" TEXT,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_alert_settings_organizationId_alertType_key" ON "organization_alert_settings"("organizationId", "alertType");

-- CreateIndex
CREATE INDEX "dag_alert_settings_organizationId_srcDagId_idx" ON "dag_alert_settings"("organizationId", "srcDagId");

-- CreateIndex
CREATE UNIQUE INDEX "dag_alert_settings_organizationId_srcDagId_captureId_alertT_key" ON "dag_alert_settings"("organizationId", "srcDagId", "captureId", "alertType");

-- CreateIndex
CREATE INDEX "alerts_organizationId_status_idx" ON "alerts"("organizationId", "status");

-- CreateIndex
CREATE INDEX "alerts_organizationId_srcDagId_idx" ON "alerts"("organizationId", "srcDagId");

-- CreateIndex
CREATE INDEX "alerts_organizationId_alertType_status_idx" ON "alerts"("organizationId", "alertType", "status");

-- CreateIndex
CREATE INDEX "alerts_dagRunId_idx" ON "alerts"("dagRunId");

-- CreateIndex
CREATE UNIQUE INDEX "alert_evaluation_jobs_dagRunId_key" ON "alert_evaluation_jobs"("dagRunId");

-- CreateIndex
CREATE INDEX "alert_evaluation_jobs_status_scheduledFor_idx" ON "alert_evaluation_jobs"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "alert_evaluation_jobs_organizationId_idx" ON "alert_evaluation_jobs"("organizationId");

-- CreateIndex
CREATE INDEX "custom_metric_monitors_organizationId_enabled_idx" ON "custom_metric_monitors"("organizationId", "enabled");

-- CreateIndex
CREATE INDEX "custom_metric_monitors_organizationId_srcDagId_idx" ON "custom_metric_monitors"("organizationId", "srcDagId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_metric_monitors_organizationId_srcDagId_metricName_key" ON "custom_metric_monitors"("organizationId", "srcDagId", "metricName");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_providerId_accountId_key" ON "accounts"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "dag_metrics_settings_userId_organizationId_idx" ON "dag_metrics_settings"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "dag_metrics_settings_dagId_idx" ON "dag_metrics_settings"("dagId");

-- CreateIndex
CREATE UNIQUE INDEX "dag_metrics_settings_userId_organizationId_dagId_key" ON "dag_metrics_settings"("userId", "organizationId", "dagId");

-- CreateIndex
CREATE INDEX "dag_computed_metrics_organizationId_dagId_idx" ON "dag_computed_metrics"("organizationId", "dagId");

-- CreateIndex
CREATE INDEX "dag_computed_metrics_environment_idx" ON "dag_computed_metrics"("environment");

-- CreateIndex
CREATE INDEX "dag_computed_metrics_timeframe_idx" ON "dag_computed_metrics"("timeframe");

-- CreateIndex
CREATE UNIQUE INDEX "dag_computed_metrics_organizationId_dagId_environment_timef_key" ON "dag_computed_metrics"("organizationId", "dagId", "environment", "timeframe");

-- CreateIndex
CREATE UNIQUE INDEX "dag_run_metric_snapshots_dagRunId_key" ON "dag_run_metric_snapshots"("dagRunId");

-- CreateIndex
CREATE INDEX "dag_run_metric_snapshots_organizationId_srcDagId_idx" ON "dag_run_metric_snapshots"("organizationId", "srcDagId");

-- CreateIndex
CREATE INDEX "dag_run_metric_snapshots_organizationId_srcDagId_environmen_idx" ON "dag_run_metric_snapshots"("organizationId", "srcDagId", "environment");

-- CreateIndex
CREATE INDEX "dag_run_metric_snapshots_dagRunId_idx" ON "dag_run_metric_snapshots"("dagRunId");

-- CreateIndex
CREATE INDEX "dags_organizationId_idx" ON "dags"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "dags_organizationId_srcDagId_namespace_key" ON "dags"("organizationId", "srcDagId", "namespace");

-- CreateIndex
CREATE INDEX "dag_runs_organizationId_srcDagId_idx" ON "dag_runs"("organizationId", "srcDagId");

-- CreateIndex
CREATE INDEX "dag_runs_organizationId_startTime_idx" ON "dag_runs"("organizationId", "startTime");

-- CreateIndex
CREATE INDEX "dag_runs_environment_idx" ON "dag_runs"("environment");

-- CreateIndex
CREATE INDEX "dag_runs_status_idx" ON "dag_runs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "dag_runs_organizationId_srcDagId_srcRunId_environment_key" ON "dag_runs"("organizationId", "srcDagId", "srcRunId", "environment");

-- CreateIndex
CREATE INDEX "task_runs_dagRunId_idx" ON "task_runs"("dagRunId");

-- CreateIndex
CREATE INDEX "task_runs_organizationId_srcTaskId_idx" ON "task_runs"("organizationId", "srcTaskId");

-- CreateIndex
CREATE INDEX "task_runs_environment_idx" ON "task_runs"("environment");

-- CreateIndex
CREATE INDEX "task_runs_status_idx" ON "task_runs"("status");

-- CreateIndex
CREATE UNIQUE INDEX "task_runs_dagRunId_srcTaskId_key" ON "task_runs"("dagRunId", "srcTaskId");

-- CreateIndex
CREATE INDEX "general_errors_organizationId_status_idx" ON "general_errors"("organizationId", "status");

-- CreateIndex
CREATE INDEX "general_errors_organizationId_lastSeenAt_idx" ON "general_errors"("organizationId", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "general_errors_organizationId_fingerprint_key" ON "general_errors"("organizationId", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "error_occurrences_errorId_key" ON "error_occurrences"("errorId");

-- CreateIndex
CREATE INDEX "error_occurrences_organizationId_timestamp_idx" ON "error_occurrences"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "error_occurrences_generalErrorId_idx" ON "error_occurrences"("generalErrorId");

-- CreateIndex
CREATE INDEX "error_occurrences_taskRunId_idx" ON "error_occurrences"("taskRunId");

-- CreateIndex
CREATE INDEX "lineage_events_organizationId_eventTime_idx" ON "lineage_events"("organizationId", "eventTime");

-- CreateIndex
CREATE INDEX "lineage_events_jobName_jobNamespace_idx" ON "lineage_events"("jobName", "jobNamespace");

-- CreateIndex
CREATE INDEX "metrics_organizationId_taskRunId_idx" ON "metrics"("organizationId", "taskRunId");

-- CreateIndex
CREATE INDEX "metrics_captureId_idx" ON "metrics"("captureId");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_organizationId_captureId_taskRunId_key" ON "metrics"("organizationId", "captureId", "taskRunId");

-- CreateIndex
CREATE UNIQUE INDEX "organization_channel_config_organizationId_channelType_key" ON "organization_channel_config"("organizationId", "channelType");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_settings_userId_notificationType_key" ON "user_notification_settings"("userId", "notificationType");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_filters_userId_key" ON "user_notification_filters"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "organization_members_organizationId_userId_key" ON "organization_members"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "environments_organizationId_idx" ON "environments"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "environments_organizationId_name_key" ON "environments"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_organizationId_idx" ON "api_keys"("organizationId");

-- AddForeignKey
ALTER TABLE "organization_alert_settings" ADD CONSTRAINT "organization_alert_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_dagRunId_fkey" FOREIGN KEY ("dagRunId") REFERENCES "dag_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_metric_monitors" ADD CONSTRAINT "custom_metric_monitors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dag_metrics_settings" ADD CONSTRAINT "dag_metrics_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dag_metrics_settings" ADD CONSTRAINT "dag_metrics_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dag_computed_metrics" ADD CONSTRAINT "dag_computed_metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dag_run_metric_snapshots" ADD CONSTRAINT "dag_run_metric_snapshots_dagRunId_fkey" FOREIGN KEY ("dagRunId") REFERENCES "dag_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dag_run_metric_snapshots" ADD CONSTRAINT "dag_run_metric_snapshots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dags" ADD CONSTRAINT "dags_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dag_runs" ADD CONSTRAINT "dag_runs_organizationId_srcDagId_namespace_fkey" FOREIGN KEY ("organizationId", "srcDagId", "namespace") REFERENCES "dags"("organizationId", "srcDagId", "namespace") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_runs" ADD CONSTRAINT "task_runs_dagRunId_fkey" FOREIGN KEY ("dagRunId") REFERENCES "dag_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "general_errors" ADD CONSTRAINT "general_errors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_occurrences" ADD CONSTRAINT "error_occurrences_generalErrorId_fkey" FOREIGN KEY ("generalErrorId") REFERENCES "general_errors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "error_occurrences" ADD CONSTRAINT "error_occurrences_taskRunId_fkey" FOREIGN KEY ("taskRunId") REFERENCES "task_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_taskRunId_fkey" FOREIGN KEY ("taskRunId") REFERENCES "task_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_channel_config" ADD CONSTRAINT "organization_channel_config_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_settings" ADD CONSTRAINT "user_notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_filters" ADD CONSTRAINT "user_notification_filters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "environments" ADD CONSTRAINT "environments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
