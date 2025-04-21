/*
  Warnings:

  - Made the column `shortCode` on table `Poll` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Poll" ALTER COLUMN "shortCode" SET NOT NULL,
ALTER COLUMN "shortCode" SET DEFAULT (generate_alphanumeric_id(6));
