/* Golden hour cloud sky: a WebGL shader of drifting clouds over a sky gradient with a warm
   sun glow, from /palette-test/. Plain WebGL, no libraries, so it is homepage-safe.
   HsSky(canvas) draws into the canvas and returns { ok }. Colors come from the --cream,
   --sky-top, --sky-bottom and --accent tokens as the canvas sees them (a section may override them). Phones get fewer clouds and a lower
   internal resolution; reduced motion gets one still frame; it pauses when off screen. */
(function () {
  'use strict';

  var VERT = 'attribute vec2 a_pos;varying vec2 v_uv;void main(){v_uv=a_pos*0.5+0.5;gl_Position=vec4(a_pos,0.0,1.0);}';
  var FRAG = [
    'precision highp float;',
    'varying vec2 v_uv;',
    'uniform vec2 u_res;uniform float u_time;uniform float u_count;uniform float u_zoom;',
    'uniform vec3 u_cloud;uniform vec3 u_skyTop;uniform vec3 u_skyBottom;uniform vec3 u_sun;',
    'const mat2 R=mat2(0.80,0.60,-0.60,0.80);',
    'float hash(vec2 p){return fract(sin(dot(p,vec2(41.31,289.17)))*26737.367);}',
    'float vnoise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);',
    ' float a=hash(i);float b=hash(i+vec2(1.0,0.0));float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));',
    ' return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
    'float fbm(vec2 p){float s=0.0;float a=0.5;for(int i=0;i<4;i++){s+=a*vnoise(p);p=R*p*2.03+19.19;a*=0.5;}return s;}',
    'float billow(vec2 p){float s=0.0;float a=0.5;for(int i=0;i<5;i++){s+=a*(1.0-abs(2.0*vnoise(p)-1.0));p=R*p*2.11+13.37;a*=0.5;}return s;}',
    'float cloudDensity(vec2 p,vec2 c,vec2 r,float seed,float t){vec2 q=p-c;',
    ' float ry=q.y>0.0?r.y:r.y*0.42;float env=1.0-length(vec2(q.x/r.x,q.y/ry));if(env<-0.35)return 0.0;',
    ' vec2 dp=q*(2.4/r.x)+seed;dp+=0.6*vec2(fbm(dp*1.4+t*0.04),fbm(dp*1.4+7.7-t*0.03));',
    ' return env+(billow(dp*1.6)-0.62)*0.62;}',
    'vec3 shadeCloud(vec3 color,vec3 sky,vec2 p,vec2 c,vec2 r,float seed,float t,float dist){',
    ' float d=cloudDensity(p,c,r,seed,t);if(d<0.02)return color;',
    ' float dUp=cloudDensity(p+vec2(0.0,r.y*0.55),c,r,seed,t);',
    ' float occl=clamp((dUp-d)*1.1+d*0.55,0.0,1.0);',
    ' vec3 lit=u_cloud*1.04;vec3 shadow=mix(u_cloud*0.60,sky,0.38);vec3 col=mix(lit,shadow,occl*0.85);',
    ' float alpha=smoothstep(0.02,0.38,d);',
    ' float rim=smoothstep(0.02,0.14,d)*(1.0-smoothstep(0.14,0.40,d));col+=rim*0.10;',
    ' col=mix(col,sky,dist*0.35);alpha*=mix(1.0,0.8,dist);',
    ' return mix(color,col,alpha);}',
    'vec3 cloudPass(vec3 color,vec3 sky,vec2 p,float aspect,float t,float spd,float phase,float y,vec2 r,float seed,float dist){',
    ' float cy=y+sin(t*0.05+phase*6.2831)*0.012;',
    ' float L=max(1.0,2.8*r.x);float cx=L*fract(t*spd+phase);',
    ' p.x-=L*floor((p.x-cx)/L+0.5);p.y-=floor(p.y-cy+0.5);',
    ' return shadeCloud(color,sky,p,vec2(cx,cy),r,seed,t,dist);}',
    // Each cloud repeats sideways and downward, so every row always has one drifting through. The
    // rows are nudged so the HANDSTART letters sit between two of them, and the drift starts part-way
    // in, so the letters open on a mix of blue and moving cloud. u_zoom < 1 (narrow screens): the sky
    // is seen from further back, a mini version of the desktop sky, with a faster drift to match.
    'void main(){float aspect=u_res.x/u_res.y;vec2 p=vec2(v_uv.x*aspect,v_uv.y);',
    ' bool narrow=u_zoom<0.999;',
    ' float t=u_time*(narrow?1.6:1.3)+12.0;',
    ' vec2 q=vec2(p.x/u_zoom,(narrow?1.035:0.97)+(p.y-1.0)/u_zoom);float va=aspect/u_zoom;',
    ' vec3 sky=mix(u_skyBottom,u_skyTop,v_uv.y);vec3 color=sky;',
    ' color=mix(color,u_skyBottom*1.06,smoothstep(0.35,0.0,v_uv.y)*0.5);',
    ' vec2 sunPos=vec2(aspect*0.78,0.92);float sd=length(p-sunPos);',
    ' color+=u_sun*exp(-sd*sd*5.0)*0.28;',
    ' float band=smoothstep(0.55,0.8,v_uv.y)*(1.0-smoothstep(0.9,1.0,v_uv.y));',
    ' if(band>0.01){float st=fbm(vec2(p.x*1.6-t*0.006,p.y*12.0));color=mix(color,u_cloud*0.98,smoothstep(0.52,0.78,st)*band*0.35);}',
    ' if(u_count>5.5)color=cloudPass(color,sky,q,va,t,0.006,0.10,0.84,vec2(0.20,0.10),43.7,1.0);',
    ' if(u_count>4.5)color=cloudPass(color,sky,q,va,t,0.008,0.62,0.73,vec2(0.24,0.12),71.3,0.85);',
    ' if(u_count>3.5)color=cloudPass(color,sky,q,va,t,0.011,0.33,0.60,vec2(0.34,0.16),17.3,0.55);',
    ' if(u_count>2.5)color=cloudPass(color,sky,q,va,t,0.013,0.80,0.47,vec2(0.30,0.15),29.9,0.45);',
    ' if(u_count>1.5)color=cloudPass(color,sky,q,va,t,0.016,0.05,0.35,vec2(0.46,0.20),91.1,0.15);',
    ' color=cloudPass(color,sky,q,va,t,0.020,0.48,0.20,vec2(0.56,0.24),57.2,0.0);',
    ' gl_FragColor=vec4(color,1.0);}'
  ].join('\n');

  // a fixed time that frames the clouds nicely when motion is off
  var STILL_T = 14;

  function hexToRgb(hex) {
    var h = hex.trim().replace('#', '');
    if (h.length === 3) h = h.replace(/(.)/g, '$1$1');
    var n = parseInt(h, 16);
    return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  function HsSky(canvas) {
    var gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) return { ok: false };

    function compile(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
      return s;
    }
    var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return { ok: false };
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'a_pos');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return { ok: false };
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    var loc = {};
    ['u_res', 'u_time', 'u_count', 'u_zoom', 'u_cloud', 'u_skyTop', 'u_skyBottom', 'u_sun'].forEach(function (n) {
      loc[n] = gl.getUniformLocation(prog, n);
    });

    // Phones: a lower internal resolution. Soft clouds survive the upscale.
    var small = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    var scale = small ? 0.5 : Math.min(window.devicePixelRatio || 1, 1.5) * 0.75;
    gl.uniform1f(loc.u_count, 6);
    // canvases much narrower than any desktop window (width/height under 0.5, so phones and portrait
    // tablets) zoom out, so the clouds show as a mini version of the desktop sky instead of one huge cloud
    function zoomFor(aspect) { return aspect < 0.5 ? Math.max(0.25, aspect / 0.7) : 1; }

    // read from the canvas, so a section can tint its own sky (the tokens inherit from :root)
    var css = getComputedStyle(canvas);
    function token(name) { return hexToRgb(css.getPropertyValue(name) || '#000'); }
    var c = token('--cream'), top = token('--sky-top'), bot = token('--sky-bottom'), warm = token('--accent');
    gl.uniform3f(loc.u_cloud, c[0], c[1], c[2]);
    gl.uniform3f(loc.u_skyTop, top[0], top[1], top[2]);
    gl.uniform3f(loc.u_skyBottom, bot[0], bot[1], bot[2]);
    gl.uniform3f(loc.u_sun, 0.6 + warm[0] * 0.4, 0.6 + warm[1] * 0.4, 0.6 + warm[2] * 0.4);

    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var running = false, frame = 0, visible = true, lastT = reduce ? STILL_T : 0, base = performance.now();
    function drawAt(t) { lastT = t; gl.uniform1f(loc.u_time, t); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    function resize() {
      var w = Math.max(1, Math.floor(canvas.clientWidth * scale));
      var h = Math.max(1, Math.floor(canvas.clientHeight * scale));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(loc.u_res, w, h);
      gl.uniform1f(loc.u_zoom, zoomFor(w / h));
      // resizing clears the canvas to black; redraw now rather than on the next frame, or a phone
      // shows a black flash whenever its toolbar slides and the canvas changes height mid-scroll
      drawAt(lastT);
    }
    function tick(now) {
      if (!running) return;
      drawAt((now - base) / 1000);
      frame = requestAnimationFrame(tick);
    }
    function start() {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      base = performance.now() - lastT * 1000;
      frame = requestAnimationFrame(tick);
    }
    function stop() { running = false; cancelAnimationFrame(frame); }

    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); else stop(); }).observe(canvas);
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    resize();
    drawAt(lastT);
    start();
    return { ok: true };
  }

  window.HsSky = HsSky;
})();
