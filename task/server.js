'use strict';

var spawn = require('child_process').spawn,
  path = require('path'),
  start = function(grunt) {
    var server,
      args = [path.join(process.cwd(), 'node_modules')];
    
    if(process.env.NODE_INSPECTOR) {
      args.unshift('--debug');
    }
    
    server = spawn(process.execPath, args, {
        env: process.env,
        cwd: process.cwd(),
        stdio: 'inherit'
    });
    
    grunt.log.ok('Started server with pid (' + server.pid + ')');

    return server;
  };

module.exports = start;