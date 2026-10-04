/*
  Warnings:

  - Added the required column `originalPrice` to the `OrderItem` table.
  - Added cupPrice and bottlePrice to the Product table.
*/

-- =====================================================
-- ORDER ITEM
-- =====================================================

-- Tambahkan kolom sebagai nullable terlebih dahulu
ALTER TABLE "OrderItem"
ADD COLUMN "originalPrice" INTEGER;

-- discountPercent belum ada pada data lama,
-- sehingga diberi nilai default 0
ALTER TABLE "OrderItem"
ADD COLUMN "discountPercent" INTEGER NOT NULL DEFAULT 0;

-- Isi originalPrice data lama menggunakan price yang sudah ada
UPDATE "OrderItem"
SET "originalPrice" = "price"
WHERE "originalPrice" IS NULL;

-- Setelah semua data lama terisi,
-- jadikan originalPrice wajib
ALTER TABLE "OrderItem"
ALTER COLUMN "originalPrice" SET NOT NULL;


-- =====================================================
-- PRODUCT
-- =====================================================

-- Tambahkan harga Cup dan Bottle
ALTER TABLE "Product"
ADD COLUMN "bottlePrice" INTEGER,
ADD COLUMN "cupPrice" INTEGER;

-- Produk lama menggunakan harga "price"
-- sebagai nilai awal Cup dan Bottle
UPDATE "Product"
SET
  "cupPrice" = "price",
  "bottlePrice" = "price"
WHERE
  "cupPrice" IS NULL
  OR "bottlePrice" IS NULL;