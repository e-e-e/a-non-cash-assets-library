/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

'use strict';

const validator = require('validator');
const Q 				= require('q');
const bcrypt		= require('bcrypt');
const db 				= require('./database.js');
const sql 			= require('./queries.js');

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

	static random () {
		//this should be optimised so that it does not count things list every time.
		return db.query(sql.select.things.random)
			.then(result => {
				if(result.rowCount>0){
					return result.rows[0];
				}	else { 
					return { name: "something",
									 description:"" };
				}
			});
	}

	static check_permission(thing,user) {
		if( thing.public || (user && user.has_permission_to_see(thing))) {
			return thing;
		} else {
			throw "YOU DONT HAVE PERMISSION TO VIEW";
		}
	}

	static have (id, user) {
		return db.query(sql.select.haves.with_id, [ id ])
			.then( results => {
				if (results.rowCount > 0) {
					return Things.check_permission(results.rows[0], user);
				} else throw "NOTHING";
			});
	}

	static haves (user, search) {		
		return select_all(sql.select.haves, user, search).then( res => res.rows );
	}

	static need (id, user) {
		return db.query(sql.select.needs.with_id, [ id ])
			.then( results => {
				console.log(results);
				if (results.rowCount > 0) {
					return Things.check_permission(results.rows[0], user);
				} else throw "NOTHING";
			});
	}

	static needs (user, search) {
		return select_all(sql.select.needs, user, search).then( res => res.rows );
	}

}

/** type is the sql select query object to be executed - either haves or needs */
function select_all(type, user, search) {
	let q;
	if(user && user.admin) {
		if(search) {
			q = db.query(type.all_with_search, [user.user_id, '%'+search+'%']);
		} else {
			q = db.query(type.all, [user.user_id]);
		}
	} else {
		//get only public
		let id = (user) ? user.user_id : null;
		if(search) {
			q = db.query(type.all_public_with_search, [ id, '%'+search+'%']);
		} else {
			q = db.query(type.all_public, [ id ]);
		}
	}
	return q;
}

/*global exports:true*/
exports = module.exports = Things;
