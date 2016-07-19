/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const express = require('express');
const Q 			= require('q');

const models 	= require('../models/models.js');

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
				name: 'Haves/Needs',
				link:'/',
				},{ 
				name: 'About',
				link:'/about' 
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

	router.get('/verify/:email', (req,res) => {
		models.users.verify(decodeURI(req.params.email))
			.then(count=> {
				if(count>0) {
					req.flash('message', 'Account verified.');
					res.redirect('/profile');
				} else {
					req.flash('error', 'Email not found.');
					res.redirect('/');
				}
			})
			.catch( handle_error(req,res,'/') );
	});

	router.get('/logout', (req,res)=> {
		req.logout();
		res.redirect('/');
	});

	/* Post routes */

	// contribution 

	router.post('/contribute', is_logged_in, (req, res) => {
		models.things.add(req.user.user_id, req.body)
			.then( result => {
				if(req.body.type==='need'){
					req.flash('message',"Thanks for adding to the \"needs\" list. Hopefully we'll find a match for you soon...");
					res.redirect('/profile/add-a-need');
				} else {
					req.flash('message',"Thanks for adding to the \"haves\" list. You rock.");
					res.redirect('/profile/add-a-have');
				}
			})
			.catch( handle_error(req,res,'/profile') )
		;
	});

	router.post('/update/password/', is_logged_in, (req,res, next) => {
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
