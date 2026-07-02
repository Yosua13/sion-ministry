ALTER TABLE donation_campaigns
DROP COLUMN IF EXISTS bank_name,
DROP COLUMN IF EXISTS account_number,
DROP COLUMN IF EXISTS account_name;
