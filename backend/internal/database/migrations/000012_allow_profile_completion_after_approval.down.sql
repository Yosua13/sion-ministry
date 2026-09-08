ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_scope_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_check
    CHECK ((role = 'admin' AND city_id IS NULL) OR (role <> 'admin' AND city_id IS NOT NULL));
