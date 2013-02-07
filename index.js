var sources = require('./json/_sources');

Object.keys(sources).forEach(function(name){
  var json;
  exports[name] = function(){
    if (!json) {
      json = require('./json/'+name);
      Object.defineProperty(json, '_source', { configurable: true, value: sources[name] });
    }
    return json;
  };
});


exports.tags = function tags(){
  var tagmap = require('./json/_tags'),
      interfaces = { HTML: exports.html5(), SVG: exports.svg() },
      out = {};

  for (var k in tagmap) {
    out[k] = {};
    for (var j in tagmap[k]) {
      var name = k+tagmap[k][j]+'Element';
      out[k][j] = interfaces[k][name];
    }
  }

  return out;
};
