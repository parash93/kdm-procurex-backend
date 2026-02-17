/*
  Warnings:

  - The values [PENDING_APPROVAL,APPROVED,REJECTED,SENT_TO_SUPPLIER,IN_PRODUCTION,READY,SHIPPED,IN_TRANSIT,DELIVERED] on the enum `POStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PURCHASE_MANAGER,FINANCE] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Approval` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Approval` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Division` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Division` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Product` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ProductCategory` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ProductCategory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PurchaseOrder` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `currency` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `expectedDeliveryDate` on the `PurchaseOrder` table. All the data in the column will be lost.
  - You are about to drop the column `paymentTerms` on the `PurchaseOrder` table. All the data in the column will be lost.
  - The `id` column on the `PurchaseOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `divisionId` column on the `PurchaseOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PurchaseOrderItem` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `PurchaseOrderItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `productId` column on the `PurchaseOrderItem` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `StageUpdate` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `poId` on the `StageUpdate` table. All the data in the column will be lost.
  - The `id` column on the `StageUpdate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updatedBy` column on the `StageUpdate` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Supplier` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Supplier` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - The `id` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `poId` on the `Approval` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `approverId` on the `Approval` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `categoryId` on the `Product` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `supplierId` on the `PurchaseOrder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `poId` on the `PurchaseOrderItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `dispatchId` to the `StageUpdate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "DispatchStatus" AS ENUM ('DRAFT', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "EntityStatus" ADD VALUE 'DELETED';

-- AlterEnum
BEGIN;
CREATE TYPE "POStatus_new" AS ENUM ('DRAFT', 'PENDING_L1', 'APPROVED_L1', 'REJECTED_L1', 'ORDER_PLACED', 'PARTIALLY_DELIVERED', 'FULLY_DELIVERED', 'CLOSED', 'CANCELLED', 'DELETED');
ALTER TABLE "public"."PurchaseOrder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "PurchaseOrder" ALTER COLUMN "status" TYPE "POStatus_new" USING ("status"::text::"POStatus_new");
ALTER TYPE "POStatus" RENAME TO "POStatus_old";
ALTER TYPE "POStatus_new" RENAME TO "POStatus";
DROP TYPE "public"."POStatus_old";
ALTER TABLE "PurchaseOrder" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'OPERATIONS', 'SALES_MANAGER');
ALTER TABLE "public"."User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'OPERATIONS';
COMMIT;

-- AlterEnum
ALTER TYPE "SupplierStatus" ADD VALUE 'DELETED';

-- DropIndex
DROP INDEX "StageUpdate_poId_idx";

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "poId",
ADD COLUMN     "poId" INTEGER NOT NULL,
DROP COLUMN "approverId",
ADD COLUMN     "approverId" INTEGER NOT NULL,
ADD CONSTRAINT "Approval_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Division" DROP CONSTRAINT "Division_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Division_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Product" DROP CONSTRAINT "Product_pkey",
ADD COLUMN     "minDeliveryDays" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "categoryId",
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ProductCategory" DROP CONSTRAINT "ProductCategory_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PurchaseOrder" DROP CONSTRAINT "PurchaseOrder_pkey",
DROP COLUMN "currency",
DROP COLUMN "expectedDeliveryDate",
DROP COLUMN "paymentTerms",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "supplierId",
ADD COLUMN     "supplierId" INTEGER NOT NULL,
DROP COLUMN "divisionId",
ADD COLUMN     "divisionId" INTEGER,
ADD CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PurchaseOrderItem" DROP CONSTRAINT "PurchaseOrderItem_pkey",
ADD COLUMN     "dispatchedQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expectedDeliveryDate" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "poId",
ADD COLUMN     "poId" INTEGER NOT NULL,
ALTER COLUMN "productName" DROP NOT NULL,
DROP COLUMN "productId",
ADD COLUMN     "productId" INTEGER,
ADD CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "StageUpdate" DROP CONSTRAINT "StageUpdate_pkey",
DROP COLUMN "poId",
ADD COLUMN     "dispatchId" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
DROP COLUMN "updatedBy",
ADD COLUMN     "updatedBy" INTEGER,
ADD CONSTRAINT "StageUpdate_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
DROP COLUMN "email",
ADD COLUMN     "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "username" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Dispatch" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "dispatchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNumber" TEXT,
    "status" "DispatchStatus" NOT NULL DEFAULT 'DRAFT',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispatchItem" (
    "id" SERIAL NOT NULL,
    "dispatchId" INTEGER NOT NULL,
    "poItemId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,

    CONSTRAINT "DispatchItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryHistory" (
    "id" SERIAL NOT NULL,
    "inventoryId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "updatedBy" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "userId" INTEGER,
    "username" TEXT,
    "previousData" JSONB,
    "newData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Dispatch_supplierId_idx" ON "Dispatch"("supplierId");

-- CreateIndex
CREATE INDEX "DispatchItem_dispatchId_idx" ON "DispatchItem"("dispatchId");

-- CreateIndex
CREATE INDEX "DispatchItem_poItemId_idx" ON "DispatchItem"("poItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_productId_key" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "InventoryHistory_inventoryId_idx" ON "InventoryHistory"("inventoryId");

-- CreateIndex
CREATE INDEX "InventoryHistory_updatedBy_idx" ON "InventoryHistory"("updatedBy");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "Approval_poId_idx" ON "Approval"("poId");

-- CreateIndex
CREATE INDEX "Approval_approverId_idx" ON "Approval"("approverId");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_divisionId_idx" ON "PurchaseOrder"("divisionId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_poId_idx" ON "PurchaseOrderItem"("poId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_productId_idx" ON "PurchaseOrderItem"("productId");

-- CreateIndex
CREATE INDEX "StageUpdate_dispatchId_idx" ON "StageUpdate"("dispatchId");

-- CreateIndex
CREATE INDEX "StageUpdate_updatedBy_idx" ON "StageUpdate"("updatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
