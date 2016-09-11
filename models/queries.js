/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const sql = {
	select: {
		users: {
			all: 
				"SELECT user_id, name, email, verified, admin FROM users",
			user_with_email: 
				"SELECT user_id, name, email, password, verified, admin FROM users WHERE email = $1",
			user_with_name: 
				"SELECT user_id, name, email, password, verified, admin FROM users WHERE name = $1",
			user_with_id: 
				"SELECT user_id, name, email, verified, admin FROM users WHERE user_id = $1",
			user_password_with_id: 
				"SELECT password FROM users WHERE user_id = $1",
			},
		haves: {
			all: 
				"SELECT a.have_id as id, a.public, (u.user_id = $1) as owned, u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description FROM haves a INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) ORDER BY a.date_added DESC ",
			all_with_search: 
				"SELECT a.have_id as id, a.public, (u.user_id = $1) as owned, u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description FROM haves a INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE t.name ILIKE $2 ORDER BY a.date_added DESC ",
			all_public: 
				"SELECT a.have_id as id, a.public, (u.user_id = $1) as owned, u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description FROM haves a INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE a.public=true ORDER BY a.date_added DESC ",
			all_public_with_search: 
				"SELECT a.have_id as id, a.public, (u.user_id = $1) as owned, u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description FROM haves a INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE a.public=true AND t.name ILIKE $2 ORDER BY a.date_added DESC ",
			with_user_id: "SELECT a.have_id as id, a.public, (u.user_id = $1) as owned, u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description FROM haves a INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE user_id = $1 ORDER BY a.date_added DESC ",
			with_id: "SELECT haves.have_id as id, t.thing_id, t.name, t.description, haves.public, u.user_id as owner_id, u.name as owner FROM haves INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE have_id=$1 ORDER BY haves.date_added DESC ",
			with_id_and_user_id: "SELECT haves.have_id as id, t.thing_id, t.name, t.description, haves.public u.user_id as owner_id, u.name as owner FROM haves INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE have_id=$1 and user_id=$2 ORDER BY haves.date_added DESC "
		},
		needs: {
			all: 
				"SELECT a.need_id as id, a.public, (u.user_id = $1) as owned, u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description FROM needs a INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) ORDER BY a.date_added DESC ",
			all_with_search: 
				"SELECT a.need_id as id, a.public, (u.user_id = $1) as owned, u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description FROM needs a INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE t.name ILIKE $2 ORDER BY a.date_added DESC ",
			all_public: 
				"SELECT a.need_id as id, a.public, (u.user_id = $1) as owned, u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description FROM needs a INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE a.public=true ORDER BY a.date_added DESC ",
			all_public_with_search: 
				"SELECT a.need_id as id, a.public, (u.user_id = $1) as owned, u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description FROM needs a INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE a.public=true AND t.name ILIKE $2 ORDER BY a.date_added DESC ",
			with_user_id: 
				"SELECT a.need_id as id, a.public, (u.user_id = $1) as owned, u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description FROM needs a INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE user_id = $1 ORDER BY a.date_added DESC ",
			with_id:
				"SELECT needs.need_id as id, t.thing_id, t.name, t.description, needs.public, u.user_id as owner_id, u.name as owner FROM needs INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE need_id=$1 ORDER BY needs.date_added DESC ",
			with_id_and_user_id:
				"SELECT needs.need_id as id, t.thing_id, t.name, t.description, needs.public, u.user_id as owner_id, u.name as owner FROM needs INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id) WHERE need_id=$1 and user_id=$2 ORDER BY needs.date_added DESC "
		},
		things: {
			random:
				"SELECT name, description FROM things OFFSET floor(random()* (SELECT count(*) from things) ) LIMIT 1;"
		},
		matches: {
			all:
				"SELECT match_id, need_id, have_id, status FROM matches",
			with_match_id:
				"SELECT match_id, need_id, have_id, status FROM matches WHERE match_id = $1",
			haves_with_user_id:
				"SELECT match_id, need_id, have_id, status FROM haves h INNER JOIN matches m USING (have_id) WHERE user_id=$1",
			needs_with_user_id:
				"SELECT match_id, need_id, have_id, status FROM needs n INNER JOIN matches m USING (need_id) WHERE user_id=$1",
		},
		converstation: {
			with_match_id: 
				"SELECT user_id, match_id, u.name, message, m.date_added FROM match_messages m INNER JOIN users u USING(user_id) WHERE match_id = $1 ORDER BY m.date_added"
		}
	},
	insert: {
		user: 
			"INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id",
		thing:
			"INSERT INTO things (name, description, creator) VALUES ($1, $2, $3) RETURNING thing_id",
		have:
			"INSERT INTO haves (user_id, thing_id, public) VALUES ($1, $2, $3)",
		need:
			"INSERT INTO needs (user_id, thing_id, public) VALUES ($1, $2, $3)",
		match:
			"INSERT INTO matches (have_id,need_id) VALUES ($1, $2)",
		message:
			'INSERT INTO match_messages ( user_id, match_id, message) VALUES ($1,$2,$3)',
	},
	update: {
		users: {
			verify:
				"UPDATE users SET verified = true WHERE email = $1",
			password:
				"UPDATE users SET password = $1 WHERE user_id = $2",

		},
		thing: {
			with_thing_id_created_by: 
				"UPDATE things SET (name, description) = ($3,$4) WHERE thing_id=$2 and creator=$1"
		},
		have: {
			set_public: 
				"UPDATE haves SET public=$1 WHERE thing_id = $2 and user_id = $3"
		},
		need: {
			set_public: 
				"UPDATE needs SET public=$1 WHERE thing_id = $2 and user_id = $3"
		}
	},
};

/* global exports:true */
exports = module.exports = sql;