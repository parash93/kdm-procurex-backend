-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "supplierId" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "divisionId" INTEGER;

-- CreateIndex
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");

-- CreateIndex
CREATE INDEX "User_divisionId_idx" ON "User"("divisionId");
