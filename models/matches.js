/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const Q 				= require('q');
const moment    = require('moment');

const db 				= require('./database.js');
const sql 			= require('./queries');
const transactions = require('../transactions/');

class Matches {

	static get_have_and_need_details(have_id,need_id) {
		return Q.all([
				db.query(sql.select.haves.user_details_and_thing_name_with_id,[have_id]),
				db.query(sql.select.needs.user_details_and_thing_name_with_id,[need_id])
			])
			.spread( (have, need) => {
				let h = have.rows[0];
				let n = need.rows[0];
				return { havers_email: h.email, 
								 needers_email: n.email, 
								 havers_name: h.name, 
								 needers_name:n.name, 
								 have:h.thing, 
								 need:n.thing };
			});
	}

	static add (have_id, need_id) {
		return db.query(sql.insert.match,[have_id,need_id])
						.tap(() => 
							Matches.get_have_and_need_details(have_id,need_id)
								.then( data => transactions.match(data.havers_email, data) )
								.catch(err => console.log(err))
						);
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
						 .then( results => {
							 return results.rows.map( e => {
								 e.time_ago_in_words = moment(e.date_added).fromNow();
								 return e;
							 });
						 });
	}
}

/*global exports:true */
exports = module.exports = Matches;