/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const url			= require('url');

const express = require('express');
const Q 			= require('q');

const helpers = require('./middleware.js');
const transactions = require('../transactions');
const User = require('../models/models.js').User;
const Things = require('../models/models.js').Things;
const Matches = require('../models/models.js').Matches;

/* global exports:true */
exports = module.exports.router = configure_router;

function configure_router() {

	const router = express.Router();

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

	router.get('/matches',
			do_user_action('attach_haves_that_match'),
			do_user_action('attach_needs_that_match'),
			helpers.render_template('profile/matches'));

	router.get('/matches/chat',
		(req,res,next)=> {
			Matches.conversation(req.query.match_id)
				.then(words=> {
					req.data.messages = words;
					next();
				}).catch(err=> next(err));
		},
		(req,res,next)=> {
			Matches.get(req.query.match_id)
				.then(match=> {
					req.data.match = match;
					next();
				}).catch(err=> next(err));
		},
		helpers.render_template('profile/chat'));

	router.get('/password',
			helpers.render_template('profile/password'));

	router.get('/add/need',
			helpers.get_random_thing,
			helpers.render_template('profile/add-a-need'));

	router.get('/add/have',
			helpers.get_random_thing,
			helpers.render_template('profile/add-a-have'));

	router.get('/edit/need',
			helpers.get_need_by_query_id,
			helpers.render_template('profile/edit-a-need'));

	router.get('/edit/have',
			helpers.get_have_by_query_id,
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

	router.post('/matches/offer',
		do_user_action_and_redirect('offer_match',
			'Match offered!',
			'/profile/matches'));

	router.post('/matches/accept', 
		do_user_action_and_redirect('accept_match',
			'Match Accepted now chat about it!',
			'/profile/matches'));

	router.post('/matches/dismiss', 
		do_user_action_and_redirect('dismiss_match',
			'Match has been ignored',
			'/profile/matches'));

	router.post('/matches/comment', 
		(req,res) => {
			let path = '/profile/matches/chat?match_id='+req.body.match_id;
			req.user.comment_on_match(req.body)
				.then( results => {
					req.flash('message', "Commented Successfully");
					res.redirect(path);
				})
				.catch( helpers.handle_error(req,res,path) );
		});
		// do_user_action_and_redirect('comment_on_match',
		// 	'Commented Successfully',
		// 	'profile/matches'));
	return router;
}
