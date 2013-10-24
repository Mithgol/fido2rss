The **Fido2RSS** application makes RSS feeds out of Fidonet echomail areas.

## Requirements

* Fido2RSS is written in JavaScript and requires [Node.js](http://nodejs.org/) (version 0.10 or newer) to run.

* Fido2RSS supports only the JAM [(Joaquim-Andrew-Mats)](http://groups.google.com/group/fido7.ru.ftn.develop/msg/e2f5486f80394418) type of Fidonet message bases.

## Installing Fido2RSS

1. Make sure that Node.js and npm are installed on your system. (See the “[Installation](https://github.com/joyent/node/wiki/Installation)” article in the Node's wiki.)

2. Download the source code of Fido2RSS from GitHub and put it to a directory.

3. Run `npm install --production` in that directory.

4. Edit the configuration in the `settings.cfg` file.

## Updating Fido2RSS

1. Make a backup copy of your `settings.cfg` file.

2. Download the newer source code of Fido2RSS from GitHub and replace the old source code.

3. Run `npm install --production` in that directory.

4. Replace the settings in the `settings.cfg` file with the settings from your backup copy of the file.

## Settings

The file `settings.cfg` is a [simple text configuration file](https://github.com/Mithgol/simteconf#simple-text-configuration-files) where each line contain a name and a (space-separated) value of some setting.

There are following settings:

* `LockFile` — the filename that is used to generate a lock file. You may use it to prevent Fido2RSS and HPT (or any other echomail processor that supports lock files) from running simultaneously and trying to process the same echomail area.

* `AreaPath` — the full path (with the filename, but without extensions) of the JAM base.

* `AreaName` — the areatag (echotag) of the echomail area.

* `Messages` — a number of the latest messages taken from the area and published to the RSS feed.

## License

MIT License, see the `LICENSE` file.