
var v3 = twgl.v3, m4 = twgl.m4;
var rotateN90Y = m4.rotationY(-Math.PI/2);
var rotate90Y = m4.rotationY(Math.PI/2);

function distanceSq(a, b) {
  return v3.lengthSq(v3.subtract(a, b));
}

function intersectLineT(c, r, x, d) {
  return (v3.dot(c,d) - v3.dot(x,d))/v3.dot(d,d);
}

function intersectPlaneT(c, r, x, d) {
  return intersectLineT(x, r, c, d);
}

function intersectLine(c, r, x, d) {
  var t = intersectLineT(c, r, x, d);
  var closest = v3.create();
  v3.mulScalar(d, t, closest);
  v3.add(x, closest, closest);
  return closest;
}

function intersectPlane(c, r, x, d) {
  return intersectLine(x, r, c, d);
}

function collideSphere(c1, r1, c2, r2) {
  return distanceSq(c1, c2) < (r1 + r2)*(r1 + r2);
}

function collideLine(c, r, x, d) {
  var closest = intersectLine(c, r, x, d);
  return distanceSq(closest, c) < r*r;
}

function collidePlane(c, r, x, d) {
  return collideLine(x, r, c, d);
}

function TriangleLookupXZ(points, bottom, thickness) {
  this.thickness = thickness;
  this.points = points;
  this.bottom = bottom;
  var normals = [];

  var count = points.length/3;
  for (var i = 0; i < count; i++) {
    for (var j = 0; j < 3; j++) {
      var target = points[3*i + j];
      var next = points[3*i + (j + 1)%3];
      var diff = v3.subtract(next, target);
      normals.push(m4.transformPoint(rotate90Y, diff));
    }
  }

  this.normals = normals;
  this.count = count;
};

TriangleLookupXZ.prototype.collide = function(c, r, y) {
  var deltaY = Math.abs(c[1] - y);
  if (deltaY < r) r = Math.sqrt(r*r - deltaY*deltaY);
  else r = 0;

  var normals = this.normals;
  for (var i = 0; i < this.count; i++) {
    var collided = true;
    for (var j = 0; collided && j < 3; j++) {
      var normal = normals[3*i + j];
      var point = this.points[3*i + j];
      var t = intersectPlaneT(c, r, point, normal);
      collided = collided && (t - r < 0.0);
    }
    if (collided) return true;
  }
};

function checkLookupXZContact(lookups, ball) {
  var lower = ball.position[1] - ball.radius;
  var upper = ball.position[1] + ball.radius;
  var up = v3.create(0, 1, 0);
  
  for (var i = 0; i < lookups.length; i++) {
    var lookup = lookups[lookups.length - i - 1];
    var bottom = lookup.bottom;
    var top = bottom + lookup.thickness;
    if (bottom > upper) return;
    if (top < lower) return;

    var target = v3.create(0, top, 0);
    if (lookup.collide(ball.position, ball.radius, top)) {
      ball.hitPlane(target, up);
      ball.contactPlane(target, up);
    }
  }
}

