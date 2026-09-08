-- An approved Jemaat may not yet have profile data. Pekerja remains city-scoped;
-- the first post-approval login forces profile completion before app access.
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_scope_check
    CHECK (
        (role = 'admin' AND city_id IS NULL)
        OR (role = 'pekerja' AND city_id IS NOT NULL)
        OR role = 'jemaat'
    );
