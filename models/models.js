/* jshint esnext:true, globalstrict:true */
/* global require, module, console, __dirname */

'use strict';

const Users = require('./users.js');
const Things = require('./things.js');

/*global exports:true*/
exports = module.exports = {
	users: new Users(),
	things: new Things()
};