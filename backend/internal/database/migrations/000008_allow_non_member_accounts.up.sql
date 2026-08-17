-- `member_status` describes a membership profile, not staff-only accounts.
-- This repair is required for databases that already applied migration 000007.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_member_status_check;
ALTER TABLE users ADD CONSTRAINT users_member_status_check
    CHECK (NOT is_member OR member_status IN ('guest', 'prospect', 'active', 'inactive', 'moved', 'deceased', 'archived'));
