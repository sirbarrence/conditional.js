/**
 * @license conditional.js 0.0.1 Copyright (c) 2014, Barry Simpson
 * Available via the MIT license.
 * https://github.com/sirbarrence/conditional.js
 */
/*jshint browser: true, laxbreak: true, plusplus: false, undef: true, unused: true, smarttabs: true */
/*global define */

define(function () {
	'use strict';

	function isArray(thing) {
		return thing
			&& typeof thing === 'object'
			&& Object.prototype.toString.call(thing) === '[object Array]';
	}

	return {
		/**
		 * Normalize each of the module names or paths in the 'load' property.
		 *
		 * @param unparsedParams JSON string with non-normalized paths
		 * @param normalize RequireJS's normalize function
		 *
		 * @returns string JSON string with normalized paths
		 */
		normalize: function (unparsedParams, normalize) {
			var params = JSON.parse(unparsedParams),
				loadType = typeof params.load,
				i;

			if ('string' === loadType) {
				params.load = [normalize(params.load)];
			} else if (isArray(params.load)) {
				for (i = 0; i < params.load.length; i ++) {
					params.load[i] = normalize(params.load[i]);
				}
			} else if (loadType === 'undefined') {
				throw 'Missing "load" parameter for conditional plugin.';
			} else {
				throw 'Unexpected "load" parameter type for conditional plugin.';
			}

			return JSON.stringify(params);
		},

		/**
		 * Conditionally load a module based on the value / return value of a property in the config object.
		 *
		 * @param {string} unparsedParams The argument to this plugin; the part after the '!'.
		 * @param {function} req The require function we use to load the chosen module.
		 * @param {function} onLoad Invoked once we've loaded the desired module.
		 * @param {object} requireConfig The object passed to requirejs.config(). Contains the 'config' property we look for the
		 * test key on.
		 */
		load: function (unparsedParams, req, onLoad, requireConfig) {
			// If we're being invoked by the r.js optimizer at build time, do nothing.
			// We always have to load this particular resource conditionally at runtime.
			if (requireConfig.isBuild) {
				onLoad();
			} else {
				// Get the 'config' object for this loader module inside the config object passed to require.config({}).
				if ( ! requireConfig.config) {
					onLoad.error('No "config" property provided in require.config() call.');
					return;
				}

				if ( ! requireConfig.config.conditional) {
					onLoad.error('No "conditional" property provided in "config" property of object passed to require.config().');
					return;
				}

				var config = requireConfig.config.conditional,
					params = JSON.parse(unparsedParams),
					testParamType = typeof params.test,
					testVarType,
					testVal,
					moduleName;

				if ('string' !== testParamType) {
					onLoad.error('"test" property on plugin params must be a string.');
				}

				testVarType = typeof config[params.test];

				// If the config value is a function, invoke it and convert its return value to a number.
				if ('function' === testVarType) {
					testVal = config[params.test]();
				} else if ('number' === testVarType || 'boolean' === testVarType) {
					testVal = config[params.test];
				} else {
					onLoad.error('Unexpected type "'+testVarType+'" for config.'+params.test+'.');
				}

				// If there's only one module, testVal is treated as a boolean that indicates whether or not to load that module.
				if (params.load.length === 1 && testVal) {
					moduleName = params.load[0];
				} else if (params.load.length > 1) {
					// Else testVal is treated like an array index.
					moduleName = params.load[+testVal];
				}

				if (moduleName) {
					req([moduleName], function (loadedModule) {
						onLoad(loadedModule);
					});
				} else {
					// nothing to do
					onLoad();
				}
			}
		}
	};
});
