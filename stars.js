(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mount = document.querySelector('.starfield');
  if (!mount) {
    mount = document.createElement('div');
    mount.className = 'starfield';
    mount.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(mount, document.body.firstChild);
  }
  mount.textContent = '';

  var canvas = document.createElement('canvas');
  mount.appendChild(canvas);
  var ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) return;

  var TILE = 256;
  var farTile = makeTile(20, 17, 1.05);
  var nearTile = makeTile(8, 91, 1.35);
  var farPat = null;
  var nearPat = null;
  var w = 0;
  var h = 0;
  var ox = 0;
  var oy = 0;
  var nx = 0;
  var ny = 0;
  var raf = 0;
  var last = 0;
  var acc = 0;
  var FRAME = 33;

  function rnd(state) {
    state[0] = (state[0] * 16807) % 2147483647;
    return state[0] / 2147483647;
  }

  function makeTile(count, seed, radius) {
    var tile = document.createElement('canvas');
    tile.width = TILE;
    tile.height = TILE;
    var g = tile.getContext('2d');
    var state = [seed];
    var i;
    for (i = 0; i < count; i++) {
      var x = rnd(state) * TILE;
      var y = rnd(state) * TILE;
      var cyan = rnd(state) > 0.78;
      var a = 0.38 + rnd(state) * 0.42;
      g.fillStyle = cyan
        ? 'rgba(32,217,255,' + a.toFixed(3) + ')'
        : 'rgba(255,255,255,' + a.toFixed(3) + ')';
      g.beginPath();
      g.arc(x, y, radius, 0, Math.PI * 2);
      g.fill();
    }
    return tile;
  }

  function wrap(value) {
    value %= TILE;
    if (value < 0) value += TILE;
    return value;
  }

  function resize() {
    var vw = window.innerWidth || 1;
    var vh = window.innerHeight || 1;
    var scale = Math.min(1, Math.sqrt(820000 / (vw * vh)));
    w = Math.max(1, (vw * scale) | 0);
    h = Math.max(1, (vh * scale) | 0);
    canvas.width = w;
    canvas.height = h;
    ctx.imageSmoothingEnabled = true;
    farPat = ctx.createPattern(farTile, 'repeat');
    nearPat = ctx.createPattern(nearTile, 'repeat');
    draw(0);
  }

  function draw(dt) {
    if (dt) {
      ox = wrap(ox + dt * 0.0032);
      oy = wrap(oy + dt * 0.0044);
      nx = wrap(nx + dt * 0.0052);
      ny = wrap(ny + dt * 0.0070);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (farPat) {
      ctx.globalAlpha = 0.7;
      ctx.setTransform(1, 0, 0, 1, -ox, -oy);
      ctx.fillStyle = farPat;
      ctx.fillRect(ox, oy, w, h);
    }
    if (nearPat) {
      ctx.globalAlpha = 0.9;
      ctx.setTransform(1, 0, 0, 1, -nx, -ny);
      ctx.fillStyle = nearPat;
      ctx.fillRect(nx, ny, w, h);
    }
    ctx.globalAlpha = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  function loop(now) {
    if (!last) last = now;
    var dt = now - last;
    last = now;
    if (dt > 80) dt = 80;
    acc += dt;
    if (acc >= FRAME) {
      draw(acc);
      acc = 0;
    }
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    acc = 0;
    if (reduce.matches) {
      draw(0);
      return;
    }
    raf = requestAnimationFrame(loop);
  }

  resize();
  start();

  window.addEventListener('resize', function () {
    resize();
    if (reduce.matches) draw(0);
  });
  if (reduce.addEventListener) reduce.addEventListener('change', start);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    } else {
      start();
    }
  });
})();
