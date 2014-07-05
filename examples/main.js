/*jshint browser: true, laxbreak: true, plusplus: false, undef: true, unused: true, smarttabs: true */
/*global require */

require.config(
	{
		baseUrl: './',
		waitSeconds: 0,
		paths: {
			'src': '../src'
		},
		config: {
			conditional: {
				/**
				 * Example test for ES5 Object support.
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
				},
				/**
				 * Is this browser < IE 9?
				 */
				ltIE9: document.documentElement.className.indexOf('lt-ie9') !== -1
			}
		}
	}
);

require(
	[
		// Might be jQuery v1 or v2, depending on the value of ltIE9 above.
		'lib/jquery',
		// This will cause an ECMAScript 5 shim to load if the missingES5 function in the config above returns something truthy.
		'src/conditional!{ "test":"missingES5", "load": "lib/es5shim" }',
		// This is some other dependency script that also depends on jquery.
		'script1'
	], function (jquery, es5Shim, script1) {
		'use strict';

		console.log(es5Shim); // Should print 'undefined' for modern browsers or some string for older browsers.
		console.log(jquery); // Should print a message containing the version of jQuery that was loaded, depending if the browser is IE < 9
	}
);
