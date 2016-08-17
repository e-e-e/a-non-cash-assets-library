/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const express = require('express');
const Q 			= require('q');

const helpers = require('./middleware.js');
const models 	= require('../models/models.js');
const Matches = models.Matches;
const transactions = require('../transactions');

/* global exports:true */
exports = module.exports.router = configure_router;

function configure_router() {

	const router = express.Router();

	//select matches
	router.get('/matchmaker/have',
		helpers.get_have_by_query_id,
		helpers.get_needs, // get the list of needs
		helpers.render_template('admin/matchmaker'));

	router.get('/matchmaker/need',
		helpers.get_need_by_query_id,
		helpers.get_haves, // get the list of haves
		helpers.render_template('admin/matchmaker'));

	//add matches
	router.post('/add/matches', (req,res)=> {
		let success_msg = 'matches made';
		if(req.body.type === 'needs') {
			let have_id = req.body.id;
			let promises = (Array.isArray(req.body.matches)) ? 
				req.body.matches.map(id=> Matches.add(have_id,id)) : 
				[ Matches.add(have_id, req.body.matches) ];
			Q.all(promises).then( () => {
				req.flash(success_msg);
				res.redirect('/admin/view/matches');
			}).catch( helpers.handle_error(req,res,'/matchmaker/have') );
		} else {
			let need_id = req.body.id;
			let promises = (Array.isArray(req.body.matches)) ? 
				req.body.matches.map(id=> Matches.add(id, need_id)) : 
				[ Matches.add(req.body.matches, need_id) ];
			Q.all(promises).then( () => {
				req.flash(success_msg);
				res.redirect('/admin/view/matches');
			}).catch( helpers.handle_error(req,res,'/matchmaker/have') );
		}
	});

	return router;
}