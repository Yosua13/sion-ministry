DO $$
BEGIN
    RAISE EXCEPTION 'Migration 000008 is part of the irreversible identity cutover; restore a verified backup.';
END $$;
