CREATE ROLE clicksmile_app WITH LOGIN PASSWORD 'testpassword';
GRANT ALL PRIVILEGES ON DATABASE clicksmile_test TO clicksmile_app;
GRANT ALL ON SCHEMA public TO clicksmile_app;
