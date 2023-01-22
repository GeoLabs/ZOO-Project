/*
    This work was supported by a grant from the European Union's 7th Framework Programme (2007-2013)
    provided for the project PublicaMundi (GA no. 609608).
*/

require(['bootstrap', 'notify']);

define([
    'module', 'jquery', 'zoo', 'xml2json','ol'
], function(module, $, Zoo, X2JS,ol) {
    
    var zoo = new Zoo({
        url: module.config().url,
        delay: module.config().delay,
    });
    
    var mymodal = $('#myModal');
    var mynotify = $('.top-right');
    

    function notify(text, type) {
        mynotify.notify({
            message: { text: text },
            type: type,
        }).show();
    }


    
    var initialize = function() {

        $('.sidebar-left .slide-submenu').on('click',function() {
          var thisEl = $(this);
          thisEl.closest('.sidebar-body').fadeOut('slide',function(){
            $('.mini-submenu-left').fadeIn();
            applyMargins();
          });
        });

        $('.mini-submenu-left').on('click',function() {
          var thisEl = $(this);
          $('.sidebar-left .sidebar-body').toggle('slide');
          thisEl.hide();
          applyMargins();
        });

        $(window).on("resize", applyMargins);


        applyInitialUIState();
        applyMargins();
	console.log('step 0');

	map = new ol.Map({
	    layers: new ol.Collection(),
	    target: 'map',
	    view: new ol.View({
		center: [260047.557702813,6251682.54296228],
		//extent: [240047.557702813,6234682.54296228,281304.353234602,6267347.78149257],//[-20037508.34,-20037508.34,20037508.34,20037508.34],
		zoom: 12
	    })
	});

	var style1 = new ol.style.Style({
            image: new ol.style.Circle({
		radius: 5,
		fill: new ol.style.Fill({
		    color: 'rgba(255,255,255,0.5)'
		}),
		stroke: new ol.style.Stroke({
		    color: 'rgba(0,0,0,0.5)'
		})
	    })
	});

        layerLS=new ol.layer.Tile({
	    source: new ol.source.OSM({
		attributions: [
		    new ol.Attribution({
			html: 'Tiles &copy; <a href="http://www.opencyclemap.org/">' +
			    'OpenCycleMap</a>'
		    }),
		    ol.source.OSM.ATTRIBUTION
		],
		url: 'http://otile{1-4}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png'
	    })
	});
	map.addLayer(layerLS);
	
	layer = new ol.layer.Vector({
	    map: map,
	    source: new ol.source.Vector({
		features: new ol.Collection(),
		useSpatialIndex: false // optional, might improve performance
	    }),
	    updateWhileAnimating: true, // optional, for instant visual feedback
	    updateWhileInteracting: true // optional, for instant visual feedback
	});
	map.addLayer(layer);
 
	SubwayStops = new ol.layer.Vector({
	    map: map,
	    source: new ol.source.Vector({
		features: new ol.Collection(),
		useSpatialIndex: false
	    }),
	    style: style1,
	    updateWhileAnimating: true,
	    updateWhileInteracting: true 
	});

	$.ajax("./data/station1.gml").then(function(response) {
 	    var format = new ol.format.WFS({
		featureNS: "ogr",
		gmlFormat: new ol.format.GML2({
		    featureNS: "ogr",
		    featureType: "ogr:geometryProperty"
		})
	    });
	    try{
		var features = format.readFeatures(response,{
		    dataProjection: 'EPSG:3857'
		});
	    }catch(e){
		console.log(e);
	    }
	    var collection=new ol.Collection(features);
	    SubwayStops.getSource().addFeatures(features);
	    
	});
	map.addLayer(SubwayStops);

    }




    var filename="http://zoo-project.org/zoo-demo-2015/data/stations.gml";
    function cgalProcessing(aProcess) {
    notify('Running '+aProcess+' service','info');
	zoo.execute({
	    identifier: "cgal."+aProcess,
            dataInputs: [{"identifier":"InputPoints","href":filename,"mimeType":"text/xml"}],
            dataOutputs: [{"identifier":"Result","mimeType":"application/json","type":"raw"}],
            type: 'POST',
            storeExecuteResponse: false,
            success: function(data) {
                notify(aProcess+' service run successfully','success');
		        var GeoJSON = new ol.format.GeoJSON();
		        var features = GeoJSON.readFeatures((data));
			layer.setSource(new ol.source.Vector({
					    features: new ol.Collection(features),
					    useSpatialIndex: false // optional, might improve performance
			}))
            },
            error: function(data) {
		        notify('Execute failed:' +data.ExceptionReport.Exception.ExceptionText, 'danger');
            }
        });
    }


      function applyMargins() {
        var leftToggler = $(".mini-submenu-left");
        if (leftToggler.is(":visible")) {
          $("#map .ol-zoom")
            .css("margin-left", 0)
            .removeClass("zoom-top-opened-sidebar")
            .addClass("zoom-top-collapsed");
        } else {
          $("#map .ol-zoom")
            .css("margin-left", $(".sidebar-left").width())
            .removeClass("zoom-top-opened-sidebar")
            .removeClass("zoom-top-collapsed");
        }
      }



      function isConstrained() {
        return $(".sidebar").width() == $(window).width();
      }

      function applyInitialUIState() {
        if (isConstrained()) {
          $(".sidebar-left .sidebar-body").fadeOut('slide');
          $('.mini-submenu-left').fadeIn();
        }
      }


    // Return public methods
    return {
        initialize: initialize,
	cgalProcessing: cgalProcessing
    };


});

