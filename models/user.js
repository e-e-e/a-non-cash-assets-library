/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const validator = require('validator');
const Q 				= require('q');
const bcrypt		= require('bcrypt');

const db 				= require('./database.js');
const sql 			= require('./queries');
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

class User {

	constructor(id) {
		this.user_id = id;
	}
 
	// - get my account data
	attach_details () {
		return db.query(sql.select.users.user_with_id, [ this.user_id ])
			.then(results => {
				//attach results to user object
				this.name = results.rows[0].name;
				this.email = results.rows[0].email;
				this.verified = results.rows[0].verified;
				this.admin = results.rows[0].admin;
				return this;
			});
	}

	// - get my things (needs and haves)
	attach_things () {
		return Q.all([
			db.query(sql.select.needs.with_user_id, [this.user_id]),
			db.query(sql.select.haves.with_user_id, [this.user_id])
			])
		.spread((needs,haves)=> {
			this.needs = needs.rows;
			this.haves = haves.rows;
		});
	}

	get_need (id) {
		let q = (this.admin) ? db.query(sql.select.needs.with_id, [id]):
							db.query(sql.select.needs.with_id_and_user_id, [id,this.user_id]);
		return q.then(exists);
	}

	get_have (id) {
		let q = (this.admin) ? db.query(sql.select.haves.with_id, [id]):
							db.query(sql.select.haves.with_id_and_user_id, [id,this.user_id]);
		return q.then(exists);
	}

	// - add a need
	// - add a have
	add_thing (thing) {
		if(!is_valid_thing(thing)) {
			return Q.reject('Failed: You need to fill out the name field');
		}
		//what about html injection? this is  covered by dustjs.
		return db.query(sql.insert.thing, [thing.name, thing.description, this.user_id])
			.then( result => {
				let thing_id = result.rows[0].thing_id;
				if (thing.type === 'have') {
					return db.query(sql.insert.have, [ this.user_id, thing_id, thing.public || false ] );
				}	else if (thing.type === 'need') {
					return db.query(sql.insert.need, [ this.user_id, thing_id, thing.public || false ] );
				} else {
					throw "Invalid Thing Type";
				}
			});
	}
	
	// - update my need
	// - update my have
	// - TODO: enable admin to edit things that are not theirs.
	update_thing (thing) {
		if(!is_valid_thing(thing)) {
			return Q.reject('Failed: You need to fill out the name field');
		}
		//check if has type propety that is valid
		return db.query(
				sql.update.thing.with_thing_id_created_by, 
				[this.user_id,thing.thing_id, thing.name, thing.description ]
			).then( result => db.query( 
				(thing.type === 'have') ? 
				sql.update.have.set_public : 
				sql.update.need.set_public,
				[ thing.public || false, thing.thing_id, this.user_id ] 
			));
	}

	// - update my name
	
	// - update my password
	update_password(options) {
		if(options.newpassword !== options.confirmpassword) {
			return Q.reject('New passwords do not match.');
		} else if (!is_valid_password(options.newpassword)){
			return Q.reject('New password must be greater than 6 characters long and standard characters.');
		}
		//check if old password matches and then updated with new one.
		return db.query(sql.select.users.user_password_with_id, [this.user_id])
			.then( result => compare(options.old_password,result.rows[0].password))
			.then( match => {
				if(!match) return Q.reject('Password is incorrect');
				else return genSalt(10);
			})
			.then( salt => hash(options.newpassword,salt))
			.then( hashed => db.query(sql.update.users.password, [ hashed, this.user_id ]));
	}

	// - hide my thing (need or have?)
	// - show my thing (need or have?)

	/** static functions  */

	static deserialise(id) {
		// construct new user from id
		var user = new User(id);
		return user.attach_details();
	}

	static login(username, password) {
		// returns new user object
		let query;
		let key = username.trim();
		if(validator.isEmail(key)) {
			key = validator.normalizeEmail( key, normalize_email_options);
			query = sql.select.users.user_with_email;
		} else {
			query = sql.select.users.user_with_name;
		}
		return db.query(query ,[key])
			.then( result => {
				if(result.rowCount===0) 
					return Q.reject('Email/Name or password is incorrect');
				console.log(result);
				return Q.all([compare(password,result.rows[0].password), result]);
			})
			.spread( (match, result) => {
				if(!match) 
					return Q.reject('Password is incorrect');
				return new User(result.rows[0].user_id);
			});
	}

	static signup(username, email, password) {
		// returns a new user object
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

		var nice_name = username;
		// then hash password and
		// insert results into database 
		return genSalt(10)
			.then( salt => hash(password,salt))
			.then( hashed => {
				return db.query(sql.insert.user, [nice_name, nice_email, hashed]);
				})
			.tap( result =>{ 
				// send an email to verify account.
				return transactions.welcome(nice_email,{
						name:nice_name, 
						verify:'/verify/?email='+encodeURIComponent(nice_email)
					}).catch(err=> console.log('failed to send message!', err));
			})
			.then( result => {
				return new User(result.rows[0].user_id);
			});
	}

	//dont need to be loged in to verify email
	static verify (email) {
		return db.query(sql.update.users.verify, [email])
			.tap(result => {
				if(result.rowCount>0) {
					return transactions.verified(email, { profile: '/profile' })
						.catch(err=> console.log('failed to send message!', err));
				}
			});
	}

}

/* global exports:true */
exports = module.exports = User;

//general info

// - get a random thing
// - get a list of public things
