/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const express = require('express');
const models = require('./models/models.js');

module.exports.router = configure_router;

function configure_router (passport) {

	const router = express.Router();

	/* Middleware to append data to request object used in rendering dust templates */
	function attach_template_data (req,res,next) {
		//setup defaults that will be passed to all rendered templates
		req.data = {
			title: 'arts asset platform',
			path: req.path,
			menu: [{ 
				name: 'home',
				link:'/',
				},{ 
				name: 'about',
				link:'/about' 
			}],
			user: req.user,
			error: req.flash('error') /* get error if raised on previous route */
		};
		next();
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

	/* Get routes */

	router.get('/', 
							attach_template_data, 
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
							render_template('profile'));

	router.get('/logout', (req,res)=> {
		req.logout();
		res.redirect('/');
	});

	/* Post routes */

	// contribution 

	router.post('/contribute', is_logged_in, (req, res) => {
		console.log(req.body);
		res.redirect('/profile');
	});

	// authentication

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

	// router.get('/:path', (req,res)=> {
	// 	res.render(req.params.path, {}, (err, html) => {
	// 		if (err) {
	// 			if (err.message.indexOf('Failed to lookup view') !== -1) {
	// 				return res.render('index',{title:'something else'});
	// 			}
	// 			throw err;
	// 		}
	// 		res.send(html);
	// 	});
	// });

	return router;
}
