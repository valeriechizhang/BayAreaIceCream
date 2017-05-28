var locations =  [
        {title: 'Bi-Rite Creamery', location: {lat: 37.7616, lng: -122.4257}, fsId: '45eaff58f964a5208e431fe3'},
        {title: 'Humphry Slocombe', location: {lat: 37.7528, lng: -122.4122}, fsId: '49972b39f964a52089521fe3'},
        {title: 'Mitchell\'s Ice Cream', location: {lat: 37.7442, lng: -122.4228}, fsId: '49e22ce6f964a520f9611fe3'},
        {title: 'Ghirardelli Chocolate', location: {lat: 37.8057, lng: -122.4223}, fsId: '4aff4914f964a520ea3622e3'},
        {title: 'Mr. and Mrs. Miscellaneous', location: {lat: 37.7578, lng: -122.3881}, fsId: '4bf313f7370e76b0c956bd4a'},
        {title: 'Polly Ann Ice Cream', location: {lat: 37.7535, lng: -122.4977}, fsId: '49f5fab6f964a520e26b1fe3'},
        {title: 'San Francisco\'s Hometown Creamery', location: {lat: 37.7644, lng: -122.4662}, fsId: '55a0aa3f498e89f153b1e0d8'},
        {title: 'ShakeDown', location: {lat: 37.786037, lng: -122.416947}, fsId: '54e7f1ee498e51bac90ed81c'},
        {title: 'Smitten', location: {lat: 37.776363, lng: -122.424192}, fsId: '4d964291daec224b08b9123e'},
        {title: 'Swensen\'s Ice Cream', location: {lat: 37.799084, lng: -122.419181}, fsId: '42b21280f964a5206e251fe3'},
        {title: 'Twirl and Dip', location: {lat: 37.768791, lng: -122.467963}, fsId: '4c7d7e4e9221236aeb6c7f3d'},
];

var fsURL = 'https://api.foursquare.com/v2/venues/';
var fsClient_Id = '1BD2UEDFOZZHDS0AH2ZUA403HXV4VPTWBQLYD1BDHBWMPF14';
var fsClient_Secret = 'ENVL3POCNUUG1IBLMRTI1ZNCG3OKWJT3UG0TLF4TFUQQ14Y2';

//'https://api.foursquare.com/v2/venues/49f5fab6f964a520e26b1fe3?client_id=1BD2UEDFOZZHDS0AH2ZUA403HXV4VPTWBQLYD1BDHBWMPF14&client_secret=ENVL3POCNUUG1IBLMRTI1ZNCG3OKWJT3UG0TLF4TFUQQ14Y2&v=20170527&m=foursquare'

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

    self.menuAction = ko.observable('Open Menu');

    self.clearFilter = function() {
        self.filterInput('');
        self.noFilterResult('');
    };

    self.clickLocation = function(location) {
        showInfo(location.title);
        if (document.getElementById('map').style.display == 'none') {
            self.toggleNav();
        }
    };

    self.toggleNav = function() {
        if (self.menuAction() == 'Close Menu') {
            document.getElementById('options-box').style.display = 'none';
            document.getElementById('map').style.display = 'block';
            self.menuAction('Open Menu');
        } else {
            document.getElementById('map').style.display = 'none';
            document.getElementById('options-box').style.display = 'block';
            self.menuAction('Close Menu');
        }
    }

    self.windowWidth = ko.observable();

    // This will execute whenever the window is resize
    // https://stackoverflow.com/questions/7789043/how-can-i-detect-window-size-with-jquery
    $(window).resize(function() {
        self.windowWidth($(window).width()); // New width
    });

    self.windowWidth.subscribe(function() {
        if (parseInt(self.windowWidth()) > 700) {
            document.getElementById('map').style.display = 'block';
            document.getElementById('options-box').style.display = 'block';
            self.menuAction('Open Menu');
        }
    });
}

ko.applyBindings(new ViewModel());

var map;
var markers = [];
var placeMarkers = [];
var largeInfowindow;


function initMap() {
    // Constructor creates a new map - only center and zoom are required
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.7749, lng: 122.4194},
        zoom: 13,
        mapTypeControl: false
    });

    largeInfowindow = new google.maps.InfoWindow();
    var bounds = new google.maps.LatLngBounds();

    var defaultIcon = makeMarkerIcon('0091ff');
    var highlightedIcon = makeMarkerIcon('ffff24');


    for (var i = 0; i < locations.length; i++) {
        // Get the position from the location array
        var position = locations[i].location;
        var title = locations[i].title;
        var fsId = locations[i].fsId;
        // Create a market per location, and put into markers array.
        var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            fsId: fsId,
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
            bounceMarker(this);
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

}


// This function populates the infowindow when the marker is clicked.
// We'll only allow one infowindow which will open at the marker that is clicked,
// and populate based on that markers position.
function populateInfoWindow(marker, infowindow) {

    var fsId = marker.fsId;
    var url = 'https://api.foursquare.com/v2/venues/' + fsId + '?client_id='
        + fsClient_Id + '&client_secret=' + fsClient_Secret + '&v=20170527&m=foursquare';

    var innerHTML = '<div>';

    $.getJSON(url, function(data) {
        response = data.response.venue;
        var details = {
            name: response.name,
            phone: response.contact.formattedPhone,
            address: response.location.address + ', ' + response.location.city,
            link: response.canonicalUrl,
            rating: response.rating,
            description: response.description,
            photo_prefix: response.bestPhoto.prefix,
            photo_suffix: response.bestPhoto.suffix
        };

        if (details.name) {
            innerHTML += '<strong>' + details.name + '</strong>';
        }

        if (details.address) {
            innerHTML += '<br>' + details.address;
        }

        if (details.phone) {
            innerHTML += '<br>' + details.phone;
        }

        if (details.description) {
            innerHTML += '<br>Description: ' + details.description;
        }

        if (details.rating) {
            innerHTML += '<br>Rating: ' + details.rating;
        }

        if (details.link) {
            innerHTML += '<br><a target="_blank" href="' + details.link + '">Foursquare</a>';
        }

        if (details.photo_prefix && details.photo_suffix) {
            innerHTML += '<br><br><img src="' + details.photo_prefix + '150x150'
                + details.photo_suffix + '">';
        }
        innerHTML += '</div>';
            // Check to make sure the infowindow is not already opened on this marker/
        if (infowindow.marker != marker) {
            infowindow.marker = marker;
            infowindow.setContent(innerHTML);
            infowindow.open(map, marker);
            // Make sure the marker property is cleared if the infowindow is closed
            infowindow.addListener('closeclick', function() {
                showListings();
                infowindow.marker = null;
            });

            infowindow.open(map, marker);
        }
    }).error(function() {
        console.log('Foursquare API Request Error');
    });
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


function bounceMarker(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){ marker.setAnimation(null); }, 750);
}


function showInfo(title) {
    for (var i = 0; i < markers.length; i++) {
        if (markers[i].title == title) {
            var marker = markers[i];
            marker.setMap(map)
            if (largeInfowindow.marker != marker) {
                populateInfoWindow(marker, largeInfowindow)
                bounceMarker(marker);
            }
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


