// init
var params       = {};
var gulp         = require('gulp');
var sass         = require('gulp-sass');
var sourcemaps   = require('gulp-sourcemaps');
var autoprefixer = require('gulp-autoprefixer');
var uglify   = require('gulp-uglify');
var rename   = require('gulp-rename');
var plumber  = require('gulp-plumber');
var jsonminify = require('gulp-jsonminify');

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
 * 
 */
params.js = {
	src : 'resources/js/script.js',
	dest: 'resources/js'
}
gulp.task('js', function(){
	gulp.src( params.js.src )
	.pipe(plumber())
	.pipe(uglify())
	.pipe(rename({extname: '.min.js'}))
	.pipe(gulp.dest( params.js.dest  ));
});

/**
 * 
 */
gulp.task('minify', function () {
	gulp.src( 'resources/js/songs.json' )
	.pipe(jsonminify())
	.pipe(rename({extname: '.min.json'}))
	.pipe(gulp.dest( 'resources/js' ));
});


/**
 * watch task
 * 
 */
gulp.task('watch', function () {
	gulp.watch(params.sass.src, ['sass']);
	gulp.watch(params.js.src, ['js']);
});

/**
 * default task
 * 
 */
gulp.task('default', ['watch', 'minify']);
