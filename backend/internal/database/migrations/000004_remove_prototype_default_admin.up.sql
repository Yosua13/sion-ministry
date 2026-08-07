-- Remove the known prototype account and invalidate all sessions created before
-- server-authoritative authentication was enforced.
DELETE FROM auth_sessions;
DELETE FROM users WHERE id = 'usr-admin-default' OR email = 'admin@sionministry.local';
