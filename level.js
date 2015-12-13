(function (root) {
  function Level (attributes) {
    this.name = attributes.name;
    this.width = attributes.width;
    this.height = attributes.height;

    this.terrain = new Terrain(
      attributes.width,
      attributes.layers,
      attributes.thickness
    );
    return this;
  }

  Level.list = [];
  Level.load = function (levels) {
    _.each(levels, function (level) {
      Level.list.push(new Level(level));
    });
  };

  root.Level = Level;
})(window);
