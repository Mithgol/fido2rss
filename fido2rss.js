#!/usr/bin/env node

var fs = require('fs');
var lock = require('lockfile');

var fido2rss = require('./');

// CLI options:
var thisver = require('./package.json').version;
var opts = require('commander')
   .version(thisver)
   .option('--lock [path]',
      'Path (with the filename) used to generate a lock file.'
   ).option('--base <path>',
      'Path (with the filename, but no extension) of the JAM base.'
   ).option('--area <name>',
      'The areatag (echotag) of the echomail area.'
   ).option('--out <path>',
      'Path (with the filename) used to generate the RSS output.'
   ).option('--type <type>',
      'Message base type: "JAM" (default) or "Squish" (without quotes).'
   ).option('--msg [number]',
      'How many latest messages from the area to publish in RSS.\n' +
      '(By default, 23.)'
   )
   .parse(process.argv);

if( typeof opts.lock !== 'string' || opts.lock.length < 1 ){
   opts.lock = void 0;
}

if( typeof opts.out !== 'string' || opts.out.length < 1 ){
   console.log('The RSS output path is not given.');
   process.exit(1);
}

// Lock file, prepare the unlocking function:
try {
   if( typeof opts.lock === 'string' ){
      lock.lockSync(opts.lock);
   }
} catch(e) {
   console.log('Cannot create lock: ' + opts.lock + '\n');
   throw e;
}

var unlock = function(){
   try {
      if( typeof opts.lock === 'string' ){
         lock.unlockSync(opts.lock);
      }
   } catch(e) {
      console.log('Cannot remove lock: ' + opts.lock + '\n');
      throw e;
   }
};

fido2rss(opts, function(err, rssData){
   unlock();
   if( err ) throw err;

   fs.writeFileSync(opts.out, rssData, {
      encoding: 'utf8'
   });
});