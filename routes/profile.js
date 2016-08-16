/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const express = require('express');
const Q 			= require('q');

const helpers = require('./middleware.js');
const transactions = require('../transactions');
const User = require('../models/models.js').User;
const Things = require('../models/models.js').Things;

/* global exports:true */
exports = module.exports.router = configure_router;

function configure_router() {

	const router = express.Router();

	//gets a random thing to for generating placeholder texts.
	function get_random_thing (req,res,next) {
		Things.random()
			.then( thing => {
				req.data.randomthing = thing;
			}).catch(err => console.log(err))
			.then(() => next());
	}

	//get need and have functions need to be refactored into a single function
	function get_have (req,res,next) {
		if(req.query.id) {
			req.user.get_have(req.query.id)
				.then( thing => {
					req.data.thing = thing;
				})
				.catch(err => console.log(err))
				.then(() => next());
		} else {
			req.flash('error','No thing_id specified to edit!');
			res.redirect('/profile');
		}
	}

	function get_need (req,res,next) {
		if(req.query.id) {
			req.user.get_need(req.query.id)
				.then( thing => {
					req.data.thing = thing;
				})
				.catch(err => console.log(err))
				.then(() => next());
		} else {
			req.flash('error','No thing_id specified to edit!');
			res.redirect('/profile');
		}
	}

	function do_user_action_and_redirect(func,success_msg,success_route, error_route) {
		return (req, res, next) => {
			//need to check existance of fn etc.
			let success_path = success_route || req.path;
			let error_path = error_route || success_path;
			req.user[func](req.body).then( results => {
					req.flash('message', success_msg || 'Success!');
					res.redirect(success_path);
				})
				.catch( helpers.handle_error(req,res,error_path) );
		};
	}

	function do_user_action(func) {
		return (req,res,next) => {
				req.user[func]()
					.then( res => next())
					.catch( err => next(err));
			};
	}

	router.get('/',
			do_user_action('attach_things'),
			helpers.render_template('profile'));

	router.get('/password',
			helpers.render_template('profile/password'));

	router.get('/add/need',
			get_random_thing,
			helpers.render_template('profile/add-a-need'));

	router.get('/add/have',
			get_random_thing,
			helpers.render_template('profile/add-a-have'));

	router.get('/edit/need',
			get_need,
			helpers.render_template('profile/edit-a-need'));

	router.get('/edit/have',
			get_have,
			helpers.render_template('profile/edit-a-have'));

	// resend verification email to confirm email
	router.get('/verify', (req, res) => {
		transactions.welcome(req.user.email,{
				name:req.user.name, 
				verify:'/verify/?email='+encodeURIComponent(req.user.email)
			}).then( result => {
				req.flash( 'message' ,'The welcome email has been resent. Please follow link within the email to verify your account.');
				res.redirect('/profile');
			}).catch( helpers.handle_error(req,res,'/profile') );
	});

	/* Post routes */

	// contribution 

	router.post('/add/need/', 
		do_user_action_and_redirect('add_thing',
			'Thanks for adding to the "needs" list. Hopefully we\'ll find a match for you soon...',
			'/profile/add/need')
		);

	router.post('/add/have/', 
		do_user_action_and_redirect('add_thing',
			'Thanks for adding to the "haves" list. You rock.',
			'/profile/add/have')
		);

	// updating info
	router.post('/update/password/', 
		do_user_action_and_redirect('update_password',
			'Password successfully updated.',
			'/profile',
			'/profile/password')
		);

	router.post('/update/username/', (req,res) => {
		//need to add connector to model
		res.redirect('/profile');
	});

	router.post('/update/thing/', 
		do_user_action_and_redirect('update_thing',
			'Successfully updated!',
			'/profile'
		));

	return router;
}
