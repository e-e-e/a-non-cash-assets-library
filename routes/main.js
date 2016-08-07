/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const express = require('express');
const Q 			= require('q');

const models 	= require('../models/models.js');
const transactions = require('../transactions');
const middleware = require('./middleware.js');
const profile = require('./profile.js');

module.exports.router = configure_router;

function configure_router (passport) {

	const router = express.Router();

	/** Middleware to add haves and wants to template data */
	function get_haves_and_wants (req,res, next) {
		Q.all([
				models.things.haves(),
				models.things.needs()
			]).spread( (haves, needs) => {
				req.data.haves = haves;
				req.data.needs = needs;
			}).catch(err=> console.log('error getting haves/needs',err))
			.then(()=>next()); // an array of have objects
	}

	/* Get routes */

	router.get('/', 
							middleware.attach_template_data,
							get_haves_and_wants,
							middleware.render_template('index'));
	
	router.get('/login', 
							middleware.attach_template_data, 
							middleware.render_template('login'));

	router.get('/signup', 
							middleware.attach_template_data, 
							middleware.render_template('signup'));

	router.get('/about', 
							middleware.attach_template_data, 
							middleware.render_template('about'));

	/** must be logged in to access profile */
	router.use('/profile', 
							middleware.is_logged_in,
							middleware.attach_template_data,
							profile.router() );

	router.get('/logout', (req,res)=> {
		req.logout();
		res.redirect('/');
	});
	
	/** route to verify email account */
	router.get('/verify/', (req,res) => {
		models.users.verify(req.query.email)
			.then(count => {
				if(count && count.rowCount>0) {
					req.flash('message', 'Account verified.');
					res.redirect('/profile');
				} else {
					req.flash('error', 'Email not found.');
					res.redirect('/');
				}
			})
			.catch( middleware.handle_error(req,res,'/') );
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
