
function distanceSq(a, b) {
  return v3.lengthSq(v3.subtract(a, b));
}

function collideSphere(c1, r1, c2, r2) {
  return distanceSq(c1, c2) < (r1 + r2)*(r1 + r2);
}

function collideLine(c, r, x, d) {
  var t = (v3.dot(c,d) - v3.dot(x,d))/v3.dot(d,d);
  var closest = v3.create();
  v3.mulScalar(d, t, closest);
  v3.add(x, closest, closest);

  return distanceSq(closest, c) < r*r;
}

