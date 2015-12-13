var fs = require('fs'),
    _ = require('./underscore-min.js')._,
    PNG = require('node-pngjs').PNG;

var levelDir = './levels';
var directories = fs.readdirSync(levelDir);
directories = _.reject(directories, function (dir) {
  return (dir === '.DS_Store');
});
_.each(directories, function (dir) {
  var path = [levelDir, dir].join('/');
  fs.readdir(path, function (e, files) {
    extractLevel(dir, path, files);
  });
});

function extractLevel (name, path, files) {
  console.log(path, files);
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
    level.width = config.width;
    level.height = config.height;
    parseLevel(name, image, config, level);
  }
}

function parseLevel(name, file, config, level) {
  fs.createReadStream(file)
    .pipe(new PNG({filterType: 4}))
    .on('parsed', function() {
      var layers = level.layers = [];
      for (var y = 0; y < this.height; y++) {
        var layerIndex = Math.floor(y / config.height);
        console.log(layerIndex);
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

          // Black
          if (this.data[idx] + this.data[idx + 1] + this.data[idx + 2] === 0) {
            layer.push(1);
            continue;
          }

          // Blue
          if (this.data[idx + 2] === 255) {
            layer.push(2);
            continue;
          }
        }
      }

      var data = 'var level_' + name + ' = ' + JSON.stringify(level) + ';'; 
      fs.writeFile(levelDir + '/' + name + '.js', data);
    });
}
