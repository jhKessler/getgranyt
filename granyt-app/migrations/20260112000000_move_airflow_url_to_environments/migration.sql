-- Add airflowUrl column to environments table
ALTER TABLE "environments" ADD COLUMN "airflowUrl" TEXT;

-- Remove airflowUrl column from organizations table
ALTER TABLE "organizations" DROP COLUMN "airflowUrl";
