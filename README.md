The **Fido2RSS** application makes RSS feeds out of Fidonet echomail areas.

## Requirements

* Fido2RSS is written in JavaScript and requires [Node.js](http://nodejs.org/) (version 0.10 or newer) to run.

* Fido2RSS supports only the JAM [(Joaquim-Andrew-Mats)](http://groups.google.com/group/fido7.ru.ftn.develop/msg/e2f5486f80394418) type of Fidonet message bases.

## Installing Fido2RSS

[![(npm package version)](https://badge.fury.io/js/fido2rss.png)](https://npmjs.org/package/fido2rss)

* Latest packaged version: `npm install -g fido2rss`

* Latest githubbed version: `npm install -g https://github.com/Mithgol/fido2rss/tarball/master`

You may visit https://github.com/Mithgol/fido2rss#readme occasionally to read the latest `README` because the package's version is not planned to grow after changes when they happen in `README` only. (However, `npm publish --force` may happen eventually.)

## Using Fido2RSS

You may run the installed application by typing in the command line:

`fido2rss [options]`

where `[options]` is a space-separated list of the following options:

### --lock path

*(optional)*

The filename that is used to generate a lock file.

You may use it to prevent both Fido2RSS and HPT (or any other echomail processor that supports lock files) from running simultaneously and trying to process the same echomail area.

### --base path

*(required)*

The full path (with the filename, but without extensions) of the JAM base.

### --area name

*(required)*

The areatag (echotag) of the echomail area.

### --msg number

How many latest messages are taken from the area and published to the RSS feed.

## Testing Fido2RSS

It is necessary to install [JSHint](http://jshint.com/) for testing.

* You may install JSHint globally (`npm install jshint -g`) or locally (`npm install jshint` in the directory of Fido2RSS).

After that you may run `npm test` (in the directory of Fido2RSS). Only the JS code errors are caugth.

## License

MIT License, see the `LICENSE` file.