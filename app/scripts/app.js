'use strict';

/**
 * @ngdoc overview
 * @name yeomanTest4App
 * @description
 * # yeomanTest4App
 *
 * Main module of the application.
 */
angular
  .module('yeomanTest4App', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/stops', {
        templateUrl: 'views/stops.html',
        controller: 'BusStopsCtrl'
      })
      .when('/find', {
        templateUrl: 'views/find.html',
        controller: 'FindCtrl',
        controllerAs: 'find'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
  
//  angular
//  .module('yeomanTest4App').config(['$httpProvider', function($httpProvider) {
//        $httpProvider.defaults.useXDomain = true;
//        delete $httpProvider.defaults.headers.common['X-Requested-With'];
//    }
//    ]);

//angular.module('yeomanTest4App', ['uiGmapgoogle-maps']).config(
//    ['uiGmapGoogleMapApiProvider', function(GoogleMapApiProviders) {
//        GoogleMapApiProvider.configure({
//            china: true
//        });
//    }]
//);