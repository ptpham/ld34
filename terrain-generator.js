
var randomHeight = function (size) {
  var heightMap = [];
  for (var i = 0; i < size * size ; i++) {
    heightMap.push(Math.random());
  }
  return heightMap;
};

var createBridgeBufferInfo = function (gl, l, w) {
  var THICKNESS = 0.001;
  var BOTTOM = -0.5;
  var LEDGE_WIDTH = 0.01;

  var baseWidth = w + LEDGE_WIDTH * 2;

  var base = twgl.primitives.createCubeVertices();
  var topLedge = twgl.primitives.createCubeVertices();
  var bottomLedge = twgl.primitives.createCubeVertices();

  var baseTransform = twgl.m4.scaling([l, baseWidth, THICKNESS]);
  twgl.m4.setTranslation(
    baseTransform,
    [0, 0, -(0.5 * THICKNESS) + BOTTOM], // sits under ground
    baseTransform
  );
  transformPositions(base.position, baseTransform);

  var ledgeTransform = twgl.m4.scaling([l, LEDGE_WIDTH, LEDGE_WIDTH]);
  var topLedgeTransform = twgl.m4.setTranslation(
    ledgeTransform,
    [0, w/2, 0.5 * LEDGE_WIDTH + BOTTOM] // sits on ground
  );

  var bottomLedgeTransform = twgl.m4.setTranslation(
    ledgeTransform,
    [0, -w/2, 0.5 * LEDGE_WIDTH + BOTTOM], // sits on ground
    ledgeTransform
  );

  transformPositions(topLedge, topLedgeTransform);
  transformPositions(bottomLedge, bottomLedgeTransform);

  return twgl.createBufferInfoFromArrays(gl, consolidateArrays(base, topLedge, bottomLedge));
};

var createTunnelBufferInfo = function (gl, l, w) {
  var THICKNESS = 0.005;
  var BOTTOM = -0.5;

  var baseWidth = w + THICKNESS * 2;
  var base = twgl.primitives.createCubeVertices();
  var cap = twgl.primitives.createCubeVertices();
  var topWall = twgl.primitives.createCubeVertices();
  var bottomWall = twgl.primitives.createCubeVertices();

  var baseTransform = twgl.m4.scaling([l, baseWidth, THICKNESS]);
  twgl.m4.setTranslation(
    baseTransform,
    [0, 0, -(0.5 * THICKNESS) + BOTTOM], // sits under ground
    baseTransform
  );
  transformPositions(base.position, baseTransform);

  var capTransform = twgl.m4.scaling([l, baseWidth, THICKNESS]);
  twgl.m4.setTranslation(
    capTransform,
    [0, 0, -(0.5 * THICKNESS) + baseWidth],
    capTransform
  );
  transformPositions(cap.position, capTransform);

  var wallTransform = twgl.m4.scaling([l, THICKNESS, baseWidth]);
  var topWallTransform = twgl.m4.setTranslation(
    wallTransform,
    [0, w/2, 0.5 * THICKNESS + BOTTOM] // sits on ground
  );

  var bottomWallTransform = twgl.m4.setTranslation(
    ledgeTransform,
    [0, w/2, 0.5 * LEDGE_WIDTH + BOTTOM], // sits on ground
    ledgeTransform
  );

  transformPositions(topLedge, topLedgeTransform);
  transformPositions(bottomLedge, bottomLedgeTransform);
};

function transformPositions (positions, transform) {
  var length = positions.length / 3;

  for (var i = 0; i < length; i++) {
    var point = [positions[i*3], positions[i*3 + 1], positions[i*3 + 2]];
    twgl.m4.transformPoint(transform, point, point);

    positions[i*3] = point[0];
    positions[i*3 + 1] = point[1];
    positions[i*3 + 2] = point[2];
  }
}

function consolidateArrays () {
  var attributeArrays = _.toArray(arguments);
  var fullAttributeArrays = {};
  _.each(attributeArrays, function (arrays, key) {
    _.each(arrays, consolidateArrayKey);
  });

  return fullAttributeArrays;

  function consolidateArrayKey (array, key) {
    var fullArray = fullAttributeArrays[key];
    if (!fullArray) {
      fullArray = fullAttributeArrays[key] = {
        numComponents: array.numComponents,
        data: []
      };
    }
    fullArray.data.push.apply(fullArray.data, array);
  }
}