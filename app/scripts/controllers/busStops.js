'use strict';

/**
 * @ngdoc function
 * @name yeomanTest4App.controller:BusStopsCtrl
 * @description
 * # BusStopsCtrl
 * Controller of the yeomanTest4App
 */
var app = angular.module('yeomanTest4App');

app.controller('BusStopsCtrl', function($scope, $window, $timeout, busData) {
    $scope.busData = busData;
    
    // $scope.fundBusStops = function() {
    //     return busData.fundBusStops();
    // };
    
    $scope.clearData = function() {
        busData.crearData();
    };
    
    $scope.getLocations = function() {
        busData.getLocations(function(){$scope.refreshData();});
    };
    
    // 非同期での検索処理
    $scope.findBusStop2 = function() {
        busData.findBusStop2();
    };
    

    $scope.findBusStop = function() {
        busData.findBusStop();
    };
    
    $scope.loadLocations = function() {
        busData.loadLocations(function(){$scope.refreshData();});
    };

    $scope.refreshData = function(){
        // 強制的にデータを反映
        if(!$scope.$$phase){
//            $scope.$apply(function () {
//                $scope.target = 'value';
//            });
            $scope.$apply();
        }
    };    

    console.log("loaded busstops");

  });
