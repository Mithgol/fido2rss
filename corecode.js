var FidoHTML = require('fidohtml');
var FidoMail2IPFS = require('fidomail2ipfs');
var fiunis = require('fiunis');
var escape = require('lodash.escape');
var IPFSAPI = require('ipfs-api');
var JAM = require('fidonet-jam');
var moment = require('moment');
var RSS = require('rss');
var Squish = require('fidonet-squish');
var UUE2IPFS = require('uue2ipfs');

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

var hashCache = { redirector: false };
var dirToHashIPFS = (IPFS, dirPath, dirName, hashName, cbErr) => {
   if( hashCache[hashName] ) return cbErr(null); // already cached

   var errors = {
      notArrDir: 'Not an Array received putting a directory to IPFS.',
      notFoundDir: 'Directory not found in an Array of content put to IPFS.',
      undefinedDirHash: 'Undefined hash after putting a directory to IPFS.'
   };

   IPFS.util.addFromFs(
      dirPath,
      { recursive: true },
      (err, arrIPFS) => {
         if( err ) return cbErr(err);
         if(!( Array.isArray(arrIPFS) )) return cbErr(
            new Error(`[${dirName}] ${errors.notArrDir}`)
         );
         var arrDirIPFS = arrIPFS.filter(
            nextIPFS => (nextIPFS.path || '').endsWith(dirName)
         );
         if( arrDirIPFS.length < 1 ) return cbErr(
            new Error(`[${dirName}] ${errors.notFoundDir}`)
         );
         var hashIPFS = arrDirIPFS[ arrDirIPFS.length - 1 ].hash;
         // if the hash is fine, put to cache and quit
         if( hashIPFS ){
            hashCache[hashName] = hashIPFS;
            return cbErr(null);
         }
         // otherwise invalidate cache
         hashCache[hashName] = false;
         return cbErr(
            new Error(`[${dirName}] ${errors.undefinedDirHash}`)
         );
      }
   );
};

var messageImgUUE2IPFS = (msgText, optsIPFS, doneImgUUE2IPFS) => {
   if( optsIPFS === null ) return doneImgUUE2IPFS(null, msgText);

   UUE2IPFS.UUE2IPFS(
      msgText,
      (fileData, fileDone) => fileDone(null,
         [
            '![(',
            fileData.name.replace(/]/g, '\\]'),
            ')](fs:/ipfs/', fileData.hash, ')'
         ].join('')
      ),
      {
         API: IPFSAPI(optsIPFS.host, optsIPFS.port),
         filterMIME: UUE2IPFS.imgMIME()
      },
      doneImgUUE2IPFS
   );
};

var FGHIURL2IPFSURL = (FGHIURL, optsIPFS, optsIPFSURL, callback) => {
   if( optsIPFS === null ) return callback(null, FGHIURL);
   if(! optsIPFSURL ) return callback(null, FGHIURL);

   var escapedURL = escape(FGHIURL);

   var bufFGHIHTML = Buffer(`<html><head><meta charset="utf-8">${ ''
      }<title>FGHI URL</title></head><body>FGHI URL: <a href="${
      escapedURL}">${escapedURL}</a></body></html>`);

   IPFSAPI(
      optsIPFS.host, optsIPFS.port
   ).add(bufFGHIHTML, (err, resultIPFS) => {
      if( err ) return callback(err);
      if( !resultIPFS ) return callback(new Error(
         'Error putting a FGHI URL to IPFS.'
      ));
      if(!( Array.isArray(resultIPFS) )) return callback(new Error(
         'Not an Array received while putting a FGHI URL to IPFS.'
      ));
      if( resultIPFS.length !== 1 ) return callback(new Error(
         'Weird array received while putting a FGHI URL to IPFS.'
      ));
      var hashIPFS = resultIPFS[0].hash;
      if( typeof hashIPFS === 'undefined' ) return callback(new Error(
         'Undefined hash received while putting a FGHI URL to IPFS.'
      ));
      callback(null, `https://ipfs.io/ipfs/${hashIPFS}`);
   });
};

var MSGID2URL = someMSGID => someMSGID.split(
   /([A-Za-z01-9:/]+)/
).map((nextChunk, IDX) => {
   if( IDX % 2 === 0 ) return encodeURIComponent(nextChunk);
   return nextChunk; // captured by the regular expression
}).join('').replace( /%20/g, '+' );

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
                     '?msgid=', MSGID2URL(decoded.msgid),
                     '&time=', decoded.origTime[0]
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
                           /^fs:\/*/g, 'https://ipfs.io/'
                        ),
                        ipfs: IPFSURL => IPFSURL.replace(
                           /^ipfs:\/*/g, 'https://ipfs.io/'
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

                     FGHIURL2IPFSURL(
                        itemURLPrefix + itemURL,
                        opts.IPFS,
                        opts.IPFSURL,
                        (err, resultURL) => {
                           if( err ) return callback(err);

                           feed.item({
                              'title': fiunis.decode(
                                 decoded.subj
                              ) || '(no title)',
                              'description': FidoHTML(
                                 FidoHTMLOptions
                              ).fromText(msgIPFS),
                              'url': resultURL,
                              'guid': itemURL,
                              'author': decoded.from,
                              'date': itemDateString
                           });
                           mailCounter++;
                           setImmediate(renderNextItem);
                        }
                     );
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