/*
  Warnings:

  - You are about to drop the column `actionTaken` on the `RequestLog` table. All the data in the column will be lost.
  - You are about to drop the column `confidenceScore` on the `RequestLog` table. All the data in the column will be lost.
  - You are about to drop the column `flaggedReason` on the `RequestLog` table. All the data in the column will be lost.
  - You are about to drop the column `latencyMs` on the `RequestLog` table. All the data in the column will be lost.
  - You are about to drop the column `policiesApplied` on the `RequestLog` table. All the data in the column will be lost.
  - You are about to drop the column `promptSnippet` on the `RequestLog` table. All the data in the column will be lost.
  - You are about to drop the column `timestamp` on the `RequestLog` table. All the data in the column will be lost.
  - Added the required column `decision` to the `RequestLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `latency` to the `RequestLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prompt` to the `RequestLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `violationData` to the `RequestLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "RequestLog_actionTaken_idx";

-- DropIndex
DROP INDEX "RequestLog_userId_timestamp_idx";

-- AlterTable
ALTER TABLE "RequestLog" DROP COLUMN "actionTaken",
DROP COLUMN "confidenceScore",
DROP COLUMN "flaggedReason",
DROP COLUMN "latencyMs",
DROP COLUMN "policiesApplied",
DROP COLUMN "promptSnippet",
DROP COLUMN "timestamp",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "decision" TEXT NOT NULL,
ADD COLUMN     "latency" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "prompt" TEXT NOT NULL,
ADD COLUMN     "violationData" JSONB NOT NULL;

-- CreateIndex
CREATE INDEX "RequestLog_userId_createdAt_idx" ON "RequestLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RequestLog_decision_idx" ON "RequestLog"("decision");
