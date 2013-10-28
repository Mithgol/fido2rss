#!/usr/bin/env node

var fs   = require('fs');
var JAM  = require('fidonet-jam');
var lock = require('lockfile');
var RSS  = require('rss');

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

// Lock file, prepare the unlocking function:

try {
   if( typeof opts.lock === 'string' ){
      lock.lockSync(opts.lock, {
         retries: 2,
         retryWait: 1000
      });
   }
} catch(e) {
   console.log('Cannot create lock: ' + opts.lock + '\n');
   throw e;
}

var unlock = function(){
   try {
      if( typeof opts.lock === 'string' ){
         lock.unlockSync(opts.lock, {
            retries: 2,
            retryWait: 1000
         });
      }
   } catch(e) {
      console.log('Cannot remove lock: ' + opts.lock + '\n');
      throw e;
   }
};

// Access Fidonet mail:

var fidomail = JAM(opts.base);
var feed = new RSS({
   title: opts.area,
   author: 'Fidonet authors of ' + opts.area,
   description: opts.area + ' area (Fidonet)',
   generator: 'Fido2RSS ' + thisver,
   site_url: 'area://' + opts.area
});

var mailCounter = 0;
var renderNextItem = function(){
   var nextItemNum = fidomail.size() - mailCounter;
   if( nextItemNum < 1 ){
      // Finish:
      unlock();
      fs.writeFileSync(opts.out, feed.xml(), {
         encoding: 'utf8'
      });
   } else {
      // Render one more mail item:
      fidomail.readHeader(nextItemNum, function(err, header){
         if (err){
            unlock();
            throw err;
         }
         var decoded = fidomail.decodeHeader(header);
         //…
         mailCounter++;
         setImmediate(renderNextItem);
      });
   }
};

fidomail.readJDX(function(err){
   if (err){
      unlock();
      throw err;
   }
   setImmediate(renderNextItem);
});