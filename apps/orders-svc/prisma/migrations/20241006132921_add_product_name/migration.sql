/*
  Warnings:

  - Added the required column `name` to the `InventoryItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "name" TEXT NOT NULL;
