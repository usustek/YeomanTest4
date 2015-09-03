'use strict';

/**
 * @ngdoc function
 * @name yeomanTest4App.controller:FindCtrl
 * @description
 * # FindCtrl
 * Controller of the yeomanTest4App
 */
angular.module('yeomanTest4App')
  .controller('FindCtrl', function ($rootScope, $scope, $window, busData) {
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
    
    $scope.search = function()
    {
      //busData.search("HOGE", "FUGA");  
      var uri = "http://www.kotsu-city-kagoshima.jp/wp/timesearch/search_index.php";
      var win = $window.open(uri, 'Search');
      
      // var st = win.Document.body.getElementById("str");
      // st.value = stName;
      $sce.tr
      win.setTimeout(function() {
        win.addEventListener('load', function() {
             var st = window.document.getElementById("str");
             st.value = "HOGE";
         }, false);
        // win.onload = function() {
        //     var st = window.document.getElementById("str");
        //     st.value = "HOGE";
        // };
      }, 0);
      
      var i = 0;
    };
    
    console.log("loaded find");
  });
