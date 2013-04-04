;(function($) {
	
	var MobileMap = function(object, options) {
	
		var $thisMap = $(object);
		
		var thisMap = {
			
			callback: {
				newMarker: function(marker, lat, lng) {},	//calls new marker
			},
			db: new localStorageDB("MapIndex", localStorage),//storage variable
			bounds: new google.maps.LatLngBounds(),
			editIndex: false,
			geocoder: new google.maps.Geocoder(),
			map: false,
			mapOptions: {
				zoom: 14,
				center: new google.maps.LatLng(0, 0), 
				mapTypeId: google.maps.MapTypeId.SATELLITE, 
				panControl: false,//disables pan control!
				scrollwheel: false, // Doesn't allow zoom via scroll wheel on mouse, does not disable zoom scrool wheel on side.
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
				thisMap.newMarker(row.lat, row.lng);
			});
			
			return thisMap.map;
		}
		
		thisMap.home = function() {
			
			google.maps.event.trigger(thisMap.map, 'resize');
			thisMap.map.setZoom(thisMap.mapOptions.zoom);
			thisMap.map.fitBounds(thisMap.bounds);
			
			$('a[href="#home"]').click();
		}
		
		
		//Adds a new marker
		thisMap.newMarker = function(lat, lng) {
			var latLng = new google.maps.LatLng(lat, lng);
		
			marker = new google.maps.Marker({
				map: thisMap.map,
				position: latLng 
			});
			
			thisMap.callback.newMarker(marker, lat, lng, thisMap.markers.length);
			
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
				thisMap.fitBounds(thisMap.bounds);
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
		
		thisMap.updateMarker = function(marker, lat, lng) {
			marker.setPosition(new google.maps.LatLng(lat, lng));
		}
		
		thisMap.deleteMarker = function(location, callback){
			thisMap.db.deleteRows("markers", {ID: thisMap.editIndex+1}, function() {
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
		});
		
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
				
				callback(response);
			});
		}
		
		thisMap.initialize();
		
		return thisMap;
	}
	
	$.fn.MobileMap = function(options) {
		return new MobileMap($(this), options);
	}	
	
})(jQuery);