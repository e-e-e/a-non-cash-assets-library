/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

"use strict";

const express = require('express');
const router = express.Router();

router.get('/', (req,res)=>{
	res.render('index', {title:'ok working'});
});

router.get('/:path', (req,res)=> {
	res.render(req.params.path, {}, (err, html) => {
		if (err) {
			if (err.message.indexOf('Failed to lookup view') !== -1) {
				return res.render('index',{title:'something else'});
			}
			throw err;
		}
		res.send(html);
	});
});

module.exports.router = router;