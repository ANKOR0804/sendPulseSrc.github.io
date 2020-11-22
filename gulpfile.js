let projectFolder = require('path').basename(__dirname) // production
let sourceFolder = 'app' // workspace

let fs = require('fs')

let path = {
  build: {
    // path for build
    html: projectFolder + '/',
    css: projectFolder + '/css/',
    js: projectFolder + '/js/',
    img: projectFolder + '/img/',
    fonts: projectFolder + '/fonts/',
  },

  src: {
    // path for workspace
    html: [sourceFolder + '/*.html', '!' + sourceFolder + '/_*.html'],
    css: sourceFolder + '/scss/style.scss',
    js: sourceFolder + '/js/script.js',
    img: sourceFolder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
    fonts: sourceFolder + '/fonts/*.ttf',
  },

  watch: {
    //  path for watch
    html: sourceFolder + '/**/*.html',
    css: sourceFolder + '/scss/**/*.scss',
    js: sourceFolder + '/js/**/*.js',
    img: sourceFolder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
  },

  clean: './' + projectFolder + '/', // delete folder when gulp started
}

let { src, dest } = require('gulp'), // stream for reading/writing
  gulp = require('gulp'),
  browsersync = require('browser-sync').create(),
  file_include = require('gulp-file-include'),
  del = require('del'),
  scss = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  group_media = require('gulp-group-css-media-queries'),
  clean_css = require('gulp-clean-css'),
  rename = require('gulp-rename'),
  uglify = require('gulp-uglify-es').default,
  babel = require('gulp-babel'),
  imagemin = require('gulp-imagemin'),
  webp = require('gulp-webp'),
  webphtml = require('gulp-webp-html'),
  webpcss = require('gulp-webpcss'),
  svgSprite = require('gulp-svg-sprite'),
  ttf2woff = require('gulp-ttf2woff'),
  ttf2woff2 = require('gulp-ttf2woff2'),
  fonter = require('gulp-fonter')

function browserSync(params) {
  // browser synchronization
  browsersync.init({
    server: {
      baseDir: './' + projectFolder + '/',
    },
    port: 3000,
    notify: false,
  })
}

function html() {
  //  html processing
  return src(path.src.html)
    .pipe(file_include())
    .pipe(webphtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

function css() {
  return src(path.src.css)
    .pipe(
      scss({
        outputStyle: 'expanded',
      })
    )
    .pipe(group_media())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 5 versions'],
        cascade: true,
      })
    )
    .pipe(webpcss())
    .pipe(dest(path.build.css))
    .pipe(clean_css())
    .pipe(
      rename({
        extname: '.min.css',
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

function js() {
  //  js processing
  return src(path.src.js)
    .pipe(file_include())
    .pipe(
      babel({
        presets: ['@babel/env'],
      })
    )
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(
      rename({
        extname: '.min.js',
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

function images() {
  //  images processing
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70,
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interplaced: true,
        optimizationLevel: 3,
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

function fonts() {
  src(path.src.fonts).pipe(ttf2woff()).pipe(dest(path.build.fonts))
  src(path.src.fonts).pipe(ttf2woff2()).pipe(dest(path.build.fonts))
}

gulp.task('ottf2ttf', function () {
  return src([sourceFolder + '/fonts/*.otf'])
    .pipe(
      fonter({
        formats: ['ttf'],
      })
    )
    .pipe(dest(sourceFolder + '/fonts/'))
})

gulp.task('svgSprite', function () {
  return gulp
    .src([sourceFolder + '/iconsprite/*.svg'])
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../icons/icon.svg',
          },
        },
      })
    )
    .pipe(dest(path.build.img))
})

function fontsStyle() {
  let file_content = fs.readFileSync(source_folder + '/scss/fonts.scss')
  if (file_content == '') {
    fs.writeFile(source_folder + '/scss/fonts.scss', '', cb)
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split('.')
          fontname = fontname[0]
          if (c_fontname != fontname) {
            fs.appendFile(
              source_folder + '/scss/fonts.scss',
              '@include font("' +
                fontname +
                '", "' +
                fontname +
                '", "400", "normal");\r\n',
              cb
            )
          }
          c_fontname = fontname
        }
      }
    })
  }
}

function cb() {}

function watchFiles() {
  //  watch a task when a change occurs
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.img], images)
}

function clean() {
  // deleting unnecessary files
  return del(path.clean)
}

let build = gulp.series(
  clean,
  gulp.parallel(js, css, html, images, fonts),
  fontsStyle
)
let watch = gulp.parallel(build, browserSync, watchFiles)

exports.fontsStyle = fontsStyle
exports.fonts = fonts
exports.images = images
exports.js = js
exports.css = css
exports.html = html
exports.build = build
exports.watch = watch
exports.default = watch
