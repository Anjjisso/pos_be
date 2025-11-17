/*
  Warnings:

  - Added the required column `unitPrice` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `order` ADD COLUMN `discountPercent` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `discountValue` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `subtotal` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `taxPercent` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `taxValue` DOUBLE NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `orderitem` ADD COLUMN `unitMultiplier` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `unitPrice` DOUBLE NOT NULL;
