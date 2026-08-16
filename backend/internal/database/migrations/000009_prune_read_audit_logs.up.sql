-- Audit logs are reserved for changes, security-relevant write denials, and
-- sensitive business actions. Request-read telemetry is noisy and does not
-- provide a durable change history.
DELETE FROM audit_logs
WHERE action LIKE '%.read'
   OR action = 'access.allowed'
   OR (
       action = 'access.denied'
       AND COALESCE(metadata ->> 'method', '') IN ('GET', 'HEAD', 'OPTIONS')
   );
