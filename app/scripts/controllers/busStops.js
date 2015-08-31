'use strict';

/**
 * @ngdoc function
 * @name yeomanTest4App.controller:BusStopsCtrl
 * @description
 * # BusStopsCtrl
 * Controller of the yeomanTest4App
 */
var app = angular.module('yeomanTest4App');

app.controller('BusStopsCtrl', function ($rootScope, $scope, $http, $window, $q) {
    $scope.urlBase = 'http://www.kotsu-city-kagoshima.jp/';
    $scope.urlRosen = 'wp/timesearch/rosen_list.php?syubetuId={0}';
    $scope.urlStops = 'wp/timesearch/strEnd.php?rosen_id={0}?syubetuId={1}';
    $scope.urlTimes = 'wp/timesearch/time_table.php?rosenId={0}&name={1}';
    
    $scope.currentPosition = null;
    $scope.rosens = [];
    $scope.busStops = [];
    $scope.busStopIds = [];
    $scope.fundBusStops = [];
    $scope.webdb = window.openDatabase('mydb', '', 'My BusStops Database', 1024 * 1024 * 2);
    
    $scope.clearData = function() {
        $scope.rosens = [];
        $scope.busStops = [];
        $scope.busStopIds = [];
        $scope.fundBusStops = [];
    };
    
    $rootScope.$on('hoge', function(event, args) {
       var i = 0;
       i++; 
    });

    $scope.getLocations = function() {
        $scope.clearData();
        $scope.webdb.transaction( function(tr){
            tr.executeSql('DELETE FROM BUSSTOPS');
        });

        var defs = [];
        $window.jQuery.each([0,1], function() { defs.push( $scope.getLocationsRosen(this) );});
        
        $q.all(defs)
                .then(
                    function() {
                        // 追加データを取得
                        $scope.loadLocations();
                        // 強制的にデータを反映
                        $scope.refreshData();
                        //alert('Finish!');
                    },
                    function() { alert('Error.'); });
    };

    $scope.getLocationsRosen = function(shubetsu) {
        var deferd = $q.defer();
        var uri = $scope.urlBase+$scope.urlRosen;
        uri = uri.replace('{0}', shubetsu.toString());

        $window.jQuery.ajax({
            url: uri,
            type: 'GET',
            success: function(res) {
                var dom = $window.jQuery.parseHTML(res.responseText);
                var wrap = null;
                $window.jQuery.each( dom, function(idx, val) { 
                    if( val.id === 'wrap' ) {
                        wrap = val.querySelector('table');
                    }
                });
                
                if(wrap !== null) {
                    var reg = /rosenId=(\d+)(,(\d+))?/;
                    var isnull = function(str) { return (str === undefined) || (str === null) || (str === ''); };
                    $window.jQuery.each(wrap.querySelectorAll('tr > td:first-child > a[href]'),
                    function() {    // 路線一覧
                        if (this.innerText.indexOf('シティビュー') >= 0) {
                        }
                        else {
                            var defs = [];
                            var res = reg.exec(this.href);
                            if(!isnull(res[1])) {
                                defs.push($scope.getLocationsStops(shubetsu, res[1]));
                            }
                            if(!isnull(res[3])) {
                                defs.push($scope.getLocationsStops(shubetsu, res[3]));
                            }
                            
                            $q.all(defs).then(
                                    function() {
                                        deferd.resolve(this);
                                    },
                                    function() {
                                        deferd.reject(this);
                                    });
                        }
                    });
                }
            },
            error: function() {
                deferd.reject(this);
            }
        });    
        
        return deferd.promise;
    };
    
    $scope.getLocationsStops = function(shubetsu, rosen) {
        var deferd = $q.defer();
        var uri = $scope.urlBase+$scope.urlStops;
        uri = uri.replace('{0}', rosen.toString());
        uri = uri.replace('{1}', shubetsu.toString());

        $window.jQuery.ajax({
            url: uri,
            type: 'GET',
            success: function(res) {
                try{
                    var dom = $window.jQuery.parseJSON(/\[.*\]/.exec(res.responseText)[0]);
                    $window.jQuery.each( dom, function() { 
                        if ( $window.jQuery.inArray(this.id, $scope.busStopIds) === -1) {
                            var tmp = {id: this.id, name: this.bus, lat: this.ido, long: this.keido };

                            if (this.bus.indexOf('シティビュー') >= 0) {
                            }
                            else{
                                $scope.webdb.transaction( function(tr){
                                    tr.executeSql('INSERT OR REPLACE INTO BUSSTOPS VALUES(?, ?, ?, ?)',
                                                [tmp.id, tmp.name, tmp.lat, tmp.long]);
                                });
                            }
                        }
                    });
                }
                catch(e){
                    var iii = 0;
                }
                deferd.resolve(this);
            },
            error: function() {
                deferd.reject(this);
            }
        });
        
        return deferd.promise;
    };
    
    // 非同期での検索処理
    $scope.findBusStop2 = function() {
        $scope.findBusStop2_1()
            .then($scope.findBusStop2_2,
                  function(){ alert('位置情報が取得できません。'); })
            .then(function(res) {
                    $scope.fundBusStops.sort(function(a,b) { return a.span - b.span; });
                },
                function(res){ alert('バス停の位置情報が取得できません。'); })
            .then($scope.findBusStop2_3)
            .then(function() {
                  $scope.fundBusStops.sort(function(a,b) { return a.walk - b.walk; });
                  $scope.refreshData();
            },
            function(){
                var i = 0;
            },
            function(){
                var i = 0;
            });
    };
    
    //　現在位置取得
    $scope.findBusStop2_1 = function() {
        var deferd = $q.defer();
        $scope.clearData();
        
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
                    function(pos){ 
                        $scope.currentPosition = pos.coords;
                        deferd.resolve(this);
                    },
                    function(res){
                        deferd.reject(this);
                    },
                    {enableHighAccuracy: true, timeout: 15000});
        }
        else {
            deferd.reject(this);
        }

        return deferd.promise;
    };
    
    // 現在位置からの近傍バス停取得
    // ※ついでに現在地からの直線距離を取得
    $scope.findBusStop2_2 = function() {
        var deferd = $q.defer();

        var maps = $window.google.maps;
        var distance = maps.geometry.spherical;
        var geo = new maps.Geocoder();
        //var pos = $scope.currentPosition;
        var pos = new maps.LatLng($scope.currentPosition.latitude, $scope.currentPosition.longitude);

        geo.geocode({location: pos},
                    function(ary){ 
                        try{
                            if (ary.length > 0){
                                $scope.currentPosition.name = ary[0].formatted_address;
                            }
                        }
                        catch(e) {
                            var iii = 0;
                        }
                    });
        $scope.webdb.transaction(function(tr){
            tr.executeSql('SELECT *,((latitude - ?)*(latitude - ?)) + ((longitude - ?)*(longitude - ?)) as span FROM BUSSTOPS ORDER BY span',
                        [pos.G, pos.G, pos.K, pos.K],
                        //[pos.latitude, pos.latitude, pos.longitude, pos.longitude],
                        function(tr,res){
                            var direct = new google.maps.DirectionsService();
                            $scope.fundBusStops = [];
                            for(var i = 0; i < Math.min(10, res.rows.length); i ++){
                                var row = res.rows.item(i);
                                var dst = new maps.LatLng(row.latitude,row.longitude);
                                var st = {id: row.id,
                                            name: row.name,
                                            lat: row.latitude,
                                            long: row.longitude,
                                            span: Math.sqrt(row.span),
                                            dist: distance.computeDistanceBetween(pos, dst),
                                            walk: 0};
                                $scope.fundBusStops.push(st);

                                deferd.notify(this);
                            }
                            $scope.fundBusStops.sort(function(a,b) { return a.dist - b.dist; });
                            deferd.resolve(this);
                        },
                        function(tr,err){
                            deferd.reject(this);
                        }
            );
        });

        return deferd.promise;
    };
    
    // 現在地から各バス停への道のりを取得
    $scope.findBusStop2_3 = function() {
        var deferd = $q.defer();

        var maps = $window.google.maps;
        var distance = maps.geometry.spherical;
        var direct = new maps.DirectionsService();
        var src = new maps.LatLng($scope.currentPosition.latitude, $scope.currentPosition.longitude);
        var defs = [];
        
        for(var i = 0; i < $scope.fundBusStops.length; i ++) {
            var stop = $scope.fundBusStops[i];
            deferd.notify(this);

            var dst = new maps.LatLng(stop.lat,stop.long);
            var tmp = function() {
                var idx = i;
                var def = $q.defer();
                defs.push(def.promise);
                return function(res, stat){
                    
                    if ( (stat === maps.DirectionsStatus.OK) && (res.routes.length > 0)){
                        try{
                            $scope.fundBusStops[idx].walk = distance.computeLength(res.routes[0].overview_path);
                        }catch(e){
                        }
                    }
                    def.resolve(this);
                };
            };
            direct.route({origin:src, destination:dst, travelMode: maps.TravelMode.WALKING }, tmp());
        }
        
        $q.all(defs)
            .then(
                function() {
                    deferd.resolve(this);
                },
                function() {
                    deferd.reject(this);
                });
        //deferd.resolve(this);
        
        return deferd.promise;
    };

    $scope.findBusStop = function() {
        var deferd = $q.defer();
        $scope.clearData();
        
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
                    function(pos){ 
                        $scope.currentPosition = pos.coords;
                        var maps = $window.google.maps;
                        var distance = maps.geometry.spherical;
                        var geo = new maps.Geocoder();
                        var loc = new maps.LatLng(pos.coords.latitude, pos.coords.longitude);

                        geo.geocode({location: loc},
                                    function(ary){ 
                                        if (ary.length > 0){
                                            $scope.currentPosition.name = ary[0].formatted_address;
                                        }
                                    });
                        $scope.webdb.transaction(function(tr){
                            tr.executeSql('SELECT *,((latitude - ?)*(latitude - ?)) + ((longitude - ?)*(longitude - ?)) as span FROM BUSSTOPS ORDER BY span',
                                         [pos.coords.latitude, pos.coords.latitude, pos.coords.longitude, pos.coords.longitude],
                                        function(tr,res){
                                            var direct = new google.maps.DirectionsService();
                                            $scope.fundBusStops = [];
                                            for(var i = 0; i < Math.min(25, res.rows.length); i ++){
                                                var row = res.rows.item(i);
                                                var dst = new maps.LatLng(row.latitude,row.longitude);
                                                var st = {id: row.id,
                                                            name: row.name,
                                                            lat: row.latitude,
                                                            long: row.longitude,
                                                            span: Math.sqrt(row.span),
                                                            dist: distance.computeDistanceBetween(loc, dst)};
                                                $scope.fundBusStops.push(st);

                                                var tmp = function(){
                                                    var target = st;
                                                    return function(res, stat){
                                                                var ttt = target;
                                                                if((res !== null) && (res.routes.length>0)){
                                                                    target.walk = distance.computeLength(res.routes[0].overview_path);
                                                                    $scope.refreshData();
                                                                }
                                                            };

                                                };
                                                loc.target = st;
                                                direct.route({origin:loc, destination:dst, travelMode: 'WALKING'}, tmp());

                                                deferd.notify(this);
                                            }
                                            $scope.fundBusStops.sort(function(a,b) { return a.dist - b.dist; });
                                            deferd.resolve(this);
                                        });
                        });
                       
                    },
                    function(){
                        deferd.reject(this);
                    },
                    {enableHighAccuracy: true, timeout: 15000});
        }
        else {
            deferd.reject(this);
            alert('位置情報が取得できません。');
        }

        return deferd.promise;
    };
    
    $scope.loadLocations = function() {
        $scope.clearData();

        if($scope.webdb !== null) {
            $scope.webdb.transaction(function(tr){
                tr.executeSql('SELECT * FROM BUSSTOPS', [],
                            function(tr,res) {
                                for(var i = 0; i < res.rows.length; i ++) {
                                    var row = res.rows.item(i);
                                    $scope.busStops.push({id: row.id, name: row.name, lat: row.latitude, long: row.longitude});
                                }
                                $scope.refreshData();
                            });
            });
        }
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
    
    if($scope.webdb !== null) {
        var db = $scope.webdb;
        db.transaction(function(tr) {
            tr.executeSql('CREATE TABLE IF NOT EXISTS BUSSTOPS(id integer not null primary key, name text, latitude real, longitude real)');
        });
    }
    
    console.log("loaded busstops");

  });
