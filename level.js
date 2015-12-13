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

    this.balls = [new Ball(v3.create(), 1.0)];
    this.activeBall = 0;
    this._eye = v3.create();
    this.reset();
    return this;
  }

  Object.defineProperty(Level.prototype, 'ball', {
    get: function() { return this.balls[this.activeBall]; }
  });

  Object.defineProperty(Level.prototype, 'target', {
    get: function() { return this.ball.position; }
  });

  Object.defineProperty(Level.prototype, 'eye', {
    get: function() { return this.getEyeFor(this.target); }
  });

  Level.prototype.reset = function () {
    this.activeBall = 0;
    while (this.balls.length > 1) { this.balls.pop(); };

    this.setStartPosition(this.start, this.ball.position);
    this.ball.reset(this.ball.position, 1.0);
  };

  Level.prototype.addBall = function (start, radius) {
    var position = v3.create();
    this.setStartPosition(start, position);
    this.balls.push(new Ball(position, radius));
  };

  Level.prototype.activateBall = function (index) {
    this.activeBall = index;
  };

  Level.prototype.getEyeFor = function(target) {
    this._eye[0] = this.width * 8 + target[0];
    this._eye[2] = this.width * 8 + target[2];
    this._eye[1] = this.width * 8 + target[1];
    return this._eye;
  };

  Level.prototype.setStartPosition = function (start, position) {
    position[0] = start[0] * Terrain.BLOCK_WIDTH + Terrain.BLOCK_WIDTH / 2;
    position[1] = 10;
    position[2] = start[1] * Terrain.BLOCK_WIDTH + Terrain.BLOCK_WIDTH / 2;
  };

  Level.prototype.update = function () {
    // TODO
  };

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
