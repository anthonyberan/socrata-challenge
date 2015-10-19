(function() {
  "use strict";
  var dataSet,
    parsedData = {},
    map,
    heatmap,
    mapPoints,
    activeFilters = [];

  // parses the large dataset returned from API call and creates new object
  // with data formatted down to what is needed for the project.
  function parseData(data) {
    data.forEach(function(currentValue, index, array) {
      if( currentValue.event_clearance_group in parsedData ) {
        parsedData[currentValue.event_clearance_group].count++;
        parsedData[currentValue.event_clearance_group].points.push(
          new google.maps.LatLng(
            currentValue.incident_location.latitude, currentValue.incident_location.longitude
          ));
      }
      else {
        parsedData[currentValue.event_clearance_group] = {
          count: 1,
          points: [new google.maps.LatLng(currentValue.incident_location.latitude, currentValue.incident_location.longitude)]
        }
      }
    });
    return parsedData;
  }

  function renderMap(lat, lng, dataSet) {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: lat, lng: lng},
      zoom: 13
    });

    //render heatmap visualization
    heatmap = new google.maps.visualization.HeatmapLayer({
      data: getPoints(parsedData, activeFilters),
      map: map
    });

    //render map filters
    renderMapFilters(parsedData);

    //set map handling
    mapHandling(map, map.getCenter());
  }

  // either add or remove data points from the heatmap depending on the state
  function updateMap(mapPoints) {
    heatmap.setData(mapPoints);
  }

  // if state is true, remove the active filter. Otherwise add it
  function updateMapFilters(filter, state) {
    if( !state ) {
      activeFilters.push(filter);
    }
    else {
      var index = activeFilters.indexOf(filter);
      if( index !== -1 ) {
        activeFilters.splice(index, 1);
      }
    }

    return activeFilters;
  }

  //get datapoints from parsedData to generate heatmap
  //if not filters are passed in, get everything
  function getPoints(dataSet, filters) {
    var points = [];

    Object.keys(dataSet).forEach(function(currentValue) {
      if( filters.indexOf(currentValue) === -1 ) {
        points = points.concat(dataSet[currentValue].points);
      }
    });

    return points;
  }

  function renderMapFilters(dataSet) {
    // map-filters
    var sortedKeys,
      filtersHTML = '', //move this to handlebars if time permits
      $mapFilters = $('#map-filters');

    //render filters alphabetically
    sortedKeys = Object.keys(dataSet);
    sortedKeys.sort();

      //loop through all keys and create list of filters
    sortedKeys.forEach(function(currentValue, index) {
      filtersHTML += '<li class="filters__filter">' +
      '<label>' +
      '<input type="checkbox" class="filters__checkbox filters__checkbox" value="' + currentValue +'" checked="checked">' +
      '<span class="filters__label">' + currentValue +'</span>' +
      '</label>' +
      '</li>';
    });

    $('#map-filters-list').html(filtersHTML);
    //save reference to filter elements
    filterHandling($mapFilters, '.filters__checkbox');
  }

  function mapHandling(map, center) {
    google.maps.event.addDomListener(window, 'resize', function() {
      map.setCenter(center);
    });
  }

  function filterHandling($mapFilters, selector) {
    var $filters = $mapFilters.find(selector);

    //add event handling for filters
    $mapFilters.on('click', selector, function(e) {
      var $this = $(this),
        filter = $this.val(),
        state = $this.is(':checked');

        //check for the all toggle
        if( filter === 'ALL' ) {
          $($filters.selector + (state ? ':not(:checked)' : ':checked')).each(function() {
            $(this).trigger('click');
          });
        }
        else {
          activeFilters = updateMapFilters(filter, state);
        }
        mapPoints = getPoints(parsedData, activeFilters);

        // only update the heatmap if the click event was triggered by the user.
        // Avoids the ALL toggle triggering multiple heatmap refreshes
        if( e.originalEvent ) {
          updateMap(mapPoints);
        }

    });
  }

  function renderBarGraph(dataSet) {
    var data = [],
      count = 0,
      z = dataSet.length;

    for(var i = 0; i < z; i++) {
        data.push([dataSet[i].event_clearance_group, parseInt(dataSet[i].total, 10)]);
        count++;
        if(count === 15 ) {
          break;
        }
    }

    Highcharts.setOptions({
      lang: {
        thousandsSep: ','
      }
    });

    $('#crime-quantity-graph').highcharts({
        chart: {
            type: 'column'
        },
        title: {
            text: 'Crime incidents by type'
        },
        subtitle: {
            text: 'Source: Socrata'
        },
        xAxis: {
            type: 'category',
            labels: {
                rotation: -90,
                style: {
                    fontSize: '13px',
                    fontFamily: 'Verdana, sans-serif'
                }
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Incidents'
            }
        },
        legend: {
            enabled: false
        },
        tooltip: {
            pointFormat: '{point.y}</b>'
        },
        series: [{
            name: 'Crime Incidents',
            data: data,
            dataLabels: {
                enabled: false,
                rotation: 45,
                color: '#FF0000',
                align: 'right',
                format: '{point.y}',
                // y: 10, // 10 pixels down from the top
                style: {
                    fontSize: '13px',
                    fontFamily: 'Verdana, sans-serif'
                }
            }
        }]
    });

  }

  function renderTimeChart(dataSet) {
    //format data for highcharts consumption
    // Create the chart
    var data = [];
    dataSet.forEach(function(currentValue) {
        data.push([Date.parse(currentValue.day), parseInt(currentValue.total, 10)])
    });

    $('#crime-time-chart').highcharts('StockChart', {


        rangeSelector : {
            selected : 1
        },

        title : {
            text : 'Crime incidents over time'
        },

        series : [{
            name : 'Crime Incidents',
            data : data,
            type : 'areaspline',
            threshold : null,
            tooltip : {
                valueDecimals : 0
            },
            fillColor : {
                linearGradient : {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops : [
                    [0, Highcharts.getOptions().colors[0]],
                    [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                ]
            }
        }]
    });
  }

  $(document).ready(function() {
    //radius is 1 mile converted to meters
    var dataEndpoint = 'https://data.seattle.gov/resource/3k2p-39jp.json?',
      radius = 1609.34,
      lat,
      lng,
      address = '800 Occidental Ave S, Seattle, WA 98134',
      searchParam = '$where=within_circle(incident_location, ';

    //load google maps to geocode CenturyLink Field's address as well as generate the map
    google.load('maps', '3', { other_params: 'key=AIzaSyCt4z9pUcxNPImfw5XUKIllrkEg1KiR77w&libraries=visualization', callback: function() {
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode( { 'address': address}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            //valid address, take the first results
            lat = results[0].geometry.location.G;
            lng = results[0].geometry.location.K;

            searchParam += lat + ', ' + lng + ', ' + radius + ')';

            //load data set now that we have the location
            $.ajax({
              url: dataEndpoint + '$select=event_clearance_group, incident_location&' + searchParam
            }).success(function(data, status) {
              if( status === 'success' ) {
                dataSet = data;
                parsedData = parseData(dataSet);
                renderMap(lat, lng, parsedData);
              }
              else {
                console.log('Show error page.');
              }
            });

            $.ajax({
              url: dataEndpoint + '$select=date_trunc_ymd(event_clearance_date) AS day, count(*) AS total&$order=day&' + searchParam + '&$group=day'
            }).success(function(data, status) {
              if( status === 'success' ) {
                dataSet = data;
                renderTimeChart(dataSet);
              }
              else {
                console.log('Show error page.');
              }
            });

            $.ajax({
              url: dataEndpoint + '$select=event_clearance_group, count(*) AS total&$order=total DESC&' + searchParam + '&$group=event_clearance_group'
            }).success(function(data, status) {
              if( status === 'success' ) {
                dataSet = data;
                renderBarGraph(dataSet);
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
