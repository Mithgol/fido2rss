The **Fido2RSS** application makes RSS feeds out of Fidonet echomail areas.

## Requirements

* Fido2RSS is written in JavaScript and requires [Node.js](http://nodejs.org/) (version 0.10 or newer) to run.

* Fido2RSS supports only a couple of Fidonet message base types: JAM [(Joaquim-Andrew-Mats)](http://groups.google.com/group/fido7.ru.ftn.develop/msg/e2f5486f80394418) and Squish.

## Installing Fido2RSS

[![(npm package version)](https://nodei.co/npm/fido2rss.png?downloads=true&downloadRank=true)](https://npmjs.org/package/fido2rss)

* Latest packaged version: `npm install -g fido2rss`

* Latest githubbed version: `npm install -g https://github.com/Mithgol/fido2rss/tarball/master`

The application becomes installed globally and appears in the `PATH`.

You may visit https://github.com/Mithgol/fido2rss#readme occasionally to read the latest `README` because the package's version is not planned to grow after changes when they happen in `README` only. (And `npm publish --force` is [forbidden](http://blog.npmjs.org/post/77758351673/no-more-npm-publish-f) nowadays.)

### Installing as a portable application

Instead of the above, download the [ZIP-packed](https://github.com/Mithgol/fido2rss/archive/master.zip) source code of Fido2RSS and unpack it to some directory. Then run `npm install --production` in that directory.

You may now move that directory (for example, on a flash drive) across systems as long as they have the required version of Node.js installed.

Unlike the above (`npm -g`), the application does not appear in the `PATH`, and thus you'll have to run it directly from the application's directory. You'll also have to use `node fido2rss [options]` instead of `fido2rss [options]`.

## Using Fido2RSS

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

How many latest messages are taken from the area and published to the RSS feed.

By default, 23.

### --out path

*(required)*

The full path (with the filename) that is used to generate the RSS output file.

## Testing Fido2RSS

[![(build testing status)](https://travis-ci.org/Mithgol/fido2rss.svg?branch=master)](https://travis-ci.org/Mithgol/fido2rss)

It is necessary to install [JSHint](http://jshint.com/) for testing.

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of Fido2RSS).

After that you may run `npm test` (in the directory of Fido2RSS). Only the JS code errors are caught.

**Note:** if you test a generated local RSS file by dragging and dropping it to Firefox, the file is not recognized as RSS. That's a known Firefox bug ([#420004](https://bugzilla.mozilla.org/show_bug.cgi?id=420004)) discovered in 2008.

## License

MIT License, see the `LICENSE` file.