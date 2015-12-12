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
    var HEIGHT = 0.02;
    var BLOCK_WIDTH = 0.02;
    var thicknesses = this.thicknesses;

    if (!this.attributes) {
      var startHeight = 0;
      var attributes = this.attributes = {
        position: [],
        normal: []
      };

      this.platforms = _.map(layers, function (layer, i) {
        var thickness = (thicknesses[i] || 1) * HEIGHT;
        var platform = {
          bottom: startHeight,
          thickness: thickness,
          vertices: []
        };

        formLayer(layer, size, startHeight, BLOCK_WIDTH, thickness, attributes, platform);
        startHeight += thicknesses[i] * HEIGHT;
        return platform;
      });
    }
    return this.attributes;
  };

  Terrain.prototype.createBufferInfo = function (gl) {
    var attributes = this.getAttributes();
    return twgl.createBufferInfoFromArrays(gl, attributes);
  };

  function formLayer (layer, size, startHeight, block, thickness, attributes, platform) {
    var positions = attributes.position;
    var normals = attributes.normal;

    var sections = layer.length-size-1;
    for (var i = 0; i < sections; i++) {
      var x = (i % size) * block;
      var y = Math.floor(i / size) * block;
      var section = [layer[i], layer[i+1], layer[size+i+1], layer[size+i]];
      formSection(section, x, y, startHeight, block, thickness, attributes, platform);
    }
    return attributes;
  }

  function formSection (section, x, y, z, block, thickness, attributes, platform) {
    if (sum(section) < 3) return;
    var positions = attributes.position;
    var normals = attributes.normal;
    var platformVertices = platform.vertices;

    var face = [];
    var faceMirror = [];
    if (section[0]) {
      face.push([x, z + thickness, y]);
      faceMirror.unshift([x, z, y]);
    }
    if (section[1]) {
      face.push([x + block, z + thickness, y]);
      faceMirror.unshift([x + block, z, y]);
    }
    if (section[2]) {
      face.push([x + block, z + thickness, y + block]);
      faceMirror.unshift([x + block, z, y + block]);
    }
    if (section[3]) {
      face.push([x, z + thickness, y + block]);
      faceMirror.unshift([x, z, y + block]);
    }

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
      platformVertices.push(twgl.v3.create.apply(null, vertex));
      normals.push.apply(normals, mirrorNormal);
    });

    formSides(face, faceMirror, attributes);
    return attributes;
  }

  function formSides (face, faceMirror, attributes) {
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

  function sum (numbers) {
    return _.reduce(numbers, function(memo, num) {
      return memo + num;
    }, 0);
  }

  function mirror (vertices) {
    var mirrorVertices = _.clone(vertices).reverse();
    return mirrorVertices;
  }

  function triangulate (face) {
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
