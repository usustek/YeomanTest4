'use strict';

/**
 * @ngdoc service
 * @name yeomanTest4App.busData
 * @description
 * # busData
 * Service in the yeomanTest4App.
 */
angular.module('yeomanTest4App')
  .service('busData', function ($window, $q) {
    this.urlBase = 'http://www.kotsu-city-kagoshima.jp/';
    this.urlRosen = 'wp/timesearch/rosen_list.php?syubetuId={0}';
    this.urlStops = 'wp/timesearch/strEnd.php?rosen_id={0}?syubetuId={1}';
    this.urlTimes = 'wp/timesearch/time_table.php?rosenId={0}&name={1}';
    this.urlSearch = 'wp/timesearch/search_index.php';
    this.urlResult = 'wp/timesearch/search_result.php';
    /* need FormData
        str:出発バス停
        end:到着バス停
        daiya_kubun:0 平日, 1 土曜, 2 日祝
        hour:16
        minute:40
        option: 1 発車時刻, 2 到着時刻, 3 始発, 4 最終,
        norikae: 1  */
    
    this.webdb = $window.openDatabase('mydb', '', 'My BusStops Database', 1024 * 1024 * 2);
    
    this.currentPosition = null;
    this.rosens = [];
    this.busStops = [];
    this.busStopIds = [];
    this.fundBusStops = [];
    
    this.clearData = function() {
      this.rosens = [];
      this.busStops = [];
      this.busStopIds = [];
      this.fundBusStops = [];
    };
    
    this.getLocations = function(finishProc) {
        var self = this;
        this.clearData();
        this.webdb.transaction( function(tr){
            tr.executeSql('DELETE FROM BUSSTOPS');
        });

        var defs = [];
        //$window.jQuery.each([0,1], function() { defs.push( getLocationsRosen(this) );});
        defs.push(this.getLocationsRosen(0));
        defs.push(this.getLocationsRosen(1));
            
        $q.all(defs)
          .then(function() {
                    self.loadLocations();         // 追加データを取得
                    if((finishProc !== undefined) && (finishProc !== null)){
                        finishProc();
                    }
                    //alert('Finish!');
                },
                function() { /*alert('Error.');*/ });
    };

    this.getLocationsRosen = function (shubetsu) {
        var deferd = $q.defer();
        var uri = this.urlBase + this.urlRosen;
        uri = uri.replace('{0}', shubetsu.toString());
        var self = this;
        
        $window.jQuery.ajax({
            url: uri,
            type: 'GET',
            success: function (res) {
                var dom = $window.jQuery.parseHTML(res.responseText);
                var wrap = null;
                $window.jQuery.each(dom, function (idx, val) {
                    if (val.id === 'wrap') {
                        wrap = val.querySelector('table');
                    }
                });

                if (wrap !== null) {
                    var reg = /rosenId=(\d+)(,(\d+))?/;
                    var isnull = function (str) { return (str === undefined) || (str === null) || (str === ''); };
                    $window.jQuery.each(wrap.querySelectorAll('tr > td:first-child > a[href]'),
                        function () {    // 路線一覧
                            if (this.innerText.indexOf('シティビュー') >= 0) {
                            }
                            else {
                                var defs = [];
                                var res = reg.exec(this.href);
                                if (!isnull(res[1])) {
                                    defs.push(self.getLocationsStops(shubetsu, res[1]));
                                }
                                if (!isnull(res[3])) {
                                    defs.push(self.getLocationsStops(shubetsu, res[3]));
                                }

                                $q.all(defs).then(
                                    function () {
                                        deferd.resolve(this);
                                    },
                                    function () {
                                        deferd.reject(this);
                                    });
                            }
                        });
                }
            },
            error: function () {
                deferd.reject(this);
            }
        });

        return deferd.promise;
    };

    this.getLocationsStops = function(shubetsu, rosen) {
        var self = this;
        var deferd = $q.defer();
        var uri = this.urlBase + this.urlStops;
        uri = uri.replace('{0}', rosen.toString());
        uri = uri.replace('{1}', shubetsu.toString());

        $window.jQuery.ajax({
            url: uri,
            type: 'GET',
            success: function(res) {
                try{
                    var dom = $window.jQuery.parseJSON(/\[.*\]/.exec(res.responseText)[0]);
                    $window.jQuery.each( dom, function() { 
                        if ( $window.jQuery.inArray(this.id, this.busStopIds) === -1) {
                            var tmp = {id: this.id, name: this.bus, lat: this.ido, long: this.keido };

                            if (this.bus.indexOf('シティビュー') >= 0) {
                            }
                            else{
                                self.webdb.transaction( function(tr){
                                    tr.executeSql('INSERT OR REPLACE INTO BUSSTOPS VALUES(?, ?, ?, ?)',
                                                [tmp.id, tmp.name, tmp.lat, tmp.long]);
                                });
                            }
                        }
                    });
                }
                catch(e){}
                deferd.resolve(this);
            },
            error: function() {
                deferd.reject(this);
            }
        });
        
        return deferd.promise;
    };
    
    // 非同期での検索処理
    this.findBusStop2 = function(loaded) {
        var self = this;
        this.findBusStop2_1()
            .then(function(){
                 self.findBusStop2_2(self);
                  },
                  function(){
                       alert('位置情報が取得できません。');
                        })
            .then(function(res) {
                    self.fundBusStops.sort(function(a,b) { return a.span - b.span; });
                },
                function(res){ alert('バス停の位置情報が取得できません。'); })
            .then(function() {
                 self.findBusStop2_3(self);
                  } )
            .then(function(res) {
                  self.fundBusStops.sort(function(a,b) { return a.walk - b.walk; });
                  if ( null !== loaded ){
                      loaded();
                  }
            });
    };
        
    //　現在位置取得
    this.findBusStop2_1 = function() {
        var deferd = $q.defer();
        var self = this;
        this.clearData();
        
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(
                    function(pos){ 
                        self.currentPosition = pos.coords;
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
    this.findBusStop2_2 = function(self) {
        var deferd = $q.defer();

        var maps = $window.google.maps;

        //var pos = $scope.currentPosition;
        var pos = new maps.LatLng(self.currentPosition.latitude, self.currentPosition.longitude);
    
        $q.all([this.findBusStop2_2a(self, pos),
                this.findBusStop2_2b(self, pos)])
           .then(function() { deferd.resolve(this); },
                 function() { deferd.reject(this); });
        
        return deferd.promise;
    };

    this.findBusStop2_2a = function(self, pos) {
        var maps = $window.google.maps;
        var geo = new maps.Geocoder();
        var def = $q.defer();
        geo.geocode({location: pos},
                function(ary){ 
                    try{
                        if (ary.length > 0){
                            self.currentPosition.name = ary[0].formatted_address;
                        }
                        def.resolve(this);
                    }
                    catch(e) {
                        def.reject(this);
                    }
                });
        return def.promise;
    };
    
    this.findBusStop2_2b = function(self, pos) {
        var def = $q.defer();
        var maps = $window.google.maps;
        var distance = maps.geometry.spherical;

        self.webdb.transaction(function(tr){
            tr.executeSql('SELECT *,((latitude - ?)*(latitude - ?)) + ((longitude - ?)*(longitude - ?)) as span FROM BUSSTOPS ORDER BY span',
                        [pos.G, pos.G, pos.K, pos.K],
                        //[pos.latitude, pos.latitude, pos.longitude, pos.longitude],
                        function(tr,res){
                            //var direct = new google.maps.DirectionsService();
                            self.fundBusStops = [];
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
                                self.fundBusStops.push(st);
                            }
                            self.fundBusStops.sort(function(a,b) { return a.dist - b.dist; });
                            def.resolve(this);
                        },
                        function(tr,err){
                            def.reject(this);
                        });
        });
        
        return def.promise;
    };
    
    // 現在地から各バス停への道のりを取得
    this.findBusStop2_3 = function(self) {
        var deferd = $q.defer();
   
        var maps = $window.google.maps;
        var distance = maps.geometry.spherical;
        var direct = new maps.DirectionsService();
        var src = new maps.LatLng(self.currentPosition.latitude, self.currentPosition.longitude);
        var defs = [];
        
        for(var i = 0; i < self.fundBusStops.length; i ++) {
            var stop = self.fundBusStops[i];
            deferd.notify(this);

            var dst = new maps.LatLng(stop.lat,stop.long);
            var tmp = function() {
                var idx = i;
                var def = $q.defer();
                defs.push(def.promise);
                return function(res, stat){
                    
                    if ( (stat === maps.DirectionsStatus.OK) && (res.routes.length > 0)){
                        try{
                            self.fundBusStops[idx].walk = distance.computeLength(res.routes[0].overview_path);
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
    
    this.loadLocations = function(finishProc) {
        var self = this;
        this.clearData();

        if(this.webdb !== null) {
            this.webdb.transaction(
                function(tr){
                    tr.executeSql('SELECT * FROM BUSSTOPS', [],
                            function(tr,res) {
                                for(var i = 0; i < res.rows.length; i ++) {
                                    var row = res.rows.item(i);
                                    self.busStops.push({id: row.id, name: row.name, lat: row.latitude, long: row.longitude});
                                }
                                if((finishProc !== undefined) && (finishProc !== null)){
                                    finishProc();
                                }
                            });
                },
                function(err){
                    if((finishProc !== undefined) && (finishProc !== null)){
                        finishProc();
                    }
                });
        }
    };

    this.search = function(stName, edName, loaded) {
        var uri = this.urlBase + this.urlResult;
        var win = $window.open(uri, 'Search');
        
        // var st = win.Document.body.getElementById("str");
        // st.value = stName;
        win.setTimeout(function() {
            // win.addEventListener('load', function() {
            //     var st = window.document.getElementById("str");
            //     st.value = stName;
            // }, false);
            win.onload = function() {
                var st = window.document.getElementById("str");
                st.value = stName;
            };
        }, 0);
        
        var i = 0;
    };
    
    this.search2 = function(stName, edName, loaded) {
        var self = this;
        var deferd = $q.defer();
        var uri = this.urlBase + this.urlResult;
        
        $window.jQuery.ajax({
            url: uri,
            type: 'POST',
            data: {
                 str: stName, 
                 end: edName,
                 daiya_kubun: 0,
                 hour: 16,
                 minute: 40,
                 option: 1
            },
            success: function(res){
                var dom = $window.jQuery.parseHTML(res.responseText);
                var wrap = null;
                deferd.resolve(this);
            },
            error: function(xreq, stat, err) {
                deferd.reject(this);
            }
        });
    }
    
    if(this.webdb !== null) {
        var db = this.webdb;
        db.transaction(function(tr) {
            tr.executeSql('CREATE TABLE IF NOT EXISTS BUSSTOPS(id integer not null primary key, name text, latitude real, longitude real)');
        });
    }
    
    console.log("loaded busData");
});
