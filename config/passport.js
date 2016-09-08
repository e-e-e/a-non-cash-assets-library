/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

'use strict';

var LocalStrategy = require('passport-local').Strategy;

var User = require('../models/user.js');

module.exports = function(passport) {
	
	passport.serializeUser((user,done) => done(null, user.user_id) );
	
	passport.deserializeUser(
		(id,done) => User.deserialise(id)
											.then( user => done(null,user) )
											.catch( err => done(err) )
		);

	passport.use('local-signup', 
		new LocalStrategy({
			usernameField : 'email',
			passwordField : 'password',
			passReqToCallback : true
		},(req, email, password, done) => {
			User.signup(req.body.name, email, password)
				.then(handle_user(done,req))
				.catch(handle_rejection(done,req));
		})
	);

	passport.use('local-login',
		new LocalStrategy({
			usernameField : 'email',
			passwordField : 'password',
			passReqToCallback : true
		},(req,email,password, done) => {
			User.login(email,password)
				.then(handle_user(done,req))
				.catch(handle_rejection(done,req));
		})
	);

	function handle_user(done, req) {
		return user => {
			if(!user) done(null, false, req.flash('error', 'No users found.'));
			else done(null, user);
		};
	}

	function handle_rejection(done, req) {
		return err => {
			console.log(err);
			if(typeof err === 'string') {
				//show flash message
				console.log('err',err);
				done(null, false, req.flash('error', err));
			} else {
				done(null, false, req.flash('error', err.message));
			}
		};
	}
};
