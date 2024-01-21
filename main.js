import * as PIXI from 'pixi.js'
import { ShockwaveFilter } from '@pixi/filter-shockwave';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import { MotionBlurFilter } from '@pixi/filter-motion-blur';

let mouseX = window.innerWidth/2
let mouseY = window.innerHeight/2

const app = new PIXI.Application({ width:1920, height:1080 })
document.body.appendChild(app.view);

const video = document.createElement("video");
video.preload = "auto";
video.muted = true;
video.loop = true;
video.autoplay = true;

video.oncanplay = addVideoToPIXI;
video.src = "/Pillars Of Creation.webm";

const options = {
  amplitude: 10,
  wavelength: 90,
}

const depthSprite = PIXI.Sprite.from('/depthmap1080.jpg')
const displacementFilter = new PIXI.DisplacementFilter(depthSprite, 0)
const shockwaveFilter = new ShockwaveFilter([app.renderer.width/2, app.renderer.height/2], options, 0.15)
const motionBlurFilter = new MotionBlurFilter();
const advancedBloomFilter = new AdvancedBloomFilter({
  threshold: 0.12,
  bloomScale: 0,
  brightness: 1,
  blur: 4,
  quality: 4
});

const container = new PIXI.Container();
container.addChild(depthSprite)
container.filters = [shockwaveFilter, displacementFilter, motionBlurFilter, advancedBloomFilter]
app.stage.addChild(container);

function addVideoToPIXI() {
  const videoTexture = PIXI.Texture.from(video)
  const imageSprite = new PIXI.Sprite(videoTexture)
  imageSprite.anchor.set(0.5)
  imageSprite.x = app.renderer.width/2
  imageSprite.y = app.renderer.height/2
  container.addChild(imageSprite)
}

app.view.addEventListener('pointermove', e => {
  let cRect = app.view.getBoundingClientRect();
  mouseX = e.clientX - cRect.left;
  mouseY = e.clientY - cRect.top;
});

let dataArray = null;

let bassRange = 5;
let trebleRange = 8;
let bassAmplitude = 7;
let mouseBubble = true;
let depthMapPath = "";
let imagePath = "";

let bass_amp = 0
let treble_amp = 0
let phase = 0
let shake_phase = 0

app.ticker.add(() => {
  phase += 0.025;
  shake_phase += 0.7;
  if (phase > 2 * Math.PI) {
    phase = 0;
  }
  if (shake_phase > 2 * Math.PI) {
    shake_phase = 0;
  }
  let bass = 0;
  let treble = 0;
  if (dataArray != null) {
    for (let index = 0; index < (8 + bassRange); index++) {
      if (dataArray[index] > 1) {
        bass += 1
      } else {
        bass += dataArray[index];
      }
    }
    bass /= (8 + bassRange)
    if (bass < 0.15) {
      bass = 0
    }
    if (bass > 0.5) {
      bass = 0.5;
    }
    
    bass_amp = (bassAmplitude + 2) * ((2 * bass)**3);
    
    for (let index = (40 - 2*trebleRange); index < dataArray.length; index++) {
      treble += dataArray[index];
    }
    treble /= (8 - 0.4*trebleRange)
    if (treble > 1.4) {
      treble = 1.4;
    }
    
    treble_amp = 0.8 * (treble ** 2);
  }
  const shake_x = bass_amp * Math.sin(shake_phase) * Math.sin(phase);
  const shake_y = bass_amp * Math.sin(shake_phase) * Math.cos(phase);
  const parallaxX = (app.renderer.width / 2 - mouseX) / 50 + shake_x;
  const parallaxY = (app.renderer.height / 2 - mouseY) / 50 + shake_y;
  container.x = parallaxX;
  container.y = parallaxY;
  motionBlurFilter.velocity.x = 6 * shake_x;
  motionBlurFilter.velocity.y = 6 * shake_y;
  advancedBloomFilter.bloomScale = treble_amp;
  displacementFilter.scale.x = (app.renderer.width / 2 - mouseX) / 30;
  displacementFilter.scale.y = (app.renderer.height / 2 - mouseY) / 30;
  if (mouseBubble) {
    shockwaveFilter.time = 0.02 * Math.sin(phase) + 0.1;
    shockwaveFilter.center = [
      (mouseX - app.renderer.width / 2) / 1.04 + app.renderer.width / 2 - parallaxX - 33,
      (mouseY - app.renderer.height / 2) / 1.04 + app.renderer.height / 2 - parallaxY - 13
    ];
  }
});

function livelyAudioListener(audioArray)
{
  dataArray = audioArray
}

function livelyPropertyListener(name, val)
{
    if(name =="bassRangeClass")
    {
        bassRange = val
    }
    else if(name =="trebleRangeClass")
    {
        trebleRange = val
    }
    else if(name =="bassAmplitudeClass")
    {
        bassAmplitude = val
    }
    else if(name =="mouseBubbleClass")
    {
      mouseBubble = val
      if (mouseBubble && container.filters[0] !== shockwaveFilter) {
        container.filters.unshift(shockwaveFilter)
      }
      else if (!mouseBubble && container.filters[0] === shockwaveFilter) {
        container.filters.shift(shockwaveFilter)
      }
    }
    else if(name =="depthMapClass")
    {
        depthMapPath = val
    }
    else if(name =="imageClass")
    {
        imagePath = val
    }
}

livelyAudioListener()
livelyPropertyListener()
