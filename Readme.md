
# normalize-contenteditable

  All text in a content-editable block should be wrapped in `<p>` tag. Each browser handles content-editables just a bit different. The goal of this library is to normalize these inconsistencies.

## Installation

  Install with [component(1)](http://component.io):

    $ component install matthewmueller/normalize-contenteditable

## Example

```js
var normalize = require('normalize-contenteditable');

normalize(editor)
  .placeholder('Let this paper be your oyster...');
```

## API

### Normalize(el)

Initialize `normalize` on the contenteditable element `el`. Optionally pass some `placeholder` text when the contenteditable element has no content.

### Normalize#placeholder(placeholder)

Add a placeholder. By default `placeholder` is a [zero-width space (\u200B)](http://en.wikipedia.org/wiki/Zero-width_space).

### Normalize#unbind()

Unbind all attached events.

## TODO

* firefox select all deletes the placeholder paragraph
* IE9+ testing
* functional tests

## License

  The MIT License (MIT)

  Copyright (c) 2014 <copyright holders>

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
