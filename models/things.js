/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

'use strict';

const validator = require('validator');
const Q 				= require('q');
const bcrypt		= require('bcrypt');
const db 				= require('./database.js');


function is_valid_thing(thing) {
	if (!thing.name) return false;
	return true;
}

function exists (results) {
	if(results.rowCount===1)
		return results.rows[0];
	else if(results.rowCount > 1) {
		return results.rows;
	}	else throw "No such thing!";
}

/** Interface to Things within the database. */
class Things {

	constructor () {
		//select statements
		let variables = "u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description";
		let join = "INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id)";
		this.select_needs = "SELECT needs.need_id, needs.public, " + variables + " FROM needs " + join;
		this.select_haves = "SELECT haves.have_id, haves.public, " + variables + " FROM haves " + join;
		this.select_needs_with_user_id = this.select_needs + "WHERE user_id = $1";
		this.select_haves_with_user_id = this.select_haves + "WHERE user_id = $1";
		this.select_need_with_id = "SELECT needs.need_id, t.thing_id, t.name, t.description, needs.public FROM needs INNER JOIN things t USING (thing_id) WHERE need_id=$1";
		this.select_have_with_id = "SELECT haves.have_id, t.thing_id, t.name, t.description, haves.public FROM haves INNER JOIN things t USING (thing_id) WHERE have_id=$1";
		//insert statments
		this.insert_into_things = "INSERT INTO things (name,description, creator) VALUES ($1, $2, $3) RETURNING thing_id";
		this.insert_into_haves = "INSERT INTO haves (user_id, thing_id, public) VALUES ($1, $2, $3)";
		this.insert_into_needs = "INSERT INTO needs (user_id, thing_id, public) VALUES ($1, $2, $3)";
		//update statements

	}

	add (user_id, thing) {
		if(!is_valid_thing(thing)) {
			return Q.reject('Failed: You need to fill out the name field');
		}
		//what about html injection? this is  covered by dustjs.
		return db.query(this.insert_into_things,[thing.name, thing.description, user_id])
			.then( result => {
				let thing_id = result.rows[0].thing_id;
				if (thing.type === 'have') {
					return db.query(this.insert_into_haves, [ user_id,thing_id,thing.public || false ] );
				}	else if (thing.type === 'need') {
					return db.query(this.insert_into_needs, [ user_id,thing_id,thing.public || false, ] );
				} else {
					throw "Invalid Thing Type";
				}
			});
	}

	update (user_id, thing) {
		if(!is_valid_thing(thing)) {
			return Q.reject('Failed: You need to fill out the name field');
		}
		return db.query("UPDATE things SET (name, description) = ($3,$4) WHERE thing_id=$2 and creator=$1;", [user_id,thing.thing_id, thing.name, thing.description ])
			.then( result => {
				if(thing.type === 'have')
					return db.query("UPDATE haves SET public=$1 WHERE thing_id = $2 and user_id = $3", [thing.public || false, thing.thing_id, user_id]);
				else
					return db.query("UPDATE needs SET public=$1 WHERE thing_id = $2 and user_id = $3", [thing.public || false, thing.thing_id, user_id]);
			});
	}

	update_have (user_id, thing) {

	}

	kill (thing_id) {
		//remove thing
		return db.query("DELETE things WHERE thing_id = $1;",[thing_id]);
	}

	get_have (have_id) {
		// get 
		return db.query(this.select_have_with_id, [have_id] ).then(exists);
	}

	get_need (need_id) {
		return db.query(this.select_need_with_id, [need_id] ).then(exists);
	}

	get (user_id, thing_id) {
		// will only get things if things creator matches user_id - user cannot edit what they did not make.
		return db.query("SELECT thing_id, name, description FROM things WHERE thing_id=$2 AND creator=$1;",[user_id,thing_id])
			.then(exists);
	}

	random () {
		//this should be optimised so that it does not count things list every time.
		return db.query("SELECT name, description FROM things OFFSET floor(random()* (SELECT count(*) from things) ) LIMIT 1;")
			.then(result => {
				if(result.rowCount>0){
					return result.rows[0];
				}	else { 
					return { name: "something",
									 description:"" };
				}
			});
	}

	haves (user_id) {
		var q;
		if(user_id){
			q = db.query(this.select_haves_with_user_id, [user_id]);
		} else {
			q = db.query(this.select_haves);
		}
		return q.then( res => res.rows );
	}

	needs (user_id) {
		var q;
		if(user_id){
			q = db.query(this.select_needs_with_user_id, [user_id]);
		} else {
			q = db.query(this.select_needs);
		}
		return q.then( res => res.rows );
	}
}

/*global exports:true*/
exports = module.exports = Things;
