/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

'use strict';

const User = require('./user.js');
const Things = require('./things.js');

/*global exports:true*/
exports = module.exports = {
	User: User,
	Things: Things
};