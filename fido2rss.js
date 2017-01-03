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
   ).option('--IPFS-URL',
      'Also uses an IPFS daemon to convert FGHI URLs\n' +
      ' '.repeat(shi) + 'of Fidonet messages to IPFS URLs of web pages\n' +
      ' '.repeat(shi) + 'that contain FGHI URLs.\n' +
      ' '.repeat(shi) +
      '(This is useful when raw FGHI URLs are not expected\n' +
      ' '.repeat(shi) + 'by RSS readers and thus they become rejected\n' +
      ' '.repeat(shi) + 'or misunderstood.)'
   ).option('--twitter [user]',
      'A user of Twitter to whom the Fidonet messages are attributed.\n' +
      ' '.repeat(shi) + '(By default, no attribution and no Twitter Cards.)'
   ).parse(process.argv);

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