// mapserver template
[resultset layer=roads]{
  "type": "FeatureCollection",
  "features": [
    [feature trimlast=","]
    {
      "type": "Feature",
      "id": "[id]",
      "geometry": {
        "type": "LineString",
        "coordinates": [
	    [shpxy cs="," xh="[" yf="]" precision=10]
        ]
      },
      "properties": {
        "name": "[name]"
      }
    },
    [/feature]
  ]
}
[/resultset]
