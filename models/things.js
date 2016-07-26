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

/** Interface to Things within the database. */
class Things {

	constructor () {
		let select = "SELECT u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description, t.visible FROM ";
		let join = " INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id)";
		this.select_needs = select + "needs" + join;
		this.select_haves = select + "haves" + join;
		this.select_needs_with_user_id = this.select_needs + "WHERE user_id = $1";
		this.select_haves_with_user_id = this.select_haves + "WHERE user_id = $1";
	}

	add (user_id, thing) {
		if(!is_valid_thing(thing)) {
			return Q.reject('Failed: You need to fill out the name field');
		}
		//what about html injection? this is  covered by dustjs.
		return db.query('INSERT INTO things (name,description,visible, creator) VALUES ($1, $2, $3, $4) RETURNING thing_id',[thing.name, thing.description, thing.visible || false, user_id])
			.then( result => {
				let thing_id = result.rows[0].thing_id;
				if (thing.type === 'have') {
					return db.query('INSERT INTO haves (user_id, thing_id) VALUES ($1, $2)', [ user_id,thing_id ] );
				}	else if (thing.type === 'need') {
					return db.query('INSERT INTO needs (user_id, thing_id) VALUES ($1, $2)', [ user_id,thing_id ] );
				} else {
					throw "Invalid Thing Type";
				}
			});
	}

	update (thing_id, thing) {
		if(!is_valid_thing(thing)) {
			return Q.reject('Failed: You need to fill out the name field');
		}
		//validate name and description
		return db.query("UPDATE things SET (name, description, visible) = ($2,$3,$4) WHERE thing_id = $1;",[thing_id, thing.name, thing.description, thing.visible || false ]);
	}

	kill (thing_id) {
		//remove thing
		return db.query("DELETE things WHERE thing_id = $1;",[thing_id]);
	}

	get (user_id, thing_id) {
		return db.query("SELECT thing_id, name, description, visible FROM things WHERE thing_id=$2 and creator=$1;",[user_id,thing_id])
			.then(result => {
				if(result.rowCount>0)
					return result.rows[0];
				else throw "No such thing!";
			});
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
		if(user_id)
			q = db.query(this.select_haves_with_user_id, [user_id]);
		else 
			q = db.query(this.select_haves);
		return q.then( res => res.rows );
	}

	needs (user_id) {
		var q;
		if(user_id)
			q = db.query(this.select_needs_with_user_id, [user_id]);
		else 
			q = db.query(this.select_needs);
		return q.then( res => res.rows );
	}
}

/*global exports:true*/
exports = module.exports = Things;
