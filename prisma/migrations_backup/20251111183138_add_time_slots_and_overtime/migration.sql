-- AlterTable
ALTER TABLE "TimeEntry" ADD COLUMN     "afternoonEnd" TEXT,
ADD COLUMN     "afternoonStart" TEXT,
ADD COLUMN     "morningEnd" TEXT,
ADD COLUMN     "morningStart" TEXT,
ADD COLUMN     "overtimeHours" DECIMAL(65,30) NOT NULL DEFAULT 0;
