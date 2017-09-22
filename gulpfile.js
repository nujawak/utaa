// init
var params       = {};
var gulp         = require('gulp');
var sass         = require('gulp-sass');
var sourcemaps   = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');

/**
 * sass settings
 * @link https://github.com/dlmanning/gulp-sass#options
 */
params.sass = {
	src   : './resources/scss/**/*.scss',
	dest  : './resources/css',
	option: {
		outputStyle : 'compressed', // :expanded or :nested or :compact or :compressed
	}
}
/**
 * sourcemaps settings
 * @link https://github.com/gulp-sourcemaps/gulp-sourcemaps#init-options
 */
params.sourcemaps = {
	dest  : '.',
	option: {
		sourceRoot: '../scss/',
		includeContent: false,
		sourceMappingURL: function(){ return 'style.css.map' },
	}
}
/**
 * autoprefixer settings
 * @link https://github.com/postcss/autoprefixer#options
 */
params.autoprefixer = {
	option : {
		browsers: ['last 2 versions'],
		cascade: false
	}
}

/**
 * sass task
 * 
 */
gulp.task('sass', function(){
	return gulp
		.src( params.sass.src )
		.pipe( sourcemaps.init() )
		.pipe( sass(params.sass.option).on('error', sass.logError) )
		.pipe( autoprefixer(params.autoprefixer.option) )
		.pipe( sourcemaps.write(params.sourcemaps.dest, params.sourcemaps.option) )
		.pipe( gulp.dest(params.sass.dest) );
});

/**
 * watch task
 * 
 */
gulp.task('watch', function () {
	gulp.watch(params.sass.src, ['sass']);
});

/**
 * default task
 * 
 */
gulp.task('default', ['watch']);
