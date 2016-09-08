/* jshint esnext:true, globalstrict:true */
/* global exports:true, require, module, console, __dirname */

'use strict';

const options = require('../config.json');
const path = require('path');
const Q = require('q');
const Mailgun = require('mailgun-js');
const kleiDust = require('klei-dust');

const default_data = {
	'domain': options.server.domain
};

const templates = {
	welcome: {
		subject: "Thanks for signing up to the Arts Asset Platform.",
		body: path.join(__dirname,"/emails/welcome.dust")
	},
	verified: {
		subject: "Arts Asset Platform Account Verified",
		body: path.join(__dirname,"/emails/verified.dust")
	},
	match: {
		subject: "Hey you've got a match.",
		body: path.join(__dirname,"/emails/match.dust")
	}
};

// export each template as a function
for (let template in templates) {
	module.exports[template] = make_send_func(templates[template]);
}

function make_send_func (template) {
	if(options.server.transactions==="mailgun") {
		return (to, data) => send_email(template,to, data);
	} else {
		return (to, data) => Q.reject('No transactional email setup.');
	}
} 

function mixin(data, obj) {
	for(let property in obj) {
		if ( obj.hasOwnProperty(property) && 
				!data.hasOwnProperty(property) ) {
			data[property] = obj[property];
		}
	}
	return data;
}

function send_email(template, to, data) {
	var deferred = Q.defer();
	var mg = new Mailgun({ domain:options.mailgun.domain, apiKey:options.mailgun.apiKey });
	//mixin default data
	data = mixin(data,default_data);
	kleiDust.dust(template.body, data, (err, body) => {
		if(err)
			return deferred.reject(err);
		var email_data = {
			to: to,
			from : options.mailgun.from,
			subject : template.subject,
			html: body
		};
		mg.messages().send(email_data, deferred.makeNodeResolver());
	});
	return deferred.promise;
}

