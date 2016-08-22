
/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const url = require('url');

const express = require('express');
const Q 			= require('q');

const Things 	= require('../models/models.js').Things;


/* global exports:true */
exports = module.exports = {
	render_template: render_template,
	handle_error: handle_error,
	is_logged_in: is_logged_in,
	get_haves_and_needs:get_haves_and_needs,
	get_have:get_have,
	get_need:get_need,
	get_haves:get_haves,
	get_needs:get_needs,
	get_have_by_query_id: get_have_by_query_id,
	get_need_by_query_id: get_need_by_query_id,
	is_admin: is_admin,
	attach_template_data:attach_template_data,
};


function render_template (template) {
	return (req,res) => res.render(template, req.data);
}

function handle_error (req, res, path) {
	return err => {
		if ( typeof err === 'string' ) {
			req.flash('error', err);
		} else {
			req.flash('error', err.message);
			console.log(err.stack);
		}
		res.redirect(path);
	};
}

/* Middleware to append data to request object used in rendering dust templates */
function attach_template_data (req,res,next) {
	//setup defaults that will be passed to all rendered template
	req.data = {
		title: 'Arts Assets Prototype',
		path: url.parse(req.originalUrl).pathname,
		menu: [{ 
			name: 'About',
			link:'/about',
			title: 'Learn about about this project.',
		},{ 
			name: 'Listings',
			link:'/',
			title: 'Find the things you need to make art and share the things you have for others.'
			}],
		user: req.user,
		message: req.flash('message'),
		error: req.flash('error') /* get error if raised on previous route */
	};
	next();
}

/** Middleware to add haves and wants to template data */
function get_haves_and_needs (req,res, next) {
	Q.all([
			Things.haves(req.user),
			Things.needs(req.user)
		]).spread( (haves, needs) => {
			req.data.haves = haves;
			req.data.needs = needs;
		}).catch(err=> console.log('error getting haves/needs',err))
		.then(()=>next()); // an array of have objects
}

function get_need (req,res, next ) {
	Things.need(req.query.id).
		then ( results => {
			req.data.thing = results;
		}).catch(err=> console.log('can’t find need', err))
		.then(()=>next());
}

function get_have (req,res, next ) {
	Things.have(req.query.id).
		then ( results => {
			req.data.thing = results;
		}).catch(err=> console.log('can’t find have', err))
		.then(()=>next());
}

function get_haves (req,res, next ) {
	Things.haves(req.user).
		then ( results => {
			req.data.haves = results;
		}).catch(err=> console.log('error getting haves.',err))
		.then(()=>next()); // an array of have objects
}

function get_needs (req,res, next ) {
	Things.needs(req.user).
		then ( results => {
			req.data.needs = results;
		}).catch(err=> console.log('error getting needs.',err))
		.then(()=>next()); // an array of have objects
}

//get need and have functions need to be refactored into a single function
function get_have_by_query_id (req,res,next) {
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

function get_need_by_query_id (req,res,next) {
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

/** Simple middleware function to check if user is loged in before accessing restricted routes */
function is_logged_in(req, res, next) {
	if (req.isAuthenticated())
		return next();
	res.redirect('/');
}

/** Simple middleware function to check if user is admin in before accessing restricted routes */
function is_admin(req, res, next) {
	if (req.user.admin)
		return next();
	res.redirect('/');
}