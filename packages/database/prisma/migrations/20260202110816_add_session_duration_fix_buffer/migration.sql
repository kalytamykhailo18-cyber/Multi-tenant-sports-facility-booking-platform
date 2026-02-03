-- AlterTable
ALTER TABLE "facilities" ADD COLUMN     "session_duration_minutes" INTEGER[] DEFAULT ARRAY[60, 90]::INTEGER[],
ALTER COLUMN "buffer_minutes" SET DEFAULT 0;
