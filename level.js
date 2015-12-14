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

    this.goals = _.map(attributes.goals, this.setGoal.bind(this));

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
    this.complete = false;
  };

  Level.prototype.addBall = function (start, radius) {
    if (start instanceof Ball) {
      this.balls.push(start);
    } else {
      var position = v3.create();
      this.setStartPosition(start, position);
      this.balls.push(new Ball(position, radius));
    }
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
    position[1] = 15;
    position[2] = start[1] * Terrain.BLOCK_WIDTH + Terrain.BLOCK_WIDTH / 2;
    return position;
  };

  Level.prototype.setGoal = function (goal) {
    var radius = goal.radius;
    var platform = this.terrain.platforms[goal.layer];
    var position = this.setStartPosition(goal.position, v3.create());
    position[1] = platform.bottom + platform.thickness;
    return {
      position: position,
      radius: radius
    };
  };

  Level.prototype.getGoalWorld = function (world, goal) {
    m4.identity(world);
    m4.translate(world, goal.position, world);
    m4.scale(world, [goal.radius, goal.radius, goal.radius], world);
  };

  Level.prototype.update = function () {
    var goals = this.goals;
    var scored = checkGoalCollisions(goals, this.balls);
    var completed = 0;
    _.each(scored, function (ball, index) {
      if (!ball) return;
      var goal = goals[index];

      var diff = Math.abs(goal.radius - ball.radius);
      if (diff < 0.2) {
        completed++;
      }
    });

    if (completed === this.goals.length) {
      this.complete = true;
    }
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
