# fn-extractor

> Extracts your functions from JavaScript code and returns them in an Object

## Install

    npm install fn-extractor

## Example

    var extract = require('fn-extractor');
    var functions = extract('(function () { function foo() { return 1; } })');

    typeof functions.foo === 'function' // true
    functions.foo() === 1 // true

## License

[MIT](http://josh.mit-license.org)
