/*
  Warnings:

  - You are about to drop the `itempesananpelangganmandiri` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `pesananpelangganmandiri` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[barcode]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `itempesananpelangganmandiri` DROP FOREIGN KEY `ItemPesananPelangganMandiri_orderId_fkey`;

-- DropForeignKey
ALTER TABLE `itempesananpelangganmandiri` DROP FOREIGN KEY `ItemPesananPelangganMandiri_productId_fkey`;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `barcode` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `itempesananpelangganmandiri`;

-- DropTable
DROP TABLE `pesananpelangganmandiri`;

-- CreateIndex
CREATE UNIQUE INDEX `Order_barcode_key` ON `Order`(`barcode`);
