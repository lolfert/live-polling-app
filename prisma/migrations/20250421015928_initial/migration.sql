-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "shortCode" TEXT DEFAULT (generate_alphanumeric_id(6)),
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP NOT NULL;