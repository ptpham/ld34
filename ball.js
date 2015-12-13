
var v3 = twgl.v3, m4 = twgl.m4;
var rotateN90Y = m4.rotationY(-Math.PI/2);
var rotate90Y = m4.rotationY(Math.PI/2);

var tempV3 = v3.create();

function randomV3(v) {
  v = v || v3.create();
  v[0] = Math.random() - 0.5;
  v[1] = Math.random() - 0.5;
  v[2] = Math.random() - 0.5;
  return v;
}

function Ball(position, radius) {
  this.angular = v3.create(0.0001);
  this.velocity = v3.create();
  this.rotation = m4.create();
  this.reset(position, radius);
}

Object.defineProperty(Ball.prototype, 'forward', {
  get: function() {
    var forward = m4.transformPoint(rotateN90Y, this.angular);
    v3.normalize(forward, forward);
    return forward;
  }
});

Object.defineProperty(Ball.prototype, 'volume', { 
  get: function() { return Math.pow(this.radius, 3); }
});

Ball.prototype.split = function() {
  var position = randomV3();
  v3.mulScalar(position, 0.3, position);
  v3.add(position, this.position, position);
  var radius = Math.pow(this.volume/2, 1/3);
  var result = new Ball(position, radius);
  this.radius = radius;
  return result;
};

Ball.prototype.pushAngular = function(direction, force) {
  var acceleration = force / this.volume;
  v3.add(this.angular, v3.mulScalar(direction, acceleration), this.angular);
};

Ball.prototype.reset = function (position, radius) {
  this.angular[0] = 0.0001;
  this.angular[1] = this.angular[2] = 0;
  v3.mulScalar(this.velocity, 0, this.velocity);
  m4.identity(this.rotation);
  this.position = position;
  this.radius = radius;
  this.friction = 0.99;
  this.bounce = 0.3;
};

Ball.prototype.update = function() {
  var angular = this.angular;
  var position = this.position;
  var rotation = this.rotation;
  var velocity = this.velocity;

  var theta = v3.length(angular);
  var delta = m4.axisRotation(angular, theta);
  m4.multiply(rotation, delta, rotation);

  // Move the ball forward and dampen angular and velocity
  // when in contact with the ground.
  if (this.contact) {
    var forward = this.forward;
    v3.mulScalar(forward, this.radius*theta, forward);
    v3.add(position, forward, position);
    if (v3.lengthSq(angular) > 0.0000001) {
      v3.mulScalar(angular, this.friction, angular);
    }
  }

  v3.add(position, this.velocity, position);
};

Ball.prototype.grow = function(amount) {
  var radius = Math.pow(this.volume + amount, 1/3);
  this.position[1] = radius - this.radius;
  this.radius = radius;
};

Ball.prototype.getWorld = function(world) {
  m4.identity(world);
  m4.translate(world, this.position, world);
  m4.multiply(this.rotation, world, world);
  m4.scale(world, [this.radius, this.radius, this.radius], world);
};

// Prevents the ball from intersecting the plane
Ball.prototype.attachPlane = function(x, normal) {
  var position = this.position
  var t = intersectPlaneT(position, this.radius, x, normal);
  if (t < -this.radius) return;

  var shift = v3.mulScalar(normal, t + this.radius);
  v3.add(position, shift, position);
};

Ball.prototype.removeAngular = function(normal) {
  var dot = Math.max(v3.dot(this.angular, normal), 0.0001);
  v3.mulScalar(normal, dot, this.angular);
};

// Subtract velocity orthgonal to plane
Ball.prototype.hitPlane = function(x, normal) {
  this.attachPlane(x, normal);
  var velocity = this.velocity;
  var reflex = (1 + this.bounce);
  v3.mulScalar(normal, reflex*v3.dot(normal, this.velocity), tempV3);
  v3.subtract(velocity, tempV3, velocity);
};

Ball.prototype.decontact = function(force, ratio) {
  var angular = this.angular;
  var amount = v3.length(angular)*ratio*this.radius;
  var velocity = this.velocity;
  var forward = this.forward;

  v3.add(velocity, v3.mulScalar(forward, amount), velocity);
  v3.add(velocity, v3.mulScalar(force, 1/this.volume), velocity);
  v3.mulScalar(angular, 1.0 - ratio, angular);
  this.contact = false;
};

Ball.prototype.contactPlane = function(x, normal) {
  var velocity = this.velocity;
  var position = this.position;

  if (v3.dot(velocity, normal) < 0.01) {
    // Remove component normal to plane
    this.contact = true;
    this.attachPlane(x, normal);
    var remove = v3.mulScalar(normal, v3.dot(normal, velocity));
    v3.subtract(velocity, remove, velocity);

    // Convert rest to angular
    var transfer = m4.transformPoint(
      m4.axisRotation(normal, Math.PI/2), velocity);
    var magnitude = v3.length(velocity)/this.radius;
    v3.mulScalar(v3.normalize(transfer, transfer), magnitude, transfer);
    v3.add(this.angular, transfer, this.angular);

    velocity[0] = 0;
    velocity[1] = 0;
    velocity[2] = 0;
  }
};

Ball.prototype.control = function(keys) {
  // w = 87, s = 83, a = 65, d = 68
  var yaw = 0, force = 0;
  if (keys[87]) force += 0.01;
  if (keys[83]) force -= 0.01;
  if (keys[65]) yaw += 0.1;
  if (keys[68]) yaw -= 0.1;
  
  var angular = this.angular;
  if (v3.lengthSq(angular) < 0.000001) {
    randomV3(angular);
    angular[1] = 0;
    v3.normalize(angular, angular);
    v3.mulScalar(angular, 0.001, angular);
  }

  var yawRotation = m4.rotationY(yaw);
  m4.transformPoint(yawRotation, angular, angular);
  m4.multiply(this.rotation, yawRotation, this.rotation);

  if (this.contact) {
    this.pushAngular(v3.normalize(angular), force);
  } else {
    var velocity = this.velocity; 
    v3.add(velocity, v3.mulScalar(this.forward, force/2), velocity);
  }
};
