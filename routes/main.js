/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const express = require('express');
const Q 			= require('q');

const Things 				= require('../models/models.js').Things;
const User 					= require('../models/models.js').User;
const transactions 	= require('../transactions');
const helpers 			= require('./middleware.js');
const profile 			= require('./profile.js');
const admin 				= require('./admin.js');

module.exports.router = configure_router;

function configure_router (passport) {

	const router = express.Router();

	/** Middleware to add haves and wants to template data */
	function get_haves_and_wants (req,res, next) {
		Q.all([
				Things.haves(req.user),
				Things.needs(req.user)
			]).spread( (haves, needs) => {
				req.data.haves = haves;
				req.data.needs = needs;
			}).catch(err=> console.log('error getting haves/needs',err))
			.then(()=>next()); // an array of have objects
	}

	/* Get routes */

	router.get('/', 
							helpers.attach_template_data,
							get_haves_and_wants,
							helpers.render_template('index'));
	
	router.get('/login', 
							helpers.attach_template_data, 
							helpers.render_template('login'));

	router.get('/signup', 
							helpers.attach_template_data, 
							helpers.render_template('signup'));

	router.get('/about', 
							helpers.attach_template_data, 
							helpers.render_template('about'));

	/** must be logged in to access profile */
	router.use('/profile', 
							helpers.is_logged_in,
							helpers.attach_template_data,
							profile.router() );

	/** must be logged in and admin to access profile */
	router.use('/admin', 
							helpers.is_logged_in,
							helpers.is_admin,
							helpers.attach_template_data,
							admin.router() );

	router.get('/logout', (req,res)=> {
		req.logout();
		res.redirect('/');
	});
	
	/** route to verify email account */
	router.get('/verify/', (req,res) => {
		User.verify(req.query.email)
			.then(count => {
				if(count && count.rowCount>0) {
					req.flash('message', 'Account verified.');
					res.redirect('/profile');
				} else {
					req.flash('error', 'Email not found.');
					res.redirect('/');
				}
			})
			.catch( helpers.handle_error(req,res,'/') );
	});

	// authentication signup/login

	router.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile',
		failureRedirect : '/signup',
		failureFlash : true
	}));

	router.post('/login', passport.authenticate('local-login', {
		successRedirect : '/profile',
		failureRedirect : '/login',
		failureFlash : true
	}));

	return router;
}
