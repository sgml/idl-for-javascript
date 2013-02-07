var tags = require('./json/_tags');

function recase(s){
  return s[0].toUpperCase() + s.slice(1);
}

Object.keys(tags).forEach(function(type){
  var tagset = tags[type],
      name = [type, , 'Element'];

  name.toString = function(){ return this.join('') };

  Object.keys(tagset).forEach(function(tag){
    name[1] = tagset[tag] || recase(tag);
    exports[name] = tag;
  });
});
