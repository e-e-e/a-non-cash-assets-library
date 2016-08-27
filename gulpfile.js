/* jshint esnext:true, globalstrict:true */
/* global require, process, console, __dirname */

"use strict";

const gulp = require('gulp');
const gutil = require('gulp-util');
const watch = require('gulp-watch');
const less = require('gulp-less');
const cleanCSS = require( 'gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
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
		.pipe(sourcemaps.init())
		.pipe(less())
		.on('error',gutil.log)
		.pipe(cleanCSS())
		.pipe(autoprefixer({
			browsers: ['last 4 versions'],
			cascade: false
		}))
		.pipe(rename({
			suffix: '.min'
		}))
		.pipe(sourcemaps.write('.'))
		.pipe(gulp.dest(paths.styles.dest));
});

gulp.task('hinting', () => {
	return gulp.src(paths.hinting.src)
		.pipe(jshint())
		.on('error',gutil.log)
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
		watch(paths.server.watch, () => gulp.start('server'));
		watch(paths.styles.src,() => gulp.start('styles'));
		watch(paths.hinting.src,() => gulp.start('hinting'));
	});
});

gulp.task('default', () => {
	runSequence('clean',['hinting','styles'], function(){});
});


// clean up if an error goes unhandled.
process.on('exit', () => {if (node) node.kill();});
