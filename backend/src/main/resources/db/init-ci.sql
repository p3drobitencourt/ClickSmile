DO
$do$
BEGIN
   -- 1. Create auxiliary 'postgres' role purely for historical migration V14
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'postgres') THEN
      CREATE ROLE postgres WITH NOLOGIN;
   END IF;
   
   -- 2. Create the true runtime role 'clicksmile_app' safely
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'clicksmile_app') THEN
      CREATE ROLE clicksmile_app WITH LOGIN PASSWORD 'clicksmile_dev' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
   END IF;
END
$do$;

-- 3. Configure privileges for runtime role
GRANT CONNECT ON DATABASE clicksmile TO clicksmile_app;
GRANT USAGE ON SCHEMA public TO clicksmile_app;

-- Grant permissions on existing tables (if any) and set defaults for Flyway-created tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO clicksmile_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO clicksmile_app;
