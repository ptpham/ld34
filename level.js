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

    var start = v3.create();
    start[0] = this.start[0] * Terrain.BLOCK_WIDTH;
    start[1] = 10;
    start[2] = this.start[1] * Terrain.BLOCK_WIDTH;

    this.ball = new Ball(start, 1.0);
    this.eye = v3.create();
    this.update();
    return this;
  }

  Object.defineProperty(Level.prototype, 'target', {
    get: function() { return this.ball.position; }
  });

  Level.prototype.update = function () {
    var ballPosition = this.ball.position;
    this.eye[0] = this.width * 8 + ballPosition[0] * 2;
    this.eye[2] = this.width * 8 + ballPosition[2] * 2;
    this.eye[1] = this.width * 8 + ballPosition[1] * 2;
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
