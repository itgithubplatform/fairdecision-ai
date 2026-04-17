-- AlterTable
ALTER TABLE "RequestLog" ADD COLUMN     "auditorNotes" TEXT,
ADD COLUMN     "auditorStatus" TEXT,
ADD COLUMN     "isProcessed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "RequestLog_isProcessed_idx" ON "RequestLog"("isProcessed");
