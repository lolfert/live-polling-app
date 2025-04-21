-- AlterTable
ALTER TABLE "Poll" ALTER COLUMN "shortCode" SET DEFAULT (generate_alphanumeric_id(6));
