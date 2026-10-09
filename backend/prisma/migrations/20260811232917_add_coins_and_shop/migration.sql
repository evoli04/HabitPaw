-- CreateEnum
CREATE TYPE "CoinTransactionType" AS ENUM ('habit_reward', 'purchase');

-- AlterTable
ALTER TABLE "profiles" ADD COLUMN     "coin_balance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "coin_transactions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "CoinTransactionType" NOT NULL,
    "habit_id" UUID,
    "reward_date" DATE,
    "shop_item_id" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_shop_items" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "item_id" VARCHAR(50) NOT NULL,
    "price_paid" INTEGER NOT NULL,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_shop_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coin_transactions_user_id_created_at_idx" ON "coin_transactions"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "coin_transactions_habit_id_reward_date_key" ON "coin_transactions"("habit_id", "reward_date");

-- CreateIndex
CREATE INDEX "user_shop_items_user_id_idx" ON "user_shop_items"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_shop_items_user_id_item_id_key" ON "user_shop_items"("user_id", "item_id");

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coin_transactions" ADD CONSTRAINT "coin_transactions_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_shop_items" ADD CONSTRAINT "user_shop_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
