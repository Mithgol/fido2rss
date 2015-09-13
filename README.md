[![(a histogram of downloads)](https://nodei.co/npm-dl/fido2rss.png?height=3)](https://npmjs.org/package/fido2rss)

**Fido2RSS** is a Node.js module and a CLI application; both make RSS feeds out of Fidonet echomail areas.

## Requirements

* Fido2RSS is written in JavaScript and requires [Node.js](http://nodejs.org/) to run.

* Fido2RSS supports only a couple of Fidonet message base types: JAM [(Joaquim-Andrew-Mats)](http://groups.google.com/group/fido7.ru.ftn.develop/msg/e2f5486f80394418) and Squish.

## Installing Fido2RSS

[![(npm package version)](https://nodei.co/npm/fido2rss.png?downloads=true&downloadRank=true)](https://npmjs.org/package/fido2rss)

### Installing as a module

* Latest packaged version: `npm install fido2rss`

* Latest githubbed version: `npm install https://github.com/Mithgol/fido2rss/tarball/master`

The module becomes installed locally and appears in `node_modules/fido2rss`. Then use `require('fido2rss')` to access the module.

You may visit https://github.com/Mithgol/fido2rss#readme occasionally to read the latest `README` because the package's version is not planned to grow after changes when they happen in `README` only. (And `npm publish --force` is [forbidden](http://blog.npmjs.org/post/77758351673/no-more-npm-publish-f) nowadays.)

### Installing as an application

* Latest packaged version: `npm install -g fido2rss`

* Latest githubbed version: `npm install -g https://github.com/Mithgol/fido2rss/tarball/master`

The application becomes installed globally and appears in the `PATH`. Then use `fido2rss` command to run the application.

### Installing as a portable application

Instead of the above, download the [ZIP-packed](https://github.com/Mithgol/fido2rss/archive/master.zip) source code of Fido2RSS and unpack it to some directory. Then run `npm install --production` in that directory.

You may now move that directory (for example, on a flash drive) across systems as long as they have the required version of Node.js installed.

Unlike the above (`npm -g`), the application does not appear in the `PATH`, and thus you'll have to run it directly from the application's directory. You'll also have to run `node fido2rss [options]` instead of `fido2rss [options]`.

## Using Fido2RSS as an application

You may run the installed application by typing in the command line:

`fido2rss [options]`

where `[options]` is a space-separated list of the following options and their values:

### --lock path

*(optional)*

The full path (with the filename) that is used to generate a lock file.

You may use it to prevent both Fido2RSS and HPT (or any other echomail processor that supports lock files) from running simultaneously and trying to process the same echomail area.

### --base path

*(required)*

The full path (with the filename, but without extensions) of the message base.

### --type typeID

*(optional)*

Message base type. Use `--type Squish` for Squish message bases. The default type is JAM.

### --area name

*(required)*

The areatag (echotag) of the echomail area.

### --msg number

*(optional)*

How many latest messages are taken from the echomail area and published to the RSS feed.

By default, 23.

### --out path

*(required)*

The full path (with the filename) that is used to generate the RSS output file.

## Using Fido2RSS as a module

You may `require()` the installed module and get a function that asynchronously converts Fidonet messages to RSS output.

That function accepts an object of options and a callback that receives an error (or `null`) and RSS output (a string).

```js
var Fido2RSS = require('fido2rss');
Fido2RSS(options, function(err, outputRSS){
   if( err ){
      // an error happened
   } else {
      // conversion is successful, you may use `outputRSS` now
   }
});
```

The following properties in the object of options are processed:

* `options.area` — the areatag (echotag) of the echomail area. (Required.)

* `options.base` — the full path (with the filename, but without extensions) of the message base. (Required.)

* `options.msg` — how many latest messages are taken from the echomail area and published to the RSS feed. (By default, 23.)

* `options.type` — the message base's type. By default, `'JAM'`; can also be `'Squish'` (not case-sensitive). An unknown type is also treated as `'JAM'`.

* `options.areaPrefixURL` — the prefix to be added before `area://…` URLs that appear in RSS output. (For example, if `.areaPrefixURL` is `'https://example.org/fidonet?'`, then the URL `'https://example.org/fidonet?area://Test/'` will appear instead of original `'area://Test/'`.) Some WebBBS support is necessary on the server side (of the given server) for such URLs to be working.
   * This property also affects URLs of images and other files decoded from UUE codes. When the property is defined, these files are given with prefixed `area://…` URLs instead of [RFC2397-compliant](http://tools.ietf.org/html/rfc2397) `data:` URLs.
   * By default, `.areaPrefixURL` is not defined. It means that prefixing does not happen and files use `data:` URLs.
   * This property is useful when RSS output is known to be consumed by RSS readers or web sites that are not ready to encounter [FGHI URLs](https://github.com/Mithgol/FGHI-URL) or impose length limits on individual RSS items or the whole RSS feed (`data:` URLs tend to be rather lengthy).
      * For example, [LiveJournal](http://www.livejournal.com/) has some [small entry size](http://www.livejournal.com/support/faq/165.html).

## Testing Fido2RSS

[![(build testing status)](https://img.shields.io/travis/Mithgol/fido2rss/master.svg?style=plastic)](https://travis-ci.org/Mithgol/fido2rss)

It is necessary to install [JSHint](http://jshint.com/) for testing.

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of Fido2RSS).

After that you may run `npm test` (in the directory of Fido2RSS). Only the JS code errors are caught; the code's behaviour is not tested.

**Note:** if you also test a generated local RSS file by dragging and dropping it to Firefox, the file is not recognized as RSS. That's a known Firefox bug ([#420004](https://bugzilla.mozilla.org/show_bug.cgi?id=420004)) discovered in 2008.

## License

MIT License, see the `LICENSE` file.