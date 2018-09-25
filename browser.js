require('fastclick')(document.body);

var assign = require('object-assign');
var createConfig = require('./config');
var createRenderer = require('./lib/createRenderer');
var createLoop = require('raf-loop');
var contrast = require('wcag-contrast');
var Web3 = require('web3');

var canvas = document.querySelector('#canvas');
var background = new window.Image();
var context = canvas.getContext('2d');

var loop = createLoop();
var seedContainer = document.querySelector('.seed-container');
var seedText = document.querySelector('.seed-text');
var generatorText = document.querySelector('.generator-text');
var artPieceText = document.querySelector('.artpiece-text');

var isIOS = /(iPad|iPhone|iPod)/i.test(navigator.userAgent);

function getUrlParams( prop ) {
    var params = {};
    var search = decodeURIComponent( window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ) );
    var definitions = search.split( '&' );

    definitions.forEach( function( val, key ) {
        var parts = val.split( '=', 2 );
        params[ parts[ 0 ] ] = parts[ 1 ];
    } );

    return ( prop && prop in params ) ? params[ prop ] : undefined;
}

var seed = getUrlParams('seed');
var colorPalette = getUrlParams('colorPalette');
console.log(seed);
console.log(colorPalette);

var contract_json = require('./ArtCore.json');
var fotabi = contract_json.abi;

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 === 'undefined') {
  //   // Use the browser's ethereum provider
  //   var provider = web3.currentProvider
  // } else {
    alert('This is the front end to a web3 application. Consider installing MetaMask!')
  }
})

var web3js = new Web3(web3.currentProvider);
// var FotRinkeby = '0xfFBC9c9662c907D61a81a07Bc49c87bc37B979cf';
var FotMain = '0xfE9B5e8F7E8f6493F7D8532D915c9d53dFfe9080';
var ckcore = new web3js.eth.Contract(fotabi, FotMain);
var tokenId = getUrlParams('tokenId');
var tokenOwner = '0x';

if (isIOS) { // iOS bugs with full screen ...
  const fixScroll = () => {
    setTimeout(() => {
      window.scrollTo(0, 1);
    }, 500);
  };

  fixScroll();
  window.addEventListener('orientationchange', () => {
    fixScroll();
  }, false);
}

window.addEventListener('resize', resize);
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
canvas.style.position = 'absolute';

// var randomize = (ev) => {
//   if (ev) ev.preventDefault();
//   reload(createConfig(seed,colorPalette));
// };
// randomize();
// resize();

var autoRefresh = getUrlParams('autoRefresh');


function renderArt(_tokenId) {
  if (typeof _tokenId === 'undefined') {
    renderRandomArt();
  } else {
    tokenId = _tokenId;
    ckcore.methods.getArtToken(_tokenId).call(function(error, r1) {
      console.log("getArtToken " + _tokenId + ": "+ r1);
      if (typeof r1 !== 'undefined') {
        seed = _tokenId + r1.birthTime;
        colorPalette = r1.generator;
        ckcore.methods.ownerOf(_tokenId).call(function(error, r2) {
          if (typeof r2 !== 'undefined') {
            tokenOwner = r2;
            reload(createConfig(seed, colorPalette));
            resize();
          }
        })
      }
    })
  }
}

function renderRandomArt() {
  ckcore.methods.promoCreatedCount().call(function(error, result) {
    var _tokenId = Math.floor(Math.random() * result) + 1;
    renderArt(_tokenId);
  })
}

if (typeof autoRefresh !== 'undefined') {
  setTimeout(function(){window.location.reload(1);}, autoRefresh * 1000);
}
renderArt(tokenId);


const addEvents = (element) => {
  element.addEventListener('mousedown', (ev) => {
    if (ev.button === 0) {
      // randomize(ev);
    }
  });
  // element.addEventListener('touchstart', randomize);
};

const targets = [ document.querySelector('#fill'), canvas ];
targets.forEach(t => addEvents(t));

function reload (config) {
  loop.removeAllListeners('tick');
  loop.stop();

  var opts = assign({
    backgroundImage: background,
    context: context
  }, config);

  var pixelRatio = typeof opts.pixelRatio === 'number' ? opts.pixelRatio : 1;
  canvas.width = opts.width * pixelRatio;
  canvas.height = opts.height * pixelRatio;

  document.body.style.background = opts.palette[0];
  seedContainer.style.color = getBestContrast(opts.palette[0], opts.palette.slice(1));
  seedText.textContent = opts.seedName;
  artPieceText.textContent = tokenId;
  generatorText.textContent = (parseInt(colorPalette)+1);

  background.onload = () => {
    var renderer = createRenderer(opts);

    if (opts.debugLuma) {
      renderer.debugLuma();
    } else {
      renderer.clear();
      var stepCount = 0;
      loop.on('tick', () => {
        renderer.step(opts.interval);
        stepCount++;
        if (!opts.endlessBrowser && stepCount > opts.steps) {
          loop.stop();
        }
      });
      loop.start();
    }
  };

  background.src = config.backgroundSrc;
}

function resize () {
  letterbox(canvas, [ window.innerWidth, window.innerHeight ]);
}

function getBestContrast (background, colors) {
  var bestContrastIdx = 0;
  var bestContrast = 0;
  colors.forEach((p, i) => {
    var ratio = contrast.hex(background, p);
    if (ratio > bestContrast) {
      bestContrast = ratio;
      bestContrastIdx = i;
    }
  });
  return colors[bestContrastIdx];
}

// resize and reposition canvas to form a letterbox view
function letterbox (element, parent) {
  var aspect = element.width / element.height;
  var pwidth = parent[0];
  var pheight = parent[1];

  var width = pwidth;
  var height = Math.round(width / aspect);
  var y = Math.floor(pheight - height) / 2;

  if (isIOS) { // Stupid iOS bug with full screen nav bars
    width += 1;
    height += 1;
  }

  element.style.top = y + 'px';
  element.style.width = width + 'px';
  element.style.height = height + 'px';
}
