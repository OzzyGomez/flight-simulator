//-------------------------------------------------------------------------
// Color Map for height
// 
var colorMap = new Float32Array();

// Terrain From Iteration
// Creates the Terrain using the x y and z from other places
function terrainFromIteration(n, minX,maxX,minY,maxY, vertexArray, faceArray, normalArray, colorArray, map) {
    var deltaX = (maxX-minX)/n;
    var deltaY = (maxY-minY)/n;
    var deltaZ = 0;
    
    for(var i = 0; i <= n; i++) {
      for(var j = 0; j <= n; j++) {
          
        var z = size * 0.001 + map[j + size * i] + 0.001 * (j + i) * 0.001;
        //var x = (0.5*(size + j - i) - size * 0.5) * 6;
        //var y = (size - 0.5 * (j + i)) * 0.005 + 1;
    
        var x = minX + deltaX * j;
        var y = minY + deltaY * i;
        //var z = map[j+ (n+1)*i]* 0.05 + (Math.random() * 0.5); 
        
        vertexArray.push(x);
        vertexArray.push(y);
        vertexArray.push(z);
          
        normalArray.push(0);
        normalArray.push(0);
        normalArray.push(0);
        
        colorArray.push(1, 1, 1, 1);
        //colorArray.push(1);
        //colorArray.push(1);
        //colorArray.push(1);
        
      }
    }
    
    var numT = 0;
    for(var i = 0;i < n; i++){
      for(var j = 0; j < n; j++) {
        var vid = i * (n + 1) + j;
        faceArray.push(vid);
        faceArray.push(vid+1);
        faceArray.push(vid+n+1);
         
        faceArray.push(vid+1);
        faceArray.push(vid+1+n+1);
        faceArray.push(vid+n+1);
        numT+=2;
      }
    }
    return numT;
}

// Generates Lines From Indexed Triangles
// Triangles gotten above
//-------------------------------------------------------------------------
function generateLinesFromIndexedTriangles(faceArray,lineArray) {
    numTris=faceArray.length/3;
    for(var f=0;f<numTris;f++) {
        var fid=f*3;
        lineArray.push(faceArray[fid]);
        lineArray.push(faceArray[fid+1]);
        
        lineArray.push(faceArray[fid+1]);
        lineArray.push(faceArray[fid+2]);
        
        lineArray.push(faceArray[fid+2]);
        lineArray.push(faceArray[fid]);
    }
}

//----------------------------------------------------------------------------------

// Helper Function to Implement Diamond Square Algorithm
// Some Code Was Modified From an Online Tutorial
//-------------------------------------------------------------------------

// Gets The Data From the Corresponding Map Key
function get(x, y) {
    if (x < 0 || x > max || y < 0 || y > max) {
        return -1;
    }
    return map[x + size * y];
}

// Gives the Map Key and Value
function set(x, y, val) {
    map[x + size * y] = val;
}

// Beginning of Diamond Square Algorithm
// Divides the Terrain
// Calls Functions Diamond and Square
function divide(divSize) {
    var x, y, half = divSize / 2;
    var scale = roughness * divSize;
    if (half < 1) {    
        return;
    }
    for (y = half; y < max; y += divSize) {
        for (x = half; x < max; x += divSize) {
            square(x, y, half, Math.random() * scale * 2 - scale);
        }
    }
    for (y = 0; y <= max; y += half) {
        for (x = (y + half) % divSize; x <= max; x += divSize) {
            diamond(x, y, half, Math.random() * scale * 2 - scale);
        }
    }
    divide(divSize / 2);
}

// Return the Average Values
// Needed for Diamond and Square Functions
function average(values) {
    var valid = values.filter(function(val) { 
        return val !== -1; 
    });
    
    var total = valid.reduce(function(sum, val) { 
        return sum + val; 
    }, 0);
    
    return total / valid.length;
}

// Square Function
// Averages the Four Corners And Sets Value with offset
function square(x, y, squareSize, offset) {
    var ave = average([
        get(x - squareSize, y - squareSize),   // upper left
        get(x + squareSize, y - squareSize),   // upper right
        get(x + squareSize, y + squareSize),   // lower right
        get(x - squareSize, y + squareSize)    // lower left
    ]);
    set(x, y, ave + offset);
}

// Diamond Function
// Averages the Four Edges And Sets Value with offset
function diamond(x, y, diamondSize, offset) {
    var ave = average([
        get(x, y - diamondSize),      // top
        get(x + diamondSize, y),      // right
        get(x, y + diamondSize),      // bottom
        get(x - diamondSize, y)       // left
    ]);
    set(x, y, ave + offset);
}
