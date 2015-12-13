var fs = require('fs'),
    _ = require('./underscore-min.js')._,
    PNG = require('node-pngjs').PNG;

var levelDir = './levels';
var levels = [];

var directories = fs.readdirSync(levelDir);
directories = _.reject(directories, function (dir) {
  return (dir === '.DS_Store');
});
var numLevels = directories.length;

_.each(directories, function (dir, index) {
  var path = [levelDir, dir].join('/');
  fs.readdir(path, function (e, files) {
    extractLevel(dir, path, files, index);
  });
});

function extractLevel (name, path, files, index) {
  var level = {};

  var image = false;
  var config = false;

  _.each(files, function (filename) {
    if (filename.substr(-5) === '.json') {
      config = require(path + '/' + filename);
      level.width = config.width;
      level.height = config.height;
      if (image) doContinue();
    }

    if (filename.substr(-4) === '.png') {
      image = path + '/' + filename;
      if (config) doContinue();
    }
  });

  function doContinue () {
    level.name = config.name;
    level.width = config.width;
    level.height = config.height;
    parseLevel(image, config, level, index);
  }
}

function parseLevel(file, config, level, index) {
  fs.createReadStream(file)
    .pipe(new PNG({filterType: 4}))
    .on('parsed', function() {
      var layers = level.layers = [];
      for (var y = 0; y < this.height; y++) {
        var layerIndex = Math.floor(y / config.height);
        if (!layers[layerIndex]) {
          layers[layerIndex] = [];
        }
        var layer = layers[layerIndex];

        for (var x = 0; x < this.width; x++) {
          var idx = (this.width * y + x) << 2;

          if (!this.data[idx + 3]) {
            layer.push(0);
            continue;
          }

          // Black - Rock
          if (this.data[idx] + this.data[idx + 1] + this.data[idx + 2] === 0) {
            layer.push(1);
            continue;
          }

          // Blue - Water
          if (this.data[idx + 2] === 255) {
            layer.push(2);
            continue;
          }
        }
      }

      levelReady(index, level);
    });
}

var finishedLevels = 0;
function levelReady(index, level) {
  finishedLevels++;
  levels[index] = level;

  if (finishedLevels === numLevels - 1) {
    var data = 'var levels = ' + JSON.stringify(levels) + ';'; 
    fs.writeFile(levelDir + '/levels.js', data);
  }
}
