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

	//select matches
	router.get('/matchmaker/:type', 
		// get the need 
		// get the list of haves
		middleware.render_template('admin/matchmaker'));

	//add matches
	router.post('/add/matches', (req,res)=> {
		//add
	});

	return router;
}