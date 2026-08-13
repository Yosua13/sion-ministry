-- This migration consolidates identities and removes redundant tables. It is
-- intentionally irreversible. Restore a verified backup instead of attempting a
-- schema-only rollback that could recreate duplicate or insecure identity data.
DO $$
BEGIN
    RAISE EXCEPTION 'Migration 000007 is irreversible; restore a verified backup.';
END $$;
