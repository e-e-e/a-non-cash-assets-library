/* jshint esnext:true, globalstrict:true */
/* global require, console, __dirname */

"use strict";

function defaults() {
	var options;
	try {
		options = require('./config.json');
	} catch (e) { options = {}; }
	return {
		port: options.port || 8080
	};
}

const options			= defaults();
const express			= require('express');
const kleiDust		= require('klei-dust');
const helmet			= require('helmet');
const bodyParser	= require('body-parser');
const errorHandler= require('errorhandler');

const app = express();
const server = require('http').Server(app);
const main_router = require('./routes/main.js');


app.set('views', __dirname + '/views');
app.engine('dust', kleiDust.dust);
app.set('view engine', 'dust');
app.set('view options', {layout: false});

app.use(helmet());
app.use(helmet.noCache());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// set static path
app.use(express.static(__dirname + '/public/dist'));

app.use(main_router.router);

app.use(errorHandler());

server.listen(options.port, (err,res) => {
	if(err)	console.log(err);
	else console.log('listening to port', options.port);
});
