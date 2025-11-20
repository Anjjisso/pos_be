/*
  Warnings:

  - A unique constraint covering the columns `[productCode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productCode` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `product` ADD COLUMN `productCode` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Product_productCode_key` ON `Product`(`productCode`);
