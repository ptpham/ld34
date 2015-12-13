(function (root) {
  function Terrain (size, layers, thicknesses) {
    this.size = size;
    this.layers = layers;
    this.thicknesses = thicknesses;

    this.attributes = null;
    this.platforms = [];

    this.getAttributes();
    return this;
  }

  root.Terrain = Terrain;

  Terrain.prototype.getPlatform = function (layer) {
    return this.platforms[layer];
  };

  Terrain.prototype.getAttributes = function () {
    var HEIGHT = 1;
    var BLOCK_WIDTH = 5;
    var thicknesses = this.thicknesses;

    if (!this.attributes) {
      var startHeight = 0;
      var attributes = this.attributes = {
        terrain: {position: [], normal: []},
        water: {position: [], normal: []}
      };

      this.platforms = _.map(layers, function (layer, i) {
        var thickness = (thicknesses[i] || 1) * HEIGHT;
        var platform = {
          bottom: startHeight,
          thickness: thickness,
          vertices: [],
          waterVertices: []
        };

        formLayer(
          layer, size, startHeight,
          BLOCK_WIDTH, thickness,
          attributes, platform
        );

        startHeight += thicknesses[i] * HEIGHT;
        return platform;
      });
    }
    return this.attributes;
  };

  Terrain.prototype.createTerrainBufferInfo = function (gl) {
    var attributes = this.getAttributes().terrain;
    return twgl.createBufferInfoFromArrays(gl, attributes);
  };

  Terrain.prototype.createWaterBufferInfo = function (gl) {
    var attributes = this.getAttributes().water;
    return twgl.createBufferInfoFromArrays(gl, attributes);
  };

  var ROCK = {value: 1, fill: false};
  var WATER = {value: 2, fill: true};

  function formLayer(layer, size, startHeight, block, thickness, attributes, platform) {
    var positions = attributes.position;
    var normals = attributes.normal;

    var sections = layer.length-size-1;
    for (var i = 0; i < sections; i++) {
      var x = (i % size) * block;
      var y = Math.floor(i / size) * block;
      var section = [layer[i], layer[i+1], layer[size+i+1], layer[size+i]];

      formSection(section, ROCK, x, y, startHeight, block, thickness, attributes.terrain, platform.vertices);
      formSection(section, WATER, x, y, startHeight, block, thickness, attributes.water, platform.waterVertices);
    }
    return attributes;
  }

  function formSection(section, type, x, y, z, block, thickness, attributes, platformVertices) {
    var countAll = count(section);
    var countType = count(section, type.value);

    if (countAll < 3) return;
    if (!type.fill && countType < 3) return;
    if (type.fill && !countType) return;

    var positions = attributes.position;
    var normals = attributes.normal;

    var face = [];
    var faceMirror = [];

    var faceVertices = [
      [x, z + thickness, y], [x + block, z + thickness, y],
      [x + block, z + thickness, y + block], [x, z + thickness, y + block]
    ];
    var mirrorVertices = [
      [x, z, y], [x + block, z, y],
      [x + block, z, y + block], [x, z, y + block]
    ];

    _.each(section, function (value, i) {
      var isVertex = value === type.value || (type.fill && countType > 2);
      if (!isVertex && type.fill && countType) {
        var next = i + 1 > section.length - 1 ? 0 : i + 1;
        var prev = i - 1 < 0 ? section.length - 1 : i - 1;
        isVertex = section[next] === type.value || section[prev] === type.value;
      }
      if (isVertex) {
        face.push(faceVertices[i]);
        faceMirror.unshift(mirrorVertices[i]);
      }
    });

    var normal = getNormal(face);
    var mirrorNormal = getNormal(faceMirror);
    var vertices = triangulate(face);
    var mirrorVertices = triangulate(faceMirror);

    _.each(vertices, function (vertex, i) {
      positions.push.apply(positions, vertex);
      normals.push.apply(normals, normal);
    });

    _.each(mirrorVertices, function (vertex, i) {
      positions.push.apply(positions, vertex);
      normals.push.apply(normals, mirrorNormal);
      platformVertices.push(twgl.v3.create.apply(null, vertex));
    });

    formSides(face, faceMirror, attributes);
    return attributes;
  }

  function formSides(face, faceMirror, attributes) {
    var length = face.length;
    var positions = attributes.position;
    var normals = attributes.normal;
    faceMirror.forEach(function (vertex, i) {
      var next = i + 1;
      if (next === length) {
        next = 0;
      }

      var upperVertex = face[length-i-1];
      var nextVertex = faceMirror[next];
      var nextUpperVertex = face[length-next- 1];

      var normalSideA = getNormal([vertex, upperVertex, nextUpperVertex]);
      var normalSideB = getNormal([nextVertex, vertex, nextUpperVertex]);

      positions.push.apply(positions, vertex);
      positions.push.apply(positions, upperVertex);
      positions.push.apply(positions, nextUpperVertex);
      positions.push.apply(positions, nextVertex);
      positions.push.apply(positions, vertex);
      positions.push.apply(positions, nextUpperVertex);

      normals.push.apply(normals, normalSideA);
      normals.push.apply(normals, normalSideA);
      normals.push.apply(normals, normalSideA);
      normals.push.apply(normals, normalSideB);
      normals.push.apply(normals, normalSideB);
      normals.push.apply(normals, normalSideB);
    });
    return attributes;
  }

  function count(numbers, type) {
    return _.reduce(numbers, function(memo, num) {
      if (num === type || (type === undefined && num)) {
        memo = memo + 1;
      }
      return memo;
    }, 0);
  }

  function mirror(vertices) {
    var mirrorVertices = _.clone(vertices).reverse();
    return mirrorVertices;
  }

  function triangulate(face) {
    if (face.length < 3) return false;
    else if (face.length === 3) return face;
    else { 
      var vertices = [];
      var first = face[0];
      var second = face[1];
      for (i = 2; i < face.length; i++) {
        vertices.push(first);
        vertices.push(second);
        vertices.push(face[i]);
        second = face[i];
      }
      return vertices;
    }
  }

  function getNormal(face) {
    var v3 = twgl.v3;
    var vA = v3.subtract(face[1], face[0]);
    var vB = v3.subtract(face[1], face[2]);
    var cross = v3.cross(vA, vB);
    v3.normalize(cross, cross);
    return cross;
  }
})(window);
