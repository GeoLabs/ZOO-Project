// Filename: main.js

requirejs.config({
    baseUrl: 'assets',
    paths: {
        text: 'js/lib/require-text-2.0.12',
        hgn: 'js/lib/require-hgn-0.3.0',

	ol: 'js/lib/openlayers/ol',
	olpopup: 'js/lib/openlayers/ol-popup',

        jquery: 'js/lib/jquery/jquery-2.1.1.min',
        bootstrap: 'js/lib/bootstrap-3.1.1-dist/js/bootstrap.min',
                
        hogan: 'js/lib/hogan/hogan-3.0.2',
        xml2json: 'js/lib/xml2json/xml2json.min',
        queryString: 'js/lib/query-string/query-string',
        wpsPayloads: 'js/lib/zoo/payloads',
        wpsPayload: 'js/lib/zoo/wps-payload',
        utils: 'js/lib/zoo/utils',
        zoo: 'js/lib/zoo/zoo',
        
        domReady: 'js/lib/domReady',
        app: 'js/spatialtools-py-app',
            
    },
    shim: {
        bootstrap: {
            deps: ['jquery'],
        },
	wpsPayloads: {
	    deps: ['hogan'],
	},
        wpsPayload: {
	    deps: ['wpsPayloads'],
            exports: 'wpsPayload',
        },
        hogan: {
            exports: 'Hogan',
        },
        xml2json: {
          exports: "X2JS",
        },
        queryString: {
            exports: 'queryString',
        },
        ol: {
            exports: 'ol',
        },
	app: {
	    deps: ['ol', 'olpopup', 'bootstrap']
	}
    },
    
});


requirejs.config({ 
    config: {
        app: {
            url: 'http://localhost/cgi-bin/zoo_loader.cgi',
            delay: 2000,
        }
    } 
});

require(['domReady', 'app'], function(domReady, app) {
    domReady(function() {
        app.initialize();
    });
    window.singleProcessing=app.singleProcessing;
    window.multiProcessing=app.multiProcessing;
    window.restartDisplay=app.restartDisplay;
    window.app=app;
});





