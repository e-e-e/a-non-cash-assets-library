/* jshint esnext:true, globalstrict:true */
/* global exports:true, require, module, console, __dirname */

'use strict';

const options = require('../config.json').mailgun;
const path = require('path');
const Q = require('q');
const Mailgun = require('mailgun-js');
const kleiDust = require('klei-dust');

const templates = {
	welcome: {
		subject: "Thanks for signing up to the Arts Asset Platform.",
		body: path.join(__dirname,"/emails/welcome.dust")
	}
};

function send_email(template, to, data) {
	var deferred = Q.defer();

	var mg = new Mailgun({ domain:options.domain, apiKey:options.apiKey });
	kleiDust.dust(template.body, data, (err, body) => {
		if(err)
			return deferred.reject(err);
		var email_data = {
			to: to,
			from : "info@frontyardprojects.org",
			subject : template.subject,
			html: body
		};
		mg.messages().send(email_data, deferred.makeNodeResolver());
	});
	return deferred.promise;
}

function make_send_func (template) {
	return (to, data) => send_email(template,to, data);
} 

// refactor this to be automatically built from templates object
exports = module.exports = {
	welcome: make_send_func(templates.welcome),
};