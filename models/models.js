/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

'use strict';

const validator = require('validator');
const Q 				= require('q');
const bcrypt		= require('bcrypt');
const db 				= require('./database.js');

const hash = Q.nfbind(bcrypt.hash);
const genSalt = Q.nfbind(bcrypt.genSalt);
const compare = Q.nfbind(bcrypt.compare);

const normalize_email_options = { 
	lowercase: true, 
	remove_dots: false, 
	remove_extension: true 
};


/** Interface to Users within the database. */
class Users {
	/** 
	 * Retrieve user from database. 
	 * @param {number|string} id - user_id or email address of user
	 * @param {string} [password] - password to compare, rejects if passwords do not match 
	 * @returns {Promise} resolves to user object.
	 */
	get (id, password) {
		var q;
		if(!id) {
			// if no id is provided return full list of users
			return db.query('SELECT user_id, name, email FROM users')
				.then( result => result.rows );
		}
		if(typeof id === 'string') {
			var email = validator.normalizeEmail( id, normalize_email_options);
			if (password)
				q = db.query('SELECT user_id, name, email, password FROM users WHERE email = $1',[email])
					.then( result => {
						if(!result.rows) 
							return Q.reject('Email or password is incorrect');
						return Q.all(compare(password,result.rows[0].password), result);
					})
					.spread( (match, result) => {
						if(!match) 
							return Q.reject('Password is incorrect');
						//remove password from returned user
						delete result.rows[0].password;
						return result;
					});
			else 
				q = db.query('SELECT user_id, name, email FROM users WHERE email = $1',[email]);
		} else {
			q = db.query('SELECT user_id, name, email FROM users WHERE user_id = $1',[id]);
		}
		return q.then(result => result.rows[0]);
	}

	/** 
	 * Add new user to database. 
	 * Validates data and hashes password.
	 * @param {string} name - username
	 * @param {string} email - user's email
	 * @param {string} password - the user's new password.
	 * @returns {Promise} resolves to user_id of new user.
	 */
	add (name, email, password ) {
		// TODO: validate name

		// validate password
		if(!password || typeof password !== 'string' || 
				password.length < 6 || !validator.isAscii(password)){
			return Q.reject('Password must be greater than 6 characters long and standard characters.');
		}

		// validate email
		if(!validator.isEmail(email)) {
			return Q.reject('Email is not valid.');
		}

		// sanitise email
		var nice_email = validator.normalizeEmail( email, normalize_email_options);
		
		// TODO: sanitise name - only valid characters
		var nice_name = name;

		// then hash password and
		// insert results into database 
		return genSalt(10)
			.then( salt => hash(password,salt))
			.then( hashed => {
				console.log(hashed.length);
				return db.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id',[nice_name, nice_email, hashed]);
				})
			.tap(()=>{
				// send an email to verify account.
			})
			.then( result => {
				return result.rows[0];
			});
	}
}

/** Interface to Things within the database. */
class Things {

	add (user_id, thing) {
		return db.query('INSERT INTO things (name,description) VALUES ($1, $2) RETURNING thing_id',[thing.name, thing.description])
			.then( result => {
				let thing_id = result.rows[0].thing_id;
				return db.query('INSERT INTO $1 (user_id, thing_id) VALUES ($2, $3)', [ 'haves', user_id,thing_id ] );
			});
	}

	haves(user_id) {

	}

	needs(user_id) {
		
	}
}

/*global exports:true*/
exports = module.exports = {
	users: new Users(),
	things: new Things()
};