/*
  Warnings:

  - Added the required column `emoji` to the `category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "category" ADD COLUMN     "emoji" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transaction" ADD COLUMN     "type" "TransactionType" NOT NULL;
