-- CreateEnum
CREATE TYPE "DeliveryCoverageType" AS ENUM ('radius', 'polygon');

-- AlterTable
ALTER TABLE "Address"
ADD COLUMN "fullName" TEXT,
ADD COLUMN "fullAddress" TEXT,
ADD COLUMN "houseNo" TEXT,
ADD COLUMN "landmark" TEXT,
ADD COLUMN "area" TEXT,
ADD COLUMN "postalCode" TEXT,
ADD COLUMN "lat" DOUBLE PRECISION,
ADD COLUMN "lng" DOUBLE PRECISION,
ADD COLUMN "placeId" TEXT,
ADD COLUMN "deliveryNotes" TEXT;

-- Backfill postalCode/fullAddress where possible
UPDATE "Address"
SET "postalCode" = COALESCE(NULLIF("postalCode", ''), "zip"),
    "fullAddress" = COALESCE(NULLIF("fullAddress", ''), TRIM(CONCAT_WS(', ', NULLIF("street", ''), NULLIF("city", ''), NULLIF("state", ''), NULLIF("zip", ''), NULLIF("country", ''))));

-- CreateTable
CREATE TABLE "DeliveryZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "coverageType" "DeliveryCoverageType" NOT NULL,
    "centerLat" DOUBLE PRECISION,
    "centerLng" DOUBLE PRECISION,
    "radiusKm" DOUBLE PRECISION,
    "polygonJson" JSONB,
    "shippingFee" INTEGER NOT NULL DEFAULT 0,
    "estimatedDeliveryTime" TEXT NOT NULL,
    "codAvailable" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryZone_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "shippingFee" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "deliveryAddress" JSONB,
ADD COLUMN "deliveryZoneId" TEXT,
ADD COLUMN "deliveryZoneName" TEXT,
ADD COLUMN "codAvailableAtOrderTime" BOOLEAN,
ADD COLUMN "estimatedDeliveryTimeAtOrderTime" TEXT;

-- CreateIndex
CREATE INDEX "DeliveryZone_city_isActive_idx" ON "DeliveryZone"("city", "isActive");
CREATE INDEX "Order_deliveryZoneId_idx" ON "Order"("deliveryZoneId");

-- AddForeignKey
ALTER TABLE "Order"
ADD CONSTRAINT "Order_deliveryZoneId_fkey"
FOREIGN KEY ("deliveryZoneId") REFERENCES "DeliveryZone"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
