var JAM = require('fidonet-jam');
var Squish = require('fidonet-squish');
var moment = require('moment');
var RSS = require('rss');
var FidoHTML = require('fidohtml')({
   fontColor: true
});

var thisver = require('./package.json').version;

// Error processing:
var findErrorsInOptions = function(opts, callback){
   /* jshint bitwise: false */

   if( typeof opts.msg !== 'string' || opts.msg.length < 1 ){
      opts.msg = 23;
   } else {
      opts.msg = opts.msg |0;
   }

   if( typeof opts.base !== 'string' || opts.base.length < 1 ){
      callback(new Error('The base path is not given.'));
      return;
   }

   if( typeof opts.area !== 'string' || opts.area.length < 1 ){
      callback(new Error('The area name is not given.'));
      return;
   }

   callback(null, opts);
};

module.exports = function(options, callback){
   findErrorsInOptions(options, function(err, opts){
      if( err ) return callback(err);

      // Access Fidonet mail:
      var fidomail;
      if(
         typeof opts.type === 'string' &&
         opts.type.toLowerCase() === 'squish'
      ){
         fidomail = Squish(opts.base);
      } else {
         fidomail = JAM(opts.base);
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
            callback(null, feed.xml());
         } else {
            // Render one more mail item:
            fidomail.readHeader(nextItemNum, function(err, header){
               if( err ) return callback(err);

               var decoded = fidomail.decodeHeader(header);
               var itemURL = 'area://' + opts.area;

               if( typeof decoded.msgid !== 'undefined' ){
                  itemURL += '?msgid=' +
                     encodeURIComponent(decoded.msgid).replace( /%20/g, '+' );
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
                  if( err ) return callback(err);

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

      if(
         typeof opts.type === 'string' &&
         opts.type.toLowerCase() === 'squish'
      ){
         fidomail.readSQI(function(err){
            if( err ) return callback(err);

            setImmediate(renderNextItem);
         });
      } else {
         fidomail.readJDX(function(err){
            if( err ) return callback(err);

            setImmediate(renderNextItem);
         });
      }
   });
};