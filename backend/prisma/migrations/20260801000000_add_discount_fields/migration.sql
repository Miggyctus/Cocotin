-- AlterTable
ALTER TABLE `Product` ADD COLUMN `discountEndDate` DATETIME(3) NULL,
                      ADD COLUMN `discountPercent` DOUBLE NULL,
                      ADD COLUMN `discountStartDate` DATETIME(3) NULL;
