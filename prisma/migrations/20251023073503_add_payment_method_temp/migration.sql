-- AlterTable
ALTER TABLE `order` ADD COLUMN `paymentMethod` ENUM('TUNAI', 'DEBIT', 'KREDIT', 'QRIS') NULL,
    ALTER COLUMN `status` DROP DEFAULT;
