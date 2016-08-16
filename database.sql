-- postgresql congiguration

CREATE USER admin WITH PASSWORD 'admin';
CREATE DATABASE noncash OWNER admin;

\c noncash

CREATE TABLE users (
  user_id serial PRIMARY KEY UNIQUE,
  name varchar (50) NOT NULL UNIQUE,
  email varchar (254) NOT NULL UNIQUE,
  password char(60) NOT NULL,
  verified boolean NOT NULL DEFAULT false,
  admin boolean NOT NULL DEFAULT false,
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
  have_id serial NOT NULL UNIQUE,
  user_id integer REFERENCES users(user_id) 
    ON UPDATE CASCADE ON DELETE CASCADE,
  thing_id integer REFERENCES things(thing_id) 
    ON UPDATE CASCADE ON DELETE CASCADE,
  public boolean NOT NULL DEFAULT true,
  date_added timestamp DEFAULT NOW(),
  PRIMARY KEY(user_id,thing_id)
);

CREATE TABLE needs (
  need_id serial NOT NULL UNIQUE,
  user_id integer REFERENCES users(user_id) 
    ON UPDATE CASCADE ON DELETE CASCADE,
  thing_id integer REFERENCES things(thing_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  public boolean NOT NULL DEFAULT true,
  date_added timestamp DEFAULT NOW(),
  PRIMARY KEY(user_id,thing_id)
);

CREATE TABLE matches (
  match_id serial PRIMARY KEY UNIQUE,
  have_id integer REFERENCES haves(have_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  need_id integer REFERENCES needs(need_id)
    ON UPDATE CASCADE ON DELETE CASCADE,
  status integer NOT NULL DEFAULT 1, -- see comments below
  date_added timestamp DEFAULT NOW(),
  lastmodified timestamp DEFAULT NOW()
);

-- Match status stores progress of matches.
-- 1 = SUGGESTED - add to queue to email 'haver' about match
--     - their options OFFER, 
--                     DISMISS AT THE MOMENT, 
--                     DISMISS FOREVER
-- 2 = OFFERED -- 'haver' offered to 'needer' - email 'needer'
--     - their options DISCUSS (negotiate exchange), 
--                     DISMISS AT THE MOMENT, 
--                     DISMISS FOREVER
-- 3 = DISCUSS PRIVATELY -- 'needer' and  'haver'
--     - options keep chating, 
--               CONCLUDE (successful),
--               CONCLUDE (haver exits), 
--               CONCLUDE (needer exits)
-- 4 = RESOLVED -- match was successful 
-- 11 = DISMISSED DON'T MATCH AGAIN
-- 12 = DISMISSED FOR NOW
-- 13 = CANCELED BY HAVER
-- 14 = CANCELED BY NEEDER

CREATE TABLE match_messages (
  match_message_id serial PRIMARY KEY UNIQUE,
  match_id integer REFERENCES matches(match_id) -- which match is it in relation too.
    ON UPDATE CASCADE ON DELETE CASCADE,
  user_id integer REFERENCES users(user_id) -- who is speaking?
    ON UPDATE CASCADE,
  message text NOT NULL,
  date_added timestamp DEFAULT NOW(),
  lastmodified timestamp DEFAULT NOW()
);

CREATE FUNCTION sync_lastmod() RETURNS trigger AS $$
BEGIN
  NEW.lastmodified := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_lastmod BEFORE UPDATE ON things FOR EACH ROW EXECUTE PROCEDURE sync_lastmod();
CREATE TRIGGER sync_lastmod BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE sync_lastmod();
CREATE TRIGGER sync_lastmod BEFORE UPDATE ON matches FOR EACH ROW EXECUTE PROCEDURE sync_lastmod();

GRANT SELECT, UPDATE, INSERT ON ALL TABLES IN SCHEMA public TO admin;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO admin;



