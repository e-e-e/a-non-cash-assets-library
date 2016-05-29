/* jshint esnext:true, globalstrict:true */
/* global require, process, console, __dirname */

"use strict";

const gulp = require('gulp');
const less = require('gulp-less');
const cleanCSS = require( 'gulp-clean-css');
const rename = require( 'gulp-rename');
const jshint = require( 'gulp-jshint');
const runSequence = require('run-sequence');
const del = require('del');
const spawn = require('child_process').spawn;
var node;

const paths = {
	styles: {
		src: './public/src/less/**/*.less',
		dest: './public/dist/css/'
	},
	hinting: {
		src: ['./**/*.js', '!node_modules/**']
	},
	server: {
		watch: ['./**/*.js', '!public/**', '!views/**']
	}
};

gulp.task('clean', (done) => {
	del.sync(['./public/dist/**']);
	done();
});

gulp.task('styles', () => {
	return gulp.src(paths.styles.src)
		.pipe(less())
		.pipe(cleanCSS())
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(gulp.dest(paths.styles.dest));
});

gulp.task('hinting', () => {
	return gulp.src(paths.hinting.src)
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

gulp.task('server', () => {
	if(node) node.kill();
	node = spawn('node',['index.js'], {stdio:'inherit'});
	node.on('close', code => {
		if(code === 8) {
			gulp.log('Error detected, waiting for changes...');
		}
	});
});

gulp.task('run', () => {
	runSequence('clean',['hinting','styles'], 'server', function(){
		gulp.watch(paths.server.watch, ['server']);
		gulp.watch(paths.styles.src,['styles']);
		gulp.watch(paths.hinting.src,['hinting']);
	});
});

gulp.task('default', () => {
	runSequence('clean',['hinting','styles'], function(){});
});


// clean up if an error goes unhandled.
process.on('exit', () => {if (node) node.kill();});
