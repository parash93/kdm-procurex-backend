/*
  Warnings:

  - You are about to drop the column `defaultLeadTimeDays` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `paymentTerms` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `taxId` on the `Supplier` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "defaultLeadTimeDays",
DROP COLUMN "paymentTerms",
DROP COLUMN "taxId";
