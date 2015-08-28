'use strict';

var start = require('./task/server');

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');

  var server = null;
      
  grunt.initConfig({
    watch: {
      reload: {
        files: '*.js',
        tasks: ['reload'],
        options: {
          spawn: false
        }
      }
    }
  });

  var startTask = function() {
    grunt.log.ok('Starting server');
    server = start(grunt);
    grunt.task.run('watch');
  };

  grunt.registerTask('reload', 'Reload the server', function() {
    grunt.log.ok('Reloading the server at pid (' + server.pid + ')');
    server.kill();
    server = start(grunt);
  });

  grunt.registerTask('start', 'Starting Server', function() {
    startTask();
  });
};