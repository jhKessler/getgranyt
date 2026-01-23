/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,srcDagId,srcRunId,environment]` on the table `dag_runs` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AlertType" ADD VALUE 'CUSTOM_METRIC_DROP';
ALTER TYPE "AlertType" ADD VALUE 'CUSTOM_METRIC_DEGRADATION';

-- DropIndex
DROP INDEX "dag_runs_organizationId_srcDagId_srcRunId_key";

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

-- CreateIndex
CREATE INDEX "custom_metric_monitors_organizationId_enabled_idx" ON "custom_metric_monitors"("organizationId", "enabled");

-- CreateIndex
CREATE INDEX "custom_metric_monitors_organizationId_srcDagId_idx" ON "custom_metric_monitors"("organizationId", "srcDagId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_metric_monitors_organizationId_srcDagId_metricName_key" ON "custom_metric_monitors"("organizationId", "srcDagId", "metricName");

-- CreateIndex
CREATE UNIQUE INDEX "dag_runs_organizationId_srcDagId_srcRunId_environment_key" ON "dag_runs"("organizationId", "srcDagId", "srcRunId", "environment");

-- AddForeignKey
ALTER TABLE "custom_metric_monitors" ADD CONSTRAINT "custom_metric_monitors_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
