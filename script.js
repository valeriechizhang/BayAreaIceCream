var locations =  [
        {title: 'Bi-Rite Creamery', location: {lat: 37.7616, lng: -122.4257}},
        {title: 'Humphry Slocombe', location: {lat: 37.7528, lng: -122.4122}},
        {title: 'Mitchell\'s Ice Cream', location: {lat: 37.7442, lng: -122.4228}},
        {title: 'Ghirardelli Chocolate', location: {lat: 37.8057, lng: -122.4223}},
        {title: 'Mr. and Mrs. Miscellaneous', location: {lat: 37.7578, lng: -122.3881}},
        {title: 'Polly Ann Ice Cream', location: {lat: 37.7535, lng: -122.4977}},
        {title: 'San Francisco\'s Hometown Creamery', location: {lat: 37.7644, lng: -122.4662}},
        {title: 'ShakeDown', location: {lat: 37.786037, lng: -122.416947}},
        {title: 'Smitten', location: {lat: 37.776363, lng: -122.424192}},
        {title: 'Swensen\'s Ice Cream', location: {lat: 37.799084, lng: -122.419181}},
        {title: 'Twirl and Dip', location: {lat: 37.768791, lng: -122.467963}},
];

var ViewModel = function() {
    var self = this;
    self.filterInput = ko.observable('');
    self.filterValue = self.filterInput;
    self.locationList = ko.observableArray([]);
    self.locationList.push.apply(self.locationList, locations);
    self.noFilterResult = ko.observable('');

    self.filterInput.subscribe(function() {
        var filter = self.filterInput().toLowerCase();
        if (filter === '') {
            self.locationList.removeAll();
            self.locationList.push.apply(self.locationList, locations);
        } else {
            var count = 0;
            var filterList = [];
            for (var i = 0; i < locations.length; i++) {
                if (locations[i].title.toLowerCase().includes(filter)) {
                    filterList.push(locations[i]);
                    count += 1;
                }
            }
            self.locationList.removeAll();
            self.locationList.push.apply(self.locationList, filterList);
            if (count == 0) {
                self.noFilterResult('No results.');
            } else {
                self.noFilterResult('');
            }
        }
    });

    self.clickLocation = function(location) {
        hideMarkers(markers);
        showMarker(location.title);
    };


}

ko.applyBindings(new ViewModel());

var map;
var markers = [];
var placeMarkers = [];

// this global polygon variable is to ensure only ONE polygon is rendered
var polygon = null;

var styles = [
    {
        featureType: 'water',
        stylers: [
            { color: '#19a0d8' }
        ]
    }, {
        featureType: 'administrative',
        elementType: 'labels.text.stroke',
        stylers: [
            { color: '#ffffff' },
            { weight: 6 }
        ]
    }, {
        featureType: 'administrative',
        elementType: 'labels.text.fill',
        styler: [
            { color: '#e85113' }
        ]
    }, {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [
            { color: '#efe9e4' },
            { lightness: -40 }
        ]
    }, {
        featureType: 'transit.station',
        stylers: [
            { weight: 9 },
            { hue: '#e85113' }
        ]
    },{
        featureType: 'road.highway',
        elementType: 'labels.icon',
        stylers: [
            { visibility: 'off' }
        ]
    },{
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [
            { lightness: 100 }
        ]
    },{
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [
            { lightness: -100 }
        ]
    },{
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [
            { visibility: 'on' },
            { color: '#f0e4d3' }
        ]
    },{
        featureType: 'road.highway',
        elementType: 'geometry.fill',
        stylers: [
            { color: '#efe9e4' },
            { lightness: -25 }
        ]
    }
];

function initMap() {
    // Constructor creates a new map - only center and zoom are required
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.7749, lng: 122.4194},
        zoom: 13,
        styles: styles,
        mapTypeControl: false
    });

    // The autocomplete is for use in the search within time entry box.
    var timeAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('search-within-time-text'));
    // This autocomplete is for use in the geocoder entry box.
    var zoomAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById('zoom-to-area-text'));
    // Bias the boundaries within the map for the zoom to area text.
        zoomAutocomplete.bindTo('bounds', map)
    // Create a searchbox in order to execute a places search
    var searchBox = new google.maps.places.SearchBox(
        document.getElementById('places-search'));
    // Bias the searchbox to within the bounds of the map
        searchBox.setBounds(map.getBounds());

    var largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();

    // Initialize the drawing manager
    var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_LEFT,
            drawingModes: [
                google.maps.drawing.OverlayType.POLYGON
            ]
        }
    });

    var defaultIcon = makeMarkerIcon('0091ff');
    var highlightedIcon = makeMarkerIcon('ffff24');


    for (var i = 0; i < locations.length; i++) {
        // Get the position from the location array
        var position = locations[i].location;
        var title = locations[i].title;
        // Create a market per location, and put into markers array.
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            icon: defaultIcon,
            id: 1
        });
        // Push the market to our array of markers.
        markers.push(marker);
        // Extend the boundaries of the map of each marker
        bounds.extend(marker.position);
        // Create an onclick event to open an infowindow at each marker.
        marker.addListener('click', function() {
            populateInfoWindow(this, largeInfowindow);
            bounchMarker(this);
        });

        marker.addListener('mouseover', function() {
            this.setIcon(highlightedIcon);
        });

        marker.addListener('mouseout', function() {
            this.setIcon(defaultIcon);
        });
    }

    map.fitBounds(bounds);

    document.getElementById('show-listings').addEventListener('click', showListings);
    document.getElementById('hide-listings').addEventListener('click', function() {
        hideMarkers(markers);
    });

    document.getElementById('toggle-drawing').addEventListener('click', function() {
        toggleDrawing(drawingManager);
    });

    document.getElementById('zoom-to-area').addEventListener('click', function() {
        zoomToArea();
    });

    document.getElementById('search-within-time').addEventListener('click', function() {
        searchWithinTime();
    });

    // Listen for the event fired when the user selects a prediction from
    // the picklist and retrieve more details for that place.
    searchBox.addListener('places_changed', function(){
        searchBoxPlaces(this);
    });

    // Listen for the event fired when the user selects a prediction and clicks
    // 'go' more details for that place
    document.getElementById('go-places').addEventListener('click', textSearchPlaces)

    // Add an event listener so that the polygon is captured,
    // call the searchWithinPolygon function.
    // This will show the markers in the polygon,
    // and hide any outside of it.
    drawingManager.addListener('overlaycomplete', function(event) {
        // First, check if there is an existing polygon.
        // If there is, get rid of it and remove the markers
        if (polygon) {
            polygon.setMap(null);
            hideMarkers(markers);
        }

        // Switching the drawing mode to the HAND (i.e., no longer drawing)
        drawingManager.setDrawingMode(null);
        // Creating a new editable polygon from the overlay.
        polygon = event.overlay;
        polygon.setEditable(true);
        // Searching within the polygon.
        searchWithinPolygon();
        calculateArea();
        // Make sure the search is re-done if the poly is changed.
        polygon.getPath().addListener('set_at', searchWithinPolygon);
        polygon.getPath().addListener('insert_at', searchWithinPolygon);
    });
}


// This function populates the infowindow when the marker is clicked.
// We'll only allow one infowindow which will open at the marker that is clicked,
// and populate based on that markers position.
function populateInfoWindow(marker, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker/
    if (infowindow.marker != marker) {
        infowindow.marker = marker;
        infowindow.setContent('');
        infowindow.open(map, marker);
        // Make sure the marker property is cleared if the infowindow is closed
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });

        // street view
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;
        // In case the status is OK, which means the pano was found, compute the
        // position of the streetview image, then calculate the heading, then get a
        // panorama from that and set the options
        function getStreetView(data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent('<div>' + marker.title + '</div>' +
                    '<div>No Street View Found</div>');
            }
        }

        // Use streetview service to get the closest streetview image within
        // 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        infowindow.open(map, marker);
    }
}


function showListings() {
    var bounds = new google.maps.LatLngBounds();
    // Extend the boundaries of the map for each marker and display the marker
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
        bounds.extend(markers[i].position);
    }
    map.fitBounds(bounds);
}


function hideMarkers(markers) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
}


function bounchMarker(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){ marker.setAnimation(null); }, 750);
}


function showMarker(title) {
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].title == title) {
            var marker = markers[i];
            marker.setMap(map)
            var infowindow = new google.maps.InfoWindow();
            populateInfoWindow(marker, infowindow)
            bounchMarker(marker);
        }
    }
}




function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage('http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor + '|40|_|%E2%80%A2',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34)
    );
    return markerImage;
}


// This shows and hides (respectively) the drawing options
function toggleDrawing(drawingManager) {
    if (drawingManager.map) {
        drawingManager.setMap(null);
        // In case the user drew anything, get rid of the polygon
        if (polygon !== null) {
            polygon.setMap(null);
        }
    } else {
        drawingManager.setMap(map);
    }
}


// This function hides all markers outside the polygon
// and shows only the ones within it. This is so that the
// user can specify an exact area of search
function searchWithinPolygon() {
    for (var i = 0; i < markers.length; i++) {
        if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
            markers[i].setMap(map);
        } else {
            markers[i].setMap(null);
        }
    }
}


function calculateArea() {
    var area = google.maps.geometry.spherical.computeArea(polygon.getPath());
    alert(area + "square meters");
}


// This function takes the input value in the find nearby area text input locates it,
// and then zooms into that area. This is so that the user can show all listings,
// then decide to focus on one area of the map
function zoomToArea() {
    // Initialize the geocoder
    var geocoder = new google.maps.Geocoder();
    // Get the address or place that the user entered.
    var address = document.getElementById('zoom-to-area-text').value;
    // Make sure the address isn't blank
    if (address == '') {
        window.alert('You must enter an area, or address.');
    } else {
        // Geocode the address/area entered to get the center.
        // Then, center the map on it and zoom in
        geocoder.geocode({
            address: address,
            componentRestrictions: {locality: 'New York'}
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                map.setCenter(results[0].geometry.location);
                map.setZoom(15);
                document.getElementById('formatted-address').innerHTML =
                    results[0].formatted_address;
            } else {
                window.alert('We couldn not find that location' +
                    ' - try entering a more specific place');
            }
        });
    }
}


// This function allows the user to input a desired travel time in minutes,
// and a travel mode and a location - and only show the listings thar are
// within that travel time (via that travel mode) of the location
function searchWithinTime() {
    // Initialize the distance matrix service.
    var distanceMatrixService = new google.maps.DistanceMatrixService;
    var address = document.getElementById('search-within-time-text').value;
    // Check to make sure the place entered isn't blank
    if (address == '') {
        window.alert('You much enter an address.');
    } else {
        hideMarkers(markers);
        // Use the distance matrix service to calculate the duration of the
        // routes between all our markers, and the destination address entered
        // by the user. Then put all the origins into an origin matrix.
        var origins = [];
        for (var i = 0; i < markers.length; i++) {
            origins[i] = markers[i].position;
        }
        var destination = address;
        var mode = document.getElementById('mode').value;
        // Now that both the origins and destination are defined,
        // get all info for the distances between them.
        distanceMatrixService.getDistanceMatrix({
            origins: origins,
            destinations: [destination],
            travelMode: google.maps.TravelMode[mode],
            unitSystem: google.maps.UnitSystem.IMPERIAL
        }, function(response, status) {
            if (status !== google.maps.DistanceMatrixStatus.OK) {
                window.alert('Error was: ' + status);
            } else {
                displayMarkersWithinTime(response);
            }
        });
    }
}


// This function will go through each of the results, and,
// if the distance is LESS than the value in the picker, show it on the map.
function displayMarkersWithinTime(response) {
    var maxDuration = document.getElementById('max-duration').value;
    var origins = response.originAddresses;
    var destinations = response.destinationAddresses;
    // Parse through the results, and get the distance and duration of each.
    // Because there might be multiple origins and destinations we have a nested loop
    var atLeastOne = false;
    for (var i = 0; i < origins.length; i++) {
        var results = response.rows[i].elements;
        for (var j = 0; j < results.length; j++) {
            var element = results[j];
            if (element.status === "OK") {
                // The distance is returned in feet, but the TEXT is in miles.
                // If we wanted to switch the function to show markers withins a user-entered DISTANCE,
                // we would need the value for distance, but for now we only need the text.
                var distanceText = element.distance.text;
                // Duration value is given in seconds so we make it minutes.
                // We need both the value and the text.
                var duration = element.duration.value / 60;
                var durationText = element.duration.text;
                if (duration <= maxDuration) {
                    // the orgin[i] shoule be the markers[i]
                    markers[i].setMap(map);
                    atLeastOne = true;
                    // Create a mini infowindow to open immediately and contain the
                    // distance and duration
                    var infowindow = new google.maps.InfoWindow({
                        content: durationText + ' away, ' + distanceText +
                        '<div><input type=\"button\" value=\"View Route\" onclick =' +
                        '\"displayDirections(&quot;' + origins[i] + '&quot;);\"></input></div>'
                    });
                    infowindow.open(map, markers[i]);
                    // Put this in so that this small window closes if the user
                    // clicks the marker, when the big infowindow opens
                    markers[i].infowindow = infowindow;
                    google.maps.event.addListener(markers[i], 'click', function() {
                        this.infowindow.close();
                    });
                }
            }
        }
    }

    if (!atLeastOne) {
        window.alert('We could not find any locations within that distance.');
    }
}

// This function is in response to the user selecting "show route" on one
// of the markers within the calculated distance. This will display the route
// on the map.
function displayDirections(origin) {
    hideMarkers(markers);
    var directionsService = new google.maps.DirectionsService;
    // get the destination address from the user entered value.
    var destinationAddress = document.getElementById('search-within-time-text').value;
    // get mode again from the user entered value
    var mode = document.getElementById('mode').value;
    directionsService.route({
        // the origin is the passed in marker's position
        origin: origin,
        // the destination is user entered address
        destination: destinationAddress,
        travelMode: google.maps.TravelMode[mode]
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            var directionDisplay = new google.maps.DirectionsRenderer({
                map: map,
                directions: response,
                draggable: true,
                polylineOptions: {
                    strokeColor: 'green'
                }
            });
        } else {
            window.alert('Direction request failed due to ' + status);
        }
    });
}


// this function fires when the user selects a searchbox picklist item
// it will do a nearby search using the selected query string or places
function searchBoxPlaces(searchBox){
    hideMarkers(markers);
    var places = searchBox.getPlaces();
    // for each place, get the icon, name and location
    createMarkersForPlaces(places);
    if (places.length == 0) {
        window.alert('We did not find any places matching that search!');
    }
}


// This function fires when the user select "go" on the places search.
// It will do a nearby search using the entered query string or place.
function textSearchPlaces(){
    var bounds = map.getBounds();
    hideMarkers(placeMarkers);
    var placesService = new google.maps.places.PlacesService(map);
    placesService.textSearch({
        query: document.getElementById('places-search').value,
        bounds: bounds
    }, function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            createMarkersForPlaces(results);
        }
    });
}


// This function creates markers for each place found in either places search.
function createMarkersForPlaces(places) {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
        var place = places[i];
        var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        // Create a marker for each place.
        var marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: place.name,
            position: place.geometry.location,
            id: place.place_id
            });

        // Create a single infowindow to be used with the place details information
        // so that only one is open that once
        var placeInfoWindow = new google.maps.InfoWindow();
        // If a marker is clicked, do a place details search on it in the next function.
        marker.addListener('click', function() {
            if (placeInfoWindow.marker == this) {
                console.log("This information already is on this marker!");
            } else {
                getPlacesDetails(this, placeInfoWindow);
            }
        });

        placeMarkers.push(marker);
        if (place.geometry.viewport) {
            // Only geocodes have viewport
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    }
    map.fitBounds(bounds);
}


// This is the PLACE DETAILS search - it's the most detailed so it's only
// executed when a marker is selected, indicating the user wants more details about that place.
function getPlacesDetails(marker, infowindow) {
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
        placeId: marker.id
    }, function(place, status) {
        console.log(status);
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            // Set the marker property on this infowindow so it isn't created again.
            infowindow.marker = marker;
            var innerHTML = '<div>';
            if (place.name) {
                innerHTML += '<strong>' + place.name + '</strong>';
            }
            if (place.formatted_address) {
                innerHTML += '<br>' + place.formatted_address;
            }
            if (place.formatted_phone_number) {
                innerHTML += '<br>' + place.formatted_phone_number;
            }
            if (place.openning_hours) {
                innerHTML += '<br><br><strong>Hours:</strong><br>'
                for (var i = 0; i < 7; i++) {
                    innerHTML += place.openning_hours.weekday_text[i] + '<br>'
                }
            }
            if (place.photos) {
                innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
                    {maxHeight: 100, maxWidth: 200}) + '">';
            }
            innerHTML += '</div>';
            infowindow.setContent(innerHTML);
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed.
            infowindow.addListener('closeclick', function() {
                infowindow.marker = null;
            });
        }
    });
}

