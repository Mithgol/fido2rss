var path = require('path');
var async = require('async');
var FidoHTML = require('fidohtml');
var FidoMail2IPFS = require('fidomail2ipfs');
var fiunis = require('fiunis');
var IPFSAPI = require('ipfs-api');
var JAM = require('fidonet-jam');
var moment = require('moment');
var RSS = require('rss');
var Squish = require('fidonet-squish');
var UUE2IPFS = require('uue2ipfs');

// inner setting (theoretically a future option):
var csspxAvatarWidth = 140;

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

   if( typeof opts.twitter !== 'string' ) opts.twitter = false;

   callback(null, opts);
};

var dirToHashIPFS = (IPFS, dirPath, dirName, cbErrHash) => { // (err, hash)
   var errors = {
      notArrDir: 'Not an Array received putting a directory to IPFS.',
      notFoundDir: 'Directory not found in an Array of content put to IPFS.',
      undefinedDirHash: 'Undefined hash after putting a directory to IPFS.'
   };

   IPFS.util.addFromFs(
      dirPath,
      { recursive: true },
      (err, arrIPFS) => {
         if( err ) return cbErrHash(err);
         if(!( Array.isArray(arrIPFS) )) return cbErrHash(
            new Error(`[${dirName}] ${errors.notArrDir}`)
         );
         var arrDirIPFS = arrIPFS.filter(
            nextIPFS => (nextIPFS.path || '').endsWith(dirName)
         );
         if( arrDirIPFS.length < 1 ) return cbErrHash(
            new Error(`[${dirName}] ${errors.notFoundDir}`)
         );
         var hashIPFS = arrDirIPFS[ arrDirIPFS.length - 1 ].hash;

         // if the hash is fine, return it throught the callback
         if( hashIPFS ) return cbErrHash(null, hashIPFS);

         // otherwise an ultimate failure
         return cbErrHash(
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

var FGHIURL2IPFSURL = (
   prefixedURL, FGHIURL,
   opts, convertedText, echobase, header, decoded, gotIPFSURL
) => {
   if( opts.IPFS === null ) return gotIPFSURL(null, prefixedURL);
   if(! opts.IPFSURL ) return gotIPFSURL(null, prefixedURL);

   async.waterfall([
      callback => echobase.getOrigAddr(
         header,
         (origErr, origAddr) => {
            if( origErr ) return callback(origErr);

            var avatarsList = echobase.getAvatarsForHeader(
               header, ['https', 'http'], {
                  size: csspxAvatarWidth * 2, //retina pixels
                  origAddr: origAddr
            });
            if( avatarsList.length < 1 ) avatarsList = [
               'https://secure.gravatar.com/avatar/?f=y&d=mm&s=' +
               ( csspxAvatarWidth * 2 ) //retina pixels
            ];

            return callback(null, {
               origAddr: origAddr,
               avatarURL: avatarsList[0]
            });
         }
      ),
      (wrapped, callback) => FidoMail2IPFS(
         {
            server: opts.IPFS.host,
            port: opts.IPFS.port,
            messageText: convertedText,
            avatarWidth: csspxAvatarWidth,
            avatarURL: wrapped.avatarURL,
            from: decoded.from || '',
            origAddr: wrapped.origAddr,
            to: decoded.to || '',
            origTime: decoded.origTime,
            procTime: decoded.procTime,
            subj: decoded.subj ? fiunis.decode( decoded.subj ) : '',
            URL: FGHIURL,
            twitterUser: opts.twitter
         },
         callback
      )
   ], gotIPFSURL);
};

var MSGID2URL = someMSGID => someMSGID.split(
   /([A-Za-z01-9:/]+)/
).map((nextChunk, IDX) => {
   if( IDX % 2 === 0 ) return encodeURIComponent(nextChunk);
   return nextChunk; // captured by the regular expression
}).join('').replace( /%20/g, '+' );

module.exports = (options, globalCallback) => async.waterfall([
   callback => findErrorsInOptions(options, callback),
   (opts, callback) => { // put `redirector/` to IPFS (only if necessary)
      if( opts.IPFS === null ) return callback(null, opts, null);
      if(! opts.IPFSURL ) return callback(null, opts, null);

      dirToHashIPFS(
         IPFSAPI(opts.IPFS.host, opts.IPFS.port),
         path.join(__dirname, 'redirector'), 'redirector',
         (err, hashIPFS) => callback(err, opts, hashIPFS)
      );
   },
   (opts, redirectorIPFS, callback) => {
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
                  // `redirectorIPFS` is here only if it is meant to be used
                  if( redirectorIPFS !== null ){
                     itemURLPrefix = `https://ipfs.io/ipfs/${redirectorIPFS
                        }/FGHIURL.html?`;
                     FidoHTMLOptions.URLPrefixes.area = itemURLPrefix;
                     FidoHTMLOptions.fileURLParts = [
                        itemURLPrefix, itemURLFilters
                     ];
                  } else if( typeof opts.areaPrefixURL !== 'undefined' ){
                     itemURLPrefix = opts.areaPrefixURL;
                     FidoHTMLOptions.URLPrefixes.area = opts.areaPrefixURL;
                     FidoHTMLOptions.fileURLParts = [
                        opts.areaPrefixURL, itemURLFilters
                     ];
                  }

                  messageImgUUE2IPFS(msgText, opts.IPFS, (err, msgIPFS) => {
                     if( err ) return callback(err);

                     FGHIURL2IPFSURL(
                        itemURLPrefix + itemURL,
                        itemURL,
                        opts,
                        msgIPFS,
                        fidomail,
                        header,
                        decoded,
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
   }
], globalCallback);