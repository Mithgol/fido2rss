var FidoHTML = require('fidohtml');
var fiunis = require('fiunis');
var JAM = require('fidonet-jam');
var moment = require('moment');
var RSS = require('rss');
var Squish = require('fidonet-squish');

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
               var itemURLFilters = '';

               if( typeof decoded.msgid !== 'undefined' ){
                  itemURLFilters = [
                     '?msgid=',
                     encodeURIComponent(decoded.msgid).replace( /%20/g, '+' ),
                     '&time=',
                     decoded.origTime[0]
                  ].join('');
               } else {
                  itemURLFilters = [
                     '?time=',
                     decoded.origTime[0],
                     '-',
                     decoded.origTime[1],
                     '-',
                     decoded.origTime[2],
                     'T',
                     decoded.origTime[3],
                     ':',
                     decoded.origTime[4],
                     ':',
                     decoded.origTime[5]
                  ].join('');
               }
               itemURL += itemURLFilters;

               var itemDateZone = '+0';
               if( typeof decoded.timezone !== 'undefined' ){
                  if( /^\d+$/.test(decoded.timezone) ){
                     decoded.timezone = '+' + decoded.timezone;
                  }
                  if( /^[+-]\d+$/.test(decoded.timezone) ){
                     itemDateZone = decoded.timezone;
                  }
               }

               var itemDateString = moment().utcOffset(itemDateZone)
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

                  var FidoHTMLOptions = {
                     fontColor: true,
                     URLPrefixes: {'*': ''} // default; ready to be extended
                  };
                  FidoHTMLOptions.URLPrefixes.fs = IPFSURL => IPFSURL.replace(
                     /^fs:\/*/g, 'http://ipfs.io/'
                  );
                  var itemURLPrefix = '';
                  if( typeof opts.areaPrefixURL !== 'undefined' ){
                     itemURLPrefix = opts.areaPrefixURL;
                     FidoHTMLOptions.URLPrefixes.area = opts.areaPrefixURL;
                     FidoHTMLOptions.fileURLParts = [
                        opts.areaPrefixURL,
                        itemURLFilters
                     ];
                  }

                  feed.item({
                     'title': fiunis.decode(decoded.subj) || '(no title)',
                     'description': FidoHTML(
                        FidoHTMLOptions
                     ).fromText(msgText),
                     'url': itemURLPrefix + itemURL,
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