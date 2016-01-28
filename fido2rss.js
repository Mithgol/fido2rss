#!/usr/bin/env node

var fs = require('fs');
var lock = require('lockfile');

var fido2rss = require('./');

const shi = 20;

// CLI options:
var opts = require('commander')
   .version( require('./package.json').version )
   .option('--lock [path]',
      "Lock file's path (and filename)."
   ).option('--base <path>',
      "Message base's path (and filename, but no extension)."
   ).option('--area <name>',
      'The areatag (echotag) of the echomail area.'
   ).option('--type [type]',
      'Message base type: "JAM" (default) or "Squish".\n' +
      ' '.repeat(shi) +
      '("JAM" or "Squish" must be given without quotes.)',
      'JAM'
   ).option('--out <path>',
      "RSS output's path (and filename)."
   ).option('--msg [number]',
      'How many latest messages to publish in RSS.\n' +
      ' '.repeat(shi) + '(By default, 23 messages are published.)'
   ).option('--IPFS [host:port]',
      'Use an IPFS daemon to store UUE-encoded images in IPFS.\n' +
      ' '.repeat(shi) + '(If "--IPFS" is given without host:port,\n' +
      ' '.repeat(shi) + 'the default host:port is localhost:5001.\n' +
      ' '.repeat(shi) +
      'If even "--IPFS" is missing, then UUE-encoded images\n' +
      ' '.repeat(shi) + 'are not stored in IPFS at all.)'
   )
   .parse(process.argv);

if( typeof opts.lock !== 'string' || opts.lock.length < 1 ){
   opts.lock = void 0;
}

if( typeof opts.out !== 'string' || opts.out.length < 1 ){
   console.log('The RSS output path is not given.');
   process.exit(1);
}

// Lock file, prepare the `unlock`:
try {
   if( typeof opts.lock === 'string' ){
      lock.lockSync(opts.lock);
   }
} catch(e) {
   console.log('Cannot create lock: ' + opts.lock + '\n');
   throw e;
}

var unlock = () => {
   try {
      if( typeof opts.lock === 'string' ){
         lock.unlockSync(opts.lock);
      }
   } catch(e) {
      console.log('Cannot remove lock: ' + opts.lock + '\n');
      throw e;
   }
};

fido2rss(opts, (err, rssData) => {
   unlock();
   if( err ) throw err;

   fs.writeFileSync(opts.out, rssData, {
      encoding: 'utf8'
   });
});