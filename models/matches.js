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
						 .then( results=> results.rows );
	}
}

/*global exports:true */
exports = module.exports = Matches;