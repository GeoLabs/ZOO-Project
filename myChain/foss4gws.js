var zoo_url='http://localhost/cgi-bin/zoo_loader.cgi';
var mapfile="/var/data/maps/project_WS2022.map";

function Buffer(inputData,bDist){

  // Create all required ZOO.formats
  var fGJ=new ZOO.Format.GeoJSON();

  // Call the Buffer service
  var myInputs = {InputPolygon: { type: 'complex', value: fGJ.write(inputData),mimeType: "application/json"}, BufferDistance: {type: 'float', "value": bDist } };
  var myOutputs= {Result: { type: 'RawDataOutput', "mimeType": "application/json" }};
  var myProcess = new ZOO.Process(zoo_url,'Buffer');
  var myExecuteResult=myProcess.Execute(myInputs,myOutputs);
  return fGJ.read(myExecuteResult);

}


function BufferToBBOX(inputs,dist){
  // Create all required ZOO.formats
  var fGJ=new ZOO.Format.GeoJSON();
  var fGML=new ZOO.Format.GML();
  if(inputs["InputData"]["mimeType"]=="application/json")
      fGML=new ZOO.Format.GeoJSON();

  // Read the   input GML
  var inputData=fGML.read(inputs["InputData"]["value"]);
  alert(inputData);

  // Compute Buffer
  var bufferResultAsJSON=Buffer(inputData,dist);
  alert(bufferResultAsJSON);

  // Create the Buffer result BBOX
  var bbox = new ZOO.Bounds();
  var bounds=bufferResultAsJSON[0].geometry.getVertices();
  for(var t in bounds){
    bbox.extend(bounds[t]);
  }
  return [bbox,bufferResultAsJSON,inputData];
}

function BufferMask(conf,inputs,outputs){
    //compute big buffer
    var bbox = BufferToBBOX(inputs,0.15);
    var finalG = bbox[0].toGeometry();
    var fGJ = new ZOO.Format.GeoJSON();

    //compute buffer standard buffer
    var bufferResultAsJSON = Buffer(bbox[2],0.0015);

    // request difference service using buffer result and features in the BBOX
    var result = new ZOO.Feature(finalG,{"fid": "1","name": "Result1000"});
    var myProcess2 = new ZOO.Process(zoo_url,'Difference');
    var myInputs2 = {
        InputEntity1: { type: 'complex',  value: fGJ.write(finalG), mimeType: "application/json" },
        InputEntity2: { type: 'complex',  value: fGJ.write(bufferResultAsJSON), mimeType: "application/json"}
    };
    var myOutputs2 = {Result: {type: 'RawDataOutput', "mimeType": "application/json" }};
    var myExecuteResult4 = myProcess2.Execute(myInputs2,myOutputs2);

    outputs["Result"]["value"] = myExecuteResult4;
    return {result: ZOO.SERVICE_SUCCEEDED, outputs: outputs};
}

function Mask(conf,inputs,outputs){
    var fGJ=new ZOO.Format.GeoJSON();
    var bbox = BufferToBBOX(inputs,0.15);
    var finalG=bbox[0].toGeometry();
    var result=new ZOO.Feature(finalG,{"name": "Result1000"});
    outputs["Result"]["value"]=fGJ.write(result);
    return {result: ZOO.SERVICE_SUCCEEDED, outputs: outputs };
  }