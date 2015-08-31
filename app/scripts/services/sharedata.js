'use strict';

/**
 * @ngdoc service
 * @name yeomanTest4App.ShareData
 * @description
 * # ShareData
 * Service in the yeomanTest4App.
 */
angular.module('yeomanTest4App')
  .service('ShareData', function ($rootScope, $scope) {
    // AngularJS will instantiate a singleton by calling "new" on this function
    $rootScope.$on('hoge', function(event,args){
      var i = 0;
      i++;
    });
  });
