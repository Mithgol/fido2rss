var util = require('util');

var opts = require('commander')
   .version( require('./package.json').version )
   .parse(process.argv);

console.log(util.inspect(
   opts, false, Infinity, true
));