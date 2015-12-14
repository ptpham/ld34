
function loadResource(path, type) {
  type = type || 'arraybuffer';
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.responseType = type
    req.open('GET', path, true);
    req.onload = function() { return resolve(req.response); }
    req.send();
  });
}

function Sound(ctx, path) {
  var _this = this;
  this.ctx = ctx;
  this.loaded = new Promise(function(resolve, reject) {
    loadResource(path).then(function(data) {
      ctx.decodeAudioData(data, function(buffer) {
        _this.buffer = buffer;
        resolve(buffer);
      });
    });
  });
}

Sound.prototype.play = function() {
  if (this.buffer == null || this.playing) return Promise.resolve(true);
  var ctx = this.ctx;
  var _this = this;

  var result = ctx.createBufferSource();
  result.connect(ctx.destination);
  result.buffer = this.buffer;
  this.playing = true;
  result.start();

  return new Promise(function(resolve, reject) {
    result.onended = function() {
      _this.playing = false;
      resolve(true);
    };
  });
};

