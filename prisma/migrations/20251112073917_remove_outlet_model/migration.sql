/*
  Warnings:

  - You are about to drop the column `outletId` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `outlet` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_outletId_fkey`;

-- DropIndex
DROP INDEX `User_outletId_fkey` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `outletId`;

-- DropTable
DROP TABLE `outlet`;
