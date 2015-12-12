
var v3 = twgl.v3, m4 = twgl.m4;

var rotateN90Y = m4.rotationY(-Math.PI/2);

function Ball(position, radius) {
  this.angular = v3.create();
  this.velocity = v3.create();
  this.rotation = m4.create();
  this.position = position;
  this.radius = radius;
}

Ball.prototype.push = function(direction, force) {
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
  var forward = m4.transformPoint(rotateN90Y, angular);
  v3.normalize(forward, forward);
  v3.mulScalar(forward, this.radius*theta, forward);
  v3.add(position, forward, position);
};

Ball.prototype.getWorld = function(world) {
  m4.identity(world);
  m4.translate(world, this.position, world);
  m4.multiply(this.rotation, world, world);
};

