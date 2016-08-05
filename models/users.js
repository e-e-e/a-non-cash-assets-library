/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

'use strict';

const validator = require('validator');
const Q 				= require('q');
const bcrypt		= require('bcrypt');
const db 				= require('./database.js');
const transactions = require('../transactions/');

const hash = Q.nfbind(bcrypt.hash);
const genSalt = Q.nfbind(bcrypt.genSalt);
const compare = Q.nfbind(bcrypt.compare);

const normalize_email_options = { 
	lowercase: true, 
	remove_dots: false, 
	remove_extension: true 
};

function is_valid_password(password) {
	return !(!password || typeof password !== 'string' || 
			password.length < 6 || !validator.isAscii(password));
}

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
			return db.query('SELECT user_id, name, email, verified, admin FROM users')
				.then( result => result.rows );
		}
		if(typeof id === 'string') {
			let query;
			let key = id.trim();
			if(validator.isEmail(key)) {
				key = validator.normalizeEmail( key, normalize_email_options);
				query = 'SELECT user_id, name, email, password, verified, admin FROM users WHERE email = $1';
			} else {
				query = 'SELECT user_id, name, email, password, verified, admin FROM users WHERE name = $1';
			}
			if (password)
				q = db.query(query,[key])
					.then( result => {
						if(!result.rows) 
							return Q.reject('Email/Name or password is incorrect');
						return Q.all([compare(password,result.rows[0].password), result]);
					})
					.spread( (match, result) => {
						if(!match) 
							return Q.reject('Password is incorrect');
						//remove password from returned user
						delete result.rows[0].password;
						return result;
					});
			else {
				q = db.query(query,[key]);
			}
		} else {
			q = db.query('SELECT user_id, name, email, verified, admin FROM users WHERE user_id = $1',[id]);
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
		if(!is_valid_password(password)){
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
				return db.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id',[nice_name, nice_email, hashed]);
				})
			.tap( result =>{
				// send an email to verify account.
				return transactions.welcome(nice_email,{
					name:nice_name, 
					verify:'/verify/?email='+encodeURIComponent(nice_email)
				}).catch(err=> console.log('failed to send message!', err));
			})
			.then( result => {
				return result.rows[0];
			});
	}

	update_name (user_id, name) {
		//change users name
	}

	update_password (user_id, old_password, new_password) {
		if(!is_valid_password(new_password)){
			return Q.reject('New password must be greater than 6 characters long and standard characters.');
		}
		//check if old password matches and then updated with new one.
		return db.query('SELECT password FROM users WHERE user_id = $1',[user_id])
			.then( result => {
				return compare(old_password,result.rows[0].password);
			})
			.then( match => {
				if(!match) return Q.reject('Password is incorrect');
				else return genSalt(10);
			})
			.then( salt => hash(new_password,salt))
			.then( hashed => {
				return db.query('UPDATE users SET password = $1 WHERE user_id = $2', [hashed,user_id]);
			});
	}

	verify (email) {
		return db.query('UPDATE users SET verified = true WHERE email = $1',[email])
			.tap(result => {
				if(result.rowCount>0) {
					return transactions.verified(email, { profile: '/profile' })
						.catch(err=> console.log('failed to send message!', err));
				}
			});
	}
}

/*global exports:true*/
exports = module.exports = Users;