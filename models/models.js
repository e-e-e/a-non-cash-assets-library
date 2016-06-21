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

class Users {

	get (id, password) {
		var q;
		if(!id) {
			// if no id is provided return full list of users
			return db.query('SELECT user_id, name, email FROM users')
				.then( result => result.rows );
		}
		if(typeof id === 'string') {
			var email = validator.normalizeEmail( id, { lowercase: true, remove_dots: false, remove_extension: true });
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

	add (name, email, password ) {
		// validate password
		if(!password || typeof password !== 'string' || 
				password.length < 6 || !validator.isAscii(password)){
			return Q.reject('Password must be greater than 6 characters long and standard characters.');
		}
		// validate email
		if(!validator.isEmail(email)) {
			return Q.reject('Email is not valid.');
		}

		//sanitise 
		var nice_email = validator.normalizeEmail( email, { lowercase: true, remove_dots: false, remove_extension: true });
		var nice_name = name;
		// then hash password
		// insert results into database 

		return genSalt(10)
			.then( salt => hash(password,salt))
			.then( hashed => {
				console.log(hashed.length);
				return db.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id',[nice_name, nice_email, hashed]);
				})
			.then( result => {
				return result.rows[0];
			});
	}

}

/*global exports:true*/
exports = module.exports = {
	users: new Users()
};