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

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_filters_userId_key" ON "user_notification_filters"("userId");

-- AddForeignKey
ALTER TABLE "user_notification_filters" ADD CONSTRAINT "user_notification_filters_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
