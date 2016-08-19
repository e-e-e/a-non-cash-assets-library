/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const Q 				= require('q');

const db 				= require('./database.js');
const sql 			= require('./queries');
const transactions = require('../transactions/');

class Matches {

	static add (have_id, need_id) {
		return db.query(sql.insert.match,[have_id,need_id]);
	}

	static all() {
		return db.query(sql.select.matches.all)
						 .then( results => Q.all( results.rows.map( Matches.get_details )));
	}

	static get_details (match) {
		return Q.all([ 
				db.query(sql.select.needs.with_id, [match.need_id]), 
				db.query(sql.select.haves.with_id, [match.have_id]), 
				match
			]).spread((need,have,match) => {
				return { need:need.rows[0], 
								 have:have.rows[0],
								 match: match }; 
			});
	}

	static get(match_id) {
		return db.query(sql.select.matches.with_match_id,[match_id])
			.then( results => results.rows[0] )
			.then( Matches.get_details );
	}

	static conversation(match_id) {
		return db.query(sql.select.converstation.with_match_id, [match_id])
						 .then( results => results.rows );
	}
}

/*global exports:true */
exports = module.exports = Matches;