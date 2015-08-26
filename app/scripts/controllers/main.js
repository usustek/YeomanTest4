'use strict';

/**
 * @ngdoc function
 * @name yeomanTest4App.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the yeomanTest4App
 */
var app = angular.module('yeomanTest4App');

  app.controller('MainCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });

