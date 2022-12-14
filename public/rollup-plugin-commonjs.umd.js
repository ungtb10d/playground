(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('fs')) :
  typeof define === 'function' && define.amd ? define(['fs'], factory) :
  (global.RollupPluginCommonJS = factory(global.fs));
}(this, (function (fs) { 'use strict';

  // 'path' module extracted from Node.js v8.11.1 (only the posix part)

  function assertPath(path) {
    if (typeof path !== 'string') {
      throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
    }
  }

  // Resolves . and .. elements in a path with directory names
  function normalizeStringPosix(path, allowAboveRoot) {
    var res = '';
    var lastSegmentLength = 0;
    var lastSlash = -1;
    var dots = 0;
    var code;
    for (var i = 0; i <= path.length; ++i) {
      if (i < path.length)
        { code = path.charCodeAt(i); }
      else if (code === 47 /*/*/)
        { break; }
      else
        { code = 47 /*/*/; }
      if (code === 47 /*/*/) {
        if (lastSlash === i - 1 || dots === 1) {
          // NOOP
        } else if (lastSlash !== i - 1 && dots === 2) {
          if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
            if (res.length > 2) {
              var lastSlashIndex = res.lastIndexOf('/');
              if (lastSlashIndex !== res.length - 1) {
                if (lastSlashIndex === -1) {
                  res = '';
                  lastSegmentLength = 0;
                } else {
                  res = res.slice(0, lastSlashIndex);
                  lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
                }
                lastSlash = i;
                dots = 0;
                continue;
              }
            } else if (res.length === 2 || res.length === 1) {
              res = '';
              lastSegmentLength = 0;
              lastSlash = i;
              dots = 0;
              continue;
            }
          }
          if (allowAboveRoot) {
            if (res.length > 0)
              { res += '/..'; }
            else
              { res = '..'; }
            lastSegmentLength = 2;
          }
        } else {
          if (res.length > 0)
            { res += '/' + path.slice(lastSlash + 1, i); }
          else
            { res = path.slice(lastSlash + 1, i); }
          lastSegmentLength = i - lastSlash - 1;
        }
        lastSlash = i;
        dots = 0;
      } else if (code === 46 /*.*/ && dots !== -1) {
        ++dots;
      } else {
        dots = -1;
      }
    }
    return res;
  }

  function _format(sep, pathObject) {
    var dir = pathObject.dir || pathObject.root;
    var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
    if (!dir) {
      return base;
    }
    if (dir === pathObject.root) {
      return dir + base;
    }
    return dir + sep + base;
  }

  var posix = {
    // path.resolve([from ...], to)
    resolve: function resolve() {
      var arguments$1 = arguments;

      var resolvedPath = '';
      var resolvedAbsolute = false;
      var cwd;

      for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        var path;
        if (i >= 0)
          { path = arguments$1[i]; }
        else {
          if (cwd === undefined)
            { cwd = './'; }
          path = cwd;
        }

        assertPath(path);

        // Skip empty entries
        if (path.length === 0) {
          continue;
        }

        resolvedPath = path + '/' + resolvedPath;
        resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
      }

      // At this point the path should be resolved to a full absolute path, but
      // handle relative paths to be safe (might happen when process.cwd() fails)

      // Normalize the path
      resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

      if (resolvedAbsolute) {
        if (resolvedPath.length > 0)
          { return '/' + resolvedPath; }
        else
          { return '/'; }
      } else if (resolvedPath.length > 0) {
        return resolvedPath;
      } else {
        return '.';
      }
    },

    normalize: function normalize(path) {
      assertPath(path);

      if (path.length === 0) { return '.'; }

      var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
      var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;

      // Normalize the path
      path = normalizeStringPosix(path, !isAbsolute);

      if (path.length === 0 && !isAbsolute) { path = '.'; }
      if (path.length > 0 && trailingSeparator) { path += '/'; }

      if (isAbsolute) { return '/' + path; }
      return path;
    },

    isAbsolute: function isAbsolute(path) {
      assertPath(path);
      return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
    },

    join: function join() {
      var arguments$1 = arguments;

      if (arguments.length === 0)
        { return '.'; }
      var joined;
      for (var i = 0; i < arguments.length; ++i) {
        var arg = arguments$1[i];
        assertPath(arg);
        if (arg.length > 0) {
          if (joined === undefined)
            { joined = arg; }
          else
            { joined += '/' + arg; }
        }
      }
      if (joined === undefined)
        { return '.'; }
      return posix.normalize(joined);
    },

    relative: function relative(from, to) {
      assertPath(from);
      assertPath(to);

      if (from === to) { return ''; }

      from = posix.resolve(from);
      to = posix.resolve(to);

      if (from === to) { return ''; }

      // Trim any leading backslashes
      var fromStart = 1;
      for (; fromStart < from.length; ++fromStart) {
        if (from.charCodeAt(fromStart) !== 47 /*/*/)
          { break; }
      }
      var fromEnd = from.length;
      var fromLen = fromEnd - fromStart;

      // Trim any leading backslashes
      var toStart = 1;
      for (; toStart < to.length; ++toStart) {
        if (to.charCodeAt(toStart) !== 47 /*/*/)
          { break; }
      }
      var toEnd = to.length;
      var toLen = toEnd - toStart;

      // Compare paths to find the longest common path from root
      var length = fromLen < toLen ? fromLen : toLen;
      var lastCommonSep = -1;
      var i = 0;
      for (; i <= length; ++i) {
        if (i === length) {
          if (toLen > length) {
            if (to.charCodeAt(toStart + i) === 47 /*/*/) {
              // We get here if `from` is the exact base path for `to`.
              // For example: from='/foo/bar'; to='/foo/bar/baz'
              return to.slice(toStart + i + 1);
            } else if (i === 0) {
              // We get here if `from` is the root
              // For example: from='/'; to='/foo'
              return to.slice(toStart + i);
            }
          } else if (fromLen > length) {
            if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
              // We get here if `to` is the exact base path for `from`.
              // For example: from='/foo/bar/baz'; to='/foo/bar'
              lastCommonSep = i;
            } else if (i === 0) {
              // We get here if `to` is the root.
              // For example: from='/foo'; to='/'
              lastCommonSep = 0;
            }
          }
          break;
        }
        var fromCode = from.charCodeAt(fromStart + i);
        var toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode)
          { break; }
        else if (fromCode === 47 /*/*/)
          { lastCommonSep = i; }
      }

      var out = '';
      // Generate the relative path based on the path difference between `to`
      // and `from`
      for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
        if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
          if (out.length === 0)
            { out += '..'; }
          else
            { out += '/..'; }
        }
      }

      // Lastly, append the rest of the destination (`to`) path that comes after
      // the common path parts
      if (out.length > 0)
        { return out + to.slice(toStart + lastCommonSep); }
      else {
        toStart += lastCommonSep;
        if (to.charCodeAt(toStart) === 47 /*/*/)
          { ++toStart; }
        return to.slice(toStart);
      }
    },

    _makeLong: function _makeLong(path) {
      return path;
    },

    dirname: function dirname(path) {
      assertPath(path);
      if (path.length === 0) { return '.'; }
      var code = path.charCodeAt(0);
      var hasRoot = code === 47 /*/*/;
      var end = -1;
      var matchedSlash = true;
      for (var i = path.length - 1; i >= 1; --i) {
        code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            if (!matchedSlash) {
              end = i;
              break;
            }
          } else {
          // We saw the first non-path separator
          matchedSlash = false;
        }
      }

      if (end === -1) { return hasRoot ? '/' : '.'; }
      if (hasRoot && end === 1) { return '//'; }
      return path.slice(0, end);
    },

    basename: function basename(path, ext) {
      if (ext !== undefined && typeof ext !== 'string') { throw new TypeError('"ext" argument must be a string'); }
      assertPath(path);

      var start = 0;
      var end = -1;
      var matchedSlash = true;
      var i;

      if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) { return ''; }
        var extIdx = ext.length - 1;
        var firstNonSlashEnd = -1;
        for (i = path.length - 1; i >= 0; --i) {
          var code = path.charCodeAt(i);
          if (code === 47 /*/*/) {
              // If we reached a path separator that was not part of a set of path
              // separators at the end of the string, stop now
              if (!matchedSlash) {
                start = i + 1;
                break;
              }
            } else {
            if (firstNonSlashEnd === -1) {
              // We saw the first non-path separator, remember this index in case
              // we need it if the extension ends up not matching
              matchedSlash = false;
              firstNonSlashEnd = i + 1;
            }
            if (extIdx >= 0) {
              // Try to match the explicit extension
              if (code === ext.charCodeAt(extIdx)) {
                if (--extIdx === -1) {
                  // We matched the extension, so mark this as the end of our path
                  // component
                  end = i;
                }
              } else {
                // Extension does not match, so our result is the entire path
                // component
                extIdx = -1;
                end = firstNonSlashEnd;
              }
            }
          }
        }

        if (start === end) { end = firstNonSlashEnd; }else if (end === -1) { end = path.length; }
        return path.slice(start, end);
      } else {
        for (i = path.length - 1; i >= 0; --i) {
          if (path.charCodeAt(i) === 47 /*/*/) {
              // If we reached a path separator that was not part of a set of path
              // separators at the end of the string, stop now
              if (!matchedSlash) {
                start = i + 1;
                break;
              }
            } else if (end === -1) {
            // We saw the first non-path separator, mark this as the end of our
            // path component
            matchedSlash = false;
            end = i + 1;
          }
        }

        if (end === -1) { return ''; }
        return path.slice(start, end);
      }
    },

    extname: function extname(path) {
      assertPath(path);
      var startDot = -1;
      var startPart = 0;
      var end = -1;
      var matchedSlash = true;
      // Track the state of characters (if any) we see before our first dot and
      // after any path separator we find
      var preDotState = 0;
      for (var i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              startPart = i + 1;
              break;
            }
            continue;
          }
        if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // extension
          matchedSlash = false;
          end = i + 1;
        }
        if (code === 46 /*.*/) {
            // If this is our first dot, mark it as the start of our extension
            if (startDot === -1)
              { startDot = i; }
            else if (preDotState !== 1)
              { preDotState = 1; }
        } else if (startDot !== -1) {
          // We saw a non-dot and non-path separator before our dot, so we should
          // have a good chance at having a non-empty extension
          preDotState = -1;
        }
      }

      if (startDot === -1 || end === -1 ||
          // We saw a non-dot character immediately before the dot
          preDotState === 0 ||
          // The (right-most) trimmed path component is exactly '..'
          preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        return '';
      }
      return path.slice(startDot, end);
    },

    format: function format(pathObject) {
      if (pathObject === null || typeof pathObject !== 'object') {
        throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
      }
      return _format('/', pathObject);
    },

    parse: function parse(path) {
      assertPath(path);

      var ret = { root: '', dir: '', base: '', ext: '', name: '' };
      if (path.length === 0) { return ret; }
      var code = path.charCodeAt(0);
      var isAbsolute = code === 47 /*/*/;
      var start;
      if (isAbsolute) {
        ret.root = '/';
        start = 1;
      } else {
        start = 0;
      }
      var startDot = -1;
      var startPart = 0;
      var end = -1;
      var matchedSlash = true;
      var i = path.length - 1;

      // Track the state of characters (if any) we see before our first dot and
      // after any path separator we find
      var preDotState = 0;

      // Get non-dir info
      for (; i >= start; --i) {
        code = path.charCodeAt(i);
        if (code === 47 /*/*/) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
              startPart = i + 1;
              break;
            }
            continue;
          }
        if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // extension
          matchedSlash = false;
          end = i + 1;
        }
        if (code === 46 /*.*/) {
            // If this is our first dot, mark it as the start of our extension
            if (startDot === -1) { startDot = i; }else if (preDotState !== 1) { preDotState = 1; }
          } else if (startDot !== -1) {
          // We saw a non-dot and non-path separator before our dot, so we should
          // have a good chance at having a non-empty extension
          preDotState = -1;
        }
      }

      if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
        if (end !== -1) {
          if (startPart === 0 && isAbsolute) { ret.base = ret.name = path.slice(1, end); }else { ret.base = ret.name = path.slice(startPart, end); }
        }
      } else {
        if (startPart === 0 && isAbsolute) {
          ret.name = path.slice(1, startDot);
          ret.base = path.slice(1, end);
        } else {
          ret.name = path.slice(startPart, startDot);
          ret.base = path.slice(startPart, end);
        }
        ret.ext = path.slice(startDot, end);
      }

      if (startPart > 0) { ret.dir = path.slice(0, startPart - 1); }else if (isAbsolute) { ret.dir = '/'; }

      return ret;
    },

    sep: '/',
    delimiter: ':',
    win32: null,
    posix: null
  };

  posix.posix = posix;

  //module.exports = posix;
  var posix_1 = posix;
  var sep = posix.sep;
  var resolve = posix.resolve;
  var join = posix.join;
  var basename = posix.basename;
  var dirname = posix.dirname;
  var extname = posix.extname;

  var pathBrowserify = {
  	posix: posix_1,
  	sep: sep,
  	resolve: resolve,
  	join: join,
  	basename: basename,
  	dirname: dirname,
  	extname: extname
  };

  function walk ( ast, ref) {
  	var enter = ref.enter;
  	var leave = ref.leave;

  	visit( ast, null, enter, leave );
  }

  var context = {
  	skip: function () { return context.shouldSkip = true; },
  	shouldSkip: false
  };

  var childKeys = {};

  var toString = Object.prototype.toString;

  function isArray ( thing ) {
  	return toString.call( thing ) === '[object Array]';
  }

  function visit ( node, parent, enter, leave, prop, index ) {
  	if ( !node ) { return; }

  	if ( enter ) {
  		context.shouldSkip = false;
  		enter.call( context, node, parent, prop, index );
  		if ( context.shouldSkip ) { return; }
  	}

  	var keys = childKeys[ node.type ] || (
  		childKeys[ node.type ] = Object.keys( node ).filter( function (key) { return typeof node[ key ] === 'object'; } )
  	);

  	for ( var i = 0; i < keys.length; i += 1 ) {
  		var key = keys[i];
  		var value = node[ key ];

  		if ( isArray( value ) ) {
  			for ( var j = 0; j < value.length; j += 1 ) {
  				visit( value[j], node, enter, leave, key, j );
  			}
  		}

  		else if ( value && value.type ) {
  			visit( value, node, enter, leave, key, null );
  		}
  	}

  	if ( leave ) {
  		leave( node, parent, prop, index );
  	}
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  /*!
   * filename-regex <https://github.com/regexps/filename-regex>
   *
   * Copyright (c) 2014-2015, Jon Schlinkert
   * Licensed under the MIT license.
   */

  var filenameRegex = function filenameRegex() {
    return /([^\\\/]+)$/;
  };

  /*!
   * arr-flatten <https://github.com/jonschlinkert/arr-flatten>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */

  var arrFlatten = function (arr) {
    return flat(arr, []);
  };

  function flat(arr, res) {
    var i = 0, cur;
    var len = arr.length;
    for (; i < len; i++) {
      cur = arr[i];
      Array.isArray(cur) ? flat(cur, res) : res.push(cur);
    }
    return res;
  }

  var slice = [].slice;

  /**
   * Return the difference between the first array and
   * additional arrays.
   *
   * ```js
   * var diff = require('{%= name %}');
   *
   * var a = ['a', 'b', 'c', 'd'];
   * var b = ['b', 'c'];
   *
   * console.log(diff(a, b))
   * //=> ['a', 'd']
   * ```
   *
   * @param  {Array} `a`
   * @param  {Array} `b`
   * @return {Array}
   * @api public
   */

  function diff(arr, arrays) {
    var argsLen = arguments.length;
    var len = arr.length, i = -1;
    var res = [], arrays;

    if (argsLen === 1) {
      return arr;
    }

    if (argsLen > 2) {
      arrays = arrFlatten(slice.call(arguments, 1));
    }

    while (++i < len) {
      if (!~arrays.indexOf(arr[i])) {
        res.push(arr[i]);
      }
    }
    return res;
  }

  /**
   * Expose `diff`
   */

  var arrDiff = diff;

  /*!
   * array-unique <https://github.com/jonschlinkert/array-unique>
   *
   * Copyright (c) 2014-2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var arrayUnique = function unique(arr) {
    if (!Array.isArray(arr)) {
      throw new TypeError('array-unique expects an array.');
    }

    var len = arr.length;
    var i = -1;

    while (i++ < len) {
      var j = i + 1;

      for (; j < arr.length; ++j) {
        if (arr[i] === arr[j]) {
          arr.splice(j--, 1);
        }
      }
    }
    return arr;
  };

  var toString$1 = {}.toString;

  var isarray = Array.isArray || function (arr) {
    return toString$1.call(arr) == '[object Array]';
  };

  var isobject = function isObject(val) {
    return val != null && typeof val === 'object' && isarray(val) === false;
  };

  /*!
   * Determine if an object is a Buffer
   *
   * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
   * @license  MIT
   */

  // The _isBuffer check is for Safari 5-7 support, because it's missing
  // Object.prototype.constructor. Remove this eventually
  var isBuffer_1 = function (obj) {
    return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
  };

  function isBuffer (obj) {
    return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
  }

  // For Node v0.10 support. Remove this eventually.
  function isSlowBuffer (obj) {
    return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
  }

  var toString$2 = Object.prototype.toString;

  /**
   * Get the native `typeof` a value.
   *
   * @param  {*} `val`
   * @return {*} Native javascript type
   */

  var kindOf = function kindOf(val) {
    // primitivies
    if (typeof val === 'undefined') {
      return 'undefined';
    }
    if (val === null) {
      return 'null';
    }
    if (val === true || val === false || val instanceof Boolean) {
      return 'boolean';
    }
    if (typeof val === 'string' || val instanceof String) {
      return 'string';
    }
    if (typeof val === 'number' || val instanceof Number) {
      return 'number';
    }

    // functions
    if (typeof val === 'function' || val instanceof Function) {
      return 'function';
    }

    // array
    if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
      return 'array';
    }

    // check for instances of RegExp and Date before calling `toString`
    if (val instanceof RegExp) {
      return 'regexp';
    }
    if (val instanceof Date) {
      return 'date';
    }

    // other objects
    var type = toString$2.call(val);

    if (type === '[object RegExp]') {
      return 'regexp';
    }
    if (type === '[object Date]') {
      return 'date';
    }
    if (type === '[object Arguments]') {
      return 'arguments';
    }
    if (type === '[object Error]') {
      return 'error';
    }

    // buffer
    if (isBuffer_1(val)) {
      return 'buffer';
    }

    // es6: Map, WeakMap, Set, WeakSet
    if (type === '[object Set]') {
      return 'set';
    }
    if (type === '[object WeakSet]') {
      return 'weakset';
    }
    if (type === '[object Map]') {
      return 'map';
    }
    if (type === '[object WeakMap]') {
      return 'weakmap';
    }
    if (type === '[object Symbol]') {
      return 'symbol';
    }

    // typed arrays
    if (type === '[object Int8Array]') {
      return 'int8array';
    }
    if (type === '[object Uint8Array]') {
      return 'uint8array';
    }
    if (type === '[object Uint8ClampedArray]') {
      return 'uint8clampedarray';
    }
    if (type === '[object Int16Array]') {
      return 'int16array';
    }
    if (type === '[object Uint16Array]') {
      return 'uint16array';
    }
    if (type === '[object Int32Array]') {
      return 'int32array';
    }
    if (type === '[object Uint32Array]') {
      return 'uint32array';
    }
    if (type === '[object Float32Array]') {
      return 'float32array';
    }
    if (type === '[object Float64Array]') {
      return 'float64array';
    }

    // must be a plain object
    return 'object';
  };

  var isNumber = function isNumber(num) {
    var type = kindOf(num);
    if (type !== 'number' && type !== 'string') {
      return false;
    }
    var n = +num;
    return (n - n + 1) >= 0 && num !== '';
  };

  var toString$3 = Object.prototype.toString;

  /**
   * Get the native `typeof` a value.
   *
   * @param  {*} `val`
   * @return {*} Native javascript type
   */

  var kindOf$1 = function kindOf(val) {
    // primitivies
    if (typeof val === 'undefined') {
      return 'undefined';
    }
    if (val === null) {
      return 'null';
    }
    if (val === true || val === false || val instanceof Boolean) {
      return 'boolean';
    }
    if (typeof val === 'string' || val instanceof String) {
      return 'string';
    }
    if (typeof val === 'number' || val instanceof Number) {
      return 'number';
    }

    // functions
    if (typeof val === 'function' || val instanceof Function) {
      return 'function';
    }

    // array
    if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
      return 'array';
    }

    // check for instances of RegExp and Date before calling `toString`
    if (val instanceof RegExp) {
      return 'regexp';
    }
    if (val instanceof Date) {
      return 'date';
    }

    // other objects
    var type = toString$3.call(val);

    if (type === '[object RegExp]') {
      return 'regexp';
    }
    if (type === '[object Date]') {
      return 'date';
    }
    if (type === '[object Arguments]') {
      return 'arguments';
    }
    if (type === '[object Error]') {
      return 'error';
    }

    // buffer
    if (isBuffer_1(val)) {
      return 'buffer';
    }

    // es6: Map, WeakMap, Set, WeakSet
    if (type === '[object Set]') {
      return 'set';
    }
    if (type === '[object WeakSet]') {
      return 'weakset';
    }
    if (type === '[object Map]') {
      return 'map';
    }
    if (type === '[object WeakMap]') {
      return 'weakmap';
    }
    if (type === '[object Symbol]') {
      return 'symbol';
    }

    // typed arrays
    if (type === '[object Int8Array]') {
      return 'int8array';
    }
    if (type === '[object Uint8Array]') {
      return 'uint8array';
    }
    if (type === '[object Uint8ClampedArray]') {
      return 'uint8clampedarray';
    }
    if (type === '[object Int16Array]') {
      return 'int16array';
    }
    if (type === '[object Uint16Array]') {
      return 'uint16array';
    }
    if (type === '[object Int32Array]') {
      return 'int32array';
    }
    if (type === '[object Uint32Array]') {
      return 'uint32array';
    }
    if (type === '[object Float32Array]') {
      return 'float32array';
    }
    if (type === '[object Float64Array]') {
      return 'float64array';
    }

    // must be a plain object
    return 'object';
  };

  var isNumber$1 = function isNumber(num) {
    var type = kindOf$1(num);

    if (type === 'string') {
      if (!num.trim()) { return false; }
    } else if (type !== 'number') {
      return false;
    }

    return (num - num + 1) >= 0;
  };

  var toString$4 = Object.prototype.toString;

  /**
   * Get the native `typeof` a value.
   *
   * @param  {*} `val`
   * @return {*} Native javascript type
   */

  var kindOf$2 = function kindOf(val) {
    // primitivies
    if (typeof val === 'undefined') {
      return 'undefined';
    }
    if (val === null) {
      return 'null';
    }
    if (val === true || val === false || val instanceof Boolean) {
      return 'boolean';
    }
    if (typeof val === 'string' || val instanceof String) {
      return 'string';
    }
    if (typeof val === 'number' || val instanceof Number) {
      return 'number';
    }

    // functions
    if (typeof val === 'function' || val instanceof Function) {
      return 'function';
    }

    // array
    if (typeof Array.isArray !== 'undefined' && Array.isArray(val)) {
      return 'array';
    }

    // check for instances of RegExp and Date before calling `toString`
    if (val instanceof RegExp) {
      return 'regexp';
    }
    if (val instanceof Date) {
      return 'date';
    }

    // other objects
    var type = toString$4.call(val);

    if (type === '[object RegExp]') {
      return 'regexp';
    }
    if (type === '[object Date]') {
      return 'date';
    }
    if (type === '[object Arguments]') {
      return 'arguments';
    }
    if (type === '[object Error]') {
      return 'error';
    }
    if (type === '[object Promise]') {
      return 'promise';
    }

    // buffer
    if (isBuffer_1(val)) {
      return 'buffer';
    }

    // es6: Map, WeakMap, Set, WeakSet
    if (type === '[object Set]') {
      return 'set';
    }
    if (type === '[object WeakSet]') {
      return 'weakset';
    }
    if (type === '[object Map]') {
      return 'map';
    }
    if (type === '[object WeakMap]') {
      return 'weakmap';
    }
    if (type === '[object Symbol]') {
      return 'symbol';
    }

    // typed arrays
    if (type === '[object Int8Array]') {
      return 'int8array';
    }
    if (type === '[object Uint8Array]') {
      return 'uint8array';
    }
    if (type === '[object Uint8ClampedArray]') {
      return 'uint8clampedarray';
    }
    if (type === '[object Int16Array]') {
      return 'int16array';
    }
    if (type === '[object Uint16Array]') {
      return 'uint16array';
    }
    if (type === '[object Int32Array]') {
      return 'int32array';
    }
    if (type === '[object Uint32Array]') {
      return 'uint32array';
    }
    if (type === '[object Float32Array]') {
      return 'float32array';
    }
    if (type === '[object Float64Array]') {
      return 'float64array';
    }

    // must be a plain object
    return 'object';
  };

  /**
   * Expose `randomatic`
   */

  var randomatic_1 = randomatic;

  /**
   * Available mask characters
   */

  var type = {
    lower: 'abcdefghijklmnopqrstuvwxyz',
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    number: '0123456789',
    special: '~!@#$%^&()_+-={}[];\',.'
  };

  type.all = type.lower + type.upper + type.number + type.special;

  /**
   * Generate random character sequences of a specified `length`,
   * based on the given `pattern`.
   *
   * @param {String} `pattern` The pattern to use for generating the random string.
   * @param {String} `length` The length of the string to generate.
   * @param {String} `options`
   * @return {String}
   * @api public
   */

  function randomatic(pattern, length, options) {
    if (typeof pattern === 'undefined') {
      throw new Error('randomatic expects a string or number.');
    }

    var custom = false;
    if (arguments.length === 1) {
      if (typeof pattern === 'string') {
        length = pattern.length;

      } else if (isNumber$1(pattern)) {
        options = {}; length = pattern; pattern = '*';
      }
    }

    if (kindOf$2(length) === 'object' && length.hasOwnProperty('chars')) {
      options = length;
      pattern = options.chars;
      length = pattern.length;
      custom = true;
    }

    var opts = options || {};
    var mask = '';
    var res = '';

    // Characters to be used
    if (pattern.indexOf('?') !== -1) { mask += opts.chars; }
    if (pattern.indexOf('a') !== -1) { mask += type.lower; }
    if (pattern.indexOf('A') !== -1) { mask += type.upper; }
    if (pattern.indexOf('0') !== -1) { mask += type.number; }
    if (pattern.indexOf('!') !== -1) { mask += type.special; }
    if (pattern.indexOf('*') !== -1) { mask += type.all; }
    if (custom) { mask += pattern; }

    while (length--) {
      res += mask.charAt(parseInt(Math.random() * mask.length, 10));
    }
    return res;
  }

  /*!
   * repeat-string <https://github.com/jonschlinkert/repeat-string>
   *
   * Copyright (c) 2014-2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  /**
   * Results cache
   */

  var res = '';
  var cache;

  /**
   * Expose `repeat`
   */

  var repeatString = repeat;

  /**
   * Repeat the given `string` the specified `number`
   * of times.
   *
   * **Example:**
   *
   * ```js
   * var repeat = require('repeat-string');
   * repeat('A', 5);
   * //=> AAAAA
   * ```
   *
   * @param {String} `string` The string to repeat
   * @param {Number} `number` The number of times to repeat the string
   * @return {String} Repeated string
   * @api public
   */

  function repeat(str, num) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string');
    }

    // cover common, quick use cases
    if (num === 1) { return str; }
    if (num === 2) { return str + str; }

    var max = str.length * num;
    if (cache !== str || typeof cache === 'undefined') {
      cache = str;
      res = '';
    } else if (res.length >= max) {
      return res.substr(0, max);
    }

    while (max > res.length && num > 1) {
      if (num & 1) {
        res += str;
      }

      num >>= 1;
      str += str;
    }

    res += str;
    res = res.substr(0, max);
    return res;
  }

  /*!
   * repeat-element <https://github.com/jonschlinkert/repeat-element>
   *
   * Copyright (c) 2015 Jon Schlinkert.
   * Licensed under the MIT license.
   */

  var repeatElement = function repeat(ele, num) {
    var arr = new Array(num);

    for (var i = 0; i < num; i++) {
      arr[i] = ele;
    }

    return arr;
  };

  /**
   * Expose `fillRange`
   */

  var fillRange_1 = fillRange;

  /**
   * Return a range of numbers or letters.
   *
   * @param  {String} `a` Start of the range
   * @param  {String} `b` End of the range
   * @param  {String} `step` Increment or decrement to use.
   * @param  {Function} `fn` Custom function to modify each element in the range.
   * @return {Array}
   */

  function fillRange(a, b, step, options, fn) {
    if (a == null || b == null) {
      throw new Error('fill-range expects the first and second args to be strings.');
    }

    if (typeof step === 'function') {
      fn = step; options = {}; step = null;
    }

    if (typeof options === 'function') {
      fn = options; options = {};
    }

    if (isobject(step)) {
      options = step; step = '';
    }

    var expand, regex = false, sep = '';
    var opts = options || {};

    if (typeof opts.silent === 'undefined') {
      opts.silent = true;
    }

    step = step || opts.step;

    // store a ref to unmodified arg
    var origA = a, origB = b;

    b = (b.toString() === '-0') ? 0 : b;

    if (opts.optimize || opts.makeRe) {
      step = step ? (step += '~') : step;
      expand = true;
      regex = true;
      sep = '~';
    }

    // handle special step characters
    if (typeof step === 'string') {
      var match = stepRe().exec(step);

      if (match) {
        var i = match.index;
        var m = match[0];

        // repeat string
        if (m === '+') {
          return repeatElement(a, b);

        // randomize a, `b` times
        } else if (m === '?') {
          return [randomatic_1(a, b)];

        // expand right, no regex reduction
        } else if (m === '>') {
          step = step.substr(0, i) + step.substr(i + 1);
          expand = true;

        // expand to an array, or if valid create a reduced
        // string for a regex logic `or`
        } else if (m === '|') {
          step = step.substr(0, i) + step.substr(i + 1);
          expand = true;
          regex = true;
          sep = m;

        // expand to an array, or if valid create a reduced
        // string for a regex range
        } else if (m === '~') {
          step = step.substr(0, i) + step.substr(i + 1);
          expand = true;
          regex = true;
          sep = m;
        }
      } else if (!isNumber(step)) {
        if (!opts.silent) {
          throw new TypeError('fill-range: invalid step.');
        }
        return null;
      }
    }

    if (/[.&*()[\]^%$#@!]/.test(a) || /[.&*()[\]^%$#@!]/.test(b)) {
      if (!opts.silent) {
        throw new RangeError('fill-range: invalid range arguments.');
      }
      return null;
    }

    // has neither a letter nor number, or has both letters and numbers
    // this needs to be after the step logic
    if (!noAlphaNum(a) || !noAlphaNum(b) || hasBoth(a) || hasBoth(b)) {
      if (!opts.silent) {
        throw new RangeError('fill-range: invalid range arguments.');
      }
      return null;
    }

    // validate arguments
    var isNumA = isNumber(zeros(a));
    var isNumB = isNumber(zeros(b));

    if ((!isNumA && isNumB) || (isNumA && !isNumB)) {
      if (!opts.silent) {
        throw new TypeError('fill-range: first range argument is incompatible with second.');
      }
      return null;
    }

    // by this point both are the same, so we
    // can use A to check going forward.
    var isNum = isNumA;
    var num = formatStep(step);

    // is the range alphabetical? or numeric?
    if (isNum) {
      // if numeric, coerce to an integer
      a = +a; b = +b;
    } else {
      // otherwise, get the charCode to expand alpha ranges
      a = a.charCodeAt(0);
      b = b.charCodeAt(0);
    }

    // is the pattern descending?
    var isDescending = a > b;

    // don't create a character class if the args are < 0
    if (a < 0 || b < 0) {
      expand = false;
      regex = false;
    }

    // detect padding
    var padding = isPadded(origA, origB);
    var res, pad, arr = [];
    var ii = 0;

    // character classes, ranges and logical `or`
    if (regex) {
      if (shouldExpand(a, b, num, isNum, padding, opts)) {
        // make sure the correct separator is used
        if (sep === '|' || sep === '~') {
          sep = detectSeparator(a, b, num, isNum, isDescending);
        }
        return wrap([origA, origB], sep, opts);
      }
    }

    while (isDescending ? (a >= b) : (a <= b)) {
      if (padding && isNum) {
        pad = padding(a);
      }

      // custom function
      if (typeof fn === 'function') {
        res = fn(a, isNum, pad, ii++);

      // letters
      } else if (!isNum) {
        if (regex && isInvalidChar(a)) {
          res = null;
        } else {
          res = String.fromCharCode(a);
        }

      // numbers
      } else {
        res = formatPadding(a, pad);
      }

      // add result to the array, filtering any nulled values
      if (res !== null) { arr.push(res); }

      // increment or decrement
      if (isDescending) {
        a -= num;
      } else {
        a += num;
      }
    }

    // now that the array is expanded, we need to handle regex
    // character classes, ranges or logical `or` that wasn't
    // already handled before the loop
    if ((regex || expand) && !opts.noexpand) {
      // make sure the correct separator is used
      if (sep === '|' || sep === '~') {
        sep = detectSeparator(a, b, num, isNum, isDescending);
      }
      if (arr.length === 1 || a < 0 || b < 0) { return arr; }
      return wrap(arr, sep, opts);
    }

    return arr;
  }

  /**
   * Wrap the string with the correct regex
   * syntax.
   */

  function wrap(arr, sep, opts) {
    if (sep === '~') { sep = '-'; }
    var str = arr.join(sep);
    var pre = opts && opts.regexPrefix;

    // regex logical `or`
    if (sep === '|') {
      str = pre ? pre + str : str;
      str = '(' + str + ')';
    }

    // regex character class
    if (sep === '-') {
      str = (pre && pre === '^')
        ? pre + str
        : str;
      str = '[' + str + ']';
    }
    return [str];
  }

  /**
   * Check for invalid characters
   */

  function isCharClass(a, b, step, isNum, isDescending) {
    if (isDescending) { return false; }
    if (isNum) { return a <= 9 && b <= 9; }
    if (a < b) { return step === 1; }
    return false;
  }

  /**
   * Detect the correct separator to use
   */

  function shouldExpand(a, b, num, isNum, padding, opts) {
    if (isNum && (a > 9 || b > 9)) { return false; }
    return !padding && num === 1 && a < b;
  }

  /**
   * Detect the correct separator to use
   */

  function detectSeparator(a, b, step, isNum, isDescending) {
    var isChar = isCharClass(a, b, step, isNum, isDescending);
    if (!isChar) {
      return '|';
    }
    return '~';
  }

  /**
   * Correctly format the step based on type
   */

  function formatStep(step) {
    return Math.abs(step >> 0) || 1;
  }

  /**
   * Format padding, taking leading `-` into account
   */

  function formatPadding(ch, pad) {
    var res = pad ? pad + ch : ch;
    if (pad && ch.toString().charAt(0) === '-') {
      res = '-' + pad + ch.toString().substr(1);
    }
    return res.toString();
  }

  /**
   * Check for invalid characters
   */

  function isInvalidChar(str) {
    var ch = toStr(str);
    return ch === '\\'
      || ch === '['
      || ch === ']'
      || ch === '^'
      || ch === '('
      || ch === ')'
      || ch === '`';
  }

  /**
   * Convert to a string from a charCode
   */

  function toStr(ch) {
    return String.fromCharCode(ch);
  }


  /**
   * Step regex
   */

  function stepRe() {
    return /\?|>|\||\+|\~/g;
  }

  /**
   * Return true if `val` has either a letter
   * or a number
   */

  function noAlphaNum(val) {
    return /[a-z0-9]/i.test(val);
  }

  /**
   * Return true if `val` has both a letter and
   * a number (invalid)
   */

  function hasBoth(val) {
    return /[a-z][0-9]|[0-9][a-z]/i.test(val);
  }

  /**
   * Normalize zeros for checks
   */

  function zeros(val) {
    if (/^-*0+$/.test(val.toString())) {
      return '0';
    }
    return val;
  }

  /**
   * Return true if `val` has leading zeros,
   * or a similar valid pattern.
   */

  function hasZeros(val) {
    return /[^.]\.|^-*0+[0-9]/.test(val);
  }

  /**
   * If the string is padded, returns a curried function with
   * the a cached padding string, or `false` if no padding.
   *
   * @param  {*} `origA` String or number.
   * @return {String|Boolean}
   */

  function isPadded(origA, origB) {
    if (hasZeros(origA) || hasZeros(origB)) {
      var alen = length(origA);
      var blen = length(origB);

      var len = alen >= blen
        ? alen
        : blen;

      return function (a) {
        return repeatString('0', len - length(a));
      };
    }
    return false;
  }

  /**
   * Get the string length of `val`
   */

  function length(val) {
    return val.toString().length;
  }

  var expandRange = function expandRange(str, options, fn) {
    if (typeof str !== 'string') {
      throw new TypeError('expand-range expects a string.');
    }

    if (typeof options === 'function') {
      fn = options;
      options = {};
    }

    if (typeof options === 'boolean') {
      options = {};
      options.makeRe = true;
    }

    // create arguments to pass to fill-range
    var opts = options || {};
    var args = str.split('..');
    var len = args.length;
    if (len > 3) { return str; }

    // if only one argument, it can't expand so return it
    if (len === 1) { return args; }

    // if `true`, tell fill-range to regexify the string
    if (typeof fn === 'boolean' && fn === true) {
      opts.makeRe = true;
    }

    args.push(opts);
    return fillRange_1.apply(null, args.concat(fn));
  };

  /*!
   * preserve <https://github.com/jonschlinkert/preserve>
   *
   * Copyright (c) 2014-2015, Jon Schlinkert.
   * Licensed under the MIT license.
   */

  /**
   * Replace tokens in `str` with a temporary, heuristic placeholder.
   *
   * ```js
   * tokens.before('{a\\,b}');
   * //=> '{__ID1__}'
   * ```
   *
   * @param  {String} `str`
   * @return {String} String with placeholders.
   * @api public
   */

  var before = function before(str, re) {
    return str.replace(re, function (match) {
      var id = randomize();
      cache$1[id] = match;
      return '__ID' + id + '__';
    });
  };

  /**
   * Replace placeholders in `str` with original tokens.
   *
   * ```js
   * tokens.after('{__ID1__}');
   * //=> '{a\\,b}'
   * ```
   *
   * @param  {String} `str` String with placeholders
   * @return {String} `str` String with original tokens.
   * @api public
   */

  var after = function after(str) {
    return str.replace(/__ID(.{5})__/g, function (_, id) {
      return cache$1[id];
    });
  };

  function randomize() {
    return Math.random().toString().slice(2, 7);
  }

  var cache$1 = {};

  var preserve = {
  	before: before,
  	after: after
  };

  /**
   * Module dependencies
   */





  /**
   * Expose `braces`
   */

  var braces_1 = function(str, options) {
    if (typeof str !== 'string') {
      throw new Error('braces expects a string');
    }
    return braces(str, options);
  };

  /**
   * Expand `{foo,bar}` or `{1..5}` braces in the
   * given `string`.
   *
   * @param  {String} `str`
   * @param  {Array} `arr`
   * @param  {Object} `options`
   * @return {Array}
   */

  function braces(str, arr, options) {
    if (str === '') {
      return [];
    }

    if (!Array.isArray(arr)) {
      options = arr;
      arr = [];
    }

    var opts = options || {};
    arr = arr || [];

    if (typeof opts.nodupes === 'undefined') {
      opts.nodupes = true;
    }

    var fn = opts.fn;
    var es6;

    if (typeof opts === 'function') {
      fn = opts;
      opts = {};
    }

    if (!(patternRe instanceof RegExp)) {
      patternRe = patternRegex();
    }

    var matches = str.match(patternRe) || [];
    var m = matches[0];

    switch(m) {
      case '\\,':
        return escapeCommas(str, arr, opts);
      case '\\.':
        return escapeDots(str, arr, opts);
      case '\/.':
        return escapePaths(str, arr, opts);
      case ' ':
        return splitWhitespace(str);
      case '{,}':
        return exponential(str, opts, braces);
      case '{}':
        return emptyBraces(str, arr, opts);
      case '\\{':
      case '\\}':
        return escapeBraces(str, arr, opts);
      case '${':
        if (!/\{[^{]+\{/.test(str)) {
          return arr.concat(str);
        } else {
          es6 = true;
          str = preserve.before(str, es6Regex());
        }
    }

    if (!(braceRe instanceof RegExp)) {
      braceRe = braceRegex();
    }

    var match = braceRe.exec(str);
    if (match == null) {
      return [str];
    }

    var outter = match[1];
    var inner = match[2];
    if (inner === '') { return [str]; }

    var segs, segsLength;

    if (inner.indexOf('..') !== -1) {
      segs = expandRange(inner, opts, fn) || inner.split(',');
      segsLength = segs.length;

    } else if (inner[0] === '"' || inner[0] === '\'') {
      return arr.concat(str.split(/['"]/).join(''));

    } else {
      segs = inner.split(',');
      if (opts.makeRe) {
        return braces(str.replace(outter, wrap$1(segs, '|')), opts);
      }

      segsLength = segs.length;
      if (segsLength === 1 && opts.bash) {
        segs[0] = wrap$1(segs[0], '\\');
      }
    }

    var len = segs.length;
    var i = 0, val;

    while (len--) {
      var path = segs[i++];

      if (/(\.[^.\/])/.test(path)) {
        if (segsLength > 1) {
          return segs;
        } else {
          return [str];
        }
      }

      val = splice(str, outter, path);

      if (/\{[^{}]+?\}/.test(val)) {
        arr = braces(val, arr, opts);
      } else if (val !== '') {
        if (opts.nodupes && arr.indexOf(val) !== -1) { continue; }
        arr.push(es6 ? preserve.after(val) : val);
      }
    }

    if (opts.strict) { return filter(arr, filterEmpty); }
    return arr;
  }

  /**
   * Expand exponential ranges
   *
   *   `a{,}{,}` => ['a', 'a', 'a', 'a']
   */

  function exponential(str, options, fn) {
    if (typeof options === 'function') {
      fn = options;
      options = null;
    }

    var opts = options || {};
    var esc = '__ESC_EXP__';
    var exp = 0;
    var res;

    var parts = str.split('{,}');
    if (opts.nodupes) {
      return fn(parts.join(''), opts);
    }

    exp = parts.length - 1;
    res = fn(parts.join(esc), opts);
    var len = res.length;
    var arr = [];
    var i = 0;

    while (len--) {
      var ele = res[i++];
      var idx = ele.indexOf(esc);

      if (idx === -1) {
        arr.push(ele);

      } else {
        ele = ele.split('__ESC_EXP__').join('');
        if (!!ele && opts.nodupes !== false) {
          arr.push(ele);

        } else {
          var num = Math.pow(2, exp);
          arr.push.apply(arr, repeatElement(ele, num));
        }
      }
    }
    return arr;
  }

  /**
   * Wrap a value with parens, brackets or braces,
   * based on the given character/separator.
   *
   * @param  {String|Array} `val`
   * @param  {String} `ch`
   * @return {String}
   */

  function wrap$1(val, ch) {
    if (ch === '|') {
      return '(' + val.join(ch) + ')';
    }
    if (ch === ',') {
      return '{' + val.join(ch) + '}';
    }
    if (ch === '-') {
      return '[' + val.join(ch) + ']';
    }
    if (ch === '\\') {
      return '\\{' + val + '\\}';
    }
  }

  /**
   * Handle empty braces: `{}`
   */

  function emptyBraces(str, arr, opts) {
    return braces(str.split('{}').join('\\{\\}'), arr, opts);
  }

  /**
   * Filter out empty-ish values
   */

  function filterEmpty(ele) {
    return !!ele && ele !== '\\';
  }

  /**
   * Handle patterns with whitespace
   */

  function splitWhitespace(str) {
    var segs = str.split(' ');
    var len = segs.length;
    var res = [];
    var i = 0;

    while (len--) {
      res.push.apply(res, braces(segs[i++]));
    }
    return res;
  }

  /**
   * Handle escaped braces: `\\{foo,bar}`
   */

  function escapeBraces(str, arr, opts) {
    if (!/\{[^{]+\{/.test(str)) {
      return arr.concat(str.split('\\').join(''));
    } else {
      str = str.split('\\{').join('__LT_BRACE__');
      str = str.split('\\}').join('__RT_BRACE__');
      return map(braces(str, arr, opts), function(ele) {
        ele = ele.split('__LT_BRACE__').join('{');
        return ele.split('__RT_BRACE__').join('}');
      });
    }
  }

  /**
   * Handle escaped dots: `{1\\.2}`
   */

  function escapeDots(str, arr, opts) {
    if (!/[^\\]\..+\\\./.test(str)) {
      return arr.concat(str.split('\\').join(''));
    } else {
      str = str.split('\\.').join('__ESC_DOT__');
      return map(braces(str, arr, opts), function(ele) {
        return ele.split('__ESC_DOT__').join('.');
      });
    }
  }

  /**
   * Handle escaped dots: `{1\\.2}`
   */

  function escapePaths(str, arr, opts) {
    str = str.split('\/.').join('__ESC_PATH__');
    return map(braces(str, arr, opts), function(ele) {
      return ele.split('__ESC_PATH__').join('\/.');
    });
  }

  /**
   * Handle escaped commas: `{a\\,b}`
   */

  function escapeCommas(str, arr, opts) {
    if (!/\w,/.test(str)) {
      return arr.concat(str.split('\\').join(''));
    } else {
      str = str.split('\\,').join('__ESC_COMMA__');
      return map(braces(str, arr, opts), function(ele) {
        return ele.split('__ESC_COMMA__').join(',');
      });
    }
  }

  /**
   * Regex for common patterns
   */

  function patternRegex() {
    return /\${|( (?=[{,}])|(?=[{,}]) )|{}|{,}|\\,(?=.*[{}])|\/\.(?=.*[{}])|\\\.(?={)|\\{|\\}/;
  }

  /**
   * Braces regex.
   */

  function braceRegex() {
    return /.*(\\?\{([^}]+)\})/;
  }

  /**
   * es6 delimiter regex.
   */

  function es6Regex() {
    return /\$\{([^}]+)\}/;
  }

  var braceRe;
  var patternRe;

  /**
   * Faster alternative to `String.replace()` when the
   * index of the token to be replaces can't be supplied
   */

  function splice(str, token, replacement) {
    var i = str.indexOf(token);
    return str.substr(0, i) + replacement
      + str.substr(i + token.length);
  }

  /**
   * Fast array map
   */

  function map(arr, fn) {
    if (arr == null) {
      return [];
    }

    var len = arr.length;
    var res = new Array(len);
    var i = -1;

    while (++i < len) {
      res[i] = fn(arr[i], i, arr);
    }

    return res;
  }

  /**
   * Fast array filter
   */

  function filter(arr, cb) {
    if (arr == null) { return []; }
    if (typeof cb !== 'function') {
      throw new TypeError('braces: filter expects a callback function.');
    }

    var len = arr.length;
    var res = arr.slice();
    var i = 0;

    while (len--) {
      if (!cb(arr[len], i++)) {
        res.splice(len, 1);
      }
    }
    return res;
  }

  /*!
   * is-posix-bracket <https://github.com/jonschlinkert/is-posix-bracket>
   *
   * Copyright (c) 2015-2016, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var isPosixBracket = function isPosixBracket(str) {
    return typeof str === 'string' && /\[([:.=+])(?:[^\[\]]|)+\1\]/.test(str);
  };

  /**
   * POSIX character classes
   */

  var POSIX = {
    alnum: 'a-zA-Z0-9',
    alpha: 'a-zA-Z',
    blank: ' \\t',
    cntrl: '\\x00-\\x1F\\x7F',
    digit: '0-9',
    graph: '\\x21-\\x7E',
    lower: 'a-z',
    print: '\\x20-\\x7E',
    punct: '-!"#$%&\'()\\*+,./:;<=>?@[\\]^_`{|}~',
    space: ' \\t\\r\\n\\v\\f',
    upper: 'A-Z',
    word:  'A-Za-z0-9_',
    xdigit: 'A-Fa-f0-9',
  };

  /**
   * Expose `brackets`
   */

  var expandBrackets = brackets;

  function brackets(str) {
    if (!isPosixBracket(str)) {
      return str;
    }

    var negated = false;
    if (str.indexOf('[^') !== -1) {
      negated = true;
      str = str.split('[^').join('[');
    }
    if (str.indexOf('[!') !== -1) {
      negated = true;
      str = str.split('[!').join('[');
    }

    var a = str.split('[');
    var b = str.split(']');
    var imbalanced = a.length !== b.length;

    var parts = str.split(/(?::\]\[:|\[?\[:|:\]\]?)/);
    var len = parts.length, i = 0;
    var end = '', beg = '';
    var res = [];

    // start at the end (innermost) first
    while (len--) {
      var inner = parts[i++];
      if (inner === '^[!' || inner === '[!') {
        inner = '';
        negated = true;
      }

      var prefix = negated ? '^' : '';
      var ch = POSIX[inner];

      if (ch) {
        res.push('[' + prefix + ch + ']');
      } else if (inner) {
        if (/^\[?\w-\w\]?$/.test(inner)) {
          if (i === parts.length) {
            res.push('[' + prefix + inner);
          } else if (i === 1) {
            res.push(prefix + inner + ']');
          } else {
            res.push(prefix + inner);
          }
        } else {
          if (i === 1) {
            beg += inner;
          } else if (i === parts.length) {
            end += inner;
          } else {
            res.push('[' + prefix + inner + ']');
          }
        }
      }
    }

    var result = res.join('|');
    var rlen = res.length || 1;
    if (rlen > 1) {
      result = '(?:' + result + ')';
      rlen = 1;
    }
    if (beg) {
      rlen++;
      if (beg.charAt(0) === '[') {
        if (imbalanced) {
          beg = '\\[' + beg.slice(1);
        } else {
          beg += ']';
        }
      }
      result = beg + result;
    }
    if (end) {
      rlen++;
      if (end.slice(-1) === ']') {
        if (imbalanced) {
          end = end.slice(0, end.length - 1) + '\\]';
        } else {
          end = '[' + end;
        }
      }
      result += end;
    }

    if (rlen > 1) {
      result = result.split('][').join(']|[');
      if (result.indexOf('|') !== -1 && !/\(\?/.test(result)) {
        result = '(?:' + result + ')';
      }
    }

    result = result.replace(/\[+=|=\]+/g, '\\b');
    return result;
  }

  brackets.makeRe = function(pattern) {
    try {
      return new RegExp(brackets(pattern));
    } catch (err) {}
  };

  brackets.isMatch = function(str, pattern) {
    try {
      return brackets.makeRe(pattern).test(str);
    } catch (err) {
      return false;
    }
  };

  brackets.match = function(arr, pattern) {
    var len = arr.length, i = 0;
    var res = arr.slice();

    var re = brackets.makeRe(pattern);
    while (i < len) {
      var ele = arr[i++];
      if (!re.test(ele)) {
        continue;
      }
      res.splice(i, 1);
    }
    return res;
  };

  /*!
   * is-extglob <https://github.com/jonschlinkert/is-extglob>
   *
   * Copyright (c) 2014-2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var isExtglob = function isExtglob(str) {
    return typeof str === 'string'
      && /[@?!+*]\(/.test(str);
  };

  /**
   * Module dependencies
   */


  var re, cache$2 = {};

  /**
   * Expose `extglob`
   */

  var extglob_1 = extglob;

  /**
   * Convert the given extglob `string` to a regex-compatible
   * string.
   *
   * ```js
   * var extglob = require('extglob');
   * extglob('!(a?(b))');
   * //=> '(?!a(?:b)?)[^/]*?'
   * ```
   *
   * @param {String} `str` The string to convert.
   * @param {Object} `options`
   *   @option {Boolean} [options] `esc` If `false` special characters will not be escaped. Defaults to `true`.
   *   @option {Boolean} [options] `regex` If `true` a regular expression is returned instead of a string.
   * @return {String}
   * @api public
   */


  function extglob(str, opts) {
    opts = opts || {};
    var o = {}, i = 0;

    // fix common character reversals
    // '*!(.js)' => '*.!(js)'
    str = str.replace(/!\(([^\w*()])/g, '$1!(');

    // support file extension negation
    str = str.replace(/([*\/])\.!\([*]\)/g, function (m, ch) {
      if (ch === '/') {
        return escape('\\/[^.]+');
      }
      return escape('[^.]+');
    });

    // create a unique key for caching by
    // combining the string and options
    var key = str
      + String(!!opts.regex)
      + String(!!opts.contains)
      + String(!!opts.escape);

    if (cache$2.hasOwnProperty(key)) {
      return cache$2[key];
    }

    if (!(re instanceof RegExp)) {
      re = regex();
    }

    opts.negate = false;
    var m;

    while (m = re.exec(str)) {
      var prefix = m[1];
      var inner = m[3];
      if (prefix === '!') {
        opts.negate = true;
      }

      var id = '__EXTGLOB_' + (i++) + '__';
      // use the prefix of the _last_ (outtermost) pattern
      o[id] = wrap$2(inner, prefix, opts.escape);
      str = str.split(m[0]).join(id);
    }

    var keys = Object.keys(o);
    var len = keys.length;

    // we have to loop again to allow us to convert
    // patterns in reverse order (starting with the
    // innermost/last pattern first)
    while (len--) {
      var prop = keys[len];
      str = str.split(prop).join(o[prop]);
    }

    var result = opts.regex
      ? toRegex(str, opts.contains, opts.negate)
      : str;

    result = result.split('.').join('\\.');

    // cache the result and return it
    return (cache$2[key] = result);
  }

  /**
   * Convert `string` to a regex string.
   *
   * @param  {String} `str`
   * @param  {String} `prefix` Character that determines how to wrap the string.
   * @param  {Boolean} `esc` If `false` special characters will not be escaped. Defaults to `true`.
   * @return {String}
   */

  function wrap$2(inner, prefix, esc) {
    if (esc) { inner = escape(inner); }

    switch (prefix) {
      case '!':
        return '(?!' + inner + ')[^/]' + (esc ? '%%%~' : '*?');
      case '@':
        return '(?:' + inner + ')';
      case '+':
        return '(?:' + inner + ')+';
      case '*':
        return '(?:' + inner + ')' + (esc ? '%%' : '*')
      case '?':
        return '(?:' + inner + '|)';
      default:
        return inner;
    }
  }

  function escape(str) {
    str = str.split('*').join('[^/]%%%~');
    str = str.split('.').join('\\.');
    return str;
  }

  /**
   * extglob regex.
   */

  function regex() {
    return /(\\?[@?!+*$]\\?)(\(([^()]*?)\))/;
  }

  /**
   * Negation regex
   */

  function negate(str) {
    return '(?!^' + str + ').*$';
  }

  /**
   * Create the regex to do the matching. If
   * the leading character in the `pattern` is `!`
   * a negation regex is returned.
   *
   * @param {String} `pattern`
   * @param {Boolean} `contains` Allow loose matching.
   * @param {Boolean} `isNegated` True if the pattern is a negation pattern.
   */

  function toRegex(pattern, contains, isNegated) {
    var prefix = contains ? '^' : '';
    var after = contains ? '$' : '';
    pattern = ('(?:' + pattern + ')' + after);
    if (isNegated) {
      pattern = prefix + negate(pattern);
    }
    return new RegExp(prefix + pattern);
  }

  /*!
   * is-glob <https://github.com/jonschlinkert/is-glob>
   *
   * Copyright (c) 2014-2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */



  var isGlob = function isGlob(str) {
    return typeof str === 'string'
      && (/[*!?{}(|)[\]]/.test(str)
       || isExtglob(str));
  };

  var isWin = false;

  var removeTrailingSeparator = function (str) {
  	var i = str.length - 1;
  	if (i < 2) {
  		return str;
  	}
  	while (isSeparator(str, i)) {
  		i--;
  	}
  	return str.substr(0, i + 1);
  };

  function isSeparator(str, i) {
  	var char = str[i];
  	return i > 0 && (char === '/' || (isWin && char === '\\'));
  }

  /*!
   * normalize-path <https://github.com/jonschlinkert/normalize-path>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */



  var normalizePath = function normalizePath(str, stripTrailing) {
    if (typeof str !== 'string') {
      throw new TypeError('expected a string');
    }
    str = str.replace(/[\\\/]+/g, '/');
    if (stripTrailing !== false) {
      str = removeTrailingSeparator(str);
    }
    return str;
  };

  /*!
   * is-extendable <https://github.com/jonschlinkert/is-extendable>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  var isExtendable = function isExtendable(val) {
    return typeof val !== 'undefined' && val !== null
      && (typeof val === 'object' || typeof val === 'function');
  };

  /*!
   * for-in <https://github.com/jonschlinkert/for-in>
   *
   * Copyright (c) 2014-2017, Jon Schlinkert.
   * Released under the MIT License.
   */

  var forIn = function forIn(obj, fn, thisArg) {
    for (var key in obj) {
      if (fn.call(thisArg, obj[key], key, obj) === false) {
        break;
      }
    }
  };

  var hasOwn = Object.prototype.hasOwnProperty;

  var forOwn = function forOwn(obj, fn, thisArg) {
    forIn(obj, function(val, key) {
      if (hasOwn.call(obj, key)) {
        return fn.call(thisArg, obj[key], key, obj);
      }
    });
  };

  var object_omit = function omit(obj, keys) {
    if (!isExtendable(obj)) { return {}; }

    keys = [].concat.apply([], [].slice.call(arguments, 1));
    var last = keys[keys.length - 1];
    var res = {}, fn;

    if (typeof last === 'function') {
      fn = keys.pop();
    }

    var isFunction = typeof fn === 'function';
    if (!keys.length && !isFunction) {
      return obj;
    }

    forOwn(obj, function(value, key) {
      if (keys.indexOf(key) === -1) {

        if (!isFunction) {
          res[key] = value;
        } else if (fn(value, key, obj)) {
          res[key] = value;
        }
      }
    });
    return res;
  };

  var globParent = function globParent(str) {
  	str += 'a'; // preserves full path in case of trailing path separator
  	do {str = pathBrowserify.dirname(str);} while (isGlob(str));
  	return str;
  };

  var globBase = function globBase(pattern) {
    if (typeof pattern !== 'string') {
      throw new TypeError('glob-base expects a string.');
    }

    var res = {};
    res.base = globParent(pattern);
    res.isGlob = isGlob(pattern);

    if (res.base !== '.') {
      res.glob = pattern.substr(res.base.length);
      if (res.glob.charAt(0) === '/') {
        res.glob = res.glob.substr(1);
      }
    } else {
      res.glob = pattern;
    }

    if (!res.isGlob) {
      res.base = dirname$1(pattern);
      res.glob = res.base !== '.'
        ? pattern.substr(res.base.length)
        : pattern;
    }

    if (res.glob.substr(0, 2) === './') {
      res.glob = res.glob.substr(2);
    }
    if (res.glob.charAt(0) === '/') {
      res.glob = res.glob.substr(1);
    }
    return res;
  };

  function dirname$1(glob) {
    if (glob.slice(-1) === '/') { return glob; }
    return pathBrowserify.dirname(glob);
  }

  /*!
   * is-dotfile <https://github.com/jonschlinkert/is-dotfile>
   *
   * Copyright (c) 2015-2017, Jon Schlinkert.
   * Released under the MIT License.
   */

  var isDotfile = function(str) {
    if (str.charCodeAt(0) === 46 /* . */ && str.indexOf('/', 1) === -1) {
      return true;
    }
    var slash = str.lastIndexOf('/');
    return slash !== -1 ? str.charCodeAt(slash + 1) === 46  /* . */ : false;
  };

  var parseGlob = createCommonjsModule(function (module) {






  /**
   * Expose `cache`
   */

  var cache = module.exports.cache = {};

  /**
   * Parse a glob pattern into tokens.
   *
   * When no paths or '**' are in the glob, we use a
   * different strategy for parsing the filename, since
   * file names can contain braces and other difficult
   * patterns. such as:
   *
   *  - `*.{a,b}`
   *  - `(**|*.js)`
   */

  module.exports = function parseGlob(glob) {
    if (cache.hasOwnProperty(glob)) {
      return cache[glob];
    }

    var tok = {};
    tok.orig = glob;
    tok.is = {};

    // unescape dots and slashes in braces/brackets
    glob = escape(glob);

    var parsed = globBase(glob);
    tok.is.glob = parsed.isGlob;

    tok.glob = parsed.glob;
    tok.base = parsed.base;
    var segs = /([^\/]*)$/.exec(glob);

    tok.path = {};
    tok.path.dirname = '';
    tok.path.basename = segs[1] || '';
    tok.path.dirname = glob.split(tok.path.basename).join('') || '';
    var basename = (tok.path.basename || '').split('.') || '';
    tok.path.filename = basename[0] || '';
    tok.path.extname = basename.slice(1).join('.') || '';
    tok.path.ext = '';

    if (isGlob(tok.path.dirname) && !tok.path.basename) {
      if (!/\/$/.test(tok.glob)) {
        tok.path.basename = tok.glob;
      }
      tok.path.dirname = tok.base;
    }

    if (glob.indexOf('/') === -1 && !tok.is.globstar) {
      tok.path.dirname = '';
      tok.path.basename = tok.orig;
    }

    var dot = tok.path.basename.indexOf('.');
    if (dot !== -1) {
      tok.path.filename = tok.path.basename.slice(0, dot);
      tok.path.extname = tok.path.basename.slice(dot);
    }

    if (tok.path.extname.charAt(0) === '.') {
      var exts = tok.path.extname.split('.');
      tok.path.ext = exts[exts.length - 1];
    }

    // unescape dots and slashes in braces/brackets
    tok.glob = unescape(tok.glob);
    tok.path.dirname = unescape(tok.path.dirname);
    tok.path.basename = unescape(tok.path.basename);
    tok.path.filename = unescape(tok.path.filename);
    tok.path.extname = unescape(tok.path.extname);

    // Booleans
    var is = (glob && tok.is.glob);
    tok.is.negated  = glob && glob.charAt(0) === '!';
    tok.is.extglob  = glob && isExtglob(glob);
    tok.is.braces   = has(is, glob, '{');
    tok.is.brackets = has(is, glob, '[:');
    tok.is.globstar = has(is, glob, '**');
    tok.is.dotfile  = isDotfile(tok.path.basename) || isDotfile(tok.path.filename);
    tok.is.dotdir   = dotdir(tok.path.dirname);
    return (cache[glob] = tok);
  };

  /**
   * Returns true if the glob matches dot-directories.
   *
   * @param  {Object} `tok` The tokens object
   * @param  {Object} `path` The path object
   * @return {Object}
   */

  function dotdir(base) {
    if (base.indexOf('/.') !== -1) {
      return true;
    }
    if (base.charAt(0) === '.' && base.charAt(1) !== '/') {
      return true;
    }
    return false;
  }

  /**
   * Returns true if the pattern has the given `ch`aracter(s)
   *
   * @param  {Object} `glob` The glob pattern.
   * @param  {Object} `ch` The character to test for
   * @return {Object}
   */

  function has(is, glob, ch) {
    return is && glob.indexOf(ch) !== -1;
  }

  /**
   * Escape/unescape utils
   */

  function escape(str) {
    var re = /\{([^{}]*?)}|\(([^()]*?)\)|\[([^\[\]]*?)\]/g;
    return str.replace(re, function (outter, braces, parens, brackets) {
      var inner = braces || parens || brackets;
      if (!inner) { return outter; }
      return outter.split(inner).join(esc(inner));
    });
  }

  function esc(str) {
    str = str.split('/').join('__SLASH__');
    str = str.split('.').join('__DOT__');
    return str;
  }

  function unescape(str) {
    str = str.split('__SLASH__').join('/');
    str = str.split('__DOT__').join('.');
    return str;
  }
  });
  var parseGlob_1 = parseGlob.cache;

  /*!
   * is-primitive <https://github.com/jonschlinkert/is-primitive>
   *
   * Copyright (c) 2014-2015, Jon Schlinkert.
   * Licensed under the MIT License.
   */

  // see http://jsperf.com/testing-value-is-primitive/7
  var isPrimitive = function isPrimitive(value) {
    return value == null || (typeof value !== 'function' && typeof value !== 'object');
  };

  var isEqualShallow = function isEqual(a, b) {
    if (!a && !b) { return true; }
    if (!a && b || a && !b) { return false; }

    var numKeysA = 0, numKeysB = 0, key;
    for (key in b) {
      numKeysB++;
      if (!isPrimitive(b[key]) || !a.hasOwnProperty(key) || (a[key] !== b[key])) {
        return false;
      }
    }
    for (key in a) {
      numKeysA++;
    }
    return numKeysA === numKeysB;
  };

  var basic = {};
  var cache$3 = {};

  /**
   * Expose `regexCache`
   */

  var regexCache_1 = regexCache;

  /**
   * Memoize the results of a call to the new RegExp constructor.
   *
   * @param  {Function} fn [description]
   * @param  {String} str [description]
   * @param  {Options} options [description]
   * @param  {Boolean} nocompare [description]
   * @return {RegExp}
   */

  function regexCache(fn, str, opts) {
    var key = '_default_', regex, cached;

    if (!str && !opts) {
      if (typeof fn !== 'function') {
        return fn;
      }
      return basic[key] || (basic[key] = fn(str));
    }

    var isString = typeof str === 'string';
    if (isString) {
      if (!opts) {
        return basic[str] || (basic[str] = fn(str));
      }
      key = str;
    } else {
      opts = str;
    }

    cached = cache$3[key];
    if (cached && isEqualShallow(cached.opts, opts)) {
      return cached.regex;
    }

    memo(key, opts, (regex = fn(str, opts)));
    return regex;
  }

  function memo(key, opts, regex) {
    cache$3[key] = {regex: regex, opts: opts};
  }

  /**
   * Expose `cache`
   */

  var cache_1 = cache$3;
  var basic_1 = basic;
  regexCache_1.cache = cache_1;
  regexCache_1.basic = basic_1;

  var utils_1 = createCommonjsModule(function (module) {

  var win32 = false;


  var utils = module.exports;

  /**
   * Module dependencies
   */

  utils.diff = arrDiff;
  utils.unique = arrayUnique;
  utils.braces = braces_1;
  utils.brackets = expandBrackets;
  utils.extglob = extglob_1;
  utils.isExtglob = isExtglob;
  utils.isGlob = isGlob;
  utils.typeOf = kindOf;
  utils.normalize = normalizePath;
  utils.omit = object_omit;
  utils.parseGlob = parseGlob;
  utils.cache = regexCache_1;

  /**
   * Get the filename of a filepath
   *
   * @param {String} `string`
   * @return {String}
   */

  utils.filename = function filename(fp) {
    var seg = fp.match(filenameRegex());
    return seg && seg[0];
  };

  /**
   * Returns a function that returns true if the given
   * pattern is the same as a given `filepath`
   *
   * @param {String} `pattern`
   * @return {Function}
   */

  utils.isPath = function isPath(pattern, opts) {
    opts = opts || {};
    return function(fp) {
      var unixified = utils.unixify(fp, opts);
      if(opts.nocase){
        return pattern.toLowerCase() === unixified.toLowerCase();
      }
      return pattern === unixified;
    };
  };

  /**
   * Returns a function that returns true if the given
   * pattern contains a `filepath`
   *
   * @param {String} `pattern`
   * @return {Function}
   */

  utils.hasPath = function hasPath(pattern, opts) {
    return function(fp) {
      return utils.unixify(pattern, opts).indexOf(fp) !== -1;
    };
  };

  /**
   * Returns a function that returns true if the given
   * pattern matches or contains a `filepath`
   *
   * @param {String} `pattern`
   * @return {Function}
   */

  utils.matchPath = function matchPath(pattern, opts) {
    var fn = (opts && opts.contains)
      ? utils.hasPath(pattern, opts)
      : utils.isPath(pattern, opts);
    return fn;
  };

  /**
   * Returns a function that returns true if the given
   * regex matches the `filename` of a file path.
   *
   * @param {RegExp} `re`
   * @return {Boolean}
   */

  utils.hasFilename = function hasFilename(re) {
    return function(fp) {
      var name = utils.filename(fp);
      return name && re.test(name);
    };
  };

  /**
   * Coerce `val` to an array
   *
   * @param  {*} val
   * @return {Array}
   */

  utils.arrayify = function arrayify(val) {
    return !Array.isArray(val)
      ? [val]
      : val;
  };

  /**
   * Normalize all slashes in a file path or glob pattern to
   * forward slashes.
   */

  utils.unixify = function unixify(fp, opts) {
    if (opts && opts.unixify === false) { return fp; }
    if (opts && opts.unixify === true || win32 || pathBrowserify.sep === '\\') {
      return utils.normalize(fp, false);
    }
    if (opts && opts.unescape === true) {
      return fp ? fp.toString().replace(/\\(\w)/g, '$1') : '';
    }
    return fp;
  };

  /**
   * Escape/unescape utils
   */

  utils.escapePath = function escapePath(fp) {
    return fp.replace(/[\\.]/g, '\\$&');
  };

  utils.unescapeGlob = function unescapeGlob(fp) {
    return fp.replace(/[\\"']/g, '');
  };

  utils.escapeRe = function escapeRe(str) {
    return str.replace(/[-[\\$*+?.#^\s{}(|)\]]/g, '\\$&');
  };

  /**
   * Expose `utils`
   */

  module.exports = utils;
  });

  var chars = {}, unesc, temp;

  function reverse(object, prepender) {
    return Object.keys(object).reduce(function(reversed, key) {
      var newKey = prepender ? prepender + key : key; // Optionally prepend a string to key.
      reversed[object[key]] = newKey; // Swap key and value.
      return reversed; // Return the result.
    }, {});
  }

  /**
   * Regex for common characters
   */

  chars.escapeRegex = {
    '?': /\?/g,
    '@': /\@/g,
    '!': /\!/g,
    '+': /\+/g,
    '*': /\*/g,
    '(': /\(/g,
    ')': /\)/g,
    '[': /\[/g,
    ']': /\]/g
  };

  /**
   * Escape characters
   */

  chars.ESC = {
    '?': '__UNESC_QMRK__',
    '@': '__UNESC_AMPE__',
    '!': '__UNESC_EXCL__',
    '+': '__UNESC_PLUS__',
    '*': '__UNESC_STAR__',
    ',': '__UNESC_COMMA__',
    '(': '__UNESC_LTPAREN__',
    ')': '__UNESC_RTPAREN__',
    '[': '__UNESC_LTBRACK__',
    ']': '__UNESC_RTBRACK__'
  };

  /**
   * Unescape characters
   */

  chars.UNESC = unesc || (unesc = reverse(chars.ESC, '\\'));

  chars.ESC_TEMP = {
    '?': '__TEMP_QMRK__',
    '@': '__TEMP_AMPE__',
    '!': '__TEMP_EXCL__',
    '*': '__TEMP_STAR__',
    '+': '__TEMP_PLUS__',
    ',': '__TEMP_COMMA__',
    '(': '__TEMP_LTPAREN__',
    ')': '__TEMP_RTPAREN__',
    '[': '__TEMP_LTBRACK__',
    ']': '__TEMP_RTBRACK__'
  };

  chars.TEMP = temp || (temp = reverse(chars.ESC_TEMP));

  var chars_1 = chars;

  var glob = createCommonjsModule(function (module) {




  /**
   * Expose `Glob`
   */

  var Glob = module.exports = function Glob(pattern, options) {
    if (!(this instanceof Glob)) {
      return new Glob(pattern, options);
    }
    this.options = options || {};
    this.pattern = pattern;
    this.history = [];
    this.tokens = {};
    this.init(pattern);
  };

  /**
   * Initialize defaults
   */

  Glob.prototype.init = function(pattern) {
    this.orig = pattern;
    this.negated = this.isNegated();
    this.options.track = this.options.track || false;
    this.options.makeRe = true;
  };

  /**
   * Push a change into `glob.history`. Useful
   * for debugging.
   */

  Glob.prototype.track = function(msg) {
    if (this.options.track) {
      this.history.push({msg: msg, pattern: this.pattern});
    }
  };

  /**
   * Return true if `glob.pattern` was negated
   * with `!`, also remove the `!` from the pattern.
   *
   * @return {Boolean}
   */

  Glob.prototype.isNegated = function() {
    if (this.pattern.charCodeAt(0) === 33 /* '!' */) {
      this.pattern = this.pattern.slice(1);
      return true;
    }
    return false;
  };

  /**
   * Expand braces in the given glob pattern.
   *
   * We only need to use the [braces] lib when
   * patterns are nested.
   */

  Glob.prototype.braces = function() {
    if (this.options.nobraces !== true && this.options.nobrace !== true) {
      // naive/fast check for imbalanced characters
      var a = this.pattern.match(/[\{\(\[]/g);
      var b = this.pattern.match(/[\}\)\]]/g);

      // if imbalanced, don't optimize the pattern
      if (a && b && (a.length !== b.length)) {
        this.options.makeRe = false;
      }

      // expand brace patterns and join the resulting array
      var expanded = utils_1.braces(this.pattern, this.options);
      this.pattern = expanded.join('|');
    }
  };

  /**
   * Expand bracket expressions in `glob.pattern`
   */

  Glob.prototype.brackets = function() {
    if (this.options.nobrackets !== true) {
      this.pattern = utils_1.brackets(this.pattern);
    }
  };

  /**
   * Expand bracket expressions in `glob.pattern`
   */

  Glob.prototype.extglob = function() {
    if (this.options.noextglob === true) { return; }

    if (utils_1.isExtglob(this.pattern)) {
      this.pattern = utils_1.extglob(this.pattern, {escape: true});
    }
  };

  /**
   * Parse the given pattern
   */

  Glob.prototype.parse = function(pattern) {
    this.tokens = utils_1.parseGlob(pattern || this.pattern, true);
    return this.tokens;
  };

  /**
   * Replace `a` with `b`. Also tracks the change before and
   * after each replacement. This is disabled by default, but
   * can be enabled by setting `options.track` to true.
   *
   * Also, when the pattern is a string, `.split()` is used,
   * because it's much faster than replace.
   *
   * @param  {RegExp|String} `a`
   * @param  {String} `b`
   * @param  {Boolean} `escape` When `true`, escapes `*` and `?` in the replacement.
   * @return {String}
   */

  Glob.prototype._replace = function(a, b, escape) {
    this.track('before (find): "' + a + '" (replace with): "' + b + '"');
    if (escape) { b = esc(b); }
    if (a && b && typeof a === 'string') {
      this.pattern = this.pattern.split(a).join(b);
    } else {
      this.pattern = this.pattern.replace(a, b);
    }
    this.track('after');
  };

  /**
   * Escape special characters in the given string.
   *
   * @param  {String} `str` Glob pattern
   * @return {String}
   */

  Glob.prototype.escape = function(str) {
    this.track('before escape: ');
    var re = /["\\](['"]?[^"'\\]['"]?)/g;

    this.pattern = str.replace(re, function($0, $1) {
      var o = chars_1.ESC;
      var ch = o && o[$1];
      if (ch) {
        return ch;
      }
      if (/[a-z]/i.test($0)) {
        return $0.split('\\').join('');
      }
      return $0;
    });

    this.track('after escape: ');
  };

  /**
   * Unescape special characters in the given string.
   *
   * @param  {String} `str`
   * @return {String}
   */

  Glob.prototype.unescape = function(str) {
    var re = /__([A-Z]+)_([A-Z]+)__/g;
    this.pattern = str.replace(re, function($0, $1) {
      return chars_1[$1][$0];
    });
    this.pattern = unesc(this.pattern);
  };

  /**
   * Escape/unescape utils
   */

  function esc(str) {
    str = str.split('?').join('%~');
    str = str.split('*').join('%%');
    return str;
  }

  function unesc(str) {
    str = str.split('%~').join('?');
    str = str.split('%%').join('*');
    return str;
  }
  });

  /**
   * Expose `expand`
   */

  var expand_1 = expand;

  /**
   * Expand a glob pattern to resolve braces and
   * similar patterns before converting to regex.
   *
   * @param  {String|Array} `pattern`
   * @param  {Array} `files`
   * @param  {Options} `opts`
   * @return {Array}
   */

  function expand(pattern, options) {
    if (typeof pattern !== 'string') {
      throw new TypeError('micromatch.expand(): argument should be a string.');
    }

    var glob$$1 = new glob(pattern, options || {});
    var opts = glob$$1.options;

    if (!utils_1.isGlob(pattern)) {
      glob$$1.pattern = glob$$1.pattern.replace(/([\/.])/g, '\\$1');
      return glob$$1;
    }

    glob$$1.pattern = glob$$1.pattern.replace(/(\+)(?!\()/g, '\\$1');
    glob$$1.pattern = glob$$1.pattern.split('$').join('\\$');

    if (typeof opts.braces !== 'boolean' && typeof opts.nobraces !== 'boolean') {
      opts.braces = true;
    }

    if (glob$$1.pattern === '.*') {
      return {
        pattern: '\\.' + star,
        tokens: tok,
        options: opts
      };
    }

    if (glob$$1.pattern === '*') {
      return {
        pattern: oneStar(opts.dot),
        tokens: tok,
        options: opts
      };
    }

    // parse the glob pattern into tokens
    glob$$1.parse();
    var tok = glob$$1.tokens;
    tok.is.negated = opts.negated;

    // dotfile handling
    if ((opts.dotfiles === true || tok.is.dotfile) && opts.dot !== false) {
      opts.dotfiles = true;
      opts.dot = true;
    }

    if ((opts.dotdirs === true || tok.is.dotdir) && opts.dot !== false) {
      opts.dotdirs = true;
      opts.dot = true;
    }

    // check for braces with a dotfile pattern
    if (/[{,]\./.test(glob$$1.pattern)) {
      opts.makeRe = false;
      opts.dot = true;
    }

    if (opts.nonegate !== true) {
      opts.negated = glob$$1.negated;
    }

    // if the leading character is a dot or a slash, escape it
    if (glob$$1.pattern.charAt(0) === '.' && glob$$1.pattern.charAt(1) !== '/') {
      glob$$1.pattern = '\\' + glob$$1.pattern;
    }

    /**
     * Extended globs
     */

    // expand braces, e.g `{1..5}`
    glob$$1.track('before braces');
    if (tok.is.braces) {
      glob$$1.braces();
    }
    glob$$1.track('after braces');

    // expand extglobs, e.g `foo/!(a|b)`
    glob$$1.track('before extglob');
    if (tok.is.extglob) {
      glob$$1.extglob();
    }
    glob$$1.track('after extglob');

    // expand brackets, e.g `[[:alpha:]]`
    glob$$1.track('before brackets');
    if (tok.is.brackets) {
      glob$$1.brackets();
    }
    glob$$1.track('after brackets');

    // special patterns
    glob$$1._replace('[!', '[^');
    glob$$1._replace('(?', '(%~');
    glob$$1._replace(/\[\]/, '\\[\\]');
    glob$$1._replace('/[', '/' + (opts.dot ? dotfiles : nodot) + '[', true);
    glob$$1._replace('/?', '/' + (opts.dot ? dotfiles : nodot) + '[^/]', true);
    glob$$1._replace('/.', '/(?=.)\\.', true);

    // windows drives
    glob$$1._replace(/^(\w):([\\\/]+?)/gi, '(?=.)$1:$2', true);

    // negate slashes in exclusion ranges
    if (glob$$1.pattern.indexOf('[^') !== -1) {
      glob$$1.pattern = negateSlash(glob$$1.pattern);
    }

    if (opts.globstar !== false && glob$$1.pattern === '**') {
      glob$$1.pattern = globstar(opts.dot);

    } else {
      glob$$1.pattern = balance(glob$$1.pattern, '[', ']');
      glob$$1.escape(glob$$1.pattern);

      // if the pattern has `**`
      if (tok.is.globstar) {
        glob$$1.pattern = collapse(glob$$1.pattern, '/**');
        glob$$1.pattern = collapse(glob$$1.pattern, '**/');
        glob$$1._replace('/**/', '(?:/' + globstar(opts.dot) + '/|/)', true);
        glob$$1._replace(/\*{2,}/g, '**');

        // 'foo/*'
        glob$$1._replace(/(\w+)\*(?!\/)/g, '$1[^/]*?', true);
        glob$$1._replace(/\*\*\/\*(\w)/g, globstar(opts.dot) + '\\/' + (opts.dot ? dotfiles : nodot) + '[^/]*?$1', true);

        if (opts.dot !== true) {
          glob$$1._replace(/\*\*\/(.)/g, '(?:**\\/|)$1');
        }

        // 'foo/**' or '{**,*}', but not 'foo**'
        if (tok.path.dirname !== '' || /,\*\*|\*\*,/.test(glob$$1.orig)) {
          glob$$1._replace('**', globstar(opts.dot), true);
        }
      }

      // ends with /*
      glob$$1._replace(/\/\*$/, '\\/' + oneStar(opts.dot), true);
      // ends with *, no slashes
      glob$$1._replace(/(?!\/)\*$/, star, true);
      // has 'n*.' (partial wildcard w/ file extension)
      glob$$1._replace(/([^\/]+)\*/, '$1' + oneStar(true), true);
      // has '*'
      glob$$1._replace('*', oneStar(opts.dot), true);
      glob$$1._replace('?.', '?\\.', true);
      glob$$1._replace('?:', '?:', true);

      glob$$1._replace(/\?+/g, function(match) {
        var len = match.length;
        if (len === 1) {
          return qmark;
        }
        return qmark + '{' + len + '}';
      });

      // escape '.abc' => '\\.abc'
      glob$$1._replace(/\.([*\w]+)/g, '\\.$1');
      // fix '[^\\\\/]'
      glob$$1._replace(/\[\^[\\\/]+\]/g, qmark);
      // '///' => '\/'
      glob$$1._replace(/\/+/g, '\\/');
      // '\\\\\\' => '\\'
      glob$$1._replace(/\\{2,}/g, '\\');
    }

    // unescape previously escaped patterns
    glob$$1.unescape(glob$$1.pattern);
    glob$$1._replace('__UNESC_STAR__', '*');

    // escape dots that follow qmarks
    glob$$1._replace('?.', '?\\.');

    // remove unnecessary slashes in character classes
    glob$$1._replace('[^\\/]', qmark);

    if (glob$$1.pattern.length > 1) {
      if (/^[\[?*]/.test(glob$$1.pattern)) {
        // only prepend the string if we don't want to match dotfiles
        glob$$1.pattern = (opts.dot ? dotfiles : nodot) + glob$$1.pattern;
      }
    }

    return glob$$1;
  }

  /**
   * Collapse repeated character sequences.
   *
   * ```js
   * collapse('a/../../../b', '../');
   * //=> 'a/../b'
   * ```
   *
   * @param  {String} `str`
   * @param  {String} `ch` Character sequence to collapse
   * @return {String}
   */

  function collapse(str, ch) {
    var res = str.split(ch);
    var isFirst = res[0] === '';
    var isLast = res[res.length - 1] === '';
    res = res.filter(Boolean);
    if (isFirst) { res.unshift(''); }
    if (isLast) { res.push(''); }
    return res.join(ch);
  }

  /**
   * Negate slashes in exclusion ranges, per glob spec:
   *
   * ```js
   * negateSlash('[^foo]');
   * //=> '[^\\/foo]'
   * ```
   *
   * @param  {String} `str` glob pattern
   * @return {String}
   */

  function negateSlash(str) {
    return str.replace(/\[\^([^\]]*?)\]/g, function(match, inner) {
      if (inner.indexOf('/') === -1) {
        inner = '\\/' + inner;
      }
      return '[^' + inner + ']';
    });
  }

  /**
   * Escape imbalanced braces/bracket. This is a very
   * basic, naive implementation that only does enough
   * to serve the purpose.
   */

  function balance(str, a, b) {
    var aarr = str.split(a);
    var alen = aarr.join('').length;
    var blen = str.split(b).join('').length;

    if (alen !== blen) {
      str = aarr.join('\\' + a);
      return str.split(b).join('\\' + b);
    }
    return str;
  }

  /**
   * Special patterns to be converted to regex.
   * Heuristics are used to simplify patterns
   * and speed up processing.
   */

  /* eslint no-multi-spaces: 0 */
  var qmark       = '[^/]';
  var star        = qmark + '*?';
  var nodot       = '(?!\\.)(?=.)';
  var dotfileGlob = '(?:\\/|^)\\.{1,2}($|\\/)';
  var dotfiles    = '(?!' + dotfileGlob + ')(?=.)';
  var twoStarDot  = '(?:(?!' + dotfileGlob + ').)*?';

  /**
   * Create a regex for `*`.
   *
   * If `dot` is true, or the pattern does not begin with
   * a leading star, then return the simpler regex.
   */

  function oneStar(dotfile) {
    return dotfile ? '(?!' + dotfileGlob + ')(?=.)' + star : (nodot + star);
  }

  function globstar(dotfile) {
    if (dotfile) { return twoStarDot; }
    return '(?:(?!(?:\\/|^)\\.).)*?';
  }

  /**
   * The main function. Pass an array of filepaths,
   * and a string or array of glob patterns
   *
   * @param  {Array|String} `files`
   * @param  {Array|String} `patterns`
   * @param  {Object} `opts`
   * @return {Array} Array of matches
   */

  function micromatch(files, patterns, opts) {
    if (!files || !patterns) { return []; }
    opts = opts || {};

    if (typeof opts.cache === 'undefined') {
      opts.cache = true;
    }

    if (!Array.isArray(patterns)) {
      return match(files, patterns, opts);
    }

    var len = patterns.length, i = 0;
    var omit = [], keep = [];

    while (len--) {
      var glob = patterns[i++];
      if (typeof glob === 'string' && glob.charCodeAt(0) === 33 /* ! */) {
        omit.push.apply(omit, match(files, glob.slice(1), opts));
      } else {
        keep.push.apply(keep, match(files, glob, opts));
      }
    }
    return utils_1.diff(keep, omit);
  }

  /**
   * Return an array of files that match the given glob pattern.
   *
   * This function is called by the main `micromatch` function If you only
   * need to pass a single pattern you might get very minor speed improvements
   * using this function.
   *
   * @param  {Array} `files`
   * @param  {String} `pattern`
   * @param  {Object} `options`
   * @return {Array}
   */

  function match(files, pattern, opts) {
    if (utils_1.typeOf(files) !== 'string' && !Array.isArray(files)) {
      throw new Error(msg('match', 'files', 'a string or array'));
    }

    files = utils_1.arrayify(files);
    opts = opts || {};

    var negate = opts.negate || false;
    var orig = pattern;

    if (typeof pattern === 'string') {
      negate = pattern.charAt(0) === '!';
      if (negate) {
        pattern = pattern.slice(1);
      }

      // we need to remove the character regardless,
      // so the above logic is still needed
      if (opts.nonegate === true) {
        negate = false;
      }
    }

    var _isMatch = matcher(pattern, opts);
    var len = files.length, i = 0;
    var res = [];

    while (i < len) {
      var file = files[i++];
      var fp = utils_1.unixify(file, opts);

      if (!_isMatch(fp)) { continue; }
      res.push(fp);
    }

    if (res.length === 0) {
      if (opts.failglob === true) {
        throw new Error('micromatch.match() found no matches for: "' + orig + '".');
      }

      if (opts.nonull || opts.nullglob) {
        res.push(utils_1.unescapeGlob(orig));
      }
    }

    // if `negate` was defined, diff negated files
    if (negate) { res = utils_1.diff(files, res); }

    // if `ignore` was defined, diff ignored filed
    if (opts.ignore && opts.ignore.length) {
      pattern = opts.ignore;
      opts = utils_1.omit(opts, ['ignore']);
      res = utils_1.diff(res, micromatch(res, pattern, opts));
    }

    if (opts.nodupes) {
      return utils_1.unique(res);
    }
    return res;
  }

  /**
   * Returns a function that takes a glob pattern or array of glob patterns
   * to be used with `Array#filter()`. (Internally this function generates
   * the matching function using the [matcher] method).
   *
   * ```js
   * var fn = mm.filter('[a-c]');
   * ['a', 'b', 'c', 'd', 'e'].filter(fn);
   * //=> ['a', 'b', 'c']
   * ```
   * @param  {String|Array} `patterns` Can be a glob or array of globs.
   * @param  {Options} `opts` Options to pass to the [matcher] method.
   * @return {Function} Filter function to be passed to `Array#filter()`.
   */

  function filter$1(patterns, opts) {
    if (!Array.isArray(patterns) && typeof patterns !== 'string') {
      throw new TypeError(msg('filter', 'patterns', 'a string or array'));
    }

    patterns = utils_1.arrayify(patterns);
    var len = patterns.length, i = 0;
    var patternMatchers = Array(len);
    while (i < len) {
      patternMatchers[i] = matcher(patterns[i++], opts);
    }

    return function(fp) {
      if (fp == null) { return []; }
      var len = patternMatchers.length, i = 0;
      var res = true;

      fp = utils_1.unixify(fp, opts);
      while (i < len) {
        var fn = patternMatchers[i++];
        if (!fn(fp)) {
          res = false;
          break;
        }
      }
      return res;
    };
  }

  /**
   * Returns true if the filepath contains the given
   * pattern. Can also return a function for matching.
   *
   * ```js
   * isMatch('foo.md', '*.md', {});
   * //=> true
   *
   * isMatch('*.md', {})('foo.md')
   * //=> true
   * ```
   * @param  {String} `fp`
   * @param  {String} `pattern`
   * @param  {Object} `opts`
   * @return {Boolean}
   */

  function isMatch(fp, pattern, opts) {
    if (typeof fp !== 'string') {
      throw new TypeError(msg('isMatch', 'filepath', 'a string'));
    }

    fp = utils_1.unixify(fp, opts);
    if (utils_1.typeOf(pattern) === 'object') {
      return matcher(fp, pattern);
    }
    return matcher(pattern, opts)(fp);
  }

  /**
   * Returns true if the filepath matches the
   * given pattern.
   */

  function contains(fp, pattern, opts) {
    if (typeof fp !== 'string') {
      throw new TypeError(msg('contains', 'pattern', 'a string'));
    }

    opts = opts || {};
    opts.contains = (pattern !== '');
    fp = utils_1.unixify(fp, opts);

    if (opts.contains && !utils_1.isGlob(pattern)) {
      return fp.indexOf(pattern) !== -1;
    }
    return matcher(pattern, opts)(fp);
  }

  /**
   * Returns true if a file path matches any of the
   * given patterns.
   *
   * @param  {String} `fp` The filepath to test.
   * @param  {String|Array} `patterns` Glob patterns to use.
   * @param  {Object} `opts` Options to pass to the `matcher()` function.
   * @return {String}
   */

  function any(fp, patterns, opts) {
    if (!Array.isArray(patterns) && typeof patterns !== 'string') {
      throw new TypeError(msg('any', 'patterns', 'a string or array'));
    }

    patterns = utils_1.arrayify(patterns);
    var len = patterns.length;

    fp = utils_1.unixify(fp, opts);
    while (len--) {
      var isMatch = matcher(patterns[len], opts);
      if (isMatch(fp)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Filter the keys of an object with the given `glob` pattern
   * and `options`
   *
   * @param  {Object} `object`
   * @param  {Pattern} `object`
   * @return {Array}
   */

  function matchKeys(obj, glob, options) {
    if (utils_1.typeOf(obj) !== 'object') {
      throw new TypeError(msg('matchKeys', 'first argument', 'an object'));
    }

    var fn = matcher(glob, options);
    var res = {};

    for (var key in obj) {
      if (obj.hasOwnProperty(key) && fn(key)) {
        res[key] = obj[key];
      }
    }
    return res;
  }

  /**
   * Return a function for matching based on the
   * given `pattern` and `options`.
   *
   * @param  {String} `pattern`
   * @param  {Object} `options`
   * @return {Function}
   */

  function matcher(pattern, opts) {
    // pattern is a function
    if (typeof pattern === 'function') {
      return pattern;
    }
    // pattern is a regex
    if (pattern instanceof RegExp) {
      return function(fp) {
        return pattern.test(fp);
      };
    }

    if (typeof pattern !== 'string') {
      throw new TypeError(msg('matcher', 'pattern', 'a string, regex, or function'));
    }

    // strings, all the way down...
    pattern = utils_1.unixify(pattern, opts);

    // pattern is a non-glob string
    if (!utils_1.isGlob(pattern)) {
      return utils_1.matchPath(pattern, opts);
    }
    // pattern is a glob string
    var re = makeRe(pattern, opts);

    // `matchBase` is defined
    if (opts && opts.matchBase) {
      return utils_1.hasFilename(re, opts);
    }
    // `matchBase` is not defined
    return function(fp) {
      fp = utils_1.unixify(fp, opts);
      return re.test(fp);
    };
  }

  /**
   * Create and cache a regular expression for matching
   * file paths.
   *
   * If the leading character in the `glob` is `!`, a negation
   * regex is returned.
   *
   * @param  {String} `glob`
   * @param  {Object} `options`
   * @return {RegExp}
   */

  function toRegex$1(glob, options) {
    // clone options to prevent  mutating the original object
    var opts = Object.create(options || {});
    var flags = opts.flags || '';
    if (opts.nocase && flags.indexOf('i') === -1) {
      flags += 'i';
    }

    var parsed = expand_1(glob, opts);

    // pass in tokens to avoid parsing more than once
    opts.negated = opts.negated || parsed.negated;
    opts.negate = opts.negated;
    glob = wrapGlob(parsed.pattern, opts);
    var re;

    try {
      re = new RegExp(glob, flags);
      return re;
    } catch (err) {
      err.reason = 'micromatch invalid regex: (' + re + ')';
      if (opts.strict) { throw new SyntaxError(err); }
    }

    // we're only here if a bad pattern was used and the user
    // passed `options.silent`, so match nothing
    return /$^/;
  }

  /**
   * Create the regex to do the matching. If the leading
   * character in the `glob` is `!` a negation regex is returned.
   *
   * @param {String} `glob`
   * @param {Boolean} `negate`
   */

  function wrapGlob(glob, opts) {
    var prefix = (opts && !opts.contains) ? '^' : '';
    var after = (opts && !opts.contains) ? '$' : '';
    glob = ('(?:' + glob + ')' + after);
    if (opts && opts.negate) {
      return prefix + ('(?!^' + glob + ').*$');
    }
    return prefix + glob;
  }

  /**
   * Create and cache a regular expression for matching file paths.
   * If the leading character in the `glob` is `!`, a negation
   * regex is returned.
   *
   * @param  {String} `glob`
   * @param  {Object} `options`
   * @return {RegExp}
   */

  function makeRe(glob, opts) {
    if (utils_1.typeOf(glob) !== 'string') {
      throw new Error(msg('makeRe', 'glob', 'a string'));
    }
    return utils_1.cache(toRegex$1, glob, opts);
  }

  /**
   * Make error messages consistent. Follows this format:
   *
   * ```js
   * msg(methodName, argNumber, nativeType);
   * // example:
   * msg('matchKeys', 'first', 'an object');
   * ```
   *
   * @param  {String} `method`
   * @param  {String} `num`
   * @param  {String} `type`
   * @return {String}
   */

  function msg(method, what, type) {
    return 'micromatch.' + method + '(): ' + what + ' should be ' + type + '.';
  }

  /**
   * Public methods
   */

  /* eslint no-multi-spaces: 0 */
  micromatch.any       = any;
  micromatch.braces    = micromatch.braceExpand = utils_1.braces;
  micromatch.contains  = contains;
  micromatch.expand    = expand_1;
  micromatch.filter    = filter$1;
  micromatch.isMatch   = isMatch;
  micromatch.makeRe    = makeRe;
  micromatch.match     = match;
  micromatch.matcher   = matcher;
  micromatch.matchKeys = matchKeys;

  /**
   * Expose `micromatch`
   */

  var micromatch_1 = micromatch;

  var blockDeclarations = {
  	'const': true,
  	'let': true
  };

  var extractors = {
  	Identifier: function Identifier ( names, param ) {
  		names.push( param.name );
  	},

  	ObjectPattern: function ObjectPattern ( names, param ) {
  		param.properties.forEach( function (prop) {
  			extractors[ prop.key.type ]( names, prop.key );
  		});
  	},

  	ArrayPattern: function ArrayPattern ( names, param ) {
  		param.elements.forEach( function (element) {
  			if ( element ) { extractors[ element.type ]( names, element ); }
  		});
  	},

  	RestElement: function RestElement ( names, param ) {
  		extractors[ param.argument.type ]( names, param.argument );
  	},

  	AssignmentPattern: function AssignmentPattern ( names, param ) {
  		return extractors[ param.left.type ]( names, param.left );
  	}
  };

  function extractNames ( param ) {
  	var names = [];

  	extractors[ param.type ]( names, param );
  	return names;
  }

  var Scope = function Scope ( options ) {
  	var this$1 = this;

  	options = options || {};

  	this.parent = options.parent;
  	this.isBlockScope = !!options.block;

  	this.declarations = Object.create( null );

  	if ( options.params ) {
  		options.params.forEach( function (param) {
  			extractNames( param ).forEach( function (name) {
  				this$1.declarations[ name ] = true;
  			});
  		});
  	}
  };

  Scope.prototype.addDeclaration = function addDeclaration ( node, isBlockDeclaration, isVar ) {
  		var this$1 = this;

  	if ( !isBlockDeclaration && this.isBlockScope ) {
  		// it's a `var` or function node, and this
  		// is a block scope, so we need to go up
  		this.parent.addDeclaration( node, isBlockDeclaration, isVar );
  	} else {
  		extractNames( node.id ).forEach( function (name) {
  			this$1.declarations[ name ] = true;
  		});
  	}
  };

  Scope.prototype.contains = function contains ( name ) {
  	return this.declarations[ name ] ||
  		       ( this.parent ? this.parent.contains( name ) : false );
  };


  function attachScopes ( ast, propertyName ) {
  	if ( propertyName === void 0 ) { propertyName = 'scope'; }

  	var scope = new Scope();

  	walk( ast, {
  		enter: function enter ( node, parent ) {
  			// function foo () {...}
  			// class Foo {...}
  			if ( /(Function|Class)Declaration/.test( node.type ) ) {
  				scope.addDeclaration( node, false, false );
  			}

  			// var foo = 1
  			if ( node.type === 'VariableDeclaration' ) {
  				var isBlockDeclaration = blockDeclarations[ node.kind ];

  				node.declarations.forEach( function (declaration) {
  					scope.addDeclaration( declaration, isBlockDeclaration, true );
  				});
  			}

  			var newScope;

  			// create new function scope
  			if ( /Function/.test( node.type ) ) {
  				newScope = new Scope({
  					parent: scope,
  					block: false,
  					params: node.params
  				});

  				// named function expressions - the name is considered
  				// part of the function's scope
  				if ( node.type === 'FunctionExpression' && node.id ) {
  					newScope.addDeclaration( node, false, false );
  				}
  			}

  			// create new block scope
  			if ( node.type === 'BlockStatement' && !/Function/.test( parent.type ) ) {
  				newScope = new Scope({
  					parent: scope,
  					block: true
  				});
  			}

  			// catch clause has its own block scope
  			if ( node.type === 'CatchClause' ) {
  				newScope = new Scope({
  					parent: scope,
  					params: [ node.param ],
  					block: true
  				});
  			}

  			if ( newScope ) {
  				Object.defineProperty( node, propertyName, {
  					value: newScope,
  					configurable: true
  				});

  				scope = newScope;
  			}
  		},
  		leave: function leave ( node ) {
  			if ( node[ propertyName ] ) { scope = scope.parent; }
  		}
  	});

  	return scope;
  }

  function ensureArray ( thing ) {
  	if ( Array.isArray( thing ) ) { return thing; }
  	if ( thing == undefined ) { return []; }
  	return [ thing ];
  }

  function createFilter ( include, exclude ) {
  	var getMatcher = function (id) { return ( isRegexp( id ) ? id : { test: micromatch_1.matcher( resolve( id ) ) } ); };
  	include = ensureArray( include ).map( getMatcher );
  	exclude = ensureArray( exclude ).map( getMatcher );

  	return function ( id ) {

  		if ( typeof id !== 'string' ) { return false; }
  		if ( /\0/.test( id ) ) { return false; }

  		id = id.split( sep ).join( '/' );

  		for ( var i = 0; i < exclude.length; ++i ) {
  			var matcher = exclude[i];
  			if ( matcher.test( id ) ) { return false; }
  		}

  		for ( var i$1 = 0; i$1 < include.length; ++i$1 ) {
  			var matcher$1 = include[i$1];
  			if ( matcher$1.test( id ) ) { return true; }
  		}

  		return !include.length;
  	};
  }

  function isRegexp ( val ) {
  	return val instanceof RegExp;
  }

  var reservedWords = 'break case class catch const continue debugger default delete do else export extends finally for function if import in instanceof let new return super switch this throw try typeof var void while with yield enum await implements package protected static interface private public'.split( ' ' );
  var builtins = 'arguments Infinity NaN undefined null true false eval uneval isFinite isNaN parseFloat parseInt decodeURI decodeURIComponent encodeURI encodeURIComponent escape unescape Object Function Boolean Symbol Error EvalError InternalError RangeError ReferenceError SyntaxError TypeError URIError Number Math Date String RegExp Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array Map Set WeakMap WeakSet SIMD ArrayBuffer DataView JSON Promise Generator GeneratorFunction Reflect Proxy Intl'.split( ' ' );

  var blacklisted = Object.create( null );
  reservedWords.concat( builtins ).forEach( function (word) { return blacklisted[ word ] = true; } );

  function makeLegalIdentifier ( str ) {
  	str = str
  		.replace( /-(\w)/g, function ( _, letter ) { return letter.toUpperCase(); } )
  		.replace( /[^$_a-zA-Z0-9]/g, '_' );

  	if ( /\d/.test( str[0] ) || blacklisted[ str ] ) { str = "_" + str; }

  	return str;
  }

  var HELPERS_ID = '\0commonjsHelpers';

  var HELPERS = "\nexport var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};\n\nexport function commonjsRequire () {\n\tthrow new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');\n}\n\nexport function unwrapExports (x) {\n\treturn x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;\n}\n\nexport function createCommonjsModule(fn, module) {\n\treturn module = { exports: {} }, fn(module, module.exports), module.exports;\n}";

  var PREFIX = '\0commonjs-proxy:';
  var EXTERNAL = '\0commonjs-external:';

  function isFile ( file ) {
  	try {
  		var stats = fs.statSync( file );
  		return stats.isFile();
  	} catch ( err ) {
  		return false;
  	}
  }

  function addJsExtensionIfNecessary ( file ) {
  	if ( isFile( file ) ) { return file; }

  	file += '.js';
  	if ( isFile( file ) ) { return file; }

  	return null;
  }

  var absolutePath = /^(?:\/|(?:[A-Za-z]:)?[\\|/])/;

  function isAbsolute ( path ) {
  	return absolutePath.test( path );
  }

  function defaultResolver ( importee, importer ) {
  	// absolute paths are left untouched
  	if ( isAbsolute( importee ) ) { return addJsExtensionIfNecessary( resolve( importee ) ); }

  	// if this is the entry point, resolve against cwd
  	if ( importer === undefined ) { return addJsExtensionIfNecessary( resolve( './', importee ) ); }

  	// external modules are skipped at this stage
  	if ( importee[0] !== '.' ) { return null; }

  	return addJsExtensionIfNecessary( resolve( dirname( importer ), importee ) );
  }

  function walk$1 ( ast, ref) {
  	var enter = ref.enter;
  	var leave = ref.leave;

  	visit$1( ast, null, enter, leave );
  }

  var shouldSkip = false;
  var context$1 = { skip: function () { return shouldSkip = true; } };

  var childKeys$1 = {};

  var toString$5 = Object.prototype.toString;

  function isArray$1 ( thing ) {
  	return toString$5.call( thing ) === '[object Array]';
  }

  function visit$1 ( node, parent, enter, leave, prop, index ) {
  	if ( !node ) { return; }

  	if ( enter ) {
  		var _shouldSkip = shouldSkip;
  		shouldSkip = false;
  		enter.call( context$1, node, parent, prop, index );
  		var skipped = shouldSkip;
  		shouldSkip = _shouldSkip;

  		if ( skipped ) { return; }
  	}

  	var keys = childKeys$1[ node.type ] || (
  		childKeys$1[ node.type ] = Object.keys( node ).filter( function (key) { return typeof node[ key ] === 'object'; } )
  	);

  	for ( var i = 0; i < keys.length; i += 1 ) {
  		var key = keys[i];
  		var value = node[ key ];

  		if ( isArray$1( value ) ) {
  			for ( var j = 0; j < value.length; j += 1 ) {
  				visit$1( value[j], node, enter, leave, key, j );
  			}
  		}

  		else if ( value && value.type ) {
  			visit$1( value, node, enter, leave, key, null );
  		}
  	}

  	if ( leave ) {
  		leave( node, parent, prop, index );
  	}
  }

  var integerToChar = {};

  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split( '' ).forEach( function ( char, i ) {
  	integerToChar[ i ] = char;
  });

  function encode ( value ) {
  	var result;

  	if ( typeof value === 'number' ) {
  		result = encodeInteger( value );
  	} else {
  		result = '';
  		for ( var i = 0; i < value.length; i += 1 ) {
  			result += encodeInteger( value[i] );
  		}
  	}

  	return result;
  }

  function encodeInteger ( num ) {
  	var result = '';

  	if ( num < 0 ) {
  		num = ( -num << 1 ) | 1;
  	} else {
  		num <<= 1;
  	}

  	do {
  		var clamped = num & 31;
  		num >>= 5;

  		if ( num > 0 ) {
  			clamped |= 32;
  		}

  		result += integerToChar[ clamped ];
  	} while ( num > 0 );

  	return result;
  }

  function Chunk ( start, end, content ) {
  	this.start = start;
  	this.end = end;
  	this.original = content;

  	this.intro = '';
  	this.outro = '';

  	this.content = content;
  	this.storeName = false;
  	this.edited = false;

  	// we make these non-enumerable, for sanity while debugging
  	Object.defineProperties( this, {
  		previous: { writable: true, value: null },
  		next: { writable: true, value: null }
  	});
  }

  Chunk.prototype = {
  	appendLeft: function appendLeft ( content ) {
  		this.outro += content;
  	},

  	appendRight: function appendRight ( content ) {
  		this.intro = this.intro + content;
  	},

  	clone: function clone () {
  		var chunk = new Chunk( this.start, this.end, this.original );

  		chunk.intro = this.intro;
  		chunk.outro = this.outro;
  		chunk.content = this.content;
  		chunk.storeName = this.storeName;
  		chunk.edited = this.edited;

  		return chunk;
  	},

  	contains: function contains ( index ) {
  		return this.start < index && index < this.end;
  	},

  	eachNext: function eachNext ( fn ) {
  		var chunk = this;
  		while ( chunk ) {
  			fn( chunk );
  			chunk = chunk.next;
  		}
  	},

  	eachPrevious: function eachPrevious ( fn ) {
  		var chunk = this;
  		while ( chunk ) {
  			fn( chunk );
  			chunk = chunk.previous;
  		}
  	},

  	edit: function edit ( content, storeName, contentOnly ) {
  		this.content = content;
  		if ( !contentOnly ) {
  			this.intro = '';
  			this.outro = '';
  		}
  		this.storeName = storeName;

  		this.edited = true;

  		return this;
  	},

  	prependLeft: function prependLeft ( content ) {
  		this.outro = content + this.outro;
  	},

  	prependRight: function prependRight ( content ) {
  		this.intro = content + this.intro;
  	},

  	split: function split ( index ) {
  		var sliceIndex = index - this.start;

  		var originalBefore = this.original.slice( 0, sliceIndex );
  		var originalAfter = this.original.slice( sliceIndex );

  		this.original = originalBefore;

  		var newChunk = new Chunk( index, this.end, originalAfter );
  		newChunk.outro = this.outro;
  		this.outro = '';

  		this.end = index;

  		if ( this.edited ) {
  			// TODO is this block necessary?...
  			newChunk.edit( '', false );
  			this.content = '';
  		} else {
  			this.content = originalBefore;
  		}

  		newChunk.next = this.next;
  		if ( newChunk.next ) { newChunk.next.previous = newChunk; }
  		newChunk.previous = this;
  		this.next = newChunk;

  		return newChunk;
  	},

  	toString: function toString () {
  		return this.intro + this.content + this.outro;
  	},

  	trimEnd: function trimEnd ( rx ) {
  		this.outro = this.outro.replace( rx, '' );
  		if ( this.outro.length ) { return true; }

  		var trimmed = this.content.replace( rx, '' );

  		if ( trimmed.length ) {
  			if ( trimmed !== this.content ) {
  				this.split( this.start + trimmed.length ).edit( '', false );
  			}

  			return true;
  		} else {
  			this.edit( '', false );

  			this.intro = this.intro.replace( rx, '' );
  			if ( this.intro.length ) { return true; }
  		}
  	},

  	trimStart: function trimStart ( rx ) {
  		this.intro = this.intro.replace( rx, '' );
  		if ( this.intro.length ) { return true; }

  		var trimmed = this.content.replace( rx, '' );

  		if ( trimmed.length ) {
  			if ( trimmed !== this.content ) {
  				this.split( this.end - trimmed.length );
  				this.edit( '', false );
  			}

  			return true;
  		} else {
  			this.edit( '', false );

  			this.outro = this.outro.replace( rx, '' );
  			if ( this.outro.length ) { return true; }
  		}
  	}
  };

  var _btoa;

  if ( typeof window !== 'undefined' && typeof window.btoa === 'function' ) {
  	_btoa = window.btoa;
  } else if ( typeof Buffer === 'function' ) {
  	_btoa = function (str) { return new Buffer( str ).toString( 'base64' ); };
  } else {
  	_btoa = function () {
  		throw new Error( 'Unsupported environment: `window.btoa` or `Buffer` should be supported.' );
  	};
  }

  var btoa = _btoa;

  function SourceMap ( properties ) {
  	this.version = 3;

  	this.file           = properties.file;
  	this.sources        = properties.sources;
  	this.sourcesContent = properties.sourcesContent;
  	this.names          = properties.names;
  	this.mappings       = properties.mappings;
  }

  SourceMap.prototype = {
  	toString: function toString () {
  		return JSON.stringify( this );
  	},

  	toUrl: function toUrl () {
  		return 'data:application/json;charset=utf-8;base64,' + btoa( this.toString() );
  	}
  };

  function guessIndent ( code ) {
  	var lines = code.split( '\n' );

  	var tabbed = lines.filter( function (line) { return /^\t+/.test( line ); } );
  	var spaced = lines.filter( function (line) { return /^ {2,}/.test( line ); } );

  	if ( tabbed.length === 0 && spaced.length === 0 ) {
  		return null;
  	}

  	// More lines tabbed than spaced? Assume tabs, and
  	// default to tabs in the case of a tie (or nothing
  	// to go on)
  	if ( tabbed.length >= spaced.length ) {
  		return '\t';
  	}

  	// Otherwise, we need to guess the multiple
  	var min = spaced.reduce( function ( previous, current ) {
  		var numSpaces = /^ +/.exec( current )[0].length;
  		return Math.min( numSpaces, previous );
  	}, Infinity );

  	return new Array( min + 1 ).join( ' ' );
  }

  function getRelativePath ( from, to ) {
  	var fromParts = from.split( /[\/\\]/ );
  	var toParts = to.split( /[\/\\]/ );

  	fromParts.pop(); // get dirname

  	while ( fromParts[0] === toParts[0] ) {
  		fromParts.shift();
  		toParts.shift();
  	}

  	if ( fromParts.length ) {
  		var i = fromParts.length;
  		while ( i-- ) { fromParts[i] = '..'; }
  	}

  	return fromParts.concat( toParts ).join( '/' );
  }

  var toString$1$1 = Object.prototype.toString;

  function isObject ( thing ) {
  	return toString$1$1.call( thing ) === '[object Object]';
  }

  function getLocator ( source ) {
  	var originalLines = source.split( '\n' );

  	var start = 0;
  	var lineRanges = originalLines.map( function ( line, i ) {
  		var end = start + line.length + 1;
  		var range = { start: start, end: end, line: i };

  		start = end;
  		return range;
  	});

  	var i = 0;

  	function rangeContains ( range, index ) {
  		return range.start <= index && index < range.end;
  	}

  	function getLocation ( range, index ) {
  		return { line: range.line, column: index - range.start };
  	}

  	return function locate ( index ) {
  		var range = lineRanges[i];

  		var d = index >= range.end ? 1 : -1;

  		while ( range ) {
  			if ( rangeContains( range, index ) ) { return getLocation( range, index ); }

  			i += d;
  			range = lineRanges[i];
  		}
  	};
  }

  function Mappings ( hires ) {
  	var this$1 = this;

  	var offsets = {
  		generatedCodeColumn: 0,
  		sourceIndex: 0,
  		sourceCodeLine: 0,
  		sourceCodeColumn: 0,
  		sourceCodeName: 0
  	};

  	var generatedCodeLine = 0;
  	var generatedCodeColumn = 0;

  	this.raw = [];
  	var rawSegments = this.raw[ generatedCodeLine ] = [];

  	var pending = null;

  	this.addEdit = function ( sourceIndex, content, original, loc, nameIndex ) {
  		if ( content.length ) {
  			rawSegments.push([
  				generatedCodeColumn,
  				sourceIndex,
  				loc.line,
  				loc.column,
  				nameIndex ]);
  		} else if ( pending ) {
  			rawSegments.push( pending );
  		}

  		this$1.advance( content );
  		pending = null;
  	};

  	this.addUneditedChunk = function ( sourceIndex, chunk, original, loc, sourcemapLocations ) {
  		var originalCharIndex = chunk.start;
  		var first = true;

  		while ( originalCharIndex < chunk.end ) {
  			if ( hires || first || sourcemapLocations[ originalCharIndex ] ) {
  				rawSegments.push([
  					generatedCodeColumn,
  					sourceIndex,
  					loc.line,
  					loc.column,
  					-1
  				]);
  			}

  			if ( original[ originalCharIndex ] === '\n' ) {
  				loc.line += 1;
  				loc.column = 0;
  				generatedCodeLine += 1;
  				this$1.raw[ generatedCodeLine ] = rawSegments = [];
  				generatedCodeColumn = 0;
  			} else {
  				loc.column += 1;
  				generatedCodeColumn += 1;
  			}

  			originalCharIndex += 1;
  			first = false;
  		}

  		pending = [
  			generatedCodeColumn,
  			sourceIndex,
  			loc.line,
  			loc.column,
  			-1 ];
  	};

  	this.advance = function (str) {
  		if ( !str ) { return; }

  		var lines = str.split( '\n' );
  		var lastLine = lines.pop();

  		if ( lines.length ) {
  			generatedCodeLine += lines.length;
  			this$1.raw[ generatedCodeLine ] = rawSegments = [];
  			generatedCodeColumn = lastLine.length;
  		} else {
  			generatedCodeColumn += lastLine.length;
  		}
  	};

  	this.encode = function () {
  		return this$1.raw.map( function (segments) {
  			var generatedCodeColumn = 0;

  			return segments.map( function (segment) {
  				var arr = [
  					segment[0] - generatedCodeColumn,
  					segment[1] - offsets.sourceIndex,
  					segment[2] - offsets.sourceCodeLine,
  					segment[3] - offsets.sourceCodeColumn
  				];

  				generatedCodeColumn = segment[0];
  				offsets.sourceIndex = segment[1];
  				offsets.sourceCodeLine = segment[2];
  				offsets.sourceCodeColumn = segment[3];

  				if ( ~segment[4] ) {
  					arr.push( segment[4] - offsets.sourceCodeName );
  					offsets.sourceCodeName = segment[4];
  				}

  				return encode( arr );
  			}).join( ',' );
  		}).join( ';' );
  	};
  }

  var warned = {
  	insertLeft: false,
  	insertRight: false,
  	storeName: false
  };

  function MagicString$1 ( string, options ) {
  	if ( options === void 0 ) { options = {}; }

  	var chunk = new Chunk( 0, string.length, string );

  	Object.defineProperties( this, {
  		original:              { writable: true, value: string },
  		outro:                 { writable: true, value: '' },
  		intro:                 { writable: true, value: '' },
  		firstChunk:            { writable: true, value: chunk },
  		lastChunk:             { writable: true, value: chunk },
  		lastSearchedChunk:     { writable: true, value: chunk },
  		byStart:               { writable: true, value: {} },
  		byEnd:                 { writable: true, value: {} },
  		filename:              { writable: true, value: options.filename },
  		indentExclusionRanges: { writable: true, value: options.indentExclusionRanges },
  		sourcemapLocations:    { writable: true, value: {} },
  		storedNames:           { writable: true, value: {} },
  		indentStr:             { writable: true, value: guessIndent( string ) }
  	});

  	this.byStart[ 0 ] = chunk;
  	this.byEnd[ string.length ] = chunk;
  }

  MagicString$1.prototype = {
  	addSourcemapLocation: function addSourcemapLocation ( char ) {
  		this.sourcemapLocations[ char ] = true;
  	},

  	append: function append ( content ) {
  		if ( typeof content !== 'string' ) { throw new TypeError( 'outro content must be a string' ); }

  		this.outro += content;
  		return this;
  	},

  	appendLeft: function appendLeft ( index, content ) {
  		if ( typeof content !== 'string' ) { throw new TypeError( 'inserted content must be a string' ); }

  		this._split( index );

  		var chunk = this.byEnd[ index ];

  		if ( chunk ) {
  			chunk.appendLeft( content );
  		} else {
  			this.intro += content;
  		}

  		return this;
  	},

  	appendRight: function appendRight ( index, content ) {
  		if ( typeof content !== 'string' ) { throw new TypeError( 'inserted content must be a string' ); }

  		this._split( index );

  		var chunk = this.byStart[ index ];

  		if ( chunk ) {
  			chunk.appendRight( content );
  		} else {
  			this.outro += content;
  		}

  		return this;
  	},

  	clone: function clone () {
  		var cloned = new MagicString$1( this.original, { filename: this.filename });

  		var originalChunk = this.firstChunk;
  		var clonedChunk = cloned.firstChunk = cloned.lastSearchedChunk = originalChunk.clone();

  		while ( originalChunk ) {
  			cloned.byStart[ clonedChunk.start ] = clonedChunk;
  			cloned.byEnd[ clonedChunk.end ] = clonedChunk;

  			var nextOriginalChunk = originalChunk.next;
  			var nextClonedChunk = nextOriginalChunk && nextOriginalChunk.clone();

  			if ( nextClonedChunk ) {
  				clonedChunk.next = nextClonedChunk;
  				nextClonedChunk.previous = clonedChunk;

  				clonedChunk = nextClonedChunk;
  			}

  			originalChunk = nextOriginalChunk;
  		}

  		cloned.lastChunk = clonedChunk;

  		if ( this.indentExclusionRanges ) {
  			cloned.indentExclusionRanges = this.indentExclusionRanges.slice();
  		}

  		Object.keys( this.sourcemapLocations ).forEach( function (loc) {
  			cloned.sourcemapLocations[ loc ] = true;
  		});

  		return cloned;
  	},

  	generateMap: function generateMap ( options ) {
  		var this$1 = this;

  		options = options || {};

  		var sourceIndex = 0;
  		var names = Object.keys( this.storedNames );
  		var mappings = new Mappings( options.hires );

  		var locate = getLocator( this.original );

  		if ( this.intro ) {
  			mappings.advance( this.intro );
  		}

  		this.firstChunk.eachNext( function (chunk) {
  			var loc = locate( chunk.start );

  			if ( chunk.intro.length ) { mappings.advance( chunk.intro ); }

  			if ( chunk.edited ) {
  				mappings.addEdit( sourceIndex, chunk.content, chunk.original, loc, chunk.storeName ? names.indexOf( chunk.original ) : -1 );
  			} else {
  				mappings.addUneditedChunk( sourceIndex, chunk, this$1.original, loc, this$1.sourcemapLocations );
  			}

  			if ( chunk.outro.length ) { mappings.advance( chunk.outro ); }
  		});

  		var map = new SourceMap({
  			file: ( options.file ? options.file.split( /[\/\\]/ ).pop() : null ),
  			sources: [ options.source ? getRelativePath( options.file || '', options.source ) : null ],
  			sourcesContent: options.includeContent ? [ this.original ] : [ null ],
  			names: names,
  			mappings: mappings.encode()
  		});
  		return map;
  	},

  	getIndentString: function getIndentString () {
  		return this.indentStr === null ? '\t' : this.indentStr;
  	},

  	indent: function indent ( indentStr, options ) {
  		var this$1 = this;

  		var pattern = /^[^\r\n]/gm;

  		if ( isObject( indentStr ) ) {
  			options = indentStr;
  			indentStr = undefined;
  		}

  		indentStr = indentStr !== undefined ? indentStr : ( this.indentStr || '\t' );

  		if ( indentStr === '' ) { return this; } // noop

  		options = options || {};

  		// Process exclusion ranges
  		var isExcluded = {};

  		if ( options.exclude ) {
  			var exclusions = typeof options.exclude[0] === 'number' ? [ options.exclude ] : options.exclude;
  			exclusions.forEach( function (exclusion) {
  				for ( var i = exclusion[0]; i < exclusion[1]; i += 1 ) {
  					isExcluded[i] = true;
  				}
  			});
  		}

  		var shouldIndentNextCharacter = options.indentStart !== false;
  		var replacer = function (match) {
  			if ( shouldIndentNextCharacter ) { return ("" + indentStr + match); }
  			shouldIndentNextCharacter = true;
  			return match;
  		};

  		this.intro = this.intro.replace( pattern, replacer );

  		var charIndex = 0;

  		var chunk = this.firstChunk;

  		while ( chunk ) {
  			var end = chunk.end;

  			if ( chunk.edited ) {
  				if ( !isExcluded[ charIndex ] ) {
  					chunk.content = chunk.content.replace( pattern, replacer );

  					if ( chunk.content.length ) {
  						shouldIndentNextCharacter = chunk.content[ chunk.content.length - 1 ] === '\n';
  					}
  				}
  			} else {
  				charIndex = chunk.start;

  				while ( charIndex < end ) {
  					if ( !isExcluded[ charIndex ] ) {
  						var char = this$1.original[ charIndex ];

  						if ( char === '\n' ) {
  							shouldIndentNextCharacter = true;
  						} else if ( char !== '\r' && shouldIndentNextCharacter ) {
  							shouldIndentNextCharacter = false;

  							if ( charIndex === chunk.start ) {
  								chunk.prependRight( indentStr );
  							} else {
  								this$1._splitChunk( chunk, charIndex );
  								chunk = chunk.next;
  								chunk.prependRight( indentStr );
  							}
  						}
  					}

  					charIndex += 1;
  				}
  			}

  			charIndex = chunk.end;
  			chunk = chunk.next;
  		}

  		this.outro = this.outro.replace( pattern, replacer );

  		return this;
  	},

  	insert: function insert () {
  		throw new Error( 'magicString.insert(...) is deprecated. Use prependRight(...) or appendLeft(...)' );
  	},

  	insertLeft: function insertLeft ( index, content ) {
  		if ( !warned.insertLeft ) {
  			console.warn( 'magicString.insertLeft(...) is deprecated. Use magicString.appendLeft(...) instead' ); // eslint-disable-line no-console
  			warned.insertLeft = true;
  		}

  		return this.appendLeft( index, content );
  	},

  	insertRight: function insertRight ( index, content ) {
  		if ( !warned.insertRight ) {
  			console.warn( 'magicString.insertRight(...) is deprecated. Use magicString.prependRight(...) instead' ); // eslint-disable-line no-console
  			warned.insertRight = true;
  		}

  		return this.prependRight( index, content );
  	},

  	move: function move ( start, end, index ) {
  		if ( index >= start && index <= end ) { throw new Error( 'Cannot move a selection inside itself' ); }

  		this._split( start );
  		this._split( end );
  		this._split( index );

  		var first = this.byStart[ start ];
  		var last = this.byEnd[ end ];

  		var oldLeft = first.previous;
  		var oldRight = last.next;

  		var newRight = this.byStart[ index ];
  		if ( !newRight && last === this.lastChunk ) { return this; }
  		var newLeft = newRight ? newRight.previous : this.lastChunk;

  		if ( oldLeft ) { oldLeft.next = oldRight; }
  		if ( oldRight ) { oldRight.previous = oldLeft; }

  		if ( newLeft ) { newLeft.next = first; }
  		if ( newRight ) { newRight.previous = last; }

  		if ( !first.previous ) { this.firstChunk = last.next; }
  		if ( !last.next ) {
  			this.lastChunk = first.previous;
  			this.lastChunk.next = null;
  		}

  		first.previous = newLeft;
  		last.next = newRight || null;

  		if ( !newLeft ) { this.firstChunk = first; }
  		if ( !newRight ) { this.lastChunk = last; }

  		return this;
  	},

  	overwrite: function overwrite ( start, end, content, options ) {
  		var this$1 = this;

  		if ( typeof content !== 'string' ) { throw new TypeError( 'replacement content must be a string' ); }

  		while ( start < 0 ) { start += this$1.original.length; }
  		while ( end < 0 ) { end += this$1.original.length; }

  		if ( end > this.original.length ) { throw new Error( 'end is out of bounds' ); }
  		if ( start === end ) { throw new Error( 'Cannot overwrite a zero-length range ??? use appendLeft or prependRight instead' ); }

  		this._split( start );
  		this._split( end );

  		if ( options === true ) {
  			if ( !warned.storeName ) {
  				console.warn( 'The final argument to magicString.overwrite(...) should be an options object. See https://github.com/rich-harris/magic-string' ); // eslint-disable-line no-console
  				warned.storeName = true;
  			}

  			options = { storeName: true };
  		}
  		var storeName = options !== undefined ? options.storeName : false;
  		var contentOnly = options !== undefined ? options.contentOnly : false;

  		if ( storeName ) {
  			var original = this.original.slice( start, end );
  			this.storedNames[ original ] = true;
  		}

  		var first = this.byStart[ start ];
  		var last = this.byEnd[ end ];

  		if ( first ) {
  			if ( end > first.end && first.next !== this.byStart[ first.end ] ) {
  				throw new Error( 'Cannot overwrite across a split point' );
  			}

  			first.edit( content, storeName, contentOnly );

  			if ( first !== last ) {
  				var chunk = first.next;
  				while ( chunk !== last ) {
  					chunk.edit( '', false );
  					chunk = chunk.next;
  				}

  				chunk.edit( '', false );
  			}
  		}

  		else {
  			// must be inserting at the end
  			var newChunk = new Chunk( start, end, '' ).edit( content, storeName );

  			// TODO last chunk in the array may not be the last chunk, if it's moved...
  			last.next = newChunk;
  			newChunk.previous = last;
  		}

  		return this;
  	},

  	prepend: function prepend ( content ) {
  		if ( typeof content !== 'string' ) { throw new TypeError( 'outro content must be a string' ); }

  		this.intro = content + this.intro;
  		return this;
  	},

  	prependLeft: function prependLeft ( index, content ) {
  		if ( typeof content !== 'string' ) { throw new TypeError( 'inserted content must be a string' ); }

  		this._split( index );

  		var chunk = this.byEnd[ index ];

  		if ( chunk ) {
  			chunk.prependLeft( content );
  		} else {
  			this.intro = content + this.intro;
  		}

  		return this;
  	},

  	prependRight: function prependRight ( index, content ) {
  		if ( typeof content !== 'string' ) { throw new TypeError( 'inserted content must be a string' ); }

  		this._split( index );

  		var chunk = this.byStart[ index ];

  		if ( chunk ) {
  			chunk.prependRight( content );
  		} else {
  			this.outro = content + this.outro;
  		}

  		return this;
  	},

  	remove: function remove ( start, end ) {
  		var this$1 = this;

  		while ( start < 0 ) { start += this$1.original.length; }
  		while ( end < 0 ) { end += this$1.original.length; }

  		if ( start === end ) { return this; }

  		if ( start < 0 || end > this.original.length ) { throw new Error( 'Character is out of bounds' ); }
  		if ( start > end ) { throw new Error( 'end must be greater than start' ); }

  		this._split( start );
  		this._split( end );

  		var chunk = this.byStart[ start ];

  		while ( chunk ) {
  			chunk.intro = '';
  			chunk.outro = '';
  			chunk.edit( '' );

  			chunk = end > chunk.end ? this$1.byStart[ chunk.end ] : null;
  		}

  		return this;
  	},

  	slice: function slice ( start, end ) {
  		var this$1 = this;
  		if ( start === void 0 ) { start = 0; }
  		if ( end === void 0 ) { end = this.original.length; }

  		while ( start < 0 ) { start += this$1.original.length; }
  		while ( end < 0 ) { end += this$1.original.length; }

  		var result = '';

  		// find start chunk
  		var chunk = this.firstChunk;
  		while ( chunk && ( chunk.start > start || chunk.end <= start ) ) {

  			// found end chunk before start
  			if ( chunk.start < end && chunk.end >= end ) {
  				return result;
  			}

  			chunk = chunk.next;
  		}

  		if ( chunk && chunk.edited && chunk.start !== start ) { throw new Error(("Cannot use replaced character " + start + " as slice start anchor.")); }

  		var startChunk = chunk;
  		while ( chunk ) {
  			if ( chunk.intro && ( startChunk !== chunk || chunk.start === start ) ) {
  				result += chunk.intro;
  			}

  			var containsEnd = chunk.start < end && chunk.end >= end;
  			if ( containsEnd && chunk.edited && chunk.end !== end ) { throw new Error(("Cannot use replaced character " + end + " as slice end anchor.")); }

  			var sliceStart = startChunk === chunk ? start - chunk.start : 0;
  			var sliceEnd = containsEnd ? chunk.content.length + end - chunk.end : chunk.content.length;

  			result += chunk.content.slice( sliceStart, sliceEnd );

  			if ( chunk.outro && ( !containsEnd || chunk.end === end ) ) {
  				result += chunk.outro;
  			}

  			if ( containsEnd ) {
  				break;
  			}

  			chunk = chunk.next;
  		}

  		return result;
  	},

  	// TODO deprecate this? not really very useful
  	snip: function snip ( start, end ) {
  		var clone = this.clone();
  		clone.remove( 0, start );
  		clone.remove( end, clone.original.length );

  		return clone;
  	},

  	_split: function _split ( index ) {
  		var this$1 = this;

  		if ( this.byStart[ index ] || this.byEnd[ index ] ) { return; }

  		var chunk = this.lastSearchedChunk;
  		var searchForward = index > chunk.end;

  		while ( true ) {
  			if ( chunk.contains( index ) ) { return this$1._splitChunk( chunk, index ); }

  			chunk = searchForward ?
  				this$1.byStart[ chunk.end ] :
  				this$1.byEnd[ chunk.start ];
  		}
  	},

  	_splitChunk: function _splitChunk ( chunk, index ) {
  		if ( chunk.edited && chunk.content.length ) { // zero-length edited chunks are a special case (overlapping replacements)
  			var loc = getLocator( this.original )( index );
  			throw new Error( ("Cannot split a chunk that has already been edited (" + (loc.line) + ":" + (loc.column) + " ??? \"" + (chunk.original) + "\")") );
  		}

  		var newChunk = chunk.split( index );

  		this.byEnd[ index ] = chunk;
  		this.byStart[ index ] = newChunk;
  		this.byEnd[ newChunk.end ] = newChunk;

  		if ( chunk === this.lastChunk ) { this.lastChunk = newChunk; }

  		this.lastSearchedChunk = chunk;
  		return true;
  	},

  	toString: function toString () {
  		var str = this.intro;

  		var chunk = this.firstChunk;
  		while ( chunk ) {
  			str += chunk.toString();
  			chunk = chunk.next;
  		}

  		return str + this.outro;
  	},

  	trimLines: function trimLines () {
  		return this.trim('[\\r\\n]');
  	},

  	trim: function trim ( charType ) {
  		return this.trimStart( charType ).trimEnd( charType );
  	},

  	trimEnd: function trimEnd ( charType ) {
  		var this$1 = this;

  		var rx = new RegExp( ( charType || '\\s' ) + '+$' );

  		this.outro = this.outro.replace( rx, '' );
  		if ( this.outro.length ) { return this; }

  		var chunk = this.lastChunk;

  		do {
  			var end = chunk.end;
  			var aborted = chunk.trimEnd( rx );

  			// if chunk was trimmed, we have a new lastChunk
  			if ( chunk.end !== end ) {
  				if ( this$1.lastChunk === chunk ) {
  					this$1.lastChunk = chunk.next;
  				}

  				this$1.byEnd[ chunk.end ] = chunk;
  				this$1.byStart[ chunk.next.start ] = chunk.next;
  				this$1.byEnd[ chunk.next.end ] = chunk.next;
  			}

  			if ( aborted ) { return this$1; }
  			chunk = chunk.previous;
  		} while ( chunk );

  		return this;
  	},

  	trimStart: function trimStart ( charType ) {
  		var this$1 = this;

  		var rx = new RegExp( '^' + ( charType || '\\s' ) + '+' );

  		this.intro = this.intro.replace( rx, '' );
  		if ( this.intro.length ) { return this; }

  		var chunk = this.firstChunk;

  		do {
  			var end = chunk.end;
  			var aborted = chunk.trimStart( rx );

  			if ( chunk.end !== end ) {
  				// special case...
  				if ( chunk === this$1.lastChunk ) { this$1.lastChunk = chunk.next; }

  				this$1.byEnd[ chunk.end ] = chunk;
  				this$1.byStart[ chunk.next.start ] = chunk.next;
  				this$1.byEnd[ chunk.next.end ] = chunk.next;
  			}

  			if ( aborted ) { return this$1; }
  			chunk = chunk.next;
  		} while ( chunk );

  		return this;
  	}
  };

  function isReference ( node, parent ) {
  	if ( parent.type === 'MemberExpression' ) { return parent.computed || node === parent.object; }

  	// disregard the `bar` in { bar: foo }
  	if ( parent.type === 'Property' && node !== parent.value ) { return false; }

  	// disregard the `bar` in `class Foo { bar () {...} }`
  	if ( parent.type === 'MethodDefinition' ) { return false; }

  	// disregard the `bar` in `export { foo as bar }`
  	if ( parent.type === 'ExportSpecifier' && node !== parent.local ) { return false; }

  	return true;
  }

  function flatten ( node ) {
  	var parts = [];

  	while ( node.type === 'MemberExpression' ) {
  		if ( node.computed ) { return null; }

  		parts.unshift( node.property.name );
  		node = node.object;
  	}

  	if ( node.type !== 'Identifier' ) { return null; }

  	var name = node.name;
  	parts.unshift( name );

  	return { name: name, keypath: parts.join( '.' ) };
  }

  function extractNames$1 ( node ) {
  	var names = [];
  	extractors$1[ node.type ]( names, node );
  	return names;
  }

  var extractors$1 = {
  	Identifier: function Identifier ( names, node ) {
  		names.push( node.name );
  	},

  	ObjectPattern: function ObjectPattern ( names, node ) {
  		node.properties.forEach( function (prop) {
  			extractors$1[ prop.value.type ]( names, prop.value );
  		});
  	},

  	ArrayPattern: function ArrayPattern ( names, node ) {
  		node.elements.forEach( function (element) {
  			if ( element ) { extractors$1[ element.type ]( names, element ); }
  		});
  	},

  	RestElement: function RestElement ( names, node ) {
  		extractors$1[ node.argument.type ]( names, node.argument );
  	},

  	AssignmentPattern: function AssignmentPattern ( names, node ) {
  		extractors$1[ node.left.type ]( names, node.left );
  	}
  };


  function isTruthy ( node ) {
  	if ( node.type === 'Literal' ) { return !!node.value; }
  	if ( node.type === 'ParenthesizedExpression' ) { return isTruthy( node.expression ); }
  	if ( node.operator in operators ) { return operators[ node.operator ]( node ); }
  }

  function isFalsy ( node ) {
  	return not( isTruthy( node ) );
  }

  function not ( value ) {
  	return value === undefined ? value : !value;
  }

  function equals ( a, b, strict ) {
  	if ( a.type !== b.type ) { return undefined; }
  	if ( a.type === 'Literal' ) { return strict ? a.value === b.value : a.value == b.value; }
  }

  var operators = {
  	'==': function (x) {
  		return equals( x.left, x.right, false );
  	},

  	'!=': function (x) { return not( operators['==']( x ) ); },

  	'===': function (x) {
  		return equals( x.left, x.right, true );
  	},

  	'!==': function (x) { return not( operators['===']( x ) ); },

  	'!': function (x) { return isFalsy( x.argument ); },

  	'&&': function (x) { return isTruthy( x.left ) && isTruthy( x.right ); },

  	'||': function (x) { return isTruthy( x.left ) || isTruthy( x.right ); }
  };

  function getName ( id ) {
  	var name = makeLegalIdentifier( basename( id, extname( id ) ) );
  	if (name !== 'index') {
  		return name;
  	} else {
  		var segments = dirname( id ).split( sep );
  		return makeLegalIdentifier( segments[segments.length - 1] );
  	}
  }

  var reserved = 'abstract arguments boolean break byte case catch char class const continue debugger default delete do double else enum eval export extends false final finally float for from function goto if implements import in instanceof int interface let long native new null package private protected public return short static super switch synchronized this throw throws transient true try typeof var void volatile while with yield'.split( ' ' );
  var blacklist = { __esModule: true };
  reserved.forEach( function (word) { return blacklist[ word ] = true; } );

  var exportsPattern = /^(?:module\.)?exports(?:\.([a-zA-Z_$][a-zA-Z_$0-9]*))?$/;

  var firstpassGlobal = /\b(?:require|module|exports|global)\b/;
  var firstpassNoGlobal = /\b(?:require|module|exports)\b/;
  var importExportDeclaration = /^(?:Import|Export(?:Named|Default))Declaration/;
  var functionType = /^(?:FunctionDeclaration|FunctionExpression|ArrowFunctionExpression)$/;

  function deconflict ( scope, globals, identifier ) {
  	var i = 1;
  	var deconflicted = identifier;

  	while ( scope.contains( deconflicted ) || globals.has( deconflicted ) || deconflicted in blacklist ) { deconflicted = identifier + "_" + (i++); }
  	scope.declarations[ deconflicted ] = true;

  	return deconflicted;
  }

  function tryParse ( parse, code, id ) {
  	try {
  		return parse( code, { allowReturnOutsideFunction: true });
  	} catch ( err ) {
  		err.message += " in " + id;
  		throw err;
  	}
  }

  function checkFirstpass (code, ignoreGlobal) {
  	var firstpass = ignoreGlobal ? firstpassNoGlobal : firstpassGlobal;
  	return firstpass.test(code);
  }

  function checkEsModule ( parse, code, id ) {
  	var ast = tryParse( parse, code, id );

  	// if there are top-level import/export declarations, this is ES not CommonJS
  	var hasDefaultExport = false;
  	var isEsModule = false;
  	for ( var i = 0, list = ast.body; i < list.length; i += 1 ) {
  		var node = list[i];

  		if ( node.type === 'ExportDefaultDeclaration' )
  			{ hasDefaultExport = true; }
  		if ( importExportDeclaration.test( node.type ) )
  			{ isEsModule = true; }
  	}

  	return { isEsModule: isEsModule, hasDefaultExport: hasDefaultExport, ast: ast };
  }

  function transformCommonjs ( parse, code, id, isEntry, ignoreGlobal, ignoreRequire, customNamedExports, sourceMap, allowDynamicRequire, astCache ) {
  	var ast = astCache || tryParse( parse, code, id );

  	var magicString = new MagicString$1( code );

  	var required = {};
  	// Because objects have no guaranteed ordering, yet we need it,
  	// we need to keep track of the order in a array
  	var sources = [];

  	var uid = 0;

  	var scope = attachScopes( ast, 'scope' );
  	var uses = { module: false, exports: false, global: false, require: false };

  	var lexicalDepth = 0;
  	var programDepth = 0;

  	var globals = new Set();

  	var HELPERS_NAME = deconflict( scope, globals, 'commonjsHelpers' ); // TODO technically wrong since globals isn't populated yet, but ??\_(???)_/??

  	var namedExports = {};

  	// TODO handle transpiled modules
  	var shouldWrap = /__esModule/.test( code );

  	function isRequireStatement ( node ) {
  		if ( !node ) { return; }
  		if ( node.type !== 'CallExpression' ) { return; }
  		if ( node.callee.name !== 'require' || scope.contains( 'require' ) ) { return; }
  		if ( node.arguments.length !== 1 || (node.arguments[0].type !== 'Literal' && (node.arguments[0].type !== 'TemplateLiteral' || node.arguments[0].expressions.length > 0) ) ) { return; } // TODO handle these weird cases?
  		if ( ignoreRequire( node.arguments[0].value ) ) { return; }

  		return true;
  	}

  	function getRequired ( node, name ) {
  		var source = node.arguments[0].type === 'Literal' ? node.arguments[0].value : node.arguments[0].quasis[0].value.cooked;

  		var existing = required[ source ];
  		if ( existing === undefined ) {
  			sources.push( source );

  			if ( !name ) {
  				do { name = "require$$" + (uid++); }
  				while ( scope.contains( name ) );
  			}

  			required[ source ] = { source: source, name: name, importsDefault: false };
  		}

  		return required[ source ];
  	}

  	// do a first pass, see which names are assigned to. This is necessary to prevent
  	// illegally replacing `var foo = require('foo')` with `import foo from 'foo'`,
  	// where `foo` is later reassigned. (This happens in the wild. CommonJS, sigh)
  	var assignedTo = new Set();
  	walk$1( ast, {
  		enter: function enter ( node ) {
  			if ( node.type !== 'AssignmentExpression' ) { return; }
  			if ( node.left.type === 'MemberExpression' ) { return; }

  			extractNames$1( node.left ).forEach( function (name) {
  				assignedTo.add( name );
  			});
  		}
  	});

  	walk$1( ast, {
  		enter: function enter ( node, parent ) {
  			if ( sourceMap ) {
  				magicString.addSourcemapLocation( node.start );
  				magicString.addSourcemapLocation( node.end );
  			}

  			// skip dead branches
  			if ( parent && ( parent.type === 'IfStatement' || parent.type === 'ConditionalExpression' ) ) {
  				if ( node === parent.consequent && isFalsy( parent.test ) ) { return this.skip(); }
  				if ( node === parent.alternate && isTruthy( parent.test ) ) { return this.skip(); }
  			}

  			if ( node._skip ) { return this.skip(); }

  			programDepth += 1;

  			if ( node.scope ) { scope = node.scope; }
  			if ( functionType.test( node.type ) ) { lexicalDepth += 1; }

  			// if toplevel return, we need to wrap it
  			if ( node.type === 'ReturnStatement' && lexicalDepth === 0 ) {
  				shouldWrap = true;
  			}

  			// rewrite `this` as `commonjsHelpers.commonjsGlobal`
  			if ( node.type === 'ThisExpression' && lexicalDepth === 0 ) {
  				uses.global = true;
  				if ( !ignoreGlobal ) { magicString.overwrite( node.start, node.end, (HELPERS_NAME + ".commonjsGlobal"), { storeName: true } ); }
  				return;
  			}

  			// rewrite `typeof module`, `typeof module.exports` and `typeof exports` (https://github.com/rollup/rollup-plugin-commonjs/issues/151)
  			if ( node.type === 'UnaryExpression' && node.operator === 'typeof' ) {
  				var flattened = flatten( node.argument );
  				if ( !flattened ) { return; }

  				if ( scope.contains( flattened.name ) ) { return; }

  				if ( flattened.keypath === 'module.exports' || flattened.keypath === 'module' || flattened.keypath === 'exports' ) {
  					magicString.overwrite( node.start, node.end, "'object'", { storeName: false } );
  				}
  			}

  			// rewrite `require` (if not already handled) `global` and `define`, and handle free references to
  			// `module` and `exports` as these mean we need to wrap the module in commonjsHelpers.createCommonjsModule
  			if ( node.type === 'Identifier' ) {
  				if ( isReference( node, parent ) && !scope.contains( node.name ) ) {
  					if ( node.name in uses ) {
  						if ( node.name === 'require' ) {
  							if ( allowDynamicRequire ) { return; }
  							magicString.overwrite( node.start, node.end, (HELPERS_NAME + ".commonjsRequire"), { storeName: true } );
  						}

  						uses[ node.name ] = true;
  						if ( node.name === 'global' && !ignoreGlobal ) {
  							magicString.overwrite( node.start, node.end, (HELPERS_NAME + ".commonjsGlobal"), { storeName: true } );
  						}

  						// if module or exports are used outside the context of an assignment
  						// expression, we need to wrap the module
  						if ( node.name === 'module' || node.name === 'exports' ) {
  							shouldWrap = true;
  						}
  					}

  					if ( node.name === 'define' ) {
  						magicString.overwrite( node.start, node.end, 'undefined', { storeName: true } );
  					}

  					globals.add( node.name );
  				}

  				return;
  			}

  			// Is this an assignment to exports or module.exports?
  			if ( node.type === 'AssignmentExpression' ) {
  				if ( node.left.type !== 'MemberExpression' ) { return; }

  				var flattened$1 = flatten( node.left );
  				if ( !flattened$1 ) { return; }

  				if ( scope.contains( flattened$1.name ) ) { return; }

  				var match = exportsPattern.exec( flattened$1.keypath );
  				if ( !match || flattened$1.keypath === 'exports' ) { return; }

  				uses[ flattened$1.name ] = true;

  				// we're dealing with `module.exports = ...` or `[module.]exports.foo = ...` ???
  				// if this isn't top-level, we'll need to wrap the module
  				if ( programDepth > 3 ) { shouldWrap = true; }

  				node.left._skip = true;

  				if ( flattened$1.keypath === 'module.exports' && node.right.type === 'ObjectExpression' ) {
  					return node.right.properties.forEach( function (prop) {
  						if ( prop.computed || prop.key.type !== 'Identifier' ) { return; }
  						var name = prop.key.name;
  						if ( name === makeLegalIdentifier( name ) ) { namedExports[ name ] = true; }
  					});
  				}

  				if ( match[1] ) { namedExports[ match[1] ] = true; }
  				return;
  			}

  			// if this is `var x = require('x')`, we can do `import x from 'x'`
  			if ( node.type === 'VariableDeclarator' && node.id.type === 'Identifier' && isRequireStatement( node.init ) ) {
  				// for now, only do this for top-level requires. maybe fix this in future
  				if ( scope.parent ) { return; }

  				// edge case ??? CJS allows you to assign to imports. ES doesn't
  				if ( assignedTo.has( node.id.name ) ) { return; }

  				var r$1 = getRequired( node.init, node.id.name );
  				r$1.importsDefault = true;

  				if ( r$1.name === node.id.name ) {
  					node._shouldRemove = true;
  				}
  			}

  			if ( !isRequireStatement( node ) ) { return; }

  			var r = getRequired( node );

  			if ( parent.type === 'ExpressionStatement' ) {
  				// is a bare import, e.g. `require('foo');`
  				magicString.remove( parent.start, parent.end );
  			} else {
  				r.importsDefault = true;
  				magicString.overwrite( node.start, node.end, r.name );
  			}

  			node.callee._skip = true;
  		},

  		leave: function leave ( node ) {
  			programDepth -= 1;
  			if ( node.scope ) { scope = scope.parent; }
  			if ( functionType.test( node.type ) ) { lexicalDepth -= 1; }

  			if ( node.type === 'VariableDeclaration' ) {
  				var keepDeclaration = false;
  				var c = node.declarations[0].start;

  				for ( var i = 0; i < node.declarations.length; i += 1 ) {
  					var declarator = node.declarations[i];

  					if ( declarator._shouldRemove ) {
  						magicString.remove( c, declarator.end );
  					} else {
  						if ( !keepDeclaration ) {
  							magicString.remove( c, declarator.start );
  							keepDeclaration = true;
  						}

  						c = declarator.end;
  					}
  				}

  				if ( !keepDeclaration ) {
  					magicString.remove( node.start, node.end );
  				}
  			}
  		}
  	});

  	if ( !sources.length && !uses.module && !uses.exports && !uses.require && ( ignoreGlobal || !uses.global ) ) {
  		if ( Object.keys( namedExports ).length ) {
  			throw new Error( ("Custom named exports were specified for " + id + " but it does not appear to be a CommonJS module") );
  		}
  		return null; // not a CommonJS module
  	}

  	var includeHelpers = shouldWrap || uses.global || uses.require;
  	var importBlock = ( includeHelpers ? [ ("import * as " + HELPERS_NAME + " from '" + HELPERS_ID + "';") ] : [] ).concat(
  		sources.map( function (source) {
  			// import the actual module before the proxy, so that we know
  			// what kind of proxy to build
  			return ("import '" + source + "';");
  		}),
  		sources.map( function (source) {
  			var ref = required[ source ];
  			var name = ref.name;
  			var importsDefault = ref.importsDefault;
  			return ("import " + (importsDefault ? (name + " from ") : "") + "'" + PREFIX + source + "';");
  		})
  	).join( '\n' ) + '\n\n';

  	var namedExportDeclarations = [];
  	var wrapperStart = '';
  	var wrapperEnd = '';

  	var moduleName = deconflict( scope, globals, getName( id ) );
  	if ( !isEntry ) {
  		var exportModuleExports = {
  			str: ("export { " + moduleName + " as __moduleExports };"),
  			name: '__moduleExports'
  		};

  		namedExportDeclarations.push( exportModuleExports );
  	}

  	var name = getName( id );

  	function addExport ( x ) {
  		var deconflicted = deconflict( scope, globals, name );

  		var declaration = deconflicted === name ?
  			("export var " + x + " = " + moduleName + "." + x + ";") :
  			("var " + deconflicted + " = " + moduleName + "." + x + ";\nexport { " + deconflicted + " as " + x + " };");

  		namedExportDeclarations.push({
  			str: declaration,
  			name: x
  		});
  	}

  	if ( customNamedExports ) { customNamedExports.forEach( addExport ); }

  	var defaultExportPropertyAssignments = [];
  	var hasDefaultExport = false;

  	if ( shouldWrap ) {
  		var args = "module" + (uses.exports ? ', exports' : '');

  		wrapperStart = "var " + moduleName + " = " + HELPERS_NAME + ".createCommonjsModule(function (" + args + ") {\n";
  		wrapperEnd = "\n});";
  	} else {
  		var names = [];

  		ast.body.forEach( function (node) {
  			if ( node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' ) {
  				var left = node.expression.left;
  				var flattened = flatten( left );

  				if ( !flattened ) { return; }

  				var match = exportsPattern.exec( flattened.keypath );
  				if ( !match ) { return; }

  				if ( flattened.keypath === 'module.exports' ) {
  					hasDefaultExport = true;
  					magicString.overwrite( left.start, left.end, ("var " + moduleName) );
  				} else {
  					var name = match[1];
  					var deconflicted = deconflict( scope, globals, name );

  					names.push({ name: name, deconflicted: deconflicted });

  					magicString.overwrite( node.start, left.end, ("var " + deconflicted) );

  					var declaration = name === deconflicted ?
  						("export { " + name + " };") :
  						("export { " + deconflicted + " as " + name + " };");

  					if ( name !== 'default' ) {
  						namedExportDeclarations.push({
  							str: declaration,
  							name: name
  						});
  						delete namedExports[name];
  					}

  					defaultExportPropertyAssignments.push( (moduleName + "." + name + " = " + deconflicted + ";") );
  				}
  			}
  		});

  		if ( !hasDefaultExport ) {
  			wrapperEnd = "\n\nvar " + moduleName + " = {\n" + (names.map( function (ref) {
  					var name = ref.name;
  					var deconflicted = ref.deconflicted;

  					return ("\t" + name + ": " + deconflicted);
  			} ).join( ',\n' )) + "\n};";
  		}
  	}
  	Object.keys( namedExports )
  		.filter( function (key) { return !blacklist[ key ]; } )
  		.forEach( addExport );

  	var defaultExport = /__esModule/.test( code ) ?
  		("export default " + HELPERS_NAME + ".unwrapExports(" + moduleName + ");") :
  		("export default " + moduleName + ";");

  	var named = namedExportDeclarations
  		.filter( function (x) { return x.name !== 'default' || !hasDefaultExport; } )
  		.map( function (x) { return x.str; } );

  	var exportBlock = '\n\n' + [ defaultExport ]
  		.concat( named )
  		.concat( hasDefaultExport ? defaultExportPropertyAssignments : [] )
  		.join( '\n' );

  	magicString.trim()
  		.prepend( importBlock + wrapperStart )
  		.trim()
  		.append( wrapperEnd + exportBlock );

  	code = magicString.toString();
  	var map = sourceMap ? magicString.generateMap() : null;

  	return { code: code, map: map };
  }

  function getCandidatesForExtension ( resolved, extension ) {
  	return [
  		resolved + extension,
  		resolved + sep + "index" + extension
  	];
  }

  function getCandidates ( resolved, extensions ) {
  	return extensions.reduce(
  		function ( paths, extension ) { return paths.concat( getCandidatesForExtension ( resolved, extension ) ); },
  		[resolved]
  	);
  }

  // Return the first non-falsy result from an array of
  // maybe-sync, maybe-promise-returning functions
  function first ( candidates ) {
  	return function () {
  		var args = [], len = arguments.length;
  		while ( len-- ) args[ len ] = arguments[ len ];

  		return candidates.reduce( function ( promise, candidate ) {
  			return promise.then( function (result) { return result != null ?
  				result :
  				Promise.resolve( candidate.apply( void 0, args ) ); } );
  		}, Promise.resolve() );
  	};
  }

  function startsWith ( str, prefix ) {
  	return str.slice( 0, prefix.length ) === prefix;
  }


  function commonjs ( options ) {
  	if ( options === void 0 ) options = {};

  	var extensions = options.extensions || ['.js'];
  	var filter = createFilter( options.include, options.exclude );
  	var ignoreGlobal = options.ignoreGlobal;

  	var customNamedExports = {};
  	if ( options.namedExports ) {
  		Object.keys( options.namedExports ).forEach( function (id) {
  			var resolvedId;

  			try {
  				resolvedId = nodeResolveSync( id, { basedir: './' });
  			} catch ( err ) {
  				resolvedId = resolve( id );
  			}

  			customNamedExports[ resolvedId ] = options.namedExports[ id ];
  		});
  	}

  	var esModulesWithoutDefaultExport = [];

  	var allowDynamicRequire = !!options.ignore; // TODO maybe this should be configurable?

  	var ignoreRequire = typeof options.ignore === 'function' ?
  		options.ignore :
  		Array.isArray( options.ignore ) ? function (id) { return ~options.ignore.indexOf( id ); } :
  			function () { return false; };

  	var entryModuleIdsPromise = null;

  	function resolveId ( importee, importer ) {
  		if ( importee === HELPERS_ID ) { return importee; }

  		if ( importer && startsWith( importer, PREFIX ) ) { importer = importer.slice( PREFIX.length ); }

  		var isProxyModule = startsWith( importee, PREFIX );
  		if ( isProxyModule ) { importee = importee.slice( PREFIX.length ); }

  		return resolveUsingOtherResolvers( importee, importer ).then( function (resolved) {
  			if ( resolved ) { return isProxyModule ? PREFIX + resolved : resolved; }

  			resolved = defaultResolver( importee, importer );

  			if ( isProxyModule ) {
  				if ( resolved ) { return PREFIX + resolved; }
  				return EXTERNAL + importee; // external
  			}

  			return resolved;
  		});
  	}

  	var sourceMap = options.sourceMap !== false;

  	var resolveUsingOtherResolvers;

  	var isCjsPromises = Object.create(null);
  	function getIsCjsPromise ( id ) {
  		var isCjsPromise = isCjsPromises[id];
  		if (isCjsPromise)
  			{ return isCjsPromise.promise; }

  		var promise = new Promise( function (resolve$$1) {
  			isCjsPromises[id] = isCjsPromise = {
  				resolve: resolve$$1,
  				promise: undefined
  			};
  		});
  		isCjsPromise.promise = promise;

  		return promise;
  	}
  	function setIsCjsPromise ( id, promise ) {
  		var isCjsPromise = isCjsPromises[id];
  		if (isCjsPromise) {
  			if (isCjsPromise.resolve) {
  				isCjsPromise.resolve(promise);
  				isCjsPromise.resolve = undefined;
  			}
  		}
  		else {
  			isCjsPromises[id] = { promise: promise, resolve: undefined };
  		}
  	}

  	return {
  		name: 'commonjs',

  		options: function options ( options$1 ) {
  			var resolvers = ( options$1.plugins || [] )
  				.map( function (plugin) {
  					if ( plugin.resolveId === resolveId ) {
  						// substitute CommonJS resolution logic
  						return function ( importee, importer ) {
  							if ( importee[0] !== '.' || !importer ) { return; } // not our problem

  							var resolved = resolve( dirname( importer ), importee );
  							var candidates = getCandidates( resolved, extensions );

  							for ( var i = 0; i < candidates.length; i += 1 ) {
  								try {
  									var stats = fs.statSync( candidates[i] );
  									if ( stats.isFile() ) { return candidates[i]; }
  								} catch ( err ) { /* noop */ }
  							}
  						};
  					}

  					return plugin.resolveId;
  				})
  				.filter( Boolean );

  			var isExternal = function (id) { return options$1.external ?
  				Array.isArray( options$1.external ) ? ~options$1.external.indexOf( id ) :
  					options$1.external(id) :
  				false; };

  			resolvers.unshift( function (id) { return isExternal( id ) ? false : null; } );

  			resolveUsingOtherResolvers = first( resolvers );

  			var entryModules = [].concat( options$1.input || options$1.entry );
  			entryModuleIdsPromise = Promise.all(
  				entryModules.map( function (entry) { return resolveId( entry ); })
  			);
  		},

  		resolveId: resolveId,

  		load: function load ( id ) {
  			if ( id === HELPERS_ID ) { return HELPERS; }

  			// generate proxy modules
  			if ( startsWith( id, EXTERNAL ) ) {
  				var actualId = id.slice( EXTERNAL.length );
  				var name = getName( actualId );

  				return ("import " + name + " from " + (JSON.stringify( actualId )) + "; export default " + name + ";");
  			}

  			if ( startsWith( id, PREFIX ) ) {
  				var actualId$1 = id.slice( PREFIX.length );
  				var name$1 = getName( actualId$1 );

  				return ( ( extname( id ) && extensions.indexOf( extname( id ) ) === -1 ) ? Promise.resolve(false) : getIsCjsPromise( actualId$1 ) )
  					.then( function (isCjs) {
  						if ( isCjs )
  							{ return ("import { __moduleExports } from " + (JSON.stringify( actualId$1 )) + "; export default __moduleExports;"); }
  						else if (esModulesWithoutDefaultExport.indexOf(actualId$1) !== -1)
  							{ return ("import * as " + name$1 + " from " + (JSON.stringify( actualId$1 )) + "; export default " + name$1 + ";"); }
  						else
  							{ return ("import * as " + name$1 + " from " + (JSON.stringify( actualId$1 )) + "; export default ( " + name$1 + " && " + name$1 + "['default'] ) || " + name$1 + ";"); }
  					});
  			}
  		},

  		transform: function transform ( code, id ) {
  			var this$1 = this;

  			if ( !filter( id ) ) { return null; }
  			if ( extname( id ) && extensions.indexOf( extname( id ) ) === -1 ) { return null; }

  			var transformPromise = entryModuleIdsPromise.then( function (entryModuleIds) {
  				var ref = checkEsModule( this$1.parse, code, id );
  				var isEsModule = ref.isEsModule;
  				var hasDefaultExport = ref.hasDefaultExport;
  				var ast = ref.ast;
  				if ( isEsModule ) {
  					if ( !hasDefaultExport )
  						{ esModulesWithoutDefaultExport.push( id ); }
  					return;
  				}

  				// it is not an ES module but not a commonjs module, too.
  				if ( !checkFirstpass( code, ignoreGlobal ) ) {
  					esModulesWithoutDefaultExport.push( id );
  					return;
  				}

  				var transformed = transformCommonjs( this$1.parse, code, id, entryModuleIds.indexOf(id) !== -1, ignoreGlobal, ignoreRequire, customNamedExports[ id ], sourceMap, allowDynamicRequire, ast );
  				if ( !transformed ) {
  					esModulesWithoutDefaultExport.push( id );
  					return;
  				}

  				return transformed;
  			}).catch(function (err) {
  				this$1.error(err, err.loc);
  			});

  			setIsCjsPromise(id, transformPromise.then( function (transformed) { return transformed ? true : false; }, function () { return true; } ));

  			return transformPromise;
  		}
  	};
  }

  return commonjs;

})));
//# sourceMappingURL=rollup-plugin-commonjs.umd.js.map
