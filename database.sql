
CREATE USER admin WITH PASSWORD 'admin';
CREATE DATABASE noncash OWNER admin;

\c noncash

CREATE TABLE users (
  user_id serial PRIMARY KEY UNIQUE,
  name varchar (50) NOT NULL UNIQUE,
  email varchar (254) NOT NULL UNIQUE,
  password char(60) NOT NULL,
  verified boolean DEFAULT false,
  date_added timestamp DEFAULT NOW(),
  lastmodified timestamp DEFAULT NOW()
);

CREATE TABLE things (
  thing_id serial PRIMARY KEY UNIQUE,
  creator integer REFERENCES users(user_id)
  ON UPDATE CASCADE ON DELETE CASCADE; 
  name varchar (256) NOT NULL,
  description text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  date_added timestamp DEFAULT NOW(),
  lastmodified timestamp DEFAULT NOW()
);

CREATE TABLE haves (
  user_id integer REFERENCES users(user_id) 
    ON UPDATE CASCADE ON DELETE CASCADE,
  thing_id integer REFERENCES things(thing_id) 
    ON UPDATE CASCADE ON DELETE CASCADE,
  date_added timestamp DEFAULT NOW(),
  PRIMARY KEY(user_id,thing_id)
);

CREATE TABLE needs (
  user_id integer REFERENCES users(user_id) 
  ON UPDATE CASCADE ON DELETE CASCADE,
  thing_id integer REFERENCES things(thing_id)
  ON UPDATE CASCADE ON DELETE CASCADE,
  date_added timestamp DEFAULT NOW(),
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

GRANT SELECT, UPDATE, INSERT ON ALL TABLES IN SCHEMA public TO admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO admin;