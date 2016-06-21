/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const express = require('express');

module.exports.router = configure_router;

function configure_router (passport) {

	const router = express.Router();

	/* Middleware to append data to request object used in rendering dust templates */
	router.use( (req,res,next) => {
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
	});

	/* Get routes */

	router.get('/', (req,res)=>{
		res.render('index', req.data);
	});

	router.get('/login', (req,res)=> {
		res.render('login', req.data);
	});

	router.get('/signup', (req,res)=> {
		res.render('signup', req.data);
	});

	router.get('/profile', isLoggedIn, (req,res)=> {
		res.render('profile', req.data);
	});

	router.get('/logout', (req,res)=> {
		req.logout();
		res.redirect('/');
	});

	/* Post routes */

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

	/** Simple middleware function to check if user is loged in before accessing restricted routes */
	function isLoggedIn(req, res, next) {
		if (req.isAuthenticated())
			return next();
		res.redirect('/');
	}

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
