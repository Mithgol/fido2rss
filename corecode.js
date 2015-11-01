var async = require('async');
var FidoHTML = require('fidohtml');
var fiunis = require('fiunis');
var IPFSAPI = require('ipfs-api');
var JAM = require('fidonet-jam');
var MIME = require('mime');
var moment = require('moment');
var RSS = require('rss');
var Squish = require('fidonet-squish');
var UUE = require('uue');

// Error processing:
var findErrorsInOptions = (opts, callback) => {
   /* jshint bitwise: false */

   if( typeof opts.msg !== 'string' || opts.msg.length < 1 ){
      opts.msg = 23;
   } else {
      opts.msg = opts.msg |0;
   }

   if(
      typeof opts.base !== 'string' || opts.base.length < 1
   ) return callback(new Error('The base path is not given.'));

   if(
      typeof opts.area !== 'string' || opts.area.length < 1
   ) return callback(new Error('The area name is not given.'));

   if( typeof opts.IPFS === 'undefined' ){
      opts.IPFS = null;
   } else {
      if( opts.IPFS === true ){
         opts.IPFS = {
            host: 'localhost',
            port: 5001
         };
      } else {
         var matchesIPFS = /^(.+):(\d+)$/.exec(opts.IPFS);
         if( matchesIPFS === null ) return callback(
            new Error('The IPFS host:port is invalid.')
         );
         opts.IPFS = {
            host: matchesIPFS[1],
            port: matchesIPFS[2]
         };
      }
   }

   callback(null, opts);
};

var messageImgUUE2IPFS = (msgText, optsIPFS, callback) => {
   if( optsIPFS === null ) return callback(null, msgText);
   async.mapLimit(
      UUE.split(msgText),
      2, // concurrency of `.mapLimit`
      (nextChunk, doneChunk) => {
         if( typeof nextChunk === 'string' ) return setImmediate(() =>
            doneChunk(null, nextChunk) // not an UUE
         );

         var mimeType = MIME.lookup(nextChunk.name);
         if([
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/svg+xml'
         ].indexOf(mimeType) < 0 ) return setImmediate(() =>
            doneChunk(null, nextChunk.source) // UUE; but not an image
         );

         IPFSAPI(
            optsIPFS.host, optsIPFS.port
         ).add(nextChunk.data, (err, resultIPFS) => {
            if( err ) return doneChunk(err);
            if( !resultIPFS ) return doneChunk(new Error(
               'Error putting an encoded UUE image to IPFS.'
            ));
            if(!( Array.isArray(resultIPFS) )) return doneChunk(new Error(
               'Not an Array received (putting an encoded UUE image to IPFS).'
            ));
            if( resultIPFS.length !== 1 ) return doneChunk(new Error(
               'Weird array received (putting an encoded UUE image to IPFS).'
            ));
            var hashIPFS = resultIPFS[0].Hash;
            doneChunk(null, [
               '![(',
               nextChunk.name.replace(/]/g, '\\]'),
               ')](fs:/ipfs/',
               hashIPFS,
               ')'
            ].join(''));
         });
      },
      (err, resultChunks) => {
         if( err ) return callback(err);

         callback(null, resultChunks.join(''));
      }
   );
};

module.exports = (options, callback) => {
   findErrorsInOptions(options, (err, opts) => {
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
         generator: 'Fido2RSS ' + require('./package.json').version,
         site_url: 'area://' + opts.area
      });

      var mailCounter = 0;
      var renderNextItem = () => {
         var nextItemNum = fidomail.size() - mailCounter;
         if( nextItemNum < 1 || mailCounter >= opts.msg ){
            // Finish:
            callback(null, feed.xml());
         } else {
            // Render one more mail item:
            fidomail.readHeader(nextItemNum, (err, header) => {
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

               fidomail.decodeMessage(header, (err, msgText) => {
                  if( err ) return callback(err);

                  var FidoHTMLOptions = {
                     fontColor: true,
                     URLPrefixes: {
                        '*': '', // default
                        fs: IPFSURL => IPFSURL.replace(
                           /^fs:\/*/g, 'http://ipfs.io/'
                        )
                     }
                  };
                  var itemURLPrefix = '';
                  if( typeof opts.areaPrefixURL !== 'undefined' ){
                     itemURLPrefix = opts.areaPrefixURL;
                     FidoHTMLOptions.URLPrefixes.area = opts.areaPrefixURL;
                     FidoHTMLOptions.fileURLParts = [
                        opts.areaPrefixURL,
                        itemURLFilters
                     ];
                  }

                  messageImgUUE2IPFS(msgText, opts.IPFS, (err, msgIPFS) => {
                     if( err ) return callback(err);

                     feed.item({
                        'title': fiunis.decode(decoded.subj) || '(no title)',
                        'description': FidoHTML(
                           FidoHTMLOptions
                        ).fromText(msgIPFS),
                        'url': itemURLPrefix + itemURL,
                        'author': decoded.from,
                        'date': itemDateString
                     });
                     mailCounter++;
                     setImmediate(renderNextItem);
                  });
               });
            });
         }
      };

      if(
         typeof opts.type === 'string' &&
         opts.type.toLowerCase() === 'squish'
      ){
         fidomail.readSQI(err => {
            if( err ) return callback(err);

            setImmediate(renderNextItem);
         });
      } else {
         fidomail.readJDX(err => {
            if( err ) return callback(err);

            setImmediate(renderNextItem);
         });
      }
   });
};