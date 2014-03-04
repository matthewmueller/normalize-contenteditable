/**
 * Module Dependencies
 */

var selection = window.getSelection;
var domify = require('domify');
var trim = require('trim');
var events = require('events');
var raf = require('per-frame');
var classes = require('classes');
var shortcuts = require('shortcuts');
var modifier = require('modifier');

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

var tpl = domify('<p class="placeholder"></p>');

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

  // default to a zero-width space
  this._placeholder = '\u200B';
  document.execCommand('defaultParagraphSeparator', false, 'p');

  // prevent certain keys
  this.shortcuts = shortcuts(el, this);
  this.shortcuts.k.ignore = false;
  this.shortcuts.bind('backspace', 'prevent');
  this.shortcuts.bind('enter', 'prevent');
  this.shortcuts.bind('super + a', 'prevent');
  this.shortcuts.bind('right', 'prevent');
  this.shortcuts.bind('down', 'prevent');

  // events
  this.events = events(el, this);
  this.events.bind('keydown', 'update');
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
    this.p = tpl.cloneNode();
    this.p.textContent = this._placeholder;
    el.insertBefore(this.p, el.firstChild);
    this.added = true;
  }
}

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

Normalize.prototype.update = raf(function(e) {
  if (modifier(e)) return this;
  var el = this.el;
  var str = el.textContent;

  if (str && str != this._placeholder && this.added) {
    // turn placeholder into regular <p>
    classes(this.p).remove('placeholder');
    this.p.textContent = this.p.textContent.slice(0, -this._placeholder.length);
    this.end(this.p);
    this.added = false;
  } if (!trim(str) && !this.added && el.children.length <= 1) {
    // FF removes the paragraph with select all, add it back.
    if (!el.contains(this.p)) {
      el.insertBefore(this.p, el.firstChild);
      this.start(this.p);
    }

    // turn old paragraph into placeholder
    classes(this.p).add('placeholder');
    this.p.textContent = this._placeholder;
    this.p.normalize();
    this.added = true;
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

Normalize.prototype.front = raf(function() {
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
