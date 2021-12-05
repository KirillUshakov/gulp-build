//Path
//////////////////////////////////////
const project_folder = "dist"
const source_folder = "#src"
const fs = require('fs')

const path = {
  build: {
    html: project_folder + '/',
    css: project_folder + '/css/',
    js: project_folder + '/js/',
    img: project_folder + '/img/',
    fonts: project_folder + '/fonts/',
  },

  src: {
    html: [source_folder + '/*.html', '!' + source_folder + '/_*.html'],
    css: source_folder + '/scss/style.scss',
    js: source_folder + '/js/script.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}',
    fonts: source_folder + '/fonts/*.ttf',
  },

  watch: {
    html: source_folder + '/**/*.html',
    css: source_folder + '/scss/**/*.scss',
    js: source_folder + '/js/**/*.js',
    img: source_folder + '/img/**/*.{jpg,png,svg,gif,ico,webp}'
  },

  clean: './' + project_folder
}

//Require
//////////////////////////////////////
const {src, dest} = require('gulp')
const gulp = require('gulp')
const browsersync = require('browser-sync').create()
const fileinclude = require('gulp-file-include')
const del = require('del')
const scss = require('gulp-sass')(require('sass'))
const autoprefixer = require('gulp-autoprefixer')
const groupMedia = require('gulp-group-css-media-queries')
const cleanCSS = require('gulp-clean-css')
const rename = require('gulp-rename')
const cleanJS = require('gulp-uglify-es').default
const imagemin = require('gulp-imagemin')
const webp = require('gulp-webp')
const webpHtml = require('gulp-webp-html')
const webpCss = require('gulp-webpcss')
const ttf2woff = require('gulp-ttf2woff')
const ttf2woff2 = require('gulp-ttf2woff2')
const fonter = require('gulp-fonter')
const sassGlob = require('gulp-sass-glob')

//Functions
//////////////////////////////////////

// -- BrowserSync
function browserSync(params) {
  browsersync.init({
    server: {
      baseDir: './' + project_folder + '/'
    },
    port: 3000,
    notify: false,
    open: false
  })
}

// -- HTML
function html() {
  return src(path.src.html)
    .pipe(fileinclude())
    .pipe(webpHtml())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}

// -- CSS
function css() {
  return src(path.src.css)
    .pipe(sassGlob())
    .pipe(
      scss({
        outputStyle: 'expanded'
      }).on('error', scss.logError)
    )
    .pipe(groupMedia())
    .pipe(
      autoprefixer({
        overrideBrowserslist: ['last 5 versions'],
        cascade: true
      })
    )
    .pipe(webpCss())
    .pipe(dest(path.build.css))
    .pipe(cleanCSS())
    .pipe(
      rename({
        extname: ".min.css"
      })
    )
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

// -- JS
function js() {
  return src(path.src.js)
    .pipe(fileinclude())
    .pipe(dest(path.build.js))
    .pipe(cleanJS())
    .pipe(
      rename({
        extname: ".min.js"
      })
    )
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

// -- Images
function images() {
  return src(path.src.img)
    .pipe(
      webp({
        quality: 70,
        webpClass: '.webp',
        noWebpClass: '.no-webp'
      })
    )
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(
      imagemin({
        progressive: true,
        svgoPlugins: [{ removeViewBox: false }],
        interlaced: true,
        optimizationLevel: 3 // 0 to 7
      })
    )
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}

// -- Fonts
function fonts() {
  src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
  return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}

// -- Watch
function watchFiles() {
  gulp.watch([path.watch.html], html)
  gulp.watch([path.watch.css], css)
  gulp.watch([path.watch.js], js)
  gulp.watch([path.watch.img], images)
}

// -- Clean
function clean(params) {
  return del(path.clean)
}

// -- Font style
function fontsStyle(params) {
  let file_content = fs.readFileSync(source_folder + "/scss/_fonts.scss");
  if (file_content == "") {
    fs.writeFile(source_folder + "/scss/_fonts.scss", "", cb);
    return fs.readdir(path.build.fonts, function (err, items) {
      if (items) {
        let c_fontname;
        for (var i = 0; i < items.length; i++) {
          let fontname = items[i].split(".");
          fontname = fontname[0];
          if (c_fontname != fontname) {
            fs.appendFile(
              source_folder + "/scss/_fonts.scss",
              '@include font("' +
                fontname +
                '", "' +
                fontname +
                '", "400", "normal");\r\n',
              cb
            );
          }
          c_fontname = fontname;
        }
      }
    });
  }
}

// -- Cb
function cb () {
}

// Tasks
//////////////////////////////////////
gulp.task('otf2ttf', function () {
  return src([ source_folder + '/fonts/*.otf' ])
    .pipe(
      fonter({
        formats: ['ttf']
      })
    )
    .pipe(dest(source_folder + '/fonts/'))
})

//Exports
//////////////////////////////////////
const build = gulp.series(clean, gulp.parallel(html, css, js, images, fonts), fontsStyle)
const watch = gulp.parallel(build, watchFiles, browserSync)

exports.html = html
exports.css = css
exports.js = js
exports.images = images
exports.fonts = fonts
exports.fontsStyle = fontsStyle
exports.build = build
exports.watch = watch
exports.default = watch
