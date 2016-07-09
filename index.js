/* jshint esnext:true, globalstrict:true */
/* global require, console, __dirname */

"use strict";

//
// Need to make a nice defaults function in case 
// options are not explicitly passed, or config.json is absent.
//
// function defaults() {
// 	var options;
// 	try {
// 		options = require('./config.json');
// 	} catch (e) { options = {}; }
// 	return {
// 		port: options.port || 8080
// 	};
// }

const options			= require('./config.json');
const express			= require('express');
const passport		= require('passport');
const flash				= require('connect-flash');
const session			= require('express-session');
const kleiDust		= require('klei-dust');
const helmet			= require('helmet');
const bodyParser	= require('body-parser');
const errorHandler= require('errorhandler');

const app					= express();
const server			= require('http').Server(app);
const main_router	= require('./routes/main.js');

require('./config/passport.js')(passport);

kleiDust.setOptions({useHelpers:true});

app.set('views', __dirname + '/views');
app.engine('dust', kleiDust.dust);
app.set('view engine', 'dust');
app.set('view options', {layout: false});

app.use(helmet());
app.use(helmet.noCache());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(session(options.cookies));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// set static path
app.use(express.static(__dirname + '/public/dist/'));

app.use(main_router.router(passport));

app.use(errorHandler());

server.listen(options.server.port, (err,res) => {
	if(err)	console.log(err);
	else console.log('listening to port ', options.server.port);
});
