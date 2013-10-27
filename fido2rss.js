#!/usr/bin/env node

var util = require('util');

// CLI options:

var opts = require('commander')
   .version( require('./package.json').version )
   .option('--lock [path]',
      'Path (with the filename) used to generate a lock file.'
   ).option('--base <path>',
      'Path (with the filename, but no extension) of the JAM base.'
   ).option('--area <name>',
      'The areatag (echotag) of the echomail area.'
   ).option('--out <path>',
      'Path (with the filename) used to generate the RSS output.'
   ).option('--msg [number]',
      'How many latest messages from the area to publish in RSS.\n' +
      '(By default, 23.)'
   )
   .parse(process.argv);

// Error processing:

(function findErrorsInOptions(){
   /* jshint bitwise: false */

   if( typeof opts.lock !== 'string' || opts.lock.length < 1 ){
      opts.lock = void 0;
   }

   if( typeof opts.msg !== 'string' || opts.msg.length < 1 ){
      opts.msg = 23;
   } else {
      opts.msg = opts.msg |0;
   }

   if( typeof opts.base !== 'string' || opts.base.length < 1 ){
      console.log('The JAM base path is not given.');
      process.exit(1);
   }

   if( typeof opts.area !== 'string' || opts.area.length < 1 ){
      console.log('The JAM area name is not given.');
      process.exit(1);
   }

   if( typeof opts.out !== 'string' || opts.out.length < 1 ){
      console.log('The RSS output path is not given.');
      process.exit(1);
   }
})();

console.log(util.inspect(
   opts, false, Infinity, true
));