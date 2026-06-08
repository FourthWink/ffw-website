/*
 * Metallic Paint shader adapted from React Bits MetallicPaint.
 * Copyright (c) 2026 David Haz.
 * Licensed under the MIT + Commons Clause License Condition v1.0:
 * https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md
 */
(function () {
  'use strict';

  if (window.__ffwMetallicAtcLoaded) return;
  window.__ffwMetallicAtcLoaded = true;

  var desktopQuery = window.matchMedia('(min-width: 990px)');
  var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var passDuration = 1050;
  var passCount = 4;
  var startDelay = 500;
  var textureScale = 4;

  var vertexShader = `#version 300 es
precision highp float;
in vec2 a_position;
out vec2 vP;
void main(){vP=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}`;

  var fragmentShader = `#version 300 es
precision highp float;
in vec2 vP;
out vec4 oC;
uniform sampler2D u_tex;
uniform float u_time,u_ratio,u_imgRatio,u_seed,u_scale,u_refract,u_blur,u_liquid;
uniform float u_bright,u_contrast,u_angle,u_fresnel,u_sharp,u_wave,u_noise,u_chroma;
uniform float u_distort,u_contour;
uniform vec3 u_lightColor,u_darkColor,u_tint;
vec3 sC,sM;
vec3 pW(vec3 v){vec3 i=floor(v),f=fract(v),s=sign(fract(v*.5)-.5),h=fract(sM*i+i.yzx),c=f*(f-1.);return s*c*((h*16.-4.)*c-1.);}
vec3 aF(vec3 b,vec3 c){return pW(b+c.zxy-pW(b.zxy+c.yzx)+pW(b.yzx+c.xyz));}
vec3 lM(vec3 s,vec3 p){return(p+aF(s,p))*.5;}
vec2 fA(){vec2 c=vP-.5;c.x*=u_ratio>u_imgRatio?u_ratio/u_imgRatio:1.;c.y*=u_ratio>u_imgRatio?1.:u_imgRatio/u_ratio;return vec2(c.x+.5,.5-c.y);}
vec2 rot(vec2 p,float r){float c=cos(r),s=sin(r);return vec2(p.x*c+p.y*s,p.y*c-p.x*s);}
float bM(vec2 c,float t){vec2 l=smoothstep(vec2(0.),vec2(t),c),u=smoothstep(vec2(0.),vec2(t),1.-c);return l.x*l.y*u.x*u.y;}
float mG(float hi,float lo,float t,float sh,float cv){sh*=(2.-u_sharp);float ci=smoothstep(.15,.85,cv),r=lo;float e1=.08/u_scale;r=mix(r,hi,smoothstep(0.,sh*1.5,t));r=mix(r,lo,smoothstep(e1-sh,e1+sh,t));float e2=e1+.05/u_scale*(1.-ci*.35);r=mix(r,hi,smoothstep(e2-sh,e2+sh,t));float e3=e2+.025/u_scale*(1.-ci*.45);r=mix(r,lo,smoothstep(e3-sh,e3+sh,t));float e4=e1+.1/u_scale;r=mix(r,hi,smoothstep(e4-sh,e4+sh,t));float rm=1.-e4,gT=clamp((t-e4)/rm,0.,1.);r=mix(r,mix(hi,lo,smoothstep(0.,1.,gT)),smoothstep(e4-sh*.5,e4+sh*.5,t));return r;}
void main(){
  sC=fract(vec3(.7548,.5698,.4154)*(u_seed+17.31))+.5;sM=fract(sC.zxy-sC.yzx*1.618);
  vec2 sc=vec2(vP.x*u_ratio,1.-vP.y);float angleRad=u_angle*3.14159/180.;sc=rot(sc-.5,angleRad)+.5;sc=clamp(sc,0.,1.);
  float sl=sc.x-sc.y,an=u_time*.001;vec2 iC=fA();vec4 texSample=texture(u_tex,iC);float dp=texSample.r,shapeMask=texSample.a;
  vec3 hi=u_lightColor*u_bright,lo=u_darkColor*(2.-u_bright);lo.b+=smoothstep(.6,1.4,sc.x+sc.y)*.08;
  vec2 fC=sc-.5;float rd=length(fC+vec2(0.,sl*.15));vec2 ag=rot(fC,(.22-sl*.18)*3.14159);float cv=1.-pow(rd*1.65,1.15);cv*=pow(sc.y,.35);
  float vs=shapeMask;vs*=bM(iC,.01);float fr=pow(1.-cv,u_fresnel)*.3;vs=min(vs+fr*vs,1.);
  float mT=an*.0625;vec3 wO=vec3(-1.05,1.35,1.55);vec3 wA=aF(vec3(31.,73.,56.),mT+wO)*.22*u_wave;vec3 wB=aF(vec3(24.,64.,42.),mT-wO.yzx)*.22*u_wave;
  vec2 nC=sc*45.*u_noise;nC+=aF(sC.zxy,an*.17*sC.yzx-sc.yxy*.35).xy*18.*u_wave;vec3 tC=vec3(.00041,.00053,.00076)*mT+wB*nC.x+wA*nC.y;tC=lM(sC,tC);tC=lM(sC+1.618,tC);
  float tb=sin(tC.x*3.14159)*.5+.5;tb=tb*2.-1.;float noiseVal=pW(vec3(sc*8.+an,an*.5)).x;float edgeFactor=smoothstep(0.,.5,dp)*smoothstep(1.,.5,dp);
  float lD=dp+(1.-dp)*u_liquid*tb;lD+=noiseVal*u_distort*.15*edgeFactor;float rB=clamp(1.-cv,0.,1.);float fl=ag.x+sl;fl+=noiseVal*sl*u_distort*edgeFactor;fl*=mix(1.,1.-dp*.5,u_contour);fl-=dp*u_contour*.8;
  float eI=smoothstep(0.,1.,lD)*smoothstep(1.,0.,lD);fl-=tb*sl*1.8*eI;float cA=cv*clamp(pow(sc.y,.12),.25,1.);fl*=.12+(1.05-lD)*cA;fl*=smoothstep(1.,.65,lD);
  float vA1=smoothstep(.08,.18,sc.y)*smoothstep(.38,.18,sc.y),vA2=smoothstep(.08,.18,1.-sc.y)*smoothstep(.38,.18,1.-sc.y);fl+=vA1*.16+vA2*.025;fl*=.45+pow(sc.y,2.)*.55;fl*=u_scale;fl-=an;
  float rO=rB+cv*tb*.025;float vM1=smoothstep(-.12,.18,sc.y)*smoothstep(.48,.08,sc.y);float cM1=smoothstep(.35,.55,cv)*smoothstep(.95,.35,cv);rO+=vM1*cM1*4.5;rO-=sl;
  float bO=rB*1.25;float vM2=smoothstep(-.02,.35,sc.y)*smoothstep(.75,.08,sc.y);float cM2=smoothstep(.35,.55,cv)*smoothstep(.75,.35,cv);bO+=vM2*cM2*.9;bO-=lD*.18;rO*=u_refract*u_chroma;bO*=u_refract*u_chroma;
  float sf=u_blur;float rP=fract(fl+rO);float rC=mG(hi.r,lo.r,rP,sf+.018+u_refract*cv*.025,cv);float gP=fract(fl);float gC=mG(hi.g,lo.g,gP,sf+.008/max(.01,1.-sl),cv);float bP=fract(fl-bO);float bC=mG(hi.b,lo.b,bP,sf+.008,cv);
  vec3 col=vec3(rC,gC,bC);col=(col-.5)*u_contrast+.5;col=clamp(col,0.,1.);col=mix(col,1.-min(vec3(1.),(1.-col)/max(u_tint,vec3(.001))),length(u_tint-1.)*.5);col=clamp(col,0.,1.);oC=vec4(col*vs,vs);
}`;

  function compile(gl, source, type) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function makeDepthMap(label, canvas) {
    var labelStyle = window.getComputedStyle(label);
    var labelRect = label.getBoundingClientRect();
    var cssWidth = Math.max(92, Math.ceil(labelRect.width + 38));
    var cssHeight = Math.max(34, Math.ceil(labelRect.height + 22));
    var width = cssWidth * textureScale;
    var height = cssHeight * textureScale;
    var source = document.createElement('canvas');
    var context = source.getContext('2d', { willReadFrequently: true });

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    source.width = width;
    source.height = height;

    context.clearRect(0, 0, width, height);
    context.fillStyle = '#ffffff';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = labelStyle.fontWeight + ' ' + (parseFloat(labelStyle.fontSize) * textureScale) + 'px ' + labelStyle.fontFamily;
    context.fillText(label.textContent.trim(), width / 2, height / 2);

    var input = context.getImageData(0, 0, width, height);
    var pixels = width * height;
    var alpha = new Float32Array(pixels);
    var shape = new Uint8Array(pixels);
    var boundary = new Uint8Array(pixels);
    var depth = new Float32Array(pixels);
    var i;

    for (i = 0; i < pixels; i++) {
      alpha[i] = input.data[i * 4 + 3] / 255;
      shape[i] = alpha[i] > 0.08 ? 1 : 0;
    }

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        i = y * width + x;
        if (!shape[i]) continue;
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
          !shape[i - 1] || !shape[i + 1] || !shape[i - width] || !shape[i + width]) {
          boundary[i] = 1;
        }
      }
    }

    for (var iteration = 0; iteration < 80; iteration++) {
      for (y = 1; y < height - 1; y++) {
        for (x = 1; x < width - 1; x++) {
          i = y * width + x;
          if (!shape[i] || boundary[i]) continue;
          var sum = (shape[i + 1] ? depth[i + 1] : 0) +
            (shape[i - 1] ? depth[i - 1] : 0) +
            (shape[i + width] ? depth[i + width] : 0) +
            (shape[i - width] ? depth[i - width] : 0);
          var next = (0.01 + sum) / 4;
          depth[i] = 1.85 * next - 0.85 * depth[i];
        }
      }
    }

    var maximum = 0;
    for (i = 0; i < pixels; i++) maximum = Math.max(maximum, depth[i]);
    maximum = maximum || 1;

    var output = context.createImageData(width, height);
    for (i = 0; i < pixels; i++) {
      var offset = i * 4;
      var normalized = depth[i] / maximum;
      var gray = Math.round(255 * (1 - normalized * normalized));
      output.data[offset] = gray;
      output.data[offset + 1] = gray;
      output.data[offset + 2] = gray;
      output.data[offset + 3] = Math.round(alpha[i] * 255);
    }

    return output;
  }

  function setColor(gl, location, color) {
    var value = color.replace('#', '');
    gl.uniform3f(
      location,
      parseInt(value.slice(0, 2), 16) / 255,
      parseInt(value.slice(2, 4), 16) / 255,
      parseInt(value.slice(4, 6), 16) / 255
    );
  }

  function initialize(canvas) {
    if (canvas.dataset.ffwMetallicReady || !desktopQuery.matches || reducedMotionQuery.matches) return;

    var label = canvas.previousElementSibling;
    if (!label || !label.classList.contains('floating-atc-text')) return;
    canvas.dataset.ffwMetallicReady = 'true';

    var imageData = makeDepthMap(label, canvas);
    var gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: true });
    if (!gl) return;

    var vertex = compile(gl, vertexShader, gl.VERTEX_SHADER);
    var fragment = compile(gl, fragmentShader, gl.FRAGMENT_SHADER);
    if (!vertex || !fragment) return;

    var program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    gl.useProgram(program);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    var uniforms = {};
    var uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < uniformCount; i++) {
      var info = gl.getActiveUniform(program, i);
      uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }

    var texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageData.width, imageData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.data);

    gl.uniform1i(uniforms.u_tex, 0);
    gl.uniform1f(uniforms.u_imgRatio, imageData.width / imageData.height);
    gl.uniform1f(uniforms.u_ratio, canvas.width / canvas.height);
    gl.uniform1f(uniforms.u_seed, 42);
    gl.uniform1f(uniforms.u_scale, 4);
    gl.uniform1f(uniforms.u_refract, 0.01);
    gl.uniform1f(uniforms.u_blur, 0.015);
    gl.uniform1f(uniforms.u_liquid, 0.75);
    gl.uniform1f(uniforms.u_bright, 2);
    gl.uniform1f(uniforms.u_contrast, 0.65);
    gl.uniform1f(uniforms.u_angle, 0);
    gl.uniform1f(uniforms.u_fresnel, 1);
    gl.uniform1f(uniforms.u_sharp, 1);
    gl.uniform1f(uniforms.u_wave, 1);
    gl.uniform1f(uniforms.u_noise, 0.5);
    gl.uniform1f(uniforms.u_chroma, 2);
    gl.uniform1f(uniforms.u_distort, 1);
    gl.uniform1f(uniforms.u_contour, 0.2);
    setColor(gl, uniforms.u_lightColor, '#ffffff');
    setColor(gl, uniforms.u_darkColor, '#111111');
    setColor(gl, uniforms.u_tint, '#ffffff');

    var startedAt;
    var frame;
    var totalDuration = passDuration * passCount;

    function finish() {
      if (frame) window.cancelAnimationFrame(frame);
      canvas.style.opacity = '0';
      label.style.removeProperty('opacity');
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
    }

    function render(now) {
      if (!startedAt) startedAt = now + startDelay;
      var elapsed = now - startedAt;

      if (!desktopQuery.matches || reducedMotionQuery.matches || elapsed >= totalDuration) {
        finish();
        return;
      }

      if (elapsed < 0) {
        frame = window.requestAnimationFrame(render);
        return;
      }

      var phase = (elapsed % passDuration) / passDuration;
      var visibility = Math.min(1, phase / 0.18, (1 - phase) / 0.2);
      canvas.style.opacity = String(visibility);
      label.style.opacity = String(1 - visibility * 0.92);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.u_time, elapsed * 0.55);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frame = window.requestAnimationFrame(render);
    }

    frame = window.requestAnimationFrame(render);
  }

  function initializeAll() {
    if (!desktopQuery.matches || reducedMotionQuery.matches) return;
    var run = function () {
      document.querySelectorAll('.ffw-metallic-atc-canvas').forEach(initialize);
    };
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(run);
    } else {
      run();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAll, { once: true });
  } else {
    initializeAll();
  }

  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', initializeAll);
  document.addEventListener('shopify:section:load', initializeAll);
})();
