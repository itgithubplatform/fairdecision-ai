-- CreateTable
CREATE TABLE "CustomRule" (
    "id" TEXT NOT NULL,
    "ruleText" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomRule_userId_idx" ON "CustomRule"("userId");

-- AddForeignKey
ALTER TABLE "CustomRule" ADD CONSTRAINT "CustomRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
