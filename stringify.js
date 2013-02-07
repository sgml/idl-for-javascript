/* A JSON pretty printer that produces dense formatted output
 *
 * Copyright (c) 2012 Brandon Benvie <http://bbenvie.com>
 * Released under MIT license.
 */


/* Accepts same parameters as JSON.stringify, with an optional fourth `options` parameters.
 * `options` should be an object with any of the following properties (default values shown):
 * {
 *   maxWidth: 60, // maximum line width in characters before causing output to break into multiple lines
 *   quotes: '"' // the character used to quote properties and strings. The empty string '' is valid (strings will still be quoted)
 * }
 */

var stringify = module.exports = (function(){
  var call = Function.prototype.call.bind(Function.prototype.call);

  var quote = (function(){
    var escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        meta = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\' };

    function escaper(a) {
      var c = meta[a];
      return typeof c === 'string' ? c : '\\u'+('0000' + a.charCodeAt(0).toString(16)).slice(-4);
    }

    return function quote(quotes, string){
      escapable.lastIndex = 0;
      return quotes+string.replace(escapable, escaper)+quotes;
    };
  })();


  function multilen(array){
    return array.reduce(function(len, item){
      return len + item.length;
    }, 0);
  }


  function J(opts, value){
    if (~opts.stack.indexOf(value)) {
      throw new Error('circular_structure');
    }

    var stepback = opts.indent,
        partial = [],
        strlen = 0,
        brackets;

    opts.indent += opts.gap;
    opts.stack.push(value);

    if (value instanceof Array) {
      brackets = ['[', ']'];

      for (var i=0, len = value.length; i < len; i++) {
        var prop = str(opts, i, value);
        partial[i] = prop === undefined ? 'null' : prop;
        strlen += partial[i].length;
      }
    } else {
      var keys = opts.propList || Object.keys(value),
          colon = opts.gap ? ': ' : ':';

      brackets = ['{', '}'];

      for (var i=0, len=keys.length; i < len; i++) {
        var prop = str(opts, keys[i], value);
        if (prop !== undefined) {
          var val = quote(opts.quotes, keys[i]) + colon + prop;
          partial.push(val);
          strlen += val.length;
        }
      }
    }

    if (!partial.length) {
      var final = brackets[0] + brackets[1];
    } else if (!opts.gap) {
      var final = brackets[0] + partial.join(',') + brackets[1];
    } else {
      var chunks = [[]],
          chunk = chunks[0],
          currentWidth = 0;

      for (var i=0; i < partial.length; i++) {
        var item = partial[i];
        if (item.length < opts.maxWidth && item.length + currentWidth > opts.maxWidth) {
          chunk = [];
          chunks.push(chunk);
          currentWidth = 0;
        }
        chunk.push(item);
        currentWidth += item.length;
      }

      var space = opts.gap ? ' ' : '';

      var forceNewline = strlen > opts.maxWidth || chunks.some(function(chunk){
        return multilen(chunk) > opts.maxWidth;
      });

      var final = chunks.map(function(chunk){
        if (forceNewline) {
          return chunk.join(',\n' + opts.indent);
        }
        return chunk.join(',' + space);
      }).join(',\n' + opts.indent) + space;


      if (forceNewline) {
        final = brackets[0] + '\n' + opts.indent + final + '\n' + stepback + brackets[1];
      } else {
        final = brackets[0] + space + final + brackets[1];
      }
    }

    opts.stack.pop();
    opts.indent = stepback;
    return final;
  }




  function str(opts, key, holder){
    var val = holder[key];
    if (val && typeof val === 'object') {
      var toJSON = val.toJSON;
      if (typeof toJSON === 'function') {
        val = call(toJSON, val, key);
      }
    }

    if (opts.callback) {
      val = call(opts.callback, holder, key, val);
    }

    if (val && typeof val === 'object' && val instanceof Number || val instanceof String || val instanceof Boolean) {
      val = val.constructor(val);
    }


    if (val === null) {
      return 'null';
    } else if (val === true) {
      return 'true';
    } else if (val === false) {
      return 'false';
    }

    var type = typeof val;
    if (type === 'string') {
      return quote('"', val);
    } else if (type === 'number') {
      return val !== val || val === Infinity || val === -Infinity ? 'null' : '' + val;
    } else if (type === 'object') {
      return J(opts, val);
    }
  }


  function stringify(value, replacer, space, options){
    var opts = Object.create(null);
    options || (options = {});
    opts.stack = [];
    opts.indent = '';
    opts.maxWidth = +options.maxWidth || 60;
    opts.quotes = typeof options.quotes === 'string' ? options.quotes : '"';

    if (replacer && typeof replacer === 'object') {
      if (typeof replacer === 'function') {
        opts.callback = replacer;
      } else if (replacer instanceof Array) {
        opts.propList = [];

        for (var i=0; i < replacer.length; i++) {
          var item = replacer[i],
              type = typeof item;

          if (type === 'string' || type === 'number' || item instanceof String || item instanceof Number) {
            if (!~opts.propList.indexOf(item += '')) {
              opts.propList.push(item);
            }
          }
        }
      }
    }

    if (space && typeof space === 'object') {
      space = space.valueOf();
    }

    if (typeof space === 'string') {
      opts.gap = space.slice(0, 10);
    } else if (typeof space === 'number') {
      space |= 0;
      space = space > 10 ? 10 : space < 1 ? 0 : space;
      opts.gap = new Array(space + 1).join(' ');
    } else {
      opts.gap = '';
    }

    return str(opts, '', { '': value });
  };

  stringify.log = function log(quotes, obj){
    console.log(stringify(obj, null, '  ', { quotes: quotes }))
  };

  return stringify;
})();
