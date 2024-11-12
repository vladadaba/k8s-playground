-- CreateEnum
CREATE TYPE "InventoryItemEventType" AS ENUM ('ORDER_APPROVED', 'ORDER_CANCELED', 'RESTOCK');

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItemDetails" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cost" MONEY NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItemDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItemQuantityChange" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL,
    "type" "InventoryItemEventType" NOT NULL,
    "quantityChange" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryItemQuantityChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InventoryItemDetails_productId_idx" ON "InventoryItemDetails"("productId");

-- AddForeignKey
ALTER TABLE "InventoryItemDetails" ADD CONSTRAINT "InventoryItemDetails_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItemQuantityChange" ADD CONSTRAINT "InventoryItemQuantityChange_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
