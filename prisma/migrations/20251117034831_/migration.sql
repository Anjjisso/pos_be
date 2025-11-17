-- AlterTable
ALTER TABLE `orderitem` ADD COLUMN `discountPercent` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `discountValue` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `unitId` INTEGER NULL;

-- CreateTable
CREATE TABLE `ProductUnit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productId` INTEGER NOT NULL,
    `unitName` VARCHAR(191) NOT NULL,
    `multiplier` INTEGER NOT NULL DEFAULT 1,
    `price` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProductUnit` ADD CONSTRAINT `ProductUnit_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_unitId_fkey` FOREIGN KEY (`unitId`) REFERENCES `ProductUnit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
