/**
 * Module Dependencies
 */

var selection = window.getSelection;
var domify = require('domify');
var trim = require('trim');
var events = require('events');
var throttle = require('per-frame');
var classes = require('classes');
var shortcuts = require('shortcuts');
var modifier = require('modifier');
var closest = require('closest');
var raf = require('raf');

/**
 * Export `Normalize`
 */

module.exports = Normalize;

/**
 * Backspace
 */

var backspace = {
  8: true,
  46: true
};

/**
 * <p> tag
 */

var tpl = domify('<div class="block"><p class="placeholder"></p></div>');

/**
 * Normalize the contenteditable element
 *
 * @param {Element} el
 * @return {el}
 * @api public
 */

function Normalize(el) {
  if (!(this instanceof Normalize)) return new Normalize(el);
  this.el = el;
  this.added = false;
  this.tpl = tpl.cloneNode(true);

  // default to a zero-width space
  this._placeholder = '\u200B';

  // prevent certain keys
  this.shortcuts = shortcuts(el, this);
  this.shortcuts.k.ignore = false;
  this.shortcuts.bind('backspace', 'prevent');
  this.shortcuts.bind('enter', 'onenter');
  this.shortcuts.bind('super + a', 'prevent');
  this.shortcuts.bind('right', 'prevent');
  this.shortcuts.bind('down', 'prevent');

  // events
  this.events = events(el, this);
  this.events.bind('keydown', 'update');
  this.events.bind('paste', 'update');
  this.events.bind('mousedown', 'front');
  this.events.bind('mousemove', 'front');
  this.events.bind('touchend', 'front');
  this.events.bind('focus', 'front');

  // add our placeholder or use the first paragraph
  var p = el.getElementsByTagName('p');
  if (p.length) {
    this.p = p[0];
    this.added = false;
  } else {
    this.tpl = tpl.cloneNode(true);
    this.p = this.tpl.querySelector('.placeholder');
    this.p.textContent = this._placeholder;
    el.insertBefore(this.tpl, el.firstChild);
    this.added = true;
  }
}

/**
 * template
 */

Normalize.prototype.template = function(tpl) {
  this.tpl = tpl;
  return this;
};


/**
 * Add a placeholder
 *
 * @param {String} placeholder
 * @return {Normalize} self
 * @api public
 */

Normalize.prototype.placeholder = function(placeholder) {
  this._placeholder = placeholder;

  if (classes(this.p).has('placeholder')) {
    this.p.textContent = placeholder;
  }

  return this;
};

/**
 * Update the placeholder, either showing or hiding.
 *
 * @return {Normalize} self
 * @api private
 */

Normalize.prototype.update = throttle(function(e) {
  if (modifier(e)) return this;
  var el = this.el;
  var str = el.textContent;

  if (str && str != this._placeholder && this.added) {
    // turn placeholder into regular <p>
    classes(this.p).remove('placeholder');
    this.p.textContent = this.p.textContent.slice(0, -this._placeholder.length);
    this.end(this.p);
    this.added = false;
  } else if (!trim(str) && !this.added && el.children.length <= 1) {
    // FF removes the paragraph with select all, add it back.
    if (!el.contains(this.tpl)) {
      if (el.firstChild) el.insertBefore(this.tpl, el.firstChild);
      else el.appendChild(this.tpl);
    }

    // cleanup other immediate children
    var last = this.el.lastChild;
    while (last && this.tpl != last) {
      this.el.removeChild(last);
      last = this.el.lastChild;
    }

    // turn old paragraph into placeholder
    classes(this.p).add('placeholder');
    this.p.textContent = this._placeholder;
    this.tpl.normalize();
    this.added = true;

    // move cursor to the start
    this.start(this.p);
  }

  return this;
});

/**
 * Move the cursor to the front
 * if the placeholder is added
 *
 * @return {Normalize} self
 * @api private
 */

Normalize.prototype.front = throttle(function() {
  if (this.added && this.el == document.activeElement) {
    this.start(this.p);
  }
  return this;
});

/**
 * Move cursor to the start
 *
 * @param {Element} el
 * @return {Normalize} self
 * @api private
 */

Normalize.prototype.start = function(el) {
  var sel = selection();
  var range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(true);
  sel.removeAllRanges();
  sel.addRange(range);
  return this;
}

/**
 * Move cursor to the end
 *
 * @param {Element} el
 * @return {Normalize} self
 * @api private
 */

Normalize.prototype.end = function(el) {
  var sel = selection();
  var range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  sel.removeAllRanges();
  sel.addRange(range);
  return this;
}

/**
 * Prevent default
 *
 * @param {Event} e
 * @return {Normalize} self
 * @api private
 */

Normalize.prototype.prevent = function(e) {
  if (this.added) {
    // TODO: < IE9 support
    e.stopImmediatePropagation();
    e.preventDefault();
  }
  return false;
};

/**
 * On Enter
 *
 * TODO: fix auto-scrolling on content-editable
 *
 * @param {Event} e
 * @return {Normalize} self
 * @api private
 */

Normalize.prototype.onenter = function(e) {
  if (this.added) return this.prevent(e);
  var tpl = this.tpl.cloneNode(true);
  var p = tpl.querySelector('p');
  var sel = selection();
  var node = sel.focusNode;
  var offset = sel.focusOffset;
  var block = closest(node, '.block');
  var sliced = '';

  e.preventDefault();

  if (node.nodeValue) {
    sliced = node.nodeValue.slice(offset);

    if (offset) {
      node.nodeValue = node.nodeValue.slice(0, offset);
    } else {
      node.parentNode.innerHTML = '<br>';
    }
  }

  p.className = '';
  p.innerHTML = sliced ? sliced : '<br>';
  block.parentNode.insertBefore(tpl, block.nextSibling);

  this.start(p);
};


/**
 * Unbind all events
 *
 * @return {Normalize} self
 * @api public
 */

Normalize.prototype.unbind = function() {
  this.shortcuts.unbind();
  this.events.unbind();
  return this;
};
