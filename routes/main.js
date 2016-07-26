/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const express = require('express');
const Q 			= require('q');

const models 	= require('../models/models.js');
const transactions = require('../transactions');


module.exports.router = configure_router;

function configure_router (passport) {

	const router = express.Router();

	/* Middleware to append data to request object used in rendering dust templates */
	function attach_template_data (req,res,next) {
		//setup defaults that will be passed to all rendered templates
		req.data = {
			title: 'arts assets platform',
			path: req.path,
			menu: [{ 
				name: 'About',
				link:'/about' 
			},{ 
				name: 'Listings',
				link:'/',
				}],
			user: req.user,
			message: req.flash('message'),
			error: req.flash('error') /* get error if raised on previous route */
		};
		next();
	}

	/** Middleware to add haves and wants to template data */
	function get_haves_and_wants (req,res, next) {
		Q.all([
				models.things.haves(),
				models.things.needs()
			]).spread( (haves, needs) => {
				req.data.haves = haves;
				req.data.needs = needs;
			}).catch(err=> console.log('error getting haves/needs'))
			.then(()=>next()); // an array of have objects
	}

	function get_haves_and_wants_of_user (req,res, next) {
		Q.all([
				models.things.haves(req.user.user_id),
				models.things.needs(req.user.user_id)
			]).spread( (haves, needs) => {
				req.data.user.haves = haves;
				req.data.user.needs = needs;
			}).catch(err=> console.log('error getting haves/needs'))
			.then(()=>next()); // an array of have objects
	}

	function get_random_thing (req,res,next) {
		models.things.random()
			.then( thing => {
				req.data.randomthing = thing;
			}).catch(err => console.log(err))
			.then(() => next());
	}

	function get_thing (req,res,next) {
		if(req.query.thing_id) {
			models.things.get(req.user.user_id, req.query.thing_id)
				.then( thing => {
					req.data.thing = thing;
				}).catch(err => console.log(err))
				.then(() => next());
		} else {
			req.flash('error','No thing_id specified to edit!');
			res.redirect('/profile');
		}
	}

	/** Simple middleware function to check if user is loged in before accessing restricted routes */
	function is_logged_in(req, res, next) {
		if (req.isAuthenticated())
			return next();
		res.redirect('/');
	}

	/** Function to make template rendering routes */
	function render_template (template) {
		return (req,res) => res.render(template, req.data);
	}

	/** Function to handle sending error messages */
	function handle_error(req, res, path) {
		return err => {
			if ( typeof err === 'string' ) {
				req.flash('error', err);
			} else {
				req.flash('error', err.message);
				console.log(err);
			}
			res.redirect(path);
		};
	}

	/* Get routes */

	router.get('/', 
							attach_template_data,
							get_haves_and_wants,
							render_template('index'));
	
	router.get('/login', 
							attach_template_data, 
							render_template('login'));

	router.get('/signup', 
							attach_template_data, 
							render_template('signup'));

	router.get('/about', 
							attach_template_data, 
							render_template('about'));
	
	router.get('/profile', 
							is_logged_in, 
							attach_template_data,
							get_haves_and_wants_of_user,
							render_template('profile'));

	router.get('/profile/password',
			is_logged_in,
			attach_template_data,
			render_template('profile/password'));

	router.get('/profile/add-a-need',
			is_logged_in,
			attach_template_data,
			get_random_thing,
			render_template('profile/add-a-need'));

	router.get('/profile/add-a-have',
			is_logged_in,
			attach_template_data,
			get_random_thing,
			render_template('profile/add-a-have'));

	router.get('/profile/edit-a-have',
			is_logged_in,
			attach_template_data,
			get_thing,
			render_template('profile/edit-a-have'));

	router.get('/profile/edit-a-need',
			is_logged_in,
			attach_template_data,
			get_thing,
			render_template('profile/edit-a-need'));

	router.get('/logout', (req,res)=> {
		req.logout();
		res.redirect('/');
	});
	
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
			.catch( handle_error(req,res,'/') );
	});

	// resend verification email to confirm email

	router.get('/user/verify/', is_logged_in, (req, res) => {
		transactions.welcome(req.user.email,{
				name:req.user.name, 
				verify:'/verify/'+encodeURIComponent(req.user.email)
			}).then( result => {
				req.flash( 'message' ,'The welcome email has been resent. Please follow link within the email to verify your account.');
				res.redirect('/profile');
			}).catch( handle_error(req,res,'/profile') );
	});

	/* Post routes */

	// contribution 

	router.post('/add/need/', is_logged_in, (req, res) => {
		models.things.add(req.user.user_id, req.body)
			.then( result => {
				req.flash('message',"Thanks for adding to the \"needs\" list. Hopefully we'll find a match for you soon...");
				res.redirect('/profile/add-a-need');
			})
			.catch( handle_error(req,res,'/profile') )
		;
	});

	router.post('/add/have/', is_logged_in, (req, res) => {
		models.things.add(req.user.user_id, req.body)
			.then( result => {
				req.flash('message',"Thanks for adding to the \"haves\" list. You rock.");
				res.redirect('/profile/add-a-have');
			})
			.catch( handle_error(req,res,'/profile') )
		;
	});

	// updating info
	router.post('/update/password/', is_logged_in, (req,res) => {
		if(req.body.newpassword !== req.body.confirmpassword) {
			req.flash('error','New passwords do not match.');
			res.redirect('/profile');
		} else {
			models.users.update_password(req.user.user_id,req.body.oldpassword, req.body.newpassword)
				.then( result => {
					req.flash('message','Password successfully updated.');
					res.redirect('/profile');
				})
				.catch( handle_error(req,res,'/profile/password') );
		}
	});

	router.post('/update/username/', is_logged_in, (req,res) => {
		//need to add connector to model
		res.redirect('/profile');
	});

	router.post('/update/thing/', is_logged_in, (req,res) => {
		models.things.update(req.body.thing_id, req.body)
			.then( result => {
				req.flash('message','Successfully updated!');
				res.redirect('/profile');
			})
			.catch(handle_error(req,res,'/profile'));
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
