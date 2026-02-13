-- CreateTable
CREATE TABLE "price_list_meta" (
    "id" TEXT NOT NULL DEFAULT 'current',
    "version" INTEGER NOT NULL DEFAULT 0,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSheetHash" TEXT NOT NULL DEFAULT '',
    "syncInProgress" BOOLEAN NOT NULL DEFAULT false,
    "maxValidDurationMs" INTEGER NOT NULL DEFAULT 300000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_list_meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cached_products" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "mrp" DOUBLE PRECISION,
    "mop" DOUBLE PRECISION,
    "finalPrice" DOUBLE PRECISION,
    "selloutMop" DOUBLE PRECISION,
    "selloutFinal" DOUBLE PRECISION,
    "selloutFromDate" TEXT,
    "selloutToDate" TEXT,
    "lastUpdated" TEXT,
    "quickPitch" TEXT,
    "bankOffers" TEXT,
    "upgradeExchangeOffers" TEXT,
    "storeOffersGifts" TEXT,
    "weeklyFocus" BOOLEAN NOT NULL DEFAULT false,
    "allModels" BOOLEAN NOT NULL DEFAULT false,
    "newLaunch" BOOLEAN NOT NULL DEFAULT false,
    "ram" INTEGER,
    "rom" INTEGER,
    "version" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cached_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cached_products_version_idx" ON "cached_products"("version");

-- CreateIndex
CREATE INDEX "cached_products_brand_idx" ON "cached_products"("brand");
