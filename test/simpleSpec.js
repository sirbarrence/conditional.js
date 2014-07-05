/*jshint browser: true, laxbreak: true, plusplus: false, undef: true, unused: true, smarttabs: true */
/*global require */

define(
	[
		'src/conditional'
	], function (conditional) {
		'use strict';

		describe('conditional.js', function() {
			it('should load', function() {
				expect(conditional).toBeDefined();
			});

			function mockNormalize(moduleName) {
				return moduleName;
			}

			describe('normalize()', function () {

				it('should turn "load" string into an array of one string', function () {
					var obj = {
						test: "boolVar",
						load: "lib/some_polyfill"
					};
					var input = JSON.stringify(obj);
					var normInput = conditional.normalize(input, mockNormalize);
					expect(typeof normInput).toBe('string');
					var parsed = JSON.parse(normInput);
					expect(typeof parsed.load).toBeDefined('object');
					expect(parsed.load.length).toBe(1);
					expect(parsed.load[0]).toBe(obj.load);
				});

				it('should call provided normalize function on every load entry', function () {
					var spyNormalize, obj, input, normInput, parsed;

					spyNormalize = jasmine.createSpy('normalize');

					spyNormalize.and.callFake(function (instr) {
						return instr.toUpperCase();
					});

					obj = {
						test: "numberFn",
						load: ["lib/mod1", "lib/mod2", 'lib/mod3']
					};
					input = JSON.stringify(obj);
					normInput = conditional.normalize(input, spyNormalize);
					expect(typeof normInput).toBe('string');
					parsed = JSON.parse(normInput);
					expect(typeof parsed.load).toBeDefined('object');
					expect(parsed.load.length).toBe(3);
					expect(parsed.load[0]).toBe(obj.load[0].toUpperCase());
					expect(parsed.load[1]).toBe(obj.load[1].toUpperCase());
					expect(parsed.load[2]).toBe(obj.load[2].toUpperCase());
					expect(spyNormalize).toHaveBeenCalledWith("lib/mod1");
					expect(spyNormalize).toHaveBeenCalledWith("lib/mod2");
					expect(spyNormalize).toHaveBeenCalledWith("lib/mod3");
				});
			});

			describe('load()', function () {
				it('should pick from an array of choices when given a function to invoke', function() {
					var onLoadFn, loadedModule, requireFn, obj, input, numberToReturn, requireConfig;

					obj = {
						test: "numberFn",
						load: ["lib/mod1", "lib/mod2", 'lib/mod3']
					};
					input = JSON.stringify(obj);
					numberToReturn = 0;
					requireConfig = {
						config: {
							conditional: {
								numberFn: jasmine.createSpy('numberFn').and.callFake(
									function () {
										return numberToReturn;
									}
								)
							}
						}
					};

					requireFn = jasmine.createSpy('requireFn').and.callFake(
						function (deps, callbackFn) {
							callbackFn(loadedModule);
						}
					);

					loadedModule = { foo: 'bar' };

					onLoadFn = jasmine.createSpy('onLoadFn');

					conditional.load(input, requireFn, onLoadFn, requireConfig);

					expect(requireConfig.config.conditional.numberFn).toHaveBeenCalled();
					expect(requireFn).toHaveBeenCalled();
					expect(requireFn.calls.mostRecent().args[0]).toEqual([ obj.load[numberToReturn] ]);
					expect(onLoadFn).toHaveBeenCalledWith(loadedModule);

					requireFn.calls.reset();
					onLoadFn.calls.reset();
					requireConfig.config.conditional.numberFn.calls.reset();
					numberToReturn = 2;
					loadedModule = [ 'brick', 'bat' ];

					conditional.load(input, requireFn, onLoadFn, requireConfig);

					expect(requireConfig.config.conditional.numberFn).toHaveBeenCalled();
					expect(requireFn).toHaveBeenCalled();
					expect(requireFn.calls.mostRecent().args[0]).toEqual([ obj.load[numberToReturn] ]);
					expect(onLoadFn).toHaveBeenCalledWith(loadedModule);
				});

				it('should load/not load a file in the "load" key when given a boolean var', function() {
					var onLoadFn;
					var loadedModule;
					var requireFn;
					var obj, input, requireConfig;

					obj = {
						test: 'boolProp',
						load: ["lib/mod1"]
					};
					input = JSON.stringify(obj);
					requireConfig = {
						config: {
							conditional: {
								boolProp: false
							}
						}
					};

					requireFn = jasmine.createSpy('requireFn1').and.callFake(
						function (deps, callbackFn) {
							callbackFn(loadedModule);
						}
					);

					loadedModule = { foo: 'bar' };

					onLoadFn = jasmine.createSpy('onLoadFn1');
					onLoadFn.error = function () {
						throw arguments;
					};

					conditional.load(input, requireFn, onLoadFn, requireConfig);

					expect(requireFn).not.toHaveBeenCalled();
					expect(onLoadFn).toHaveBeenCalledWith();

					requireFn.calls.reset();
					onLoadFn.calls.reset();
					requireConfig.config.conditional.boolProp = true;
					input = JSON.stringify(obj);

					conditional.load(input, requireFn, onLoadFn, requireConfig);

					expect(requireFn).toHaveBeenCalled();
					expect(requireFn.calls.mostRecent().args[0]).toEqual( obj.load );
					expect(onLoadFn).toHaveBeenCalledWith(loadedModule);
				});

				it('should treat a test function returning boolean as a 0/1 index if a load array is given', function () {
					var onLoadFn, loadedModule, requireFn, obj, input, boolToReturn, requireConfig;

					obj = {
						test: "boolFn",
						load: ["lib/mod1", "lib/mod2", 'lib/mod3']
					};
					input = JSON.stringify(obj);
					boolToReturn = false;
					requireConfig = {
						config: {
							conditional: {
								boolFn: jasmine.createSpy('boolFn').and.callFake(
									function () {
										return boolToReturn;
									}
								)
							}
						}
					};

					requireFn = jasmine.createSpy('requireFn').and.callFake(
						function (deps, callbackFn) {
							callbackFn(loadedModule);
						}
					);

					loadedModule = { foo: 'bar' };

					onLoadFn = jasmine.createSpy('onLoadFn');

					conditional.load(input, requireFn, onLoadFn, requireConfig);

					expect(requireConfig.config.conditional.boolFn).toHaveBeenCalled();
					expect(requireFn).toHaveBeenCalled();
					expect(requireFn.calls.mostRecent().args[0]).toEqual([ obj.load[0] ]);
					expect(onLoadFn).toHaveBeenCalledWith(loadedModule);

					requireFn.calls.reset();
					onLoadFn.calls.reset();
					requireConfig.config.conditional.boolFn.calls.reset();
					boolToReturn = true;
					loadedModule = [ 'brick', 'bat' ];

					conditional.load(input, requireFn, onLoadFn, requireConfig);

					expect(requireConfig.config.conditional.boolFn).toHaveBeenCalled();
					expect(requireFn).toHaveBeenCalled();
					expect(requireFn.calls.mostRecent().args[0]).toEqual([ obj.load[1] ]);
					expect(onLoadFn).toHaveBeenCalledWith(loadedModule);
				});

				it('should not do anything if isBuild is true', function () {
					var requireFn = jasmine.createSpy('requireFn1');
					var onLoadFn = jasmine.createSpy('onLoadFn1');
					conditional.load('{"test": "thing","load":"bogus"}', requireFn, onLoadFn, {isBuild:true});
					expect(requireFn).not.toHaveBeenCalled();
					expect(onLoadFn).toHaveBeenCalledWith();
				});
			});
		});
	}
);
