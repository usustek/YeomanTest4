'use strict';

/**
 * @ngdoc function
 * @name yeomanTest4App.controller:FindCtrl
 * @description
 * # FindCtrl
 * Controller of the yeomanTest4App
 */
angular.module('yeomanTest4App')
  .controller('FindCtrl', function ($rootScope, $scope, busData) {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
    
    $scope.findDeparture = function(){
      $rootScope.$broadcast('hoge', this);
      console.log("broadcasted");
    };
    
    $scope.findArrival = function(){
      
    };
    
    console.log("loaded find");
  });
