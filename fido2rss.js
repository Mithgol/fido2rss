#!/usr/bin/env node

var fs   = require('fs');
var JAM = require('fidonet-jam');
var Squish = require('fidonet-squish');
var lock = require('lockfile');
var moment = require('moment');
var RSS = require('rss');
var FidoHTML = require('fidohtml')({
   fontColor: true
});

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
      'JAM or Squish'
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

// Access Fidonet mail:
if( opts.type === 'Squish' ){
   var fidomail = Squish(opts.base);
} else {
   var fidomail = JAM(opts.base);
}
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
   if( nextItemNum < 1 || mailCounter >= opts.msg ){
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
         var itemURL = 'area://' + opts.area;

         if( typeof decoded.msgid !== 'undefined' ){
            itemURL += '?msgid=' + encodeURIComponent(decoded.msgid).replace(
               /%20/g, '+'
            );
            itemURL += '&time=' + decoded.origTime[0];
         } else {
            itemURL += '?time=' + decoded.origTime[0];
            itemURL += '-' + decoded.origTime[1];
            itemURL += '-' + decoded.origTime[2];
            itemURL += 'T' + decoded.origTime[3];
            itemURL += ':' + decoded.origTime[4];
            itemURL += ':' + decoded.origTime[5];
         }

         var itemDateZone = '+0';
         if( typeof decoded.timezone !== 'undefined' ){
            if( /^\d+$/.test(decoded.timezone) ){
               decoded.timezone = '+' + decoded.timezone;
            }
            if( /^[+-]\d+$/.test(decoded.timezone) ){
               itemDateZone = decoded.timezone;
            }
         }

         var itemDateString = moment().zone(itemDateZone)
         .year(decoded.origTime[0])
         .month(decoded.origTime[1]-1)
         .date(decoded.origTime[2])
         .hour(decoded.origTime[3])
         .minute(decoded.origTime[4])
         .second(decoded.origTime[5])
         .millisecond(0)
         .format('ddd, D MMM YY HH:mm:ss ZZ');

         fidomail.decodeMessage(header, function(err, msgText){
            if (err){
               unlock();
               throw err;
            }
            feed.item({
               'title': decoded.subj || '(no title)',
               'description': FidoHTML.fromText(msgText),
               'url': itemURL,
               'author': decoded.from,
               'date': itemDateString
            });
            mailCounter++;
            setImmediate(renderNextItem);
         });
      });
   }
};

if (opts.type==='Squish'){
   fidomail.readSQI(function(err){
      if (err){
         unlock();
         throw err;
      }
      setImmediate(renderNextItem);
   });
} else {
   fidomail.readJDX(function(err){
      if (err){
         unlock();
         throw err;
      }
      setImmediate(renderNextItem);
   });
}