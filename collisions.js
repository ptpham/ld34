
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

