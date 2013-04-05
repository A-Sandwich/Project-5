;(function($, window) {
	
	var jQT;
	
    $(function(){
	
	    jQT = new $.jQTouch({
	        statusBar: 'black-translucent',
	        preloadImages: []
	    });

    });
    
	$('#home').bind('pageAnimationEnd', function(event, info) {
		if (info.direction == 'in') {
			$("#map").show();
			
			google.maps.event.trigger(map.map, 'resize');
			
			map.map.setZoom(map.mapOptions.zoom);
			map.map.fitBounds(map.bounds);
					
		}
		return false;
	});

	var map = $('#map').MobileMap({
		mapOptions: {
			center: new google.maps.LatLng(39.76, -86.15)//Coordinates = Indianapolis
		},
		callback: {
			newMarker: function(marker, lat, lng, index) {
				google.maps.event.addListener(marker, 'click', function() {
					
					map.editIndex = index;
					
					var row     = map.db.query('markers', function(row) {
						if(row.ID == index+1) {
							return true;
						}
						return false;
					});
					
					row = row[0];
					
					var $name   = $('#editLoc').find('#locationName');
					var $street = $('#editLoc').find('#streetAddress');
					var $city   = $('#editLoc').find('#city');
					var $state  = $('#editLoc').find('#state');
					var $zip    = $('#editLoc').find('#zipCode');
									
					$name.val(row.name);
					$street.val(row.street);
					$city.val(row.city);
					$state.val(row.state);	
					$zip.val(row.zipcode);
					
					jQT.goTo('#updateLocation', 'slideup');		
					
				});
			}
		}
	});
	
	$('#delete-location').submit(function(e) {
		
		var $thisLocation      = $('#editLoc');
		var $name   = $thisLocation.find('#locationName');
		var $street = $thisLocation.find('#streetAddress');
		var $city   = $thisLocation.find('#city');
		var $state  = $thisLocation.find('#state');
		var $zip    = $thisLocation.find('#zipCode');
		//alert($state.val());
		
		
		var address = [
			$street.val(),
			$city.val(),
			$state.val(),
			$zip.val()
		];
		
		var object = {
			name: $name.val(),
			address: address.join(' '),
			street: $street.val(),
			city: $city.val(),
			state: $state.val(),
			zipcode: $zip.val()
		}
		
		map.deleteMarker(object, function() {
			map.home();
			$name.val('');
			$street.val('');
			$city.val('');
			$state.val('');
			$zip.val('');
		});
		
		e.preventDefault();
	
		window.location = "#home";
		
		return false;
	});
	
	$('#newLoc').submit(function(e) {
		var $thisLocation      = $(this);
		var $name   = $thisLocation.find('#locationName');
		var $street = $thisLocation.find('#streetAddress');
		var $city   = $thisLocation.find('#city');
		var $state  = $thisLocation.find('#state');
		var $zip    = $thisLocation.find('#zipCode');
		
		var address = [
			$street.val(),
			$city.val(),
			$state.val(),
			$zip.val()
		];
		
		var object = {
			name: $name.val(),
			address: address.join(' '),
			street: $street.val(),
			city: $city.val(),
			state: $state.val(),
			zipcode: $zip.val()
		}
		
		//Send information to mobileMap to be used
		map.addMarker(object, function() {
			map.home();
			$name.val('');
			$street.val('');
			$city.val('');
			$state.val('');
			$zip.val('');
		});
		
		e.preventDefault();
		
		//window.getElementById('#home').click();
		//window.location = "#home";
		
		return false;
	});
	
	$('#editLoc').submit(function(e) {
		
		var $thisLocation      = $(this);
		var $name   = $thisLocation.find('#locationName');
		var $street = $thisLocation.find('#streetAddress');
		var $city   = $thisLocation.find('#city');
		var $state  = $thisLocation.find('#state');
		var $zip    = $thisLocation.find('#zipCode');
		
		var address = [
			$street.val(),
			$city.val(),
			$state.val(),
			$zip.val()
		];
		
		var object = {
			name: $name.val(),
			address: address.join(' '),
			street: $street.val(),
			city: $city.val(),
			state: $state.val(),
			zipcode: $zip.val()
		}
		
		map.editMarker(object, function() {
			map.home();
			$name.val('');
			$street.val('');
			$city.val('');
			$state.val('');
			$zip.val('');
		});
		
		e.preventDefault();
	
		window.location = "#home";
		
		return false;
	});
	
}(jQuery, this));