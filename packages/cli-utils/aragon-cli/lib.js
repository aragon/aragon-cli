// make sourcemaps work!
require('source-map-support').install();

module.exports = require("./node_modules/ganache-core/public-exports.js.js");
module.exports.version = require("./node_modules/ganache-core/package.json.js").version;
module.exports.to = require("./node_modules/ganache-core/lib/utils/to");
