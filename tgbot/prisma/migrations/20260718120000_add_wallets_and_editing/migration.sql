-- Wallets are real accounts. The "overall" balance remains a calculated aggregate.
CREATE TYPE "WalletKind" AS ENUM ('CASH', 'BANK', 'CUSTOM');

ALTER TABLE "category"
ADD COLUMN "archived_at" TIMESTAMP(3),
ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE "wallet" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "WalletKind" NOT NULL DEFAULT 'CUSTOM',
    "emoji" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "initial_balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "wallet_initial_balance_range" CHECK (ABS("initial_balance") <= 9999999999.99)
);

ALTER TABLE "transaction"
ADD COLUMN "wallet_id" UUID,
ADD COLUMN "type" "TransactionType",
ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill is safe even if the database already contains users and transactions.
INSERT INTO "wallet" (
    "id", "user_id", "name", "kind", "emoji", "color", "initial_balance", "is_default"
)
SELECT gen_random_uuid(), "id", 'Банковский', 'BANK', '💳', '#2481CC', 0, true
FROM "user";

INSERT INTO "wallet" (
    "id", "user_id", "name", "kind", "emoji", "color", "initial_balance", "is_default"
)
SELECT gen_random_uuid(), "id", 'Наличные', 'CASH', '💵', '#31B56A', 0, false
FROM "user";

UPDATE "transaction" AS transaction_row
SET
    "type" = category_row."type",
    "wallet_id" = wallet_row."id"
FROM "category" AS category_row, "wallet" AS wallet_row
WHERE transaction_row."category_id" = category_row."id"
  AND wallet_row."user_id" = transaction_row."user_id"
  AND wallet_row."is_default" = true;

ALTER TABLE "transaction"
ALTER COLUMN "wallet_id" SET NOT NULL,
ALTER COLUMN "type" SET NOT NULL;

CREATE INDEX "category_user_id_type_idx" ON "category"("user_id", "type");
CREATE UNIQUE INDEX "category_user_active_name_type_key"
ON "category"("user_id", LOWER("name"), "type")
WHERE "user_id" IS NOT NULL AND "archived_at" IS NULL;

CREATE INDEX "wallet_user_id_archived_at_idx" ON "wallet"("user_id", "archived_at");
CREATE UNIQUE INDEX "wallet_user_active_name_key"
ON "wallet"("user_id", LOWER("name"))
WHERE "archived_at" IS NULL;
CREATE UNIQUE INDEX "wallet_user_default_key"
ON "wallet"("user_id")
WHERE "is_default" = true AND "archived_at" IS NULL;

CREATE INDEX "transaction_user_id_wallet_id_date_idx"
ON "transaction"("user_id", "wallet_id", "date" DESC);
CREATE INDEX "transaction_user_id_type_date_idx"
ON "transaction"("user_id", "type", "date" DESC);

ALTER TABLE "wallet"
ADD CONSTRAINT "wallet_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "transaction"
ADD CONSTRAINT "transaction_wallet_id_fkey"
FOREIGN KEY ("wallet_id") REFERENCES "wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
