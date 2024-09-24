CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE Users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

-- create 100 user record

DO $$
BEGIN
    FOR i IN 1..100 LOOP
        INSERT INTO Users (username, email) 
        VALUES (
            'user_' || i,
            'user_' || i || '@example.com'
        );
    END LOOP;
END $$;

select * from users;