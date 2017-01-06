[![(a histogram of downloads)](https://nodei.co/npm-dl/fido2rss.png?height=3)](https://npmjs.org/package/fido2rss)

**Fido2RSS** is a Node.js module and a CLI application; both make RSS feeds out of Fidonet echomail areas.

## Requirements

* Fido2RSS is written in JavaScript and requires [Node.js](http://nodejs.org/) to run.
   * Starting from v3.0.0, Fido2RSS requires Node.js version 6.8.1 or newer because it is rewritten in ECMAScript 2016 (ES7).
   * Starting from v2.0.0, Fido2RSS requires Node.js version 4.2.2 or newer because the newer versions of IPFS API [require it.](https://github.com/ipfs/js-ipfs-api/pull/172)
   * Starting from v1.0.0, Fido2RSS requires Node.js version 4.0.0 or newer because it is rewritten in ECMAScript 2015 (ES6).
   * You may run older versions of Fido2RSS (that precede v1.0.0) with older Node.js versions (0.10.x or 0.12.x). These older versions of FidoRSS, however, had to contain additional subdependencies as polyfills for missing ECMAScript 2015 (ES6) features which are now present in Node.js.
   * Some older versions of FidoRSS (from 1.4.0 to 3.0.0, inclusively) might need an explicit `npm install mime` (in the directory of Fido2RSS) to run (unless they are used as a module for a Node-powered web application where a web server usually has the [`mime`](https://www.npmjs.com/package/mime) package already installed anyway). This issue is fixed in Fido2RSS version 3.0.1 and newer.
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

### An optional dependency

After the installation you may receive an npm warning saying that `node-webcrypto-ossl` (an optional dependency of [JavaScript IPFS API](https://github.com/ipfs/js-ipfs-api)) could not be installed. It happens if you do not have [C++ build tools for Windows](https://github.com/felixrieseberg/windows-build-tools) (or their Linux or macOS counterparts) required to build that dependency on your system, or if such tools are incomplete or outdated.

Ignore the warning. The dependency is optional and IPFS API is able to work without it.

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

### --area name

*(required)*

The areatag (echotag) of the echomail area.

### --type typeID

*(optional)*

Message base type. Use `--type Squish` for Squish message bases. The default type is JAM.

### --out path

*(required)*

The full path (with the filename) that is used to generate the RSS output file.

### --msg number

*(optional)*

How many latest messages are taken from the echomail area and published to the RSS feed.

By default, 23.

### --IPFS host:port

*(optional)*

If this option is present, then UUE-encoded images are automatically decoded and put to [IPFS](https://ipfs.io/). The given `host:port` is used to contact an IPFS daemon.

* If a mere `--IPFS` is given (i.e. without `host:port` part), the default address `--IPFS localhost:5001` is used (i.e. an IPFS daemon is expected to be running locally, alongside Fido2RSS).

* If even `--IPFS` is missing, UUE-encoded images are left as they are (not IPFS-hosted at all), i.e. this option is off by default.

IPFS-hosted images have the following advantages:

* By default (without `--IPFS` option) UUE-decoded images use large [RFC2397-compliant](http://tools.ietf.org/html/rfc2397) Data URI, while IPFS-hosted images have much shorter URI (only ≈67 characters each) and the RSS feed's size is reduced. This is important for RSS consumers that do not tolerate large entries. (For example, [LiveJournal](http://www.livejournal.com/) has some [small entry size](http://www.livejournal.com/support/faq/165.html).)

* End users (e.g. human readers) may install their own IPFS daemons and then use extensions (available [for Firefox](https://github.com/lidel/ipfs-firefox-addon/) and [for Chrome](https://github.com/dylanPowers/ipfs-chrome-extension/)) to browse IPFS locally. It has all the usual potential advantages of P2P (peer-to-peer) systems: local storage (cache), local traffic (peering), most files are still available even if their initial sources are offline or overcrowded, etc.

### --IPFS-URL

*(optional)*

If this option and the previous (`--IPFS`) option are both present, then FidoRSS uses IPFS URLs (pointing to the default https://ipfs.io/ gateway) instead of FGHI URLs as the addresses of RSS items (and also of FGHI URLs encountered inside Fidonet messages).

For inner FGHI URLs these IPFS URLs are addresses of a small IPFS-hosted page that receives real FGHI URLs in its query string and generates a hyperlink by JavaScript. (Such page is automatically generated by Fido2RSS and published in IPFS on the fly.)

For items' FGHI URLs an intermediate web page (containing the necessary FGHI URL and the whole Fidonet message) is automatically generated, and stored in IPFS, and then hyperlinked from the RSS.

This option is designed as a workaround for RSS consumers that do not expect FGHI URLs to appear in RSS. (For example, [LiveJournal](http://www.livejournal.com/) simply replaces `area:` with `http:` in FGHI URLs, which is wrong.)

### --twitter username

*(optional)*

If this option and the previous two (`--IPFS` and `--IPFS-URL`) options are present, then FidoRSS uses this option's value as a username of a [Twitter](https://twitter.com/)'s user that each of the processed Fidonet messages should be attributed to. When the message is stored in IPFS, a [Summary Card with Large Image](https://dev.twitter.com/cards/types/summary-large-image) will be generated for future references and stored in HTML5 representation's `<head>`, but only if an image for that card can be found in the Fidonet message's text. Notes:
   * An image in the Fidonet message's text is expected to appear in the form of a Fidonet Rune markup (similar to a Markdown's inline image markup).
   * If several images are present in the message, only the first image is used in the card.
   * Twitter may decide to ignore the card if it feels that the image is too small (less than 280×150 pixels) or too large (more than 1 megabyte); compose your Fidonet messages accordingly and sometimes check the related [Twitter Card docs](https://dev.twitter.com/cards/types/summary-large-image) to see if these expected values change in the future.

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

* `options.IPFS` — this option is used to decide if UUE-encoded images are automatically decoded and put to [IPFS](https://ipfs.io/). This option may have one of the following values:
   * `undefined` — UUE-encoded images are not put to IPFS.
   * `true` — UUE-encoded images are automatically decoded and put to IPFS. A local IPFS daemon (localhost:5001) is contacted.
   * `'host:port'` — Same as above, but a remote IPFS daemon is contacted (the given `'host:port'` string is used as its address).

* `options.IPFSURL` — if this option is a truthy value and the previous option (`options.IPFS`) is not `undefined`, then FidoRSS uses IPFS URLs (pointing to the default https://ipfs.io/ gateway) instead of FGHI URLs as the addresses of RSS items, and also of FGHI URLs encountered inside Fidonet messages.
   * For inner FGHI URLs these IPFS URLs are addresses of a small IPFS-hosted page that receives real FGHI URLs in its query string and generates a hyperlink by JavaScript. (Such page is automatically generated by Fido2RSS and published in IPFS on the fly.)
   * For items' FGHI URLs an intermediate web page (containing the necessary FGHI URL and the whole Fidonet message) is automatically generated, and stored in IPFS, and then hyperlinked from the RSS.
   * This option is designed as a workaround for RSS consumers that do not expect FGHI URLs to appear as addresses of RSS items. (For example, [LiveJournal](http://www.livejournal.com/) simply replaces `area:` with `http:` in FGHI URLs, which is wrong.)

* `options.areaPrefixURL` — the prefix to be added before `area://…` URLs that appear in RSS output. (For example, if `.areaPrefixURL` is `'https://example.org/fidonet?'`, then the URL `'https://example.org/fidonet?area://Test/'` will appear instead of original `'area://Test/'`.) Some WebBBS support is necessary on the server side (of the given server) for such URLs to be working.
   * This property also affects URLs of images and other files decoded from UUE codes. When the property is defined, these files are given with prefixed `area://…` URLs instead of [RFC2397-compliant](http://tools.ietf.org/html/rfc2397) `data:` URLs.
   * However, images are not affected if they were already decoded and put to IPFS (because of `options.IPFS`). Only other files are affected.
   * By default, `.areaPrefixURL` is not defined. It means that prefixing does not happen and files use `data:` URLs (unless put to IPFS).
   * This property is useful when RSS output is known to be consumed by RSS readers or web sites that are not ready to encounter [FGHI URLs](https://github.com/Mithgol/FGHI-URL) or impose length limits on individual RSS items or the whole RSS feed (`data:` URLs tend to be rather lengthy).
      * For example, [LiveJournal](http://www.livejournal.com/) has some [small entry size](http://www.livejournal.com/support/faq/165.html).

**Note:**   `options.IPFSURL` and `options.areaPrefixURL` are mutually exclusive. Therefore `options.areaPrefixURL` works only if `options.IPFSURL` is a falsy value or if `options.IPFS` is `undefined`.

* `options.twitter` — if this option's value is a string and the previous two options (`options.IPFS` and `options.IPFSURL`) are in effect, then FidoRSS uses this option's value as a username of a [Twitter](https://twitter.com/)'s user that each of the processed Fidonet messages should be attributed to. When the message is stored in IPFS, a [Summary Card with Large Image](https://dev.twitter.com/cards/types/summary-large-image) will be generated for future references and stored in HTML5 representation's `<head>`, but only if an image for that card can be found in the Fidonet message's text. Notes:
   * An image in the Fidonet message's text is expected to appear in the form of a Fidonet Rune markup (similar to a Markdown's inline image markup).
   * If several images are present in the message, only the first image is used in the card.
   * Twitter may decide to ignore the card if it feels that the image is too small (less than 280×150 pixels) or too large (more than 1 megabyte); compose your Fidonet messages accordingly and sometimes check the related [Twitter Card docs](https://dev.twitter.com/cards/types/summary-large-image) to see if these expected values change in the future.

## Testing Fido2RSS

[![(build testing status)](https://img.shields.io/travis/Mithgol/fido2rss/master.svg?style=plastic)](https://travis-ci.org/Mithgol/fido2rss)

It is necessary to install [JSHint](http://jshint.com/) for testing.

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of Fido2RSS).

After that you may run `npm test` (in the directory of Fido2RSS). Only the JS code errors are caught; the code's behaviour is not tested.

**Note:** if you also test a generated local RSS file by dragging and dropping it to Firefox, the file is not recognized as RSS. That's a known Firefox bug ([#420004](https://bugzilla.mozilla.org/show_bug.cgi?id=420004)) discovered in 2008.

## License

MIT License (see the `LICENSE` file), with the following exceptions:

* The file `redirector/jquery.min.js` contains [jQuery](https://jquery.org/) under the terms of jQuery's [license](https://jquery.org/license/).

* The file `redirector/underscore-min.js` contains [Underscore.js](http://underscorejs.org/) under the terms of Underscore's [license](https://github.com/jashkenas/underscore/blob/master/LICENSE).

* The file `redirector/jsload.gif` is generated on http://ajaxload.info/ where the terms of the [Do What The Fuck You Want To Public License](http://www.wtfpl.net/) are said to apply.
