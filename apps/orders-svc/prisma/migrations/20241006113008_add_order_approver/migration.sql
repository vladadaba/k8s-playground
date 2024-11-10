-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "approverId" UUID;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
