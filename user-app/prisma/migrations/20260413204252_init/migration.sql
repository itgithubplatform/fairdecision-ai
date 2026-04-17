-- AlterTable
ALTER TABLE "CustomRule" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'General Compliance',
ADD COLUMN     "isSystem" BOOLEAN NOT NULL DEFAULT false;
