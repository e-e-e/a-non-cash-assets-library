
CREATE USER admin WITH PASSWORD 'admin';
CREATE DATABASE noncash OWNER admin;

GRANT SELECT, UPDATE, INSERT ON ALL TABLES IN SCHEMA public TO admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO admin;

\c noncash

CREATE TABLE users (
  user_id serial PRIMARY KEY UNIQUE,
  name varchar (50) NOT NULL,
  email varchar (254) NOT NULL UNIQUE,
  password char(60) NOT NULL,
  verified boolean DEFAULT false,
  date_added timestamp DEFAULT NOW(),
  lastmodified timestamp DEFAULT NOW()
);

CREATE TABLE things (
  thing_id serial PRIMARY KEY UNIQUE,
  name varchar (256) NOT NULL,
  description text NOT NULL,
  date_added timestamp DEFAULT NOW(),
  lastmodified timestamp DEFAULT NOW()
);

CREATE TABLE haves (
  user_id integer references users(user_id) 
    ON UPDATE CASCADE ON DELETE CASCADE,
  thing_id integer references things(thing_id) 
    ON UPDATE CASCADE ON DELETE CASCADE, 
  PRIMARY KEY(user_id,thing_id)
);

CREATE TABLE wants (
  user_id integer references users(user_id) 
  ON UPDATE CASCADE ON DELETE CASCADE,
  thing_id integer references things(thing_id)
  ON UPDATE CASCADE ON DELETE CASCADE, 
  PRIMARY KEY(user_id,thing_id)
);

CREATE FUNCTION sync_lastmod() RETURNS trigger AS $$
BEGIN
  NEW.lastmodified := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_lastmod BEFORE UPDATE ON things FOR EACH ROW EXECUTE PROCEDURE sync_lastmod();
CREATE TRIGGER sync_lastmod BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE sync_lastmod();