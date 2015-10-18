var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var minifycss = require('gulp-minify-css');
var concat = require('gulp-concat');


gulp.task('css', function () {
  gulp.src('./src/sass/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: ['last 2 versions', 'ie >= 9'],
        cascade: false
    }))
    .pipe(minifycss())
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('cssbuild', function () {
  gulp.src('./src/sass/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
        browsers: ['last 2 versions', 'ie >= 9'],
        cascade: false
    }))
    .pipe(gulp.dest('./dist/css'));
});

gulp.task('uglify', function() {
  return gulp.src('src/js/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'));
});


gulp.task('js', function() {
  return gulp.src(['src/js/main.js', 'src/js/jquery.js'])
    .pipe(concat('app.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./dist/js'));
});

gulp.task('jsbuild', function() {
  return gulp.src(['src/js/jquery.min.js', 'src/js/main.js'])
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./dist/js'));
});


// tasks
gulp.task('default', ['cssbuild', 'jsbuild']);
gulp.task('prod', ['css', 'js']);
