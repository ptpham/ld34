(function (root) {
  function Level (attributes) {
    this.name = attributes.name;
    this.width = attributes.width;
    this.height = attributes.height;
    this.start = attributes.start;

    this.terrain = new Terrain(
      attributes.width,
      attributes.layers,
      attributes.thickness
    );

    this.frustum = this.width * 2.5;

    var start = v3.create();
    start[0] = this.start[0] * Terrain.BLOCK_WIDTH + Terrain.BLOCK_WIDTH / 2;
    start[1] = 10;
    start[2] = this.start[1] * Terrain.BLOCK_WIDTH + Terrain.BLOCK_WIDTH / 2;

    this.ball = new Ball(start, 1.0);

    this._eye = v3.create();
    return this;
  }

  Object.defineProperty(Level.prototype, 'target', {
    get: function() { return this.ball.position; }
  });

  Level.prototype.getEyeFor = function(target) {
    this._eye[0] = this.width * 8 + target[0];
    this._eye[2] = this.width * 8 + target[2];
    this._eye[1] = this.width * 8 + target[1];
    return this._eye;
  };

  Object.defineProperty(Level.prototype, 'eye', {
    get: function() { return this.getEyeFor(this.target); }
  });

  root.Level = Level;

  Level.list = [];
  Level.load = function (levels) {
    _.each(levels, function (level) {
      Level.list.push(new Level(level));
    });
  };
  Level.get = function (index) {
    return Level.list[index];
  };

})(window);
