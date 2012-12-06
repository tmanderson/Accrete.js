module.exports = function(grunt) {

	grunt.initConfig({
		pkg: {
			name	: "Accrete.js",
			author	: "Mitch Anderson",
			version : "0.0.1"
		},
		concat: {
			all: {
				src : [
					'src/Astro.js',
					'src/DoleParams.js',
					'src/DustBands.js',
					'src/Planetismal.js',
					'src/Accrete.js'
				],
				dest: './accrete.js'
			}	
		}
	});

	grunt.registerTask('default', 'concat:all');
};