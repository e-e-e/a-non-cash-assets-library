/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

'use strict';

const validator = require('validator');
const Q 				= require('q');
const bcrypt		= require('bcrypt');
const db 				= require('./database.js');


/** Interface to Things within the database. */
class Things {

	constructor () {
		this.select_needs = "SELECT u.user_id as owner_id, u.name as owner, t.thing_id, t.name, t.description FROM needs INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id)";
		this.select_haves = "SELECT u.user_id as owner_id, u.name as owner, t.name, t.thing_id, t.description FROM haves INNER JOIN users u USING (user_id) INNER JOIN things t USING (thing_id)";
		this.select_needs_with_user_id = this.select_needs + "WHERE user_id = $1";
		this.select_haves_with_user_id = this.select_haves + "WHERE user_id = $1";
	}

	add (user_id, thing) {
		//add validation here. what if thing has no name.
		//what about html injection? is this covered by dustjs?
		return db.query('INSERT INTO things (name,description) VALUES ($1, $2) RETURNING thing_id',[thing.name, thing.description])
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

	random () {
		return db.query("SELECT name,description FROM things OFFSET floor(random()* (SELECT count(*) from things) ) LIMIT 1;")
			.then(result => {
				if(result.rowCount>0){
					return result.rows[0];
				}	else { 
					return { name: "something",
									 description:"" };
				}
			});
	}

	update (thing_id, name, description) {
		//validate name and description
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
