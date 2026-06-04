-- MySQL initialization script
-- This runs when the container is first created.
-- The database is created by Docker environment variables,
-- so we just ensure charset settings are optimal.

ALTER DATABASE psicopedagogia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
