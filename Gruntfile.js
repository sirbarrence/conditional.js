module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig(
		{
			connect: {
				test: {
					options: {
						port: 8100
					}
				}
			},
			jasmine: {
				test: {
					options: {
						specs: 'test/*Spec.js',
						host: 'http://127.0.0.1:8100/',
						template: require('grunt-template-jasmine-requirejs'),
						templateOptions: {
							requireConfig: {
								baseUrl: 'test/',
								paths: {
									'src': '../src'
								}
							}
						}
					}
				}
			}
		}
	);

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-contrib-connect');

	grunt.registerTask('test', ['connect', 'jasmine']);

};