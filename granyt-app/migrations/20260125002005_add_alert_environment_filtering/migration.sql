-- AlterTable
ALTER TABLE "organization_alert_settings" ADD COLUMN     "enabledEnvironments" TEXT[] DEFAULT ARRAY[]::TEXT[];
