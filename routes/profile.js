/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const express = require('express');
const Q 			= require('q');

const middleware = require('./middleware.js');
const models 	= require('../models/models.js');
const transactions = require('../transactions');

/* global exports:true */
exports = module.exports.router = configure_router;

function configure_router() {

	const router = express.Router();

	//gets a random thing to for generating placeholder texts.
	function get_random_thing (req,res,next) {
		models.things.random()
			.then( thing => {
				req.data.randomthing = thing;
			}).catch(err => console.log(err))
			.then(() => next());
	}

	function get_haves_and_wants_of_user (req,res, next) {
		Q.all([
				models.things.haves(req.user.user_id),
				models.things.needs(req.user.user_id)
			]).spread( (haves, needs) => {
				req.data.user.haves = haves;
				req.data.user.needs = needs;
			}).catch(err=> {
				console.log('error getting haves/needs');
				console.log(err);
			})
			.then(()=>next()); // an array of have objects
	}

	//get need and have functions need to be refactored into a single function
	function get_have (req,res,next) {
		if(req.query.id) {
			models.things.get_have(req.query.id)
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
			models.things.get_need(req.query.id)
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

	router.get('/', 
						get_haves_and_wants_of_user,
						middleware.render_template('profile'));

	router.get('/password',
			middleware.render_template('profile/password'));

	router.get('/add/need',
			get_random_thing,
			middleware.render_template('profile/add-a-need'));

	router.get('/add/have',
			get_random_thing,
			middleware.render_template('profile/add-a-have'));

	router.get('/edit/need',
			get_need,
			middleware.render_template('profile/edit-a-need'));

	router.get('/edit/have',
			get_have,
			middleware.render_template('profile/edit-a-have'));

	// resend verification email to confirm email
	router.get('/verify', (req, res) => {
		transactions.welcome(req.user.email,{
				name:req.user.name, 
				verify:'/verify/'+encodeURIComponent(req.user.email)
			}).then( result => {
				req.flash( 'message' ,'The welcome email has been resent. Please follow link within the email to verify your account.');
				res.redirect('/profile');
			}).catch( middleware.handle_error(req,res,'/profile') );
	});

	/* Post routes */

	// contribution 

	router.post('/add/need/', (req, res) => {
		models.things.add(req.user.user_id, req.body)
			.then( result => {
				req.flash('message',"Thanks for adding to the \"needs\" list. Hopefully we'll find a match for you soon...");
				res.redirect('/profile/add/need');
			})
			.catch( middleware.handle_error(req,res,'/profile') )
		;
	});

	router.post('/add/have/', (req, res) => {
		models.things.add(req.user.user_id, req.body)
			.then( result => {
				req.flash('message',"Thanks for adding to the \"haves\" list. You rock.");
				res.redirect('/profile/add/have');
			})
			.catch( middleware.handle_error(req,res,'/profile') )
		;
	});

	// updating info
	router.post('/update/password/', (req,res) => {
		if(req.body.newpassword !== req.body.confirmpassword) {
			req.flash('error','New passwords do not match.');
			res.redirect('/profile');
		} else {
			models.users.update_password(req.user.user_id,req.body.oldpassword, req.body.newpassword)
				.then( result => {
					req.flash('message','Password successfully updated.');
					res.redirect('/profile');
				})
				.catch( middleware.handle_error(req,res,'/profile/password') );
		}
	});

	router.post('/update/username/', (req,res) => {
		//need to add connector to model
		res.redirect('/profile');
	});

	router.post('/update/thing/', (req,res) => {
		console.log(req.body);
		models.things.update(req.user.user_id, req.body)
			.then( result => {
				req.flash('message','Successfully updated!');
				let redirect = (req.body.type === 'have')? '/profile/edit/have?id='+req.body.have_id : '/profile/edit/need?id='+req.body.need_id ;
				res.redirect(redirect);
			})
			.catch( middleware.handle_error(req,res,'/profile') );
	});

	return router;
}
