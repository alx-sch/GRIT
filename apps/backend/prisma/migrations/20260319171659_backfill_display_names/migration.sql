-- Lowercase any names that weren't stored correctly before normalization was enforced
UPDATE "User" SET "name" = LOWER("name") WHERE "name" != LOWER("name");

-- Backfill displayName for users who existed before the displayName column was added
-- (or were created via the broken Google OAuth path that generated mismatched nanoids)
UPDATE "User" SET "displayName" = "name" WHERE "displayName" IS NULL;
