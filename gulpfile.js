
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var gutil = require('gulp-util');
var browserify = require('browserify');
var reactify = require('reactify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

var _ = require('lodash');

function bundle(watch)
{
    var bundler;
    var input = './client/index.js';

    var args = _.extend({}, watchify.args, {debug: true});

    if (watch) {
        bundler = watchify(browserify(input, args));
    } else {
        bundler = browserify(input);
    }
    bundler.transform('reactify');
    
    function bundleProper()
    {
        var bundle = bundler.bundle();
        bundle
            .pipe(source('bundle.js'))
            .pipe(gulp.dest('./client'));
    }

    bundleProper();

    if (watch) {
        bundler.on('update', bundleProper);
        bundler.on('error', gutil.log.bind(gutil, 'Browserify Error'))
    }
}

gulp.task('browserify', function() {
    bundle(false);
});

gulp.task('watchify', function() {
    bundle(true);
});


gulp.task('test-api', function () {
    return gulp.src('server/test.js', {read: false})
        .pipe(mocha({reporter: 'spec'}));
});
