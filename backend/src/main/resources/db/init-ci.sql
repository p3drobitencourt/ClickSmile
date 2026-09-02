DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'clicksmile_app') THEN
      CREATE ROLE clicksmile_app WITH NOLOGIN;
   END IF;
END
$do$;
