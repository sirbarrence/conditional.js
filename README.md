# conditional.js - A RequireJS Plugin for Conditionally Loading Dependencies 

conditional.js is a RequireJS plugin for conditionally loading dependencies based on the runtime environment of the browser. 

## Purpose

If your web app must support older browsers, you may need to load feature polyfills, shims, or older/compatibility versions of libraries like jQuery or Lodash. But you also probably want to avoid loading extra code and larger, slower compatibility versions of libraries in modern browsers that don't need them. [Modernizr + Yep-Nope](http://modernizr.com/) are good at testing for features and loading code optionally, but if you're already using RequireJS for the rest of your code you probably don't want to add another asynchronous script loader into the mix. Out of the box, however, RequireJS doesn't have a great way to use a runtime feature test or browser version check to inform which scripts it loads. 

The conditional.js plugin allows you to declare functions or properties in your `requirejs.config()` object that are used at runtime to pick a script to load from a list. The plugin has two main goals: 

- Provide a way to choose whether or not to load a polyfill / shim script.
- Provide a way to pick which version of a library to load, but use the same module name regardless of the chose version so most of your code doesn't have to know which version it's using. 

## Installation

	bower install --production https://github.com/sirbarrence/conditional.js.git

You could also just download and save conditional.js to a location of your choosing in your project. It only has dev dependencies for tests and examples, besides the obvious dependency on RequireJS which it's assumed you already have installed. If you want to run the tests - see below - remove the `--production` flag.

## Usage

### Basics

conditional.js is a RequireJS [loader plugin](http://requirejs.org/docs/api.html#plugins) like [text](http://requirejs.org/docs/api.html#text) or [i18n](http://requirejs.org/docs/api.html#i18n). Like other plugins, its module dependency declarations consist of a prefix that is the plugin module name "conditional" followed by an exclamation mark: `conditional!`. Possibly unlike other plugins this is followed by a JSON string that specifies a test function or property name and one or more module names to potentially load.

```javascript
define([
	'conditional!{ "test": "nameOfSomeFunctionThatReturnsBool", "load": "lib/mayOrMayNotBeLoaded" }'
], function (loadedLibOrUndefined) { ... });
```

The value of `test` must be the name of a function or property present in the `config` object of the object you pass to your `requirejs.config()` call. In the declaration above, `nameOfSomeFunctionThatReturnsBool` is a function found on the `config` object:

```javascript
require.config({
	config: {
		// name of this plugin
		conditional: {
			// Your functions and properties that will be referenced in the dependency delcarations go here.
			nameOfSomeFunctionThatReturnsBool: function () {
				if (/* some complex logic or feature detection */) {
					return true; // load the optional library 'lib/mayOrMayNotBeLoaded'
				}
				
				return false; // do not load the optional library
			}
		}
	},
	baseUrl: './',
	paths: {
		'src': '../src'
	},
	// ...
```

If the test function returns boolean `true`, the "lib/mayOrMayNotBeLoaded" library will be loaded and passed into the module function where it's declared as a dependency. If the test function returns false, the library is not loaded and the module function receives `undefined`.    
### Scenario 1 - Conditional Loading of a Shim Library

Perhaps you need to use some ECMAScript 5 features but also need to support ES4 browsers. You want to load something like the [ES5 Shim](https://github.com/es-shims/es5-shim/) lib only if the useragent actually needs it.

In this scenario, you should define a property or function in your RequireJS config object that evalutates to `true` if the shim should be loaded and `false` if not.  

```javascript
require.config({
	baseUrl: './',
	paths: {
		// ...
	},
	config: {
		conditional: {
			/**
			 * @returns {boolean}
			 */
			missingES5: function () {
				// Modernizr test for ES5 Object methods.
				// https://github.com/Modernizr/Modernizr/blob/7bf3046835e4c97e1d5e98f6933288b80e8e7cb8/feature-detects/es5/object.js
				return !(Object.keys &&
				Object.create &&
				Object.getPrototypeOf &&
				Object.getOwnPropertyNames &&
				Object.isSealed &&
				Object.isFrozen &&
				Object.isExtensible &&
				Object.getOwnPropertyDescriptor &&
				Object.defineProperty &&
				Object.defineProperties &&
				Object.seal &&
				Object.freeze &&
				Object.preventExtensions);
			}
		}
	}
});

require([
	'conditional!{ "test": "missingES5", "load": "lib/es5shim" }',
	// ...
], function (es5Shim/*, ... */) {
	// initialize your app
});
```

Polyfill libraries may or may not evaluate to or return anything useful, so we're mainly concerned with loading this lib - if newer Object methods are missing - before our other code executes, not with using the injected dependency. So in this example, the injected `es5Shim` would probably not be used and might be `undefined` even if it loaded successfully. That's just the nature of most polyfills and shims.  

### Scenario 2 - Conditional Loading of a Library Version

You want to use jQuery, but you want to load the 1.x version for IE 6, 7, and 8 and the slimmer, faster 2.x version for everyone else. If you use [HTML5 Boilerplate](http://html5boilerplate.com/), you probably have a bunch of IE conditional comments around your `<html>` element(s) in order to easily determine which IE version you're running in by querying the DOM.

```html
<!DOCTYPE html>
<!--[if lt IE 7]>      <html class="lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class=""> <!--<![endif]-->
<head>
    <meta charset="utf-8">
<!-- ... -->
```

In your RequireJS config, since the test is relatively short, you create a property `ltIE9` that stores the result of querying the DOM to determine if its `<html>` element has the `lt-ie9` class.

```javascript
require.config({
	baseUrl: './',
	paths: {
		// ...
	},
	config: {
		conditional: {
			/**
			 * Is this browser older than IE 9?
			 */
			ltIE9: document.documentElement.className.indexOf('lt-ie9') !== -1
		}
	}
});
```

Now you can reference this property in your conditional.js declaration for jQuery. 

However, you may have many different modules in your application that all need to declare a dependency on jQuery and have it injected. You *do not* want to specify the long conditional.js declaration in every place you would normally only need 'lib/jquery'. To get around this, just create a simple wrapper module named 'jquery.js' alongside the two real jQuery files in your 'lib' directory:

```javascript
define([ 'conditional!{ "test": "ltIE9", "load": [ "lib/jquery-2.1.1", "lib/jquery-1.11.1" ] }' ], function (jquery) {
	return jquery;
});
```

If the `ltIE9` property is `false`, 'lib/jquery-2.1.1' will be loaded; if `true`, 'lib/jquery-1.11.1' will be loaded. (Note that in this case, a boolean value will be converted to array indexes 0 (false) and 1 (true), since the `load` property is an array.)

Now you can simply require 'lib/jquery' everywhere else:

```javascript
require([
	'lib/jquery',
	// ...
], function ($/*, ... */) {
	// Do stuff with $, which might be v1.11.1 or v2.1.1...
});

// And in some other module ... 

define([
	'lib/jquery',
	// ...
], function ($/*, ... */) {
	// do stuff with $...
});
```

**Note**: The config property value or function return value for your test should either be a boolean or a number. Numbers are only useful if you have more than two possible dependencies to choose from at runtime; the number will be interpreted as an index into the `load` array.

## Examples

The previous two examples can be found with fuller context in the [examples](https://github.com/sirbarrence/conditional.js/tree/master/examples) directory. It includes dummy versions of a two versions of jQuery and an ES5 shim library that are loaded and used by a `main.js` script as well as a child script, creatively named `script1.js`.

## Tests

There are a handful of Jasmine tests that can be run on the command line via Node and PhantomJS. Clone this repo and change into its directory, then use `npm` and `bower` to install some dev dependencies and use `grunt` to run the tests.

```bash
npm install -g grunt-cli
npm install
bower install
grunt test
```

## Caveats 

- Please be aware that when you conditionally load a script dependency at runtime, you're accepting the fact that the r.js optimizer will not be able to include the file in the build with all of your other code. Loading it will always incur an extra HTTP request.
- This plugin is intended for projects where the overall size of your r.js build is quite large, and it may be beneficial to load a handful of your libraries separately and conditionally instead of including them in a single monolitic file. If your project needs to reduce the overall number of HTTP requests more than it needs to reduce its download size, you probably don't want to use this plugin. In that case, creating multiple build targets - "modern", "legacy", etc. - might be more helpful for you. You might also consider sticking with older library versions for all users until you can drop support for older browsers.

## License

Distributed under the MIT license.

