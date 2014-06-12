// Create a global object to store all logic in
var root = this;
root.app == null ? app = root.app = {} : app = root.app;
app.views == null ? app.views = app.views = {} : app.views = app.views;

app.views.RouteResultsView = Backbone.View.extend({
  initialize: function () {
    this.parentTemplate = _.template($("#show-directions-template").html());
    this.childTemplate = _.template($("#show-directions-items-template").html());
  },
  render: function () {
    var el = this.el;
    $(el).append(this.parentTemplate());
    this.buildRouteTable();
  },
  buildRouteTable: function () {
    var el = this.el,
        data = this.attributes.features,
        template = this.childTemplate;

    _.each(data, function (item) {
      var itemData = {
				"index": item.properties.index,
        "text": item.properties.text,
        "time": item.properties.time,
        "distance": item.properties.distance,
      },
      el = $("#show-directions .list-group").first();

      return $(el).append(template({
        data: itemData
      }))
    })   
  }
});

// Render the route
app.views.RouteView = Backbone.View.extend({
  initialize: function () {
  	var view = this;
    this.template = _.template($("#get-directions-template").html());
  },
  render: function () {
    var el = this.el,
        template = this.template;
    return $(el).append(template());
  },
  events: {
    "submit": "getDirections",
  },
  getDirections: function () {
		var directions = {
			from: $("#geo-start").val(),
			to: $("#geo-destination").val(),
		};
		directions.from = this.getLocation(directions.from);
		directions.to = this.getLocation(directions.to);
		this.route(directions);
		return false;
	},
	// Get the lat/long for a selected location if the location 
	// matches a source location in the farms.json data
	getLocation:	function (location) {
		farmsData = window.FarmsData.models[0].attributes.features;
		_.each(farmsData, function(farmData) {
			if (farmData.properties.source == location)
				location = farmData.properties.lat + ", " + farmData.properties.lon;
		});
		return location;
	},
  route: function (data, callback) {
    var layers = this.model.get("layer"),
        view = this;
    layers.clearLayers();
    this.model.createLayers();
  	// Look into the JSON object and build GeoJSON features
    this.model.processRoute(data, function (data) {
      if (data) {
        var linesLayer = layers.getLayers()[0],
            pointsLayer = layers.getLayers()[1],
            bbox = data.bbox;
        linesLayer.addData(data.lines);
        pointsLayer.addData(data.points);

        app.map.fitBounds([
          [bbox.ul.lat, bbox.ul.lng], 
          [bbox.lr.lat, bbox.lr.lng]
        ]);

        $("#show-directions .panel").remove()

        new app.views.RouteResultsView({
          el: $("#show-directions").first(),
          attributes: data.points,
        }).render();
      }
			// If there was an error calculating directions
			else {
				var data = {
					"points": {
						"features": [{
							"properties": {
								"index": 0,
								"text": "Unable to calculate directions.",
								"time": "0",
								"distance": 0
					}}]}};
					
				$("#show-directions .panel").remove()
				
				new app.views.RouteResultsView({
          el: $("#show-directions").first(),
          attributes: data.points,
        }).render();
			}
    });
  }
});