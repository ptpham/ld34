
var v3 = twgl.v3, m4 = twgl.m4;
var rotateN90Y = m4.rotationY(-Math.PI/2);
var rotate90Y = m4.rotationY(Math.PI/2);

function Ball(position, radius) {
  this.angular = v3.create(0.0001);
  this.velocity = v3.create();
  this.rotation = m4.create();
  this.position = position;
  this.radius = radius;
  this.bounce = 0.3;
}

Object.defineProperty(Ball.prototype, 'forward', {
  get: function() {
    var forward = m4.transformPoint(rotateN90Y, this.angular);
    v3.normalize(forward, forward);
    return forward;
  }
});

Ball.prototype.pushAngular = function(direction, force) {
  var acceleration = force / Math.pow(this.radius, 3);
  v3.add(this.angular, v3.mulScalar(direction, acceleration), this.angular);
};

Ball.prototype.update = function() {
  var angular = this.angular;
  var position = this.position;
  var rotation = this.rotation;

  var theta = v3.length(angular);
  var delta = m4.axisRotation(angular, theta);
  m4.multiply(delta, rotation, rotation);

  // Move the ball forward and dampen angular when in contact with the ground
  var forward = this.forward;
  v3.mulScalar(forward, this.radius*theta, forward);
  v3.add(position, forward, position);
  v3.mulScalar(angular, 0.99, angular);

  v3.add(position, this.velocity, position);
};

Ball.prototype.getWorld = function(world) {
  m4.identity(world);
  m4.translate(world, this.position, world);
  m4.multiply(this.rotation, world, world);
};

Ball.prototype.hitPlane = function(x, normal) {
  // Prevent the ball from intersecting the plane
  var delta = v3.subtract(this.position, x);
  v3.normalize(delta, delta);
  if (!Number.isNaN(delta[0])) {
    v3.mulScalar(delta, this.radius, delta);
    v3.add(x, delta, this.position);
  }

  // Reflect velocity orthgonal to plane
  var velocity = this.velocity;
  var reflex = (1 + this.bounce);
  var remove = v3.mulScalar(normal, reflex*v3.dot(normal, this.velocity));
  v3.subtract(velocity, remove, velocity);
};

Ball.prototype.contactPlane = function(x, normal) {
  var velocity = this.velocity;
  var position = this.position;
  if (v3.dot(velocity, normal) < 0.01) {
    this.contact = true;
    this.position[1] = x[1] + this.radius;
    var t = intersectPlaneT(this.position, this.radius, x, normal);
    var shift = v3.mulScalar(normal, t + this.radius);
    v3.add(position, shift, position);
    var remove = v3.mulScalar(normal, v3.dot(normal, velocity));
    v3.subtract(velocity, remove, velocity);
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
  m4.transformPoint(m4.rotationY(yaw), angular, angular);
  this.pushAngular(v3.normalize(angular), force);
};

