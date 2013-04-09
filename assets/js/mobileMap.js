;(function($) {
	
	var MobileMap = function(object, options) {
		centerCircle = new google.maps.Circle({fillColor: 'red'});
		var circles = [];
		
		var centerCircLat;
		var centerCircLng;
		var tf = false;
		var oldZoom = 0;
		//var center = new google.maps.LatLng(39.76, -86.15);
		var radius, hasLoaded = false, zoom;
		var $thisMap = $(object);
		var lat = 0;
		var lng = 0;
		var dist = 0;
		center = new google.maps.LatLng(39.76, -86.15);
		radius = 10;
		var thisMap = {
			
			callback: {
				newMarker: function(marker, lat, lng) {},	//calls new marker
			},
			db: new localStorageDB("MapIndex", localStorage),//storage variable
			bounds: new google.maps.LatLngBounds(),
			editIndex: false,
			arrayOfKeptMarkers: [],
			counter: 0,
			geocoder: new google.maps.Geocoder(),
			map: false,
			mapOptions: {
				zoom: 14,
				center: new google.maps.LatLng(0, 0), 
				mapTypeId: google.maps.MapTypeId.ROADMAP, 
				panControl: false,//disables pan control!
				scrollwheel: false // Doesn't allow zoom via scroll wheel on mouse, does not disable zoom scroll wheel on side.
				//navigationControl: false, gets rid of ui
				//mapTypeControl: false, gets rid of map type button
			},
			markers: [],
			ui: {
				map: $thisMap
			}
			
		}
		
		if(!options) {
			var options = {};
		}
		
		thisMap = $.extend(true, thisMap, options);
		
		thisMap.initialize = function(options) {
			
			if(options) {
				thisMap.mapOptions = $.extend(true, thisMap.mapOptions, options);	
			}
			
			thisMap.map = new google.maps.Map(thisMap.ui.map.get(0), thisMap.mapOptions);
			
			if(!thisMap.db.tableExists('markers')) {	//If a table does not exist then:		
			    thisMap.db.createTable("markers", ["name", "address", "response", "street", "city", "state", "zipcode", "lat", "lng"]);
			    thisMap.db.commit();
			}
			
			thisMap.db.query('markers', function(row) {//Add new marker to table (That exists)
				thisMap.newMarker(row.lat, row.lng, row.ID);
			});
			//thisMap.map.setBounds(lat, lng);
			return thisMap.map;
		}
		
		thisMap.removeCircle = function(){
			centerCircle.setRadius(0);
			thisMap.map.setZoom(thisMap.oldZoom);
			for(i=0;i<thisMap.counter;i++){
				thisMap.markers[thisMap.arrayOfKeptMarkers[i]].setMap(thisMap.map);
			}
			thisMap.home();
		}
		
		//delete later -- for testing
		thisMap.drop = function(){
			thisMap.db.drop();
			alert("database has been purged, please refresh the page.");
		}
		
		thisMap.home = function() {
			setTimeout(function () {
				google.maps.event.trigger(thisMap.map, 'resize');
				thisMap.map.setZoom(thisMap.mapOptions.zoom);
				thisMap.map.fitBounds(thisMap.bounds);
				thisMap.resize();
			}, 250);
			
			$('a[href="#home"]').click();
		}
		
		
		//Adds a new marker
		thisMap.newMarker = function(lat, lng, id) {
			if(typeof id == "undefined") {
				var id = thisMap.markers.length+1;
			}
		
			var latLng = new google.maps.LatLng(lat, lng);
		
			marker = new google.maps.Marker({
				map: thisMap.map,
				position: latLng 
			});
			
			thisMap.callback.newMarker(marker, lat, lng, id);
			
			thisMap.markers.push(marker);//Puts marker on map
			thisMap.bounds.extend(latLng);//extends bounds of map to new point.
			thisMap.map.fitBounds(thisMap.bounds);//Adjusts map's viewport

			return marker;
		}
		
		thisMap.addMarker = function(location, save, callback) {
			
			if(typeof save == "undefined") {
				var save = true;
			}
			
			if(typeof save == "function") {
				callback = save;
				save = true;
			}
			
			//Is called by app.js and given search info
			thisMap.geocode(location.address, function(response) {
			
				if(response.success) {
					var lat = response.results[0].geometry.location.lat();
					var lng = response.results[0].geometry.location.lng();
					var hasLatLng = thisMap.hasLatLng(lat, lng);
					var marker = false;
					
					if(hasLatLng) {
						alert('This location has already been entered');	
					}
					else {						
						thisMap.newMarker(lat, lng);
						
						if(typeof callback == "function") {
							callback(response, location, save);
						}
					}
					
					if(save && !hasLatLng) {
						thisMap.db.insert("markers", {
							name: location.name,
							address: location.address,
							street: location.street,
							city: location.city,
							state: location.state,
							zipcode: location.zipcode,
							response: response,
							lat: lat,
							lng: lng
						});
						
						thisMap.db.commit();
						
					}
				}
				else {
					alert('This is not a location.');
				}
				
				thisMap.geocode = function(location, callback) {
					if(typeof callback != "function") {
					callback = function() {};
				}
			
				thisMap.geocoder.geocode({'address': location}, function(results, status) {
				
					var response = {
						success: status == google.maps.GeocoderStatus.OK ? true : false,
						status: status,
						results: results
					}
				
					callback(response);
				});
				//thisMap.fitBounds(thisMap.bounds);
			}
			});
			;
		}
		
		//Checks to see if lat&&lng are already in table
		thisMap.hasLatLng = function(lat, lng) {
			var _return = false;
			
			thisMap.db.query('markers', function(row) {
				if(row.lat == lat && row.lng == lng) {
					_return = true;	
				}
			});
			
			return _return;
		}
		
		thisMap.deleteMarker = function(id){
			thisMap.db.deleteRows("markers", {ID: (id)});
			thisMap.db.commit();
			thisMap.markers[id-1].setMap(null);
			thisMap.map.setZoom(thisMap.mapOptions.zoom);
			thisMap.map.fitBounds(thisMap.bounds);
		}
		
		
		thisMap.updateMarker = function(marker, lat, lng) {
			marker.setPosition(new google.maps.LatLng(lat, lng));
		}
		
		thisMap.editMarker = function(location, callback) {
			
			thisMap.geocode(location.address, function(response) {
				if(response.success) {
					
					var lat = response.results[0].geometry.location.lat();
					var lng = response.results[0].geometry.location.lng();
					var hasLatLng = thisMap.hasLatLng(lat, lng);
					
					if(hasLatLng) {
						alert('\''+$.trim(location.address)+'\' is already a location on the map');	
					}
					else {						
						thisMap.updateMarker(thisMap.markers[thisMap.editIndex], lat, lng);
									
						thisMap.db.update("markers", {ID: thisMap.editIndex+1}, function() {
							var row = {
								name: location.name,
								address: location.address,
								street: location.street,
								city: location.city,
								state: location.state,
								zipcode: location.zipcode,
								response: response,
								lat: lat,
								lng: lng
							}
							
						console.log(row);
						
							return row;
						});
						
						thisMap.db.commit();
						
						if(typeof callback == "function") {
							callback(response, location);
						}
						
						
					}
				}
				else {
					alert('This is an invalid location');
				}
			});
			
		}
		
		thisMap.resize = function(){
			if(latLng == undefined){				
				var latLng = new google.maps.LatLng(lat, lng);
			}
			thisMap.bounds.extend(latLng);//extends bounds of map to new point.
			thisMap.map.fitBounds(thisMap.bounds)
		}
		
		thisMap.geocode = function(location, callback) {
			if(typeof callback != "function") {
				callback = function() {};
			}
			
			thisMap.geocoder.geocode({'address': location}, function(results, status) {
				
				var response = {
					success: status == google.maps.GeocoderStatus.OK ? true : false,
					status: status,
					results: results
				}
				lat = response.results[0].geometry.location.lat();
				lng = response.results[0].geometry.location.lng();
				center = new google.maps.LatLng(lat, lng);
				centerCircle.setCenter(center);
				thisMap.centerCircLat = lat;
				thisMap.centerCircLng = lng;
				callback(response);
			});
		}
		
		thisMap.initialize();
		
		
		thisMap.search = function(location, dist){
			
			thisMap.geocode(location, function(){
				center = centerCircle.getCenter();
			});
			
			centerCircle.setRadius(dist*1609.344);
			
			circles.push(thisMap.centerCircle);
			centerCircle.setMap(thisMap.map);
			center = centerCircle.getCenter();
			thisMap.oldZoom = thisMap.map.getZoom();
			
			setTimeout(function () {
				thisMap.map.setCenter(center);
				if(dist == 100){
					thisMap.map.setZoom(7);
				}else if(dist == 50){
					thisMap.map.setZoom(8);
				}else if(dist == 25){
					thisMap.map.setZoom(9);
				}else if(dist == 15){
					thisMap.map.setZoom(10);
				}else if(dist == 10){
					thisMap.map.setZoom(10);
				}else if(dist == 5){
					thisMap.map.setZoom(11);
				}else{
					thisMap.map.setZoom(7);
				}		
				
			
			center = new google.maps.LatLng(centerCircle.getCenter());
			circleLat = center.lat();
			circleLng = center.lng();
			
			
			
			var row = [];
			row = thisMap.db.query('markers');
			for(i=0; i<thisMap.db.rowCount('markers'); i++){
				lat = row[i].lat;
				lng = row[i].lng;
				if(row.ID == i){
					console.log(row.ID);
				}
				
				if(((Math.acos(Math.sin(thisMap.centerCircLat * Math.PI / 180) * Math.sin(lat * Math.PI / 180) + Math.cos(thisMap.centerCircLat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * Math.cos((thisMap.centerCircLng - lng) * Math.PI / 180)) * 180 / Math.PI) * 60 * 1.1515) * 1 > dist){
					thisMap.arrayOfKeptMarkers[thisMap.counter] = i;
					thisMap.markers[i].setMap(null);
					thisMap.counter++;
					console.log(thisMap.arrayOfKeptMarkers[thisMap.counter-1]);
					
				};
				
			};
			
			}, 250);
			
		};
		
		
		return thisMap;
	}
	
	$.fn.MobileMap = function(options) {
		return new MobileMap($(this), options);
	}	
	
})(jQuery);