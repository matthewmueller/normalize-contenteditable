
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
map.td =\n\
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];\n\
\n\
map.option =\n\
map.optgroup = [1, '<select multiple=\"multiple\">', '</select>'];\n\
\n\
map.thead =\n\
map.tbody =\n\
map.colgroup =\n\
map.caption =\n\
map.tfoot = [1, '<table>', '</table>'];\n\
\n\
map.text =\n\
map.circle =\n\
map.ellipse =\n\
map.line =\n\
map.path =\n\
map.polygon =\n\
map.polyline =\n\
map.rect = [1, '<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">','</svg>'];\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
  \n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // one element\n\
  if (el.firstChild == el.lastChild) {\n\
    return el.removeChild(el.firstChild);\n\
  }\n\
\n\
  // several elements\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.firstChild) {\n\
    fragment.appendChild(el.removeChild(el.firstChild));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("component-trim/index.js", Function("exports, require, module",
"\n\
exports = module.exports = trim;\n\
\n\
function trim(str){\n\
  if (str.trim) return str.trim();\n\
  return str.replace(/^\\s*|\\s*$/g, '');\n\
}\n\
\n\
exports.left = function(str){\n\
  if (str.trimLeft) return str.trimLeft();\n\
  return str.replace(/^\\s*/, '');\n\
};\n\
\n\
exports.right = function(str){\n\
  if (str.trimRight) return str.trimRight();\n\
  return str.replace(/\\s*$/, '');\n\
};\n\
//@ sourceURL=component-trim/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',\n\
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',\n\
    prefix = bind !== 'addEventListener' ? 'on' : '';\n\
\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  el[bind](prefix + type, fn, capture || false);\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  el[unbind](prefix + type, fn, capture || false);\n\
  return fn;\n\
};//@ sourceURL=component-event/index.js"
));
require.register("component-query/index.js", Function("exports, require, module",
"function one(selector, el) {\n\
  return el.querySelector(selector);\n\
}\n\
\n\
exports = module.exports = function(selector, el){\n\
  el = el || document;\n\
  return one(selector, el);\n\
};\n\
\n\
exports.all = function(selector, el){\n\
  el = el || document;\n\
  return el.querySelectorAll(selector);\n\
};\n\
\n\
exports.engine = function(obj){\n\
  if (!obj.one) throw new Error('.one callback required');\n\
  if (!obj.all) throw new Error('.all callback required');\n\
  one = obj.one;\n\
  exports.all = obj.all;\n\
  return exports;\n\
};\n\
//@ sourceURL=component-query/index.js"
));
require.register("component-matches-selector/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var query = require('query');\n\
\n\
/**\n\
 * Element prototype.\n\
 */\n\
\n\
var proto = Element.prototype;\n\
\n\
/**\n\
 * Vendor function.\n\
 */\n\
\n\
var vendor = proto.matches\n\
  || proto.webkitMatchesSelector\n\
  || proto.mozMatchesSelector\n\
  || proto.msMatchesSelector\n\
  || proto.oMatchesSelector;\n\
\n\
/**\n\
 * Expose `match()`.\n\
 */\n\
\n\
module.exports = match;\n\
\n\
/**\n\
 * Match `el` to `selector`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
function match(el, selector) {\n\
  if (vendor) return vendor.call(el, selector);\n\
  var nodes = query.all(selector, el.parentNode);\n\
  for (var i = 0; i < nodes.length; ++i) {\n\
    if (nodes[i] == el) return true;\n\
  }\n\
  return false;\n\
}\n\
//@ sourceURL=component-matches-selector/index.js"
));
require.register("discore-closest/index.js", Function("exports, require, module",
"var matches = require('matches-selector')\n\
\n\
module.exports = function (element, selector, checkYoSelf, root) {\n\
  element = checkYoSelf ? {parentNode: element} : element\n\
\n\
  root = root || document\n\
\n\
  // Make sure `element !== document` and `element != null`\n\
  // otherwise we get an illegal invocation\n\
  while ((element = element.parentNode) && element !== document) {\n\
    if (matches(element, selector))\n\
      return element\n\
    // After `matches` on the edge case that\n\
    // the selector matches the root\n\
    // (when the root is not the document)\n\
    if (element === root)\n\
      return  \n\
  }\n\
}//@ sourceURL=discore-closest/index.js"
));
require.register("component-delegate/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var closest = require('closest')\n\
  , event = require('event');\n\
\n\
/**\n\
 * Delegate event `type` to `selector`\n\
 * and invoke `fn(e)`. A callback function\n\
 * is returned which may be passed to `.unbind()`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, selector, type, fn, capture){\n\
  return event.bind(el, type, function(e){\n\
    var target = e.target || e.srcElement;\n\
    e.delegateTarget = closest(target, selector, true, el);\n\
    if (e.delegateTarget) fn.call(el, e);\n\
  }, capture);\n\
};\n\
\n\
/**\n\
 * Unbind event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  event.unbind(el, type, fn, capture);\n\
};\n\
//@ sourceURL=component-delegate/index.js"
));
require.register("component-events/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var events = require('event');\n\
var delegate = require('delegate');\n\
\n\
/**\n\
 * Expose `Events`.\n\
 */\n\
\n\
module.exports = Events;\n\
\n\
/**\n\
 * Initialize an `Events` with the given\n\
 * `el` object which events will be bound to,\n\
 * and the `obj` which will receive method calls.\n\
 *\n\
 * @param {Object} el\n\
 * @param {Object} obj\n\
 * @api public\n\
 */\n\
\n\
function Events(el, obj) {\n\
  if (!(this instanceof Events)) return new Events(el, obj);\n\
  if (!el) throw new Error('element required');\n\
  if (!obj) throw new Error('object required');\n\
  this.el = el;\n\
  this.obj = obj;\n\
  this._events = {};\n\
}\n\
\n\
/**\n\
 * Subscription helper.\n\
 */\n\
\n\
Events.prototype.sub = function(event, method, cb){\n\
  this._events[event] = this._events[event] || {};\n\
  this._events[event][method] = cb;\n\
};\n\
\n\
/**\n\
 * Bind to `event` with optional `method` name.\n\
 * When `method` is undefined it becomes `event`\n\
 * with the \"on\" prefix.\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Direct event handling:\n\
 *\n\
 *    events.bind('click') // implies \"onclick\"\n\
 *    events.bind('click', 'remove')\n\
 *    events.bind('click', 'sort', 'asc')\n\
 *\n\
 *  Delegated event handling:\n\
 *\n\
 *    events.bind('click li > a')\n\
 *    events.bind('click li > a', 'remove')\n\
 *    events.bind('click a.sort-ascending', 'sort', 'asc')\n\
 *    events.bind('click a.sort-descending', 'sort', 'desc')\n\
 *\n\
 * @param {String} event\n\
 * @param {String|function} [method]\n\
 * @return {Function} callback\n\
 * @api public\n\
 */\n\
\n\
Events.prototype.bind = function(event, method){\n\
  var e = parse(event);\n\
  var el = this.el;\n\
  var obj = this.obj;\n\
  var name = e.name;\n\
  var method = method || 'on' + name;\n\
  var args = [].slice.call(arguments, 2);\n\
\n\
  // callback\n\
  function cb(){\n\
    var a = [].slice.call(arguments).concat(args);\n\
    obj[method].apply(obj, a);\n\
  }\n\
\n\
  // bind\n\
  if (e.selector) {\n\
    cb = delegate.bind(el, e.selector, name, cb);\n\
  } else {\n\
    events.bind(el, name, cb);\n\
  }\n\
\n\
  // subscription for unbinding\n\
  this.sub(name, method, cb);\n\
\n\
  return cb;\n\
};\n\
\n\
/**\n\
 * Unbind a single binding, all bindings for `event`,\n\
 * or all bindings within the manager.\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Unbind direct handlers:\n\
 *\n\
 *     events.unbind('click', 'remove')\n\
 *     events.unbind('click')\n\
 *     events.unbind()\n\
 *\n\
 * Unbind delegate handlers:\n\
 *\n\
 *     events.unbind('click', 'remove')\n\
 *     events.unbind('click')\n\
 *     events.unbind()\n\
 *\n\
 * @param {String|Function} [event]\n\
 * @param {String|Function} [method]\n\
 * @api public\n\
 */\n\
\n\
Events.prototype.unbind = function(event, method){\n\
  if (0 == arguments.length) return this.unbindAll();\n\
  if (1 == arguments.length) return this.unbindAllOf(event);\n\
\n\
  // no bindings for this event\n\
  var bindings = this._events[event];\n\
  if (!bindings) return;\n\
\n\
  // no bindings for this method\n\
  var cb = bindings[method];\n\
  if (!cb) return;\n\
\n\
  events.unbind(this.el, event, cb);\n\
};\n\
\n\
/**\n\
 * Unbind all events.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.unbindAll = function(){\n\
  for (var event in this._events) {\n\
    this.unbindAllOf(event);\n\
  }\n\
};\n\
\n\
/**\n\
 * Unbind all events for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.unbindAllOf = function(event){\n\
  var bindings = this._events[event];\n\
  if (!bindings) return;\n\
\n\
  for (var method in bindings) {\n\
    this.unbind(event, method);\n\
  }\n\
};\n\
\n\
/**\n\
 * Parse `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function parse(event) {\n\
  var parts = event.split(/ +/);\n\
  return {\n\
    name: parts.shift(),\n\
    selector: parts.join(' ')\n\
  }\n\
}\n\
//@ sourceURL=component-events/index.js"
));
require.register("component-raf/index.js", Function("exports, require, module",
"/**\n\
 * Expose `requestAnimationFrame()`.\n\
 */\n\
\n\
exports = module.exports = window.requestAnimationFrame\n\
  || window.webkitRequestAnimationFrame\n\
  || window.mozRequestAnimationFrame\n\
  || window.oRequestAnimationFrame\n\
  || window.msRequestAnimationFrame\n\
  || fallback;\n\
\n\
/**\n\
 * Fallback implementation.\n\
 */\n\
\n\
var prev = new Date().getTime();\n\
function fallback(fn) {\n\
  var curr = new Date().getTime();\n\
  var ms = Math.max(0, 16 - (curr - prev));\n\
  var req = setTimeout(fn, ms);\n\
  prev = curr;\n\
  return req;\n\
}\n\
\n\
/**\n\
 * Cancel.\n\
 */\n\
\n\
var cancel = window.cancelAnimationFrame\n\
  || window.webkitCancelAnimationFrame\n\
  || window.mozCancelAnimationFrame\n\
  || window.oCancelAnimationFrame\n\
  || window.msCancelAnimationFrame\n\
  || window.clearTimeout;\n\
\n\
exports.cancel = function(id){\n\
  cancel.call(window, id);\n\
};\n\
//@ sourceURL=component-raf/index.js"
));
require.register("matthewmueller-per-frame/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var raf = require('raf')\n\
\n\
/**\n\
 * Export `throttle`\n\
 */\n\
\n\
module.exports = throttle;\n\
\n\
/**\n\
 * Throttle by the request animation frame.\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Function}\n\
 */\n\
\n\
function throttle(fn) {\n\
  var queued = false;\n\
  return queue;\n\
\n\
  function queue() {\n\
    if (queued) return;\n\
    queued = true;\n\
    var ctx = this;\n\
    var args = arguments;\n\
\n\
    raf(function() {\n\
      queued = false;\n\
      return fn.apply(ctx, args);\n\
    });\n\
  }\n\
}\n\
//@ sourceURL=matthewmueller-per-frame/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"module.exports = function(arr, obj){\n\
  if (arr.indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("component-classes/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var index = require('indexof');\n\
\n\
/**\n\
 * Whitespace regexp.\n\
 */\n\
\n\
var re = /\\s+/;\n\
\n\
/**\n\
 * toString reference.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Wrap `el` in a `ClassList`.\n\
 *\n\
 * @param {Element} el\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el){\n\
  return new ClassList(el);\n\
};\n\
\n\
/**\n\
 * Initialize a new ClassList for `el`.\n\
 *\n\
 * @param {Element} el\n\
 * @api private\n\
 */\n\
\n\
function ClassList(el) {\n\
  if (!el) throw new Error('A DOM element reference is required');\n\
  this.el = el;\n\
  this.list = el.classList;\n\
}\n\
\n\
/**\n\
 * Add class `name` if not already present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.add = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.add(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (!~i) arr.push(name);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove class `name` when present, or\n\
 * pass a regular expression to remove\n\
 * any which match.\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.remove = function(name){\n\
  if ('[object RegExp]' == toString.call(name)) {\n\
    return this.removeMatching(name);\n\
  }\n\
\n\
  // classList\n\
  if (this.list) {\n\
    this.list.remove(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (~i) arr.splice(i, 1);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove all classes matching `re`.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {ClassList}\n\
 * @api private\n\
 */\n\
\n\
ClassList.prototype.removeMatching = function(re){\n\
  var arr = this.array();\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (re.test(arr[i])) {\n\
      this.remove(arr[i]);\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Toggle class `name`, can force state via `force`.\n\
 *\n\
 * For browsers that support classList, but do not support `force` yet,\n\
 * the mistake will be detected and corrected.\n\
 *\n\
 * @param {String} name\n\
 * @param {Boolean} force\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.toggle = function(name, force){\n\
  // classList\n\
  if (this.list) {\n\
    if (\"undefined\" !== typeof force) {\n\
      if (force !== this.list.toggle(name, force)) {\n\
        this.list.toggle(name); // toggle again to correct\n\
      }\n\
    } else {\n\
      this.list.toggle(name);\n\
    }\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  if (\"undefined\" !== typeof force) {\n\
    if (!force) {\n\
      this.remove(name);\n\
    } else {\n\
      this.add(name);\n\
    }\n\
  } else {\n\
    if (this.has(name)) {\n\
      this.remove(name);\n\
    } else {\n\
      this.add(name);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return an array of classes.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.array = function(){\n\
  var str = this.el.className.replace(/^\\s+|\\s+$/g, '');\n\
  var arr = str.split(re);\n\
  if ('' === arr[0]) arr.shift();\n\
  return arr;\n\
};\n\
\n\
/**\n\
 * Check if class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.has =\n\
ClassList.prototype.contains = function(name){\n\
  return this.list\n\
    ? this.list.contains(name)\n\
    : !! ~index(this.array(), name);\n\
};\n\
//@ sourceURL=component-classes/index.js"
));
require.register("yields-k-sequence/index.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies\n\
 */\n\
\n\
var keycode = require('keycode');\n\
\n\
/**\n\
 * Export `sequence`\n\
 */\n\
\n\
module.exports = sequence;\n\
\n\
/**\n\
 * Create sequence fn with `keys`.\n\
 * optional `ms` which defaults\n\
 * to `500ms` and `fn`.\n\
 *\n\
 * Example:\n\
 *\n\
 *      seq = sequence('a b c', fn);\n\
 *      el.addEventListener('keydown', seq);\n\
 *\n\
 * @param {String} keys\n\
 * @param {Number} ms\n\
 * @param {Function} fn\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
function sequence(keys, ms, fn){\n\
  var codes = keys.split(/ +/).map(keycode)\n\
    , clen = codes.length\n\
    , seq = []\n\
    , i = 0\n\
    , prev;\n\
\n\
  if (2 == arguments.length) {\n\
    fn = ms;\n\
    ms = 500;\n\
  }\n\
\n\
  return function(e){\n\
    var code = codes[i++];\n\
    if (42 != code && code != e.which) return reset();\n\
    if (prev && new Date - prev > ms) return reset();\n\
    var len = seq.push(e.which);\n\
    prev = new Date;\n\
    if (len != clen) return;\n\
    reset();\n\
    fn(e);\n\
  };\n\
\n\
  function reset(){\n\
    prev = null;\n\
    seq = [];\n\
    i = 0;\n\
  }\n\
};\n\
//@ sourceURL=yields-k-sequence/index.js"
));
require.register("yields-keycode/index.js", Function("exports, require, module",
"\n\
/**\n\
 * map\n\
 */\n\
\n\
var map = {\n\
    backspace: 8\n\
  , command: 91\n\
  , tab: 9\n\
  , clear: 12\n\
  , enter: 13\n\
  , shift: 16\n\
  , ctrl: 17\n\
  , alt: 18\n\
  , capslock: 20\n\
  , escape: 27\n\
  , esc: 27\n\
  , space: 32\n\
  , left: 37\n\
  , up: 38\n\
  , right: 39\n\
  , down: 40\n\
  , del: 46\n\
  , comma: 188\n\
  , ',': 188\n\
  , '.': 190\n\
  , '/': 191\n\
  , '`': 192\n\
  , '-': 189\n\
  , '=': 187\n\
  , ';': 186\n\
  , '[': 219\n\
  , '\\\\': 220\n\
  , ']': 221\n\
  , '\\'': 222\n\
};\n\
\n\
/**\n\
 * find a keycode.\n\
 *\n\
 * @param {String} name\n\
 * @return {Number}\n\
 */\n\
\n\
module.exports = function(name){\n\
  return map[name] || name.toUpperCase().charCodeAt(0);\n\
};\n\
//@ sourceURL=yields-keycode/index.js"
));
require.register("component-bind/index.js", Function("exports, require, module",
"/**\n\
 * Slice reference.\n\
 */\n\
\n\
var slice = [].slice;\n\
\n\
/**\n\
 * Bind `obj` to `fn`.\n\
 *\n\
 * @param {Object} obj\n\
 * @param {Function|String} fn or string\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(obj, fn){\n\
  if ('string' == typeof fn) fn = obj[fn];\n\
  if ('function' != typeof fn) throw new Error('bind() requires a function');\n\
  var args = slice.call(arguments, 2);\n\
  return function(){\n\
    return fn.apply(obj, args.concat(slice.call(arguments)));\n\
  }\n\
};\n\
//@ sourceURL=component-bind/index.js"
));
require.register("component-os/index.js", Function("exports, require, module",
"\n\
\n\
module.exports = os();\n\
\n\
function os() {\n\
  var ua = navigator.userAgent;\n\
  if (/mac/i.test(ua)) return 'mac';\n\
  if (/win/i.test(ua)) return 'windows';\n\
  if (/linux/i.test(ua)) return 'linux';\n\
}\n\
//@ sourceURL=component-os/index.js"
));
require.register("yields-k/lib/index.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies.\n\
 */\n\
\n\
var event = require('event')\n\
  , proto = require('./proto')\n\
  , bind = require('bind');\n\
\n\
/**\n\
 * Create a new dispatcher with `el`.\n\
 *\n\
 * example:\n\
 *\n\
 *      var k = require('k')(window);\n\
 *      k('shift + tab', function(){});\n\
 *\n\
 * @param {Element} el\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el){\n\
  function k(e, fn){ k.handle(e, fn) };\n\
  k._handle = bind(k, proto.handle);\n\
  k._clear = bind(k, proto.clear);\n\
  event.bind(el, 'keydown', k._handle, false);\n\
  event.bind(el, 'keyup', k._handle, false);\n\
  event.bind(el, 'keyup', k._clear, false);\n\
  event.bind(el, 'focus', k._clear, false);\n\
  for (var p in proto) k[p] = proto[p];\n\
  k.listeners = [];\n\
  k.el = el;\n\
  return k;\n\
};\n\
//@ sourceURL=yields-k/lib/index.js"
));
require.register("yields-k/lib/proto.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies\n\
 */\n\
\n\
var sequence = require('k-sequence')\n\
  , keycode = require('keycode')\n\
  , event = require('event')\n\
  , os = require('os');\n\
\n\
/**\n\
 * modifiers.\n\
 */\n\
\n\
var modifiers = {\n\
  224: 'command',\n\
  91: 'command',\n\
  93: 'command',\n\
  16: 'shift',\n\
  17: 'ctrl',\n\
  18: 'alt'\n\
};\n\
\n\
/**\n\
 * Super key.\n\
 */\n\
\n\
exports.super = 'mac' == os\n\
  ? 'command'\n\
  : 'ctrl';\n\
\n\
/**\n\
 * Handle the given `KeyboardEvent` or bind\n\
 * a new `keys` handler.\n\
 *\n\
 * @param {String|KeyboardEvent} e\n\
 * @param {Function} fn\n\
 * @api private\n\
 */\n\
\n\
exports.handle = function(e, fn){\n\
  var ignore = this.ignore;\n\
  var event = e.type;\n\
  var code = e.which;\n\
\n\
  // bind\n\
  if (fn) return this.bind(e, fn);\n\
\n\
  // modifiers\n\
  var mod = modifiers[code];\n\
  if ('keydown' == event && mod) {\n\
    this.super = exports.super == mod;\n\
    this[mod] = true;\n\
    this.modifiers = true;\n\
    return;\n\
  }\n\
\n\
  // ignore\n\
  if (ignore && ignore(e)) return;\n\
\n\
  // listeners\n\
  var all = this.listeners;\n\
\n\
  // match\n\
  for (var i = 0; i < all.length; ++i) {\n\
    var invoke = true;\n\
    var obj = all[i];\n\
    var seq = obj.seq;\n\
    var mods = obj.mods;\n\
    var fn = seq || obj.fn;\n\
\n\
    if (!seq && code != obj.code) continue;\n\
    if (event != obj.event) continue;\n\
\n\
    for (var j = 0; j < mods.length; ++j) {\n\
      if (!this[mods[j]]) {\n\
        invoke = null;\n\
        break;\n\
      }\n\
    }\n\
\n\
    invoke && fn(e);\n\
  }\n\
};\n\
\n\
/**\n\
 * Destroy this `k` dispatcher instance.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
exports.destroy = function(){\n\
  event.unbind(this.el, 'keydown', this._handle);\n\
  event.unbind(this.el, 'keyup', this._handle);\n\
  event.unbind(this.el, 'keyup', this._clear);\n\
  event.unbind(this.el, 'focus', this._clear);\n\
  this.listeners = [];\n\
};\n\
\n\
/**\n\
 * Unbind the given `keys` with optional `fn`.\n\
 *\n\
 * example:\n\
 *\n\
 *      k.unbind('enter, tab', myListener); // unbind `myListener` from `enter, tab` keys\n\
 *      k.unbind('enter, tab'); // unbind all `enter, tab` listeners\n\
 *      k.unbind(); // unbind all listeners\n\
 *\n\
 * @param {String} keys\n\
 * @param {Function} fn\n\
 * @return {k}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(keys, fn){\n\
  var fns = this.listeners\n\
    , len = fns.length\n\
    , all;\n\
\n\
  // unbind all\n\
  if (0 == arguments.length) {\n\
    this.listeners = [];\n\
    return this;\n\
  }\n\
\n\
  // parse\n\
  all = parseKeys(keys);\n\
\n\
  // unbind\n\
  for (var i = 0; i < all.length; ++i) {\n\
    for (var j = 0, obj; j < len; ++j) {\n\
      obj = fns[j];\n\
      if (!obj) continue;\n\
      if (fn && obj.fn != fn) continue;\n\
      if (obj.key != all[i].key) continue;\n\
      if (!matches(obj, all[i])) continue;\n\
      fns.splice(j--, 1);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Bind the given `keys` to `fn` with optional `event`\n\
 *\n\
 * example:\n\
 *\n\
 *      k.bind('shift + tab, ctrl + a', function(e){});\n\
 *\n\
 * @param {String} event\n\
 * @param {String} keys\n\
 * @param {Function} fn\n\
 * @return {k}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(event, keys, fn){\n\
  var fns = this.listeners\n\
    , len\n\
    , all;\n\
\n\
  if (2 == arguments.length) {\n\
    fn = keys;\n\
    keys = event;\n\
    event = 'keydown';\n\
  }\n\
\n\
  all = parseKeys(keys);\n\
  len = all.length;\n\
\n\
  for (var i = 0; i < len; ++i) {\n\
    var obj = all[i];\n\
    obj.seq = obj.seq && sequence(obj.key, fn);\n\
    obj.event = event;\n\
    obj.fn = fn;\n\
    fns.push(obj);\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Bind keyup with `keys` and `fn`.\n\
 *\n\
 * @param {String} keys\n\
 * @param {Function} fn\n\
 * @return {k}\n\
 * @api public\n\
 */\n\
\n\
exports.up = function(keys, fn){\n\
  return this.bind('keyup', keys, fn);\n\
};\n\
\n\
/**\n\
 * Bind keydown with `keys` and `fn`.\n\
 *\n\
 * @param {String} keys\n\
 * @param {Function} fn\n\
 * @return {k}\n\
 * @api public\n\
 */\n\
\n\
exports.down = function(keys, fn){\n\
  return this.bind('keydown', keys, fn);\n\
};\n\
\n\
/**\n\
 * Clear all modifiers on `keyup`.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
exports.clear = function(e){\n\
  var code = e.keyCode || e.which;\n\
  if (!(code in modifiers)) return;\n\
  this[modifiers[code]] = null;\n\
  this.modifiers = this.command\n\
    || this.shift\n\
    || this.ctrl\n\
    || this.alt;\n\
};\n\
\n\
/**\n\
 * Ignore all input elements by default.\n\
 *\n\
 * @param {Event} e\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
exports.ignore = function(e){\n\
  var el = e.target || e.srcElement;\n\
  var name = el.tagName.toLowerCase();\n\
  return 'textarea' == name\n\
    || 'select' == name\n\
    || 'input' == name;\n\
};\n\
\n\
/**\n\
 * Parse the given `keys`.\n\
 *\n\
 * @param {String} keys\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parseKeys(keys){\n\
  keys = keys.replace('super', exports.super);\n\
\n\
  var all = ',' != keys\n\
    ? keys.split(/ *, */)\n\
    : [','];\n\
\n\
  var ret = [];\n\
  for (var i = 0; i < all.length; ++i) {\n\
    if ('' == all[i]) continue;\n\
    var mods = all[i].split(/ *\\+ */);\n\
    var key = mods.pop() || ',';\n\
\n\
    ret.push({\n\
      seq: !!~ key.indexOf(' '),\n\
      code: keycode(key),\n\
      mods: mods,\n\
      key: key\n\
    });\n\
  }\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Check if the given `a` matches `b`.\n\
 *\n\
 * @param {Object} a\n\
 * @param {Object} b\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function matches(a, b){\n\
  return 0 == b.mods.length || eql(a, b);\n\
}\n\
\n\
/**\n\
 * Shallow eql util.\n\
 *\n\
 * TODO: move to yields/eql\n\
 *\n\
 * @param {Array} a\n\
 * @param {Array} b\n\
 * @return {Boolean}\n\
 * @api private\n\
 */\n\
\n\
function eql(a, b){\n\
  a = a.mods.sort().toString();\n\
  b = b.mods.sort().toString();\n\
  return a == b;\n\
}\n\
//@ sourceURL=yields-k/lib/proto.js"
));
require.register("yields-shortcuts/index.js", Function("exports, require, module",
"\n\
/**\n\
 * dependencies\n\
 */\n\
\n\
var dispatcher = require('k');\n\
\n\
/**\n\
 * Export `Shortcuts`\n\
 */\n\
\n\
module.exports = Shortcuts;\n\
\n\
/**\n\
 * Initialize `Shortcuts`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {Object} obj\n\
 * @api public\n\
 */\n\
\n\
function Shortcuts(el, obj){\n\
  if (!(this instanceof Shortcuts)) return new Shortcuts(el, obj);\n\
  this.k = dispatcher(el);\n\
  this.bindings = {};\n\
  this.obj = obj;\n\
  this.el = el;\n\
}\n\
\n\
/**\n\
 * Bind `keys`, `method`.\n\
 *\n\
 * @param {String} keys\n\
 * @param {String} method\n\
 * @return {Shortcuts}\n\
 * @api public\n\
 */\n\
\n\
Shortcuts.prototype.bind = function(keys, method){\n\
  if (2 != arguments.length) throw new Error('expected 2 arguments');\n\
  var bindings = this.bindings;\n\
  var m = bindings[keys] = bindings[keys] || {};\n\
  var callback = this.callback(method);\n\
  m[method] = callback;\n\
  this.k(keys, callback);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Unbind `keys`, `method`.\n\
 *\n\
 * @param {String} keys\n\
 * @param {String} method\n\
 * @return {Shortcuts}\n\
 * @api public\n\
 */\n\
\n\
Shortcuts.prototype.unbind = function(keys, method){\n\
  var methods = this.bindings[keys];\n\
\n\
  if (2 == arguments.length) {\n\
    this.k.unbind(keys, methods[method]);\n\
    return this;\n\
  }\n\
\n\
  if (1 == arguments.length) {\n\
    this.bindings[keys] = {};\n\
    this.k.unbind(keys);\n\
    return this;\n\
  }\n\
\n\
  this.bindings = {};\n\
  this.k.unbind();\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Wrap the given `method`.\n\
 *\n\
 * @param {String} method\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
Shortcuts.prototype.callback = function(method){\n\
  var obj = this.obj;\n\
\n\
  return function callback(){\n\
    obj[method].apply(obj, arguments);\n\
  }\n\
};\n\
//@ sourceURL=yields-shortcuts/index.js"
));
require.register("normalize-contenteditable/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var selection = window.getSelection;\n\
var domify = require('domify');\n\
var trim = require('trim');\n\
var events = require('events');\n\
var raf = require('per-frame');\n\
var classes = require('classes');\n\
var shortcuts = require('shortcuts');\n\
\n\
/**\n\
 * Export `normalize`\n\
 */\n\
\n\
module.exports = normalize;\n\
\n\
/**\n\
 * <p> tag\n\
 */\n\
\n\
var p = domify('<p class=\"placeholder\"></p>');\n\
\n\
/**\n\
 * Normalize the contenteditable element\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} placeholder (optional)\n\
 * @return {el}\n\
 * @api public\n\
 */\n\
\n\
function normalize(el, placeholder) {\n\
  if (!(this instanceof normalize)) return new normalize(el, placeholder);\n\
  this.el = el;\n\
  this.added = false;\n\
\n\
  // default to a zero-width space\n\
  this.placeholder = placeholder || '\\u200B';\n\
\n\
  // create our elements\n\
  this.p = p.cloneNode();\n\
  this.p.textContent = this.placeholder;\n\
\n\
  // events\n\
  this.events = events(el, this);\n\
  this.events.bind('keydown', 'update');\n\
  this.events.bind('mousedown', 'front');\n\
  this.events.bind('mousemove', 'front');\n\
  this.events.bind('touchstart', 'front');\n\
  this.events.bind('touchmove', 'front');\n\
\n\
  // prevent certain keys\n\
  this.shortcuts = shortcuts(el, this);\n\
  this.shortcuts.k.ignore = false;\n\
  this.shortcuts.bind('enter', 'prevent');\n\
  this.shortcuts.bind('super + a', 'prevent');\n\
  this.shortcuts.bind('right', 'prevent');\n\
  this.shortcuts.bind('down', 'prevent');\n\
\n\
  this.init();\n\
}\n\
\n\
/**\n\
 * Initialize our contenteditable\n\
 *\n\
 * @return {Normalize} self\n\
 * @api private\n\
 */\n\
\n\
normalize.prototype.init = function() {\n\
  var el = this.el;\n\
  var str = trim(el.textContent);\n\
  if (str) return this;\n\
\n\
  el.insertBefore(this.p, el.firstChild);\n\
  this.added = true;\n\
\n\
  return this;\n\
}\n\
\n\
/**\n\
 * Update the placeholder, either showing or hiding.\n\
 *\n\
 * @return {Normalize} self\n\
 * @api private\n\
 */\n\
\n\
normalize.prototype.update = raf(function() {\n\
  var el = this.el;\n\
  var str = el.textContent;\n\
\n\
  if (str && str != this.placeholder && this.added) {\n\
    // turn placeholder into regular <p>\n\
    classes(this.p).remove('placeholder');\n\
    this.p.textContent = this.p.textContent.slice(0, -this.placeholder.length);\n\
    this.end(this.p);\n\
    this.added = false;\n\
  } if (!str && !this.added && el.children.length <= 1) {\n\
    // turn old paragraph into placeholder\n\
    classes(this.p).add('placeholder');\n\
    this.p.textContent = this.placeholder;\n\
    this.added = true;\n\
  }\n\
\n\
  return this;\n\
});\n\
\n\
/**\n\
 * Move the cursor to the front\n\
 * if the placeholder is added\n\
 *\n\
 * @return {Normalize} self\n\
 * @api private\n\
 */\n\
\n\
normalize.prototype.front = raf(function() {\n\
  if (this.added) this.start(this.p);\n\
  return this;\n\
});\n\
\n\
/**\n\
 * Move cursor to the start\n\
 *\n\
 * @param {Element} el\n\
 * @return {Normalize} self\n\
 * @api private\n\
 */\n\
\n\
normalize.prototype.start = function(el) {\n\
  var sel = selection();\n\
  var range = document.createRange();\n\
  range.selectNodeContents(el);\n\
  range.collapse(true);\n\
  sel.removeAllRanges();\n\
  sel.addRange(range);\n\
  return this;\n\
}\n\
\n\
/**\n\
 * Move cursor to the end\n\
 *\n\
 * @param {Element} el\n\
 * @return {Normalize} self\n\
 * @api private\n\
 */\n\
\n\
normalize.prototype.end = function(el) {\n\
  var sel = selection();\n\
  var range = document.createRange();\n\
  range.selectNodeContents(el);\n\
  range.collapse(false);\n\
  sel.removeAllRanges();\n\
  sel.addRange(range);\n\
  return this;\n\
}\n\
\n\
/**\n\
 * Prevent default\n\
 *\n\
 * @param {Event} e\n\
 * @return {Normalize} self\n\
 * @api private\n\
 */\n\
\n\
normalize.prototype.prevent = function(e) {\n\
  if (this.added) e.preventDefault();\n\
  return false;\n\
};\n\
\n\
/**\n\
 * Unbind all events\n\
 *\n\
 * @return {Normalize} self\n\
 * @api public\n\
 */\n\
\n\
normalize.prototype.unbind = function() {\n\
  this.shortcuts.unbind();\n\
  this.events.unbind();\n\
  return this;\n\
};\n\
//@ sourceURL=normalize-contenteditable/index.js"
));




















require.alias("component-domify/index.js", "normalize-contenteditable/deps/domify/index.js");
require.alias("component-domify/index.js", "domify/index.js");

require.alias("component-trim/index.js", "normalize-contenteditable/deps/trim/index.js");
require.alias("component-trim/index.js", "trim/index.js");

require.alias("component-events/index.js", "normalize-contenteditable/deps/events/index.js");
require.alias("component-events/index.js", "events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-delegate/index.js", "component-events/deps/delegate/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "discore-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("discore-closest/index.js", "discore-closest/index.js");
require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("matthewmueller-per-frame/index.js", "normalize-contenteditable/deps/per-frame/index.js");
require.alias("matthewmueller-per-frame/index.js", "per-frame/index.js");
require.alias("component-raf/index.js", "matthewmueller-per-frame/deps/raf/index.js");

require.alias("component-classes/index.js", "normalize-contenteditable/deps/classes/index.js");
require.alias("component-classes/index.js", "classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("yields-shortcuts/index.js", "normalize-contenteditable/deps/shortcuts/index.js");
require.alias("yields-shortcuts/index.js", "normalize-contenteditable/deps/shortcuts/index.js");
require.alias("yields-shortcuts/index.js", "shortcuts/index.js");
require.alias("yields-k/lib/index.js", "yields-shortcuts/deps/k/lib/index.js");
require.alias("yields-k/lib/proto.js", "yields-shortcuts/deps/k/lib/proto.js");
require.alias("yields-k/lib/index.js", "yields-shortcuts/deps/k/index.js");
require.alias("yields-k-sequence/index.js", "yields-k/deps/k-sequence/index.js");
require.alias("yields-k-sequence/index.js", "yields-k/deps/k-sequence/index.js");
require.alias("yields-keycode/index.js", "yields-k-sequence/deps/keycode/index.js");

require.alias("yields-k-sequence/index.js", "yields-k-sequence/index.js");
require.alias("yields-keycode/index.js", "yields-k/deps/keycode/index.js");

require.alias("component-event/index.js", "yields-k/deps/event/index.js");

require.alias("component-bind/index.js", "yields-k/deps/bind/index.js");

require.alias("component-os/index.js", "yields-k/deps/os/index.js");

require.alias("yields-k/lib/index.js", "yields-k/index.js");
require.alias("yields-shortcuts/index.js", "yields-shortcuts/index.js");
require.alias("normalize-contenteditable/index.js", "normalize-contenteditable/index.js");