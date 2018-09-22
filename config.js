var seedRandom = require('seed-random');
var palettes = require('./lib/color-palettes.json');
var createRandomRange = require('./lib/random-range');

module.exports = function (seed, paletteId) {
  if (typeof seed === 'undefined') {
    seed = String(Math.floor(Math.random() * 1000000));
  }


  console.log('Seed:', seed);

  var randomFunc = seedRandom(seed);
  var random = createRandomRange(randomFunc);

  if (typeof paletteId === 'undefined') {
    paletteId = Math.floor(random() * palettes.length);
  }
  paletteId = paletteId % (palettes.length-1);

  var maps = [
    'base_image.jpg'
  ].map(function (p) {
    return 'maps/' + p;
  });

  var mapSrc = maps[Math.floor(random(maps.length))];

  return {
    // rendering options
    random: randomFunc,
    seedName: seed,
    pointilism: 0,//random(0, 0.1),
    noiseScalar: [0.000001, 0.0002],//[ random(0.000001, 0.000001), random(0.0002, 0.004) ],
    globalAlpha: 0.5,
    startArea: 1.5,//random(0.0, 1.5),
    maxRadius: 50,//random(5, 100),
    lineStyle: 'round',//random(1) > 0.5 ? 'round' : 'square',
    interval: 0.001,//random(0.001, 0.01),
    count: 1000,//Math.floor(random(50, 2000)),
    steps: 1000,//Math.floor(random(100, 1000)),
    endlessBrowser: false, // Whether to endlessly step in browser

    // background image that drives the algorithm
    debugLuma: false,
    backgroundScale: 1,
    backgorundFille: 'black',
    backgroundSrc: mapSrc,

    // browser/node options
    pixelRatio: 1,
    width: 1280 * 2,
    height: 720 * 2,
    palette: getPalette(),

    // node only options
    asVideoFrames: false,
    filename: 'render',
    outputDir: 'output'
  };

  function getPalette () {
    var paletteColors = palettes[paletteId];
    return arrayShuffle(paletteColors);
  }

  function arrayShuffle (arr) {
    var rand;
    var tmp;
    var len = arr.length;
    var ret = arr.slice();

    while (len) {
      rand = Math.floor(random(1) * len--);
      tmp = ret[len];
      ret[len] = ret[rand];
      ret[rand] = tmp;
    }

    return ret;
  }
};
