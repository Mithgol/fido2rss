#!/usr/bin/env node

var util = require('util');

var opts = require('commander')
   .version( require('./package.json').version )
   .option('--lock [path]',
      'Path (with the filename) used to generate a lock file.'
   ).option('--base <path>',
      'Path (with the filename, but no extension) of the JAM base.'
   ).option('--area <name>',
      'The areatag (echotag) of the echomail area.'
   ).option('--msg [number]',
      'How many latest messages from the area to publish in RSS.\n' +
      '(By default, 23.)'
   )
   .parse(process.argv);

console.log(util.inspect(
   opts, false, Infinity, true
));