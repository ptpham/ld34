
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
  var normals = [], centers = [], lengths = [];
  var directions = [];
  this.thickness = thickness;
  this.points = points;
  this.bottom = bottom;

  var count = points.length/3;
  for (var i = 0; i < count; i++) {

    var sum = v3.create();
    for (var j = 0; j < 3; j++) {
      var target = points[3*i + j];
      var next = points[3*i + (j + 1)%3];
      var diff = v3.subtract(next, target);
      var length = v3.length(diff);
      v3.normalize(diff, diff);

      directions.push(diff);
      normals.push(m4.transformPoint(rotateN90Y, diff));
      lengths.push(length);
      v3.add(sum, target, sum);
    }
    
    centers.push(v3.normalize(sum, sum));
  }

  this.directions = directions;
  this.lengths = lengths;
  this.centers = centers;
  this.normals = normals;
  this.count = count;
};

var tempV3 = v3.create();

TriangleLookupXZ.prototype.collide = function(c, r, y) {
  var deltaY = Math.abs(c[1] - y);
  if (deltaY < r) r = Math.sqrt(r*r - deltaY*deltaY);
  else r = 0;

  var rSquared = r*r;
  var normals = this.normals;
  var diff = v3.create();
  var corner = null;

  for (var i = 0; i < this.count; i++) {
    var collided = false, contained = true;

    for (var j = 0; !collided && j < 3; j++) {
      var index = 3*i + j;
      var normal = normals[index];
      var point = this.points[index];

      // Check point contained in circle
      v3.subtract(point, c, diff);
      diff[1] = 0;
      if (v3.lengthSq(diff) < rSquared) {
        v3.subtract(c, point, diff);
        diff[1] = 0;

        var normalBack = normals[3*i + (j + 2)%3];
        var dotForward = Math.abs(v3.dot(diff, normal));
        var dotBackward = Math.abs(v3.dot(diff, v3.mulScalar(normalBack, -1), tempV3));
        
        var current = [point, normal, dotForward, true];
        if (dotBackward > dotForward) {
          current[1] = normalBack;
          current[2] = dotBackward;
        }
        
        if (corner == null || corner[2] < current[2]) corner = current;
      }

      // Continue checking containment of circle in triangle
      var t = intersectPlaneT(c, r, point, normal);
      contained = contained && t > -0.0001;

      // Check edge intersections
      v3.mulScalar(normal, -t, tempV3);
      v3.add(c, tempV3, tempV3);
      v3.subtract(tempV3, point, tempV3);
      tempV3[1] = 0;
      var dot = v3.dot(tempV3, this.directions[index]);

      v3.subtract(c, tempV3);
      tempV3[1] = 0;

      var margin = v3.dot(tempV3, this.directions[index]);

      if (Math.abs(t) < r && dot > 0 && dot < this.lengths[index]) {
        return [point, normal, t];
      }
    }
    if (contained) return true;
  }

  if (corner) {
    return corner;
  }
};

function checkLookupXZContact(lookups, ball) {
  var position = ball.position;
  var lower = position[1] - ball.radius;
  var upper = position[1] + ball.radius;
  var up = v3.create(0, 1, 0);
  var radius = ball.radius;

  var handled = false;
  for (var i = 0; i < lookups.length; i++) {
    var lookup = lookups[lookups.length - i - 1];
    var bottom = lookup.bottom;
    var top = bottom + lookup.thickness;
    if (bottom > upper) continue;
    if (top < lower) continue;

    var target = v3.create(0, top, 0);
    var contact = lookup.collide(position, radius, top);
    var switched = (contact != null) ^ ball.contact;

    if (contact != null && position[1] > top) {
      var supported = lookup.collide(position, ball.radius, lower);
      if (supported) {
        ball.hitPlane(target, up);
        ball.contactPlane(target, up);
        handled = true;
      } else if (contact.length > 2) {
        var coeff = radius*radius - contact[2]*contact[2];
        if (coeff > 0) {
          var downward = Math.sqrt(coeff);
          var delta = top - (position[1] - downward);
          position[1] += Math.min(delta, 0.1);
          var yvel = ball.velocity[1];
          ball.velocity[1] = 0;

          var volume = ball.volume;
          v3.add(ball.angular, v3.mulScalar(ball.angular, yvel, tempV3), ball.angular);
        }
        handled = true;
      }
    } else if (!handled) {
      if ((position[1] > bottom && position[1] < top) && (!contact || !contact.length)) {
        contact = lookup.collide(position, ball.radius, position[1]);
      }
      if (!contact) {
        contact = lookup.collide(position, ball.radius, bottom);
      }

      if (contact) {
        if (contact[3]) {
          var normal = contact[1];
          v3.mulScalar(normal, radius - contact[2], tempV3);
          v3.add(position, tempV3, position);
          var velocity = ball.velocity;
          var remove = v3.mulScalar(normal, v3.dot(normal, velocity));
          v3.subtract(velocity, remove, velocity);
        } else {
          ball.hitPlane(contact[0], contact[1]);
        }
        ball.removeAngular(contact[1]);
        handled = true;
      }
    }
  }

  if (!handled) ball.decontact(v3.create(), 0.1);
}

function checkInterballCollisions(balls) {
  var diff = v3.create(), temp = v3.create();
  for (var i = 0; i < balls.length; i++) {
    var first = balls[i];
    var r1 = first.radius;
    for (var j = 0; j < i; j++) {
      var second = balls[j];
      var r2 = second.radius;
      v3.subtract(first.position, second.position, diff);
      var distance = v3.length(diff);
      if (distance < r1 + r2) {
        var vol1 = first.volume, vol2 = second.volume;
        var ratio = vol1 / (vol1 + vol2);

        var pos1 = first.position;
        var pos2 = second.position;

        var speed1 = Math.max(v3.length(first.velocity), 0.01);
        var speed2 = Math.max(v3.length(second.velocity), 0.01);
        v3.normalize(diff, diff);

        v3.mulScalar(diff, speed1, first.velocity);
        v3.mulScalar(diff, -speed2, second.velocity);

        var remain = r1 + r2 - distance;
        v3.add(pos1, v3.mulScalar(diff, 0.5*ratio*remain), pos1);
        v3.add(pos2, v3.mulScalar(diff, -0.5*(1 - ratio)*remain), pos2);

        var angular1 = first.angular, angular2 = second.angular;
        var sign1 = (v3.dot(angular1, diff) > 0) ? 1 : -1;
        var sign2 = (v3.dot(angular2, diff) > 0) ? 1 : -1;

        var ma1 = Math.max(v3.length(angular1), 0.001);
        var ma2 = Math.max(v3.length(angular2), 0.001);

        v3.add(angular1, diff, angular1);
        v3.add(angular2, -diff, angular2);
        v3.normalize(angular1, angular1);
        v3.normalize(angular2, angular2);

        v3.mulScalar(angular1, ma1, angular1);
        v3.mulScalar(angular2, ma2, angular2);
      }
    }
  }
}

function checkGoalCollisions (goals, balls) {
  var scored = _.map(goals, function (goal) {
    var nearestBall = null;
    var nearestDistance = Infinity;
    var diff = v3.create();

    for (var i = 0; i < balls.length; i++) {
      var ball = balls[i];
      v3.subtract(goal.position, ball.position, diff);
      var distance = v3.length(diff);

      if (distance < goal.radius && distance < nearestDistance) {
        nearestBall = ball;
        nearestDistance = distance;
      }
    }

    return nearestBall;
  });
  return scored;
}
