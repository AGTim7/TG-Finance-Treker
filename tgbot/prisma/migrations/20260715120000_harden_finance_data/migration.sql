-- Merge duplicate global categories before adding the partial unique index.
WITH ranked_categories AS (
  SELECT
    "id",
    FIRST_VALUE("id") OVER (
      PARTITION BY "name", "type"
      ORDER BY "id"::text
    ) AS "keep_id",
    ROW_NUMBER() OVER (
      PARTITION BY "name", "type"
      ORDER BY "id"::text
    ) AS "position"
  FROM "category"
  WHERE "user_id" IS NULL
)
UPDATE "transaction" AS transaction_row
SET "category_id" = ranked_categories."keep_id"
FROM ranked_categories
WHERE ranked_categories."position" > 1
  AND transaction_row."category_id" = ranked_categories."id";

WITH ranked_categories AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (
      PARTITION BY "name", "type"
      ORDER BY "id"::text
    ) AS "position"
  FROM "category"
  WHERE "user_id" IS NULL
)
DELETE FROM "category" AS category_row
USING ranked_categories
WHERE ranked_categories."position" > 1
  AND category_row."id" = ranked_categories."id";

CREATE UNIQUE INDEX "category_global_name_type_key"
ON "category" ("name", "type")
WHERE "user_id" IS NULL;

ALTER TABLE "transaction"
ADD CONSTRAINT "transaction_amount_positive" CHECK ("amount" > 0);
