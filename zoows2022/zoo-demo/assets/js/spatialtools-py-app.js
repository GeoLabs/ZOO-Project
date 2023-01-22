// Filename: spatialtools-py-app.js
/*
    This work was supported by a grant from the European Union's 7th Framework Programme (2007-2013)
    provided for the project PublicaMundi (GA no. 609608).
*/

// REQUIRE OL 3.7.0

define([
    'module', 'jquery', 'zoo', 'xml2json','ol'
], function(module, $, Zoo, X2JS,ol) {
    
    var zoo = new Zoo({
        url: module.config().url,
        delay: module.config().delay,
    });

    var hasSimpleChain=false;


    var map, SubwayStops, layer;
    var highlightOverlay,hover,hover_,multi;
    var requestUrl;
    var pop;

    var activatedServices={
	Mask: false,
	BufferMask: false,
	BufferRequest: false,
	BufferRequestAndMask: false
    };


    function notify(){
        console.log(arguments);
    }

    function onPopupClose(){
	if(pop)
	    map.removePopup(pop);
    }

    function createPopup(){
	var tmp=arguments[0].geometry.getCentroid();
	if(pop)
	    map.removePopup(pop);
	var attrs='<div style="color: #000;"><table>';
	for(var i in arguments[0].data)
	    if(i!="gml_id")
		attrs+="<tr><td width='100' style='font-weight: bold;'>"+i+"</td><td>"+arguments[0].data[i]+"</td></tr>";
	attrs+="</table></div>";
	pop=new OpenLayers.Popup.FramedCloud("Information",
					     arguments[0].geometry.getBounds().getCenterLonLat(),
					     new OpenLayers.Size(100,100),
					     "<h2>"+arguments[0].data.name+"</h2>"+attrs,
					     null, true,onPopupClose);
	map.addPopup(pop);
    }
    
    function unSelect(){
	if(pop)
	    map.removePopup(pop);
    }

    function parseMapServerId(){
	try{
	    var sf=arguments[0].split(".");
	    return sf[0]+"."+sf[1].replace(/ /g,'');
	}catch(e){}
    }

    function toggleControl(element) {
	for(key in mapControls) {
	    var control = mapControls[key];
	    if(element.name == key && $(element).is('.ui-state-active')) {
		control.activate();
	    } else {
		control.deactivate();
	    }
	}
    }

    function restartDisplay(){
	var tmp=[highlightOverlay,hover,multi,hover_];
	for(i=0;i<tmp.length;i++)
	    if(tmp[i].getSource().getFeatures().length>=1){
		tmp[i].getSource().clear({"fast":true});
		for(var j=0;j<tmp[i].getSource().getFeatures().length;j++)
		    tmp[i].getSource().removeFeature(tmp[i].getSource().getFeatures()[j]);
	    }
	slist=$(".single-process:not(.ui-state-disabled)");
	for(var i=0;i<slist.length;i++)
	    slist[i].style.display='none';
	mlist=$(".multi-process:not(.ui-state-disabled)");
	for(var i=0;i<mlist.length;i++)
	    mlist[i].style.display='none';
    }

    function refreshDisplay(){
	elist=$(".single-process:not(.ui-state-disabled)");
	for(var i=0;i<elist.length;i++)
	    elist[i].style.display='block';
	if(hover.getSource().getFeatures().length>=1){
	    slist=$(".multi-process:not(.ui-state-disabled)");
	    for(var i=0;i<slist.length;i++)
		slist[i].style.display='block';
	}
    }

    function singleProcessing(aProcess) {
	if (highlightOverlay.getSource().getFeatures().length== 0)
	    return alert("No feature selected!");
	if(multi.getSource().getFeatures().length>=1)
  	    multi.getSource().clear();
	var started=true;
	var dep=hover;
	if(arguments.length>1){
	    dep=arguments[1];
	    started=false;
	}
	var xlink = requestUrl;
	var inputs=[{"identifier":(aProcess=="Buffer"?"InputPolygon":"InputData"),"href":xlink,"mimeType":(aProcess=="Buffer"?"text/xml":"application/json")}];

	var isChain2=false;
	if(aProcess=="SimpleChain2"){
	    aProcess="BufferRequest";
	    isChain2=true;
	}
	if (aProcess == 'Buffer' || aProcess == 'BufferPy') {
	    inputs.push({"identifier":"BufferDistance","value":"0.001","dataType":"integer"})
	}

        zoo.execute({
            identifier: aProcess,
            dataInputs: inputs,
            dataOutputs: [{"identifier":"Result","mimeType":"application/json","type":"raw"}],
            type: 'POST',
            storeExecuteResponse: false,
            success: function(data) {
		if(dep.getSource().getFeatures().length>0)
		    dep.getSource().clear();
		notify('Execute succeded', 'success');
		var GeoJSON = new ol.format.GeoJSON();
		var features = GeoJSON.readFeatures(data,
						    {dataProjection: 'EPSG:4326',
						     featureProjection: 'EPSG:3857'});
		dep.getSource().addFeatures(features);
		refreshDisplay();
            },
            error: function(data) {
		notify('Execute failed:' +data.ExceptionReport.Exception.ExceptionText, 'danger');
            }
        });
	if(isChain2){
	    singleProcessing("BufferMask",hover_);
        }
    }

    function multiProcessing(aProcess) {
	if (highlightOverlay.getSource().getFeatures().length == 0 || hover.getSource().getFeatures().length == 0)
	    return alert("Not enough feature created!");

	var xlink = requestUrl;
	var GeoJSON = new ol.format.GeoJSON();
	
	val=GeoJSON.writeFeatures([hover.getSource().getFeatures()[0]],
				      {dataProjection: 'EPSG:4326',
				       featureProjection: 'EPSG:3857'});
	console.log(val);
	var inputs=[{"identifier":"InputEntity1","href":xlink,"mimeType":"text/xml"},
		   {"identifier":"InputEntity2","value":val,"mimeType":"application/json"}];

        zoo.execute({
            identifier: aProcess,
            dataInputs: inputs,
            dataOutputs: [{"identifier":"Result","mimeType":"application/json","type":"raw"}],
            type: 'POST',
            storeExecuteResponse: false,
            success: function(data) {
		if(multi.getSource().getFeatures().length>0)
		    multi.getSource().removeFeature(multi.getSource().getFeatures()[0]);
		notify('Execute succeded', 'success');
		console.log(data);
		var GeoJSON = new ol.format.GeoJSON();
		var features = GeoJSON.readFeatures(data,
						    {dataProjection: 'EPSG:4326',
						     featureProjection: 'EPSG:3857'});
		multi.getSource().addFeatures(features);
            },
            error: function(data) {
		notify('Execute failed:' +data.ExceptionReport.Exception.ExceptionText, 'danger');
            }
        });

    }
    
    function activateService(){
	try{
	    console.log('ok !');
	    $("#buttonBar").append('<li class="navbar-btn">'+
				   '<a href="#" class="btn btn-default btn-sml single-process process processa" title="'+(arguments[0]!="SimpleChain2"?arguments[0]:"BufferRequestAndMask")+'" name="Source" onclick="app.singleProcessing(\''+(arguments[0]!="SimpleChain2"?arguments[0]:"SimpleChain2")+'\');"> <span>'+(arguments[0]!="SimpleChain2" && arguments[0]!="BufferMask" && arguments[0]!="BufferRequest"?arguments[0]:(arguments[0]!="BufferMask" && arguments[0]!="BufferRequest"?"Buffer Request and Mask":arguments[0]!="BufferRequest"?"Buffer Mask":"Buffer Request"))+'</span></a>'+
				   '</li>');
	    elist=$('.processa');
	    for(var i=0;i<elist.length;i++){
		elist[i].style.display='none';
	    }
	    
	}catch(e){
	    alert(e);
	}
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

    
    //
    var initialize = function() {
        self = this;        

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


	var main_url="http://localhost/cgi-bin/mapserv?map=/var/data/maps/project_WS2022.map";
	var typename="roads";

	var wmsSource=new ol.source.TileWMS({
	    url: main_url,
	    params: {'LAYERS': typename},
	    serverType: 'mapserver'
	});
        layerLS=new ol.layer.Tile({
            opacity: 0.7,
            source: new ol.source.OSM()
        });

	var layers = [
	    layerLS,
	    new ol.layer.Tile({
		source: wmsSource
	    })
	];
	map = new ol.Map({
	    layers: layers,
	    target: 'map',
	    view: new ol.View({
		center: ol.proj.transform([11.2493375,43.7729866],"EPSG:4326","EPSG:3857"),
		zoom: 16
	    })
	});
	
	var parser = new ol.format.GeoJSON();
	var style = new ol.style.Style({
	    fill: new ol.style.Fill({
		color: 'rgba(255,255,255,0.5)'
	    }),
	    stroke: new ol.style.Stroke({
		color: 'rgba(255,255,255,0.5)',
		width: 4
	    }),
	    text: new ol.style.Text({
		font: '12px Calibri,sans-serif',
		fill: new ol.style.Fill({
		    color: '#000'
		}),
		stroke: new ol.style.Stroke({
		    color: '#fff',
		    width: 3
		})
	    }),
	    image: new ol.style.Circle({
		radius: 7,
		fill: new ol.style.Fill({
		    color: 'rgba(255, 0, 0, 0.2)'
		}),
		stroke: new ol.style.Stroke({
		    color: '#ffcc33',
		    width: 2
		})
	    })
	});
	var style1 = new ol.style.Style({
	    fill: new ol.style.Fill({
		color: 'rgba(110,110,110,0.5)'
	    }),
	    stroke: new ol.style.Stroke({
		color: 'rgba(110,110,110,0.5)',
		width: 4
	    }),
	    text: new ol.style.Text({
		font: '12px Calibri,sans-serif',
		fill: new ol.style.Fill({
		    color: '#000'
		}),
		stroke: new ol.style.Stroke({
		    color: '#fff',
		    width: 3
		})
	    }),
	    image: new ol.style.Circle({
		radius: 7,
		fill: new ol.style.Fill({
		    color: 'rgba(255, 0, 0, 0.2)'
		}),
		stroke: new ol.style.Stroke({
		    color: '#ffcc33',
		    width: 2
		})
	    })
	});
	var style2 = new ol.style.Style({
	    fill: new ol.style.Fill({
		color: 'rgba(0,0,0,0.4)'
	    }),
	    stroke: new ol.style.Stroke({
		color: 'rgba(0,0,0,0.4)',
		width: 4
	    }),
	    image: new ol.style.Circle({
		radius: 7,
		fill: new ol.style.Fill({
		    color: 'rgba(255, 0, 0, 0.2)'
		}),
		stroke: new ol.style.Stroke({
		    color: '#ffcc33',
		    width: 2
		})
	    })
	});
	var styles = [style];
	var myproj=new ol.proj.Projection({
	    code: "EPSG:4326"
	});
	console.log(myproj);

	highlightOverlay = new ol.layer.Vector({
	    map: map,
	    source: new ol.source.Vector({
		features: new ol.Collection(),
		useSpatialIndex: false // optional, might improve performance
	    }),
	    style: style,
	    updateWhileAnimating: true, // optional, for instant visual feedback
	    updateWhileInteracting: true // optional, for instant visual feedback
	});
	hover = new ol.layer.Vector({
	    map: map,
	    source: new ol.source.Vector({
		features: new ol.Collection(),
		useSpatialIndex: false // optional, might improve performance
	    }),
	    style: style1,
	    updateWhileAnimating: true, // optional, for instant visual feedback
	    updateWhileInteracting: true // optional, for instant visual feedback
	});
	hover_ = new ol.layer.Vector({
	    map: map,
	    source: new ol.source.Vector({
		features: new ol.Collection(),
		useSpatialIndex: false // optional, might improve performance
	    }),
	    style: style2,
	    updateWhileAnimating: true, // optional, for instant visual feedback
	    updateWhileInteracting: true // optional, for instant visual feedback
	});
	multi = new ol.layer.Vector({
	    map: map,
	    source: new ol.source.Vector({
		features: new ol.Collection(),
		useSpatialIndex: false // optional, might improve performance
	    }),
	    style: style2,
	    updateWhileAnimating: true, // optional, for instant visual feedback
	    updateWhileInteracting: true // optional, for instant visual feedback
	});
	var toto=[highlightOverlay,hover,hover_,multi];
	for(i=0;i<toto.length;i++)
	    map.addLayer(toto[i]);

	var popup = new ol.Overlay.Popup();
	map.addOverlay(popup);

	map.on('singleclick', function(evt) {
	    var view = map.getView();
	    var feature = null;
	    map.forEachFeatureAtPixel(evt.pixel,function (f, hover1) {
		feature=f;
	    });
	    if (feature) {
		var geometry = feature.getGeometry();
		var coord = geometry.getCoordinates();
		popup.setPosition(coord);
		
		var coords = ol.coordinate.toStringXY(ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326'),2);
		
		popup.show(evt.coordinate, '<div><h3>' + feature.get('name')
			   +'</h3><p>' + coords +'</p></div>');
	    } else {
		popup.hide();
		var url = wmsSource.getGetFeatureInfoUrl(evt.coordinate,
							 view.getResolution(), view.getProjection(),
							 {'INFO_FORMAT': 'application/json'});
		var ccoords=ol.proj.transform(evt.coordinate,"EPSG:3857","EPSG:4326");
		console.log(ccoords);
		var x=ccoords[0];
		var y=ccoords[1];
	    requestUrl=url;//proxy+encodeURIComponent(url);
	    console.log(requestUrl);
	    $.ajax(requestUrl).then(function(response) {
		console.log(response);
		if(highlightOverlay.getSource().getFeatures().length>0)
		    highlightOverlay.getSource().removeFeature(highlightOverlay.getSource().getFeatures()[0]);
		console.log(response);
		var features = parser.readFeatures(response,
						   {dataProjection: 'EPSG:4326',
						    featureProjection: 'EPSG:3857'});
		console.log(features);
		highlightOverlay.getSource().addFeatures(features);
		console.log("ok");
		
		refreshDisplay();
	    });
	    }


	});

	zoo.getCapabilities({
	    type: 'POST',
	    success: function(data){
		restartDisplay();
		var processes=data["Capabilities"]["ProcessOfferings"]["Process"];
		for(var i in activatedServices){
		    for(var j=0;j<processes.length;j++)
			if(i==processes[j].Identifier){
			    activateService(i);
			    activatedServices[i]=true;
			    if(activatedServices["BufferRequest"] && activatedServices["BufferMask"] && !hasSimpleChain){
				activateService("SimpleChain2");
				activatedServices["BufferRequestAndMask"]=true;
				hasSimpleChain=true;
			    }
			    if(i=="BufferMask")
				if(activatedServices["BufferRequest"]){
				    activateService("SimpleChain2");
				    activatedServices["BufferRequestAndMask"]=true;
				}
			    break;
			}
		}
	    }
	});


    }
    
    // Return public methods
    return {
        initialize: initialize,
        singleProcessing: singleProcessing,
        multiProcessing: multiProcessing,
        restartDisplay: restartDisplay
    };


});

