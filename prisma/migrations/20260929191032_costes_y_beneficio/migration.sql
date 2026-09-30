-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "costsKnown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentFeeCents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shippingCostCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "unitCostCents" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "costCents" INTEGER;

-- AlterTable
ALTER TABLE "ShippingZone" ADD COLUMN     "costCents" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "costCents" INTEGER;

