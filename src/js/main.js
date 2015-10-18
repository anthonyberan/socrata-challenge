(function() {
  var dataSet,
    map;

  function renderMap(dataSet) {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: 47.593307, lng: -122.3321654},
      zoom: 13
    });

    //throw down the pins...


    //render heatmap
    heatmap = new google.maps.visualization.HeatmapLayer({
      data: getPoints(dataSet),
      map: map
    });
  }

  function getPoints(dataSet) {
    var points = [];
    for(var i = 0, z = dataSet.length; i < z; i++) {
      points.push(new google.maps.LatLng(dataSet[i].incident_location.latitude, dataSet[i].incident_location.longitude));
    }

    return points;
  }

  $(document).ready(function() {
    //radius is 1 mile converted to meters
    var dataEndpoint = 'https://data.seattle.gov/resource/3k2p-39jp.json',
      radius = 1609.34,
      lat,
      lng,
      address = '800 Occidental Ave S, Seattle, WA 98134',
      searchParam = '$where=within_circle(incident_location, ';

    //load google maps to geocode CenturyLink's address as well as generate the map
    google.load('maps', '3', { other_params: 'key=AIzaSyCt4z9pUcxNPImfw5XUKIllrkEg1KiR77w&libraries=visualization', callback: function() {
        geocoder = new google.maps.Geocoder();
        geocoder.geocode( { 'address': address}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            //valid address, take the first results
            lat = results[0].geometry.location.G;
            lng = results[0].geometry.location.K;

            //load data set now that we have the location
            $.ajax({
              url: dataEndpoint + '?' + searchParam + lat + ', ' + lng + ', ' + radius + ')'
            }).success(function(data, status) {
              if( status === 'success' ) {
                dataSet = data;
                renderMap(dataSet);

              }
              else {
                console.log('Show error page.');
              }
            });

          } else {
            alert("Geocode was not successful for the following reason: " + status);
          }
        });
    }});


  });

}());
