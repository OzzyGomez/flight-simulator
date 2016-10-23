var gl;
var canvas;
var shaderProgram;
var vertexPositionBuffer;

// Create a place to store terrain geometry
var tVertexPositionBuffer;

//Create a place to store normals for shading
var tVertexNormalBuffer;

// Create a place to store Colors
var tVertexColorBuffer;

// Create a place to store the terrain triangles
var tIndexTriBuffer;

//Create a place to store the traingle edges
var tIndexEdgeBuffer;

// View parameters
var eyePt = vec3.fromValues(0.0, 100.0,300.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,1.0);
var viewPt = vec3.fromValues(0.0,1.0,0.0);
/*
var eyePt = vec3.fromValues(0.0, 75.0,100.0);
var viewDir = vec3.fromValues(0.0,0.0,-1.0);
var up = vec3.fromValues(0.0,1.0,1.0);
var viewPt = vec3.fromValues(0.0,1.0,0.0);
*/


// Create the normal
var nMatrix = mat3.create();

// Create ModelView matrix
var mvMatrix = mat4.create();

//Create Projection matrix
var pMatrix = mat4.create();

var mvMatrixStack = [];

// GLOBAL VARIABLES
// Defind Initial Quat
var rotate = quat.create();
// Define Initial Camera
var myCamera = vec3.create();
// Initialize Booleans For Roll and Pitch with KeyCodes
var goUp = false;
var goDown = false;
var goLeft = false;
var goRight = false;
var goFast = false;

// Initalize Camera Speed
var speed = 0.3;
var speed3 = 0.01;
var roughness = 0.7;

// Initalize Roll and Pitch 
var rollLeft = -0.5;
var rollRight = 0.5;
var pitchUp = 0.5;
var pitchDown = -0.5;

// Global Variable to Use for Later
var size;
var map;
var max;

// Global Variable for Canvas Size
var canvasWidth;
var canvasHeight;

// Initalized Terrain, Diamond, Square, and Buffer
//-------------------------------------------------------------------------
function setupTerrainBuffers() {
    
    // Variables For Vertices, Edges, Color, Etc.
    var vTerrain=[];
    var fTerrain=[];
    var nTerrain=[];
    var eTerrain=[];
    var cTerrain=[];
    var gridN = 128; // Math.pow(2, detail) WHERE detail = 4
    
    // Initalize Gloabla Variables with Certain values
    size = gridN + 1; // 5
    max = size - 1; // 4
    map = new Float32Array(size * size); //16
    
    // Sets up the Four Conners of the terrain
    set(0, 0, max);   
    set(max, 0, max/2);           
    set(max, max, 0);            
    set(0, max, max/2);
    
    // divide and conquer. This starts the Diamond Square Algorithm Process
    divide(max);
    
    var numT = terrainFromIteration(gridN, -200,200,-200,200, vTerrain, fTerrain, nTerrain, cTerrain, map);
    console.log("Generated ", numT, " triangles");
    
    tVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);      
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vTerrain), gl.STATIC_DRAW);
    tVertexPositionBuffer.itemSize = 3;
    tVertexPositionBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify normals to be able to do lighting calculations
    tVertexNormalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(nTerrain),
                  gl.STATIC_DRAW);
    tVertexNormalBuffer.itemSize = 3;
    tVertexNormalBuffer.numItems = (gridN+1)*(gridN+1);
    
    // Specify colors to be able to do lighting calculations
    tVertexColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tVertexColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(cTerrain),
                  gl.STATIC_DRAW);
    tVertexColorBuffer.itemSize = 3;
    tVertexColorBuffer.numItems = (gridN+1)*(gridN+1);
    
    
    // Specify faces of the terrain 
    tIndexTriBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(fTerrain),
                  gl.STATIC_DRAW);
    tIndexTriBuffer.itemSize = 1;
    tIndexTriBuffer.numItems = numT*3;
    
    //Setup Edges
     generateLinesFromIndexedTriangles(fTerrain,eTerrain);  
     tIndexEdgeBuffer = gl.createBuffer();
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(eTerrain),
                  gl.STATIC_DRAW);
     tIndexEdgeBuffer.itemSize = 1;
     tIndexEdgeBuffer.numItems = eTerrain.length;
    
     
}

// Draw the Terrain
// Uses the Arrays From Above
//-------------------------------------------------------------------------
function drawTerrain(){
 gl.polygonOffset(0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);   
 
 // tVertexColorBuffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexColorBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                           tVertexColorBuffer.itemSize,
                           gl.FLOAT, false, 0, 0); 
  
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexTriBuffer);
 gl.drawElements(gl.TRIANGLES, tIndexTriBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

// Draws Edges of Terrain
//-------------------------------------------------------------------------
function drawTerrainEdges(){
 gl.polygonOffset(1,1);
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexPositionBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, tVertexPositionBuffer.itemSize, 
                         gl.FLOAT, false, 0, 0);

 // Bind normal buffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexNormalBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
                           tVertexNormalBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);

 // tVertexColorBuffer
 gl.bindBuffer(gl.ARRAY_BUFFER, tVertexColorBuffer);
 gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 
                           tVertexColorBuffer.itemSize,
                           gl.FLOAT, false, 0, 0);
    
 //Draw 
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, tIndexEdgeBuffer);
 gl.drawElements(gl.LINES, tIndexEdgeBuffer.numItems, gl.UNSIGNED_SHORT,0);      
}

//-------------------------------------------------------------------------
function uploadModelViewMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//-------------------------------------------------------------------------
function uploadProjectionMatrixToShader() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, 
                      false, pMatrix);
}

//-------------------------------------------------------------------------
function uploadNormalMatrixToShader() {
  mat3.fromMat4(nMatrix,mvMatrix);
  mat3.transpose(nMatrix,nMatrix);
  mat3.invert(nMatrix,nMatrix);
  gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, nMatrix);
}

//----------------------------------------------------------------------------------
function mvPushMatrix() {
    var copy = mat4.clone(mvMatrix);
    mvMatrixStack.push(copy);
}

//----------------------------------------------------------------------------------
function mvPopMatrix() {
    if (mvMatrixStack.length == 0) {
      throw "Invalid popMatrix!";
    }
    mvMatrix = mvMatrixStack.pop();
}

//----------------------------------------------------------------------------------
function setMatrixUniforms() {
    uploadModelViewMatrixToShader();
    uploadNormalMatrixToShader();
    uploadProjectionMatrixToShader();
}

//----------------------------------------------------------------------------------
function degToRad(degrees) {
        return degrees * Math.PI / 180;
}

//----------------------------------------------------------------------------------
function createGLContext(canvas) {
  var names = ["webgl", "experimental-webgl"];
  var context = null;
  for (var i=0; i < names.length; i++) {
    try {
      context = canvas.getContext(names[i]);
    } catch(e) {}
    if (context) {
      break;
    }
  }
  if (context) {
    context.viewportWidth = canvas.width;
    context.viewportHeight = canvas.height;
  } else {
    alert("Failed to create WebGL context!");
  }
  return context;
}

//----------------------------------------------------------------------------------
function loadShaderFromDOM(id) {
  var shaderScript = document.getElementById(id);
  
  // If we don't find an element with the specified id
  // we do an early exit 
  if (!shaderScript) {
    return null;
  }
  
  // Loop through the children for the found DOM element and
  // build up the shader source code as a string
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) { // 3 corresponds to TEXT_NODE
      shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }
 
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }
 
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);
 
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  } 
  return shader;
}

//----------------------------------------------------------------------------------
function setupShaders() {
  vertexShader = loadShaderFromDOM("shader-vs");
  fragmentShader = loadShaderFromDOM("shader-fs");
  
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Failed to setup shaders");
  }

  gl.useProgram(shaderProgram);

  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
    
  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
  shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
  shaderProgram.uniformLightPositionLoc = gl.getUniformLocation(shaderProgram, "uLightPosition");    
  shaderProgram.uniformAmbientLightColorLoc = gl.getUniformLocation(shaderProgram, "uAmbientLightColor");  
  shaderProgram.uniformDiffuseLightColorLoc = gl.getUniformLocation(shaderProgram, "uDiffuseLightColor");
  shaderProgram.uniformSpecularLightColorLoc = gl.getUniformLocation(shaderProgram, "uSpecularLightColor");
}

//-------------------------------------------------------------------------
function uploadLightsToShader(loc,a,d,s) {
  gl.uniform3fv(shaderProgram.uniformLightPositionLoc, loc);
  gl.uniform3fv(shaderProgram.uniformAmbientLightColorLoc, a);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColorLoc, d);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColorLoc, s);
}

//----------------------------------------------------------------------------------
function setupBuffers() {
    setupTerrainBuffers();
}

//----------------------------------------------------------------------------------
function draw() { 
    var transformVec = vec3.create();
  
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // We'll use perspective 
    mat4.perspective(pMatrix,degToRad(45), gl.viewportWidth / gl.viewportHeight, 0.1, 200.0);

    // We want to look down -z, so create a lookat point in that direction    
    vec3.add(viewPt, eyePt, viewDir);
    // Then generate the lookat matrix and initialize the MV matrix to that view
    mat4.lookAt(mvMatrix,eyePt,viewPt,up);    
 
    //Draw Terrain
    mvPushMatrix();
    vec3.set(transformVec,0.0,-0.25,-3.0);
    mat4.translate(mvMatrix, mvMatrix,transformVec);
    mat4.rotateX(mvMatrix, mvMatrix, degToRad(-75));
    mat4.rotateZ(mvMatrix, mvMatrix, degToRad(25));     
    setMatrixUniforms();
    
    //if ((document.getElementById("polygon").checked) || (document.getElementById("wirepoly").checked)) {
        uploadLightsToShader([0,1,1],[0.0,0.2,0.0],[0.0,0.2,0.0],[0.0,0.2,0.0]);
        drawTerrain();
    //}
    //if(document.getElementById("wirepoly").checked){
    // uploadLightsToShader([0,1,1],[0.0,0.0,0.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
    // drawTerrainEdges();
    //}

    //if(document.getElementById("wireframe").checked){
    //  uploadLightsToShader([0,1,1],[1.0,1.0,1.0],[0.0,0.0,0.0],[0.0,0.0,0.0]);
    //  drawTerrainEdges();
    //}
    mvPopMatrix();
  
}

//----------------------------------------------------------------------------------
function FlightSimulator() {
    // Initialize terrain vars
    // Initialize camera vars
}

//----------------------------------------------------------------------------------
function RunFlightSimulator() {
    // Set GL parameters (e.g. depth test, face culling, etc.)
    // Bootstrap the shaders
    // Initialize the terrain data
    // Initialize matrices (e.g., view, perspective)
    // Kick	off	the	rendering loop (and draw)
}
//----------------------------------------------------------------------------------
function MyCamera() {
    
}
//----------------------------------------------------------------------------------
function updateViewMatrix() {
  vec3.normalize(viewDir, viewDir);
  vec3.scale(viewDir, viewDir, speed);
  myCamera.set(eyePt);
  vec3.normalize(up, up);
    
  if (goLeft){
    //rollLeft += 1;
    roll(rollLeft);
  } else if (goRight){
    //rollRight -= 1;
    roll(rollRight);
  }
  if (goUp){
    //pitchUp += 0.5
    pitch(pitchUp);
  } else if (goDown){
    //pitchDown -= 0.5;
    pitch(pitchDown);
  }
    
  vec3.add(eyePt, eyePt, viewDir);
}

//----------------------------------------------------------------------------------
function KeyboardEventHandler() {
  document.onkeydown = handleKeyDown;
  document.onkeyup = handleKeyUp;
}

function handleKeyDown(event){
  if (event.keyCode === 37) {
    goLeft = true;
    goRight = false;
  } else if (event.keyCode === 38) {
    goUp = true;
    goDown = false;
  } else if (event.keyCode === 39) {
    goLeft = false;
    goRight = true;
  } else if (event.keyCode === 40) {
    goUp = false;
    goDown = true;
  }

  if (event.keyCode === 32) {
      goFast = false;
  }
}

function handleKeyUp(event){
  if (event.keyCode === 37) {
    goLeft = false;
  } else if (event.keyCode === 38) {
    goUp = false;
  } else if (event.keyCode === 39) {
    goRight = false;
  } else if (event.keyCode === 40) {
    goDown = false;
  } //else if (event.keyCode === 32) {
    //speed = 0.1;
    //}
    
  if (event.keyCode >= 37 && event.keyCode <= 40) {
    rotate = quat.create();
  }
}

function pitch(degree) {

  var radius = degToRad(degree);
  var workingQuat = quat.create();
  var vec = vec3.create();
    
  vec3.cross(vec, viewDir, up);
  quat.setAxisAngle(workingQuat, vec, radius);

  quat.normalize(workingQuat, workingQuat);
  quat.multiply(rotate, rotate, workingQuat);
  quat.normalize(rotate, rotate);
    
  vec3.transformQuat(up, up, rotate);
  vec3.transformQuat(viewDir,viewDir, rotate);
    
  mat4.lookAt(mvMatrix,eyePt,viewPt,up);
}

function roll(degree) {
  var radius = degToRad(degree);
  var workingQuat = quat.create();

  quat.setAxisAngle(workingQuat, viewDir, radius);
  quat.normalize(workingQuat, workingQuat); 
  quat.multiply(rotate, rotate, workingQuat);
  quat.normalize(rotate, rotate);
     
  vec3.transformQuat(up, up, rotate);
  vec3.transformQuat(viewDir,viewDir, rotate);

  mat4.lookAt(mvMatrix,eyePt,viewPt,up);
}

//----------------------------------------------------------------------------------
function animate() {
}

//----------------------------------------------------------------------------------
function startup() {
  canvas = document.getElementById("myGLCanvas");
  gl = createGLContext(canvas);
  width = canvas.width;
  height = canvas.height;
  setupShaders();
  setupBuffers();
  gl.clearColor(0.53, 0.8, 0.98, 1.0);
  gl.enable(gl.DEPTH_TEST);
  tick();
}

//----------------------------------------------------------------------------------
function tick() {
    requestAnimFrame(tick);
    draw();
    KeyboardEventHandler();
    updateViewMatrix();
}
