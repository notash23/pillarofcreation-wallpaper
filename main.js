import * as PIXI from 'pixi.js'
import { ShockwaveFilter } from '@pixi/filter-shockwave';
import { AdvancedBloomFilter } from '@pixi/filter-advanced-bloom';
import { MotionBlurFilter } from '@pixi/filter-motion-blur';

let mouseX = window.innerWidth/2
let mouseY = window.innerHeight/2

const app = new PIXI.Application({ width:1920, height:1080 })
document.body.appendChild(app.view);

const video = document.getElementById('video')
const videoTexture = PIXI.Texture.from(video)
const imageSprite = new PIXI.Sprite(videoTexture)

const depthSprite = PIXI.Sprite.from('/depthmap1080.jpg')
imageSprite.anchor.set(0.5)
imageSprite.x = app.renderer.width/2
imageSprite.y = app.renderer.height/2

const options = {
  amplitude: 10,
  wavelength: 90,
}

const displacementFilter = new PIXI.DisplacementFilter(depthSprite, 0)
const shockwaveFilter = new ShockwaveFilter([app.renderer.width/2, app.renderer.height/2], options, 0.15)
const motionBlurFilter = new MotionBlurFilter();
const advancedBloomFilter = new AdvancedBloomFilter({
  threshold: 0.14,
  bloomScale: 0,
  brightness: 1,
  blur: 4,
  quality: 4
});

const container = new PIXI.Container();
container.addChild(imageSprite)
container.addChild(depthSprite)
container.filters = [shockwaveFilter, displacementFilter, motionBlurFilter, advancedBloomFilter]
app.stage.addChild(container);

app.view.addEventListener('pointermove', e => {
  let cRect = app.view.getBoundingClientRect();
  mouseX = e.clientX - cRect.left;
  mouseY = e.clientY - cRect.top;
});

let bass_amp = 0
let treble_amp = 0
let phase = 0
let shake_phase = 0

let dataArray = null;
function livelyAudioListener(audioArray)
{
  dataArray = audioArray
}

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
    for (let index = 0; index < 13; index++) {
      if (dataArray[index] > 1) {
        bass += 1
      } else {
        bass += dataArray[index];
      }
    }
    bass /= 13
    if (bass < 0.15) {
      bass = 0
    }
    if (bass > 0.5) {
      bass = 0.5;
    }
    // TODO: Turn 7 into a variable
    bass_amp = 7 * (2 * bass)**3;
    
    for (let index = 32; index < dataArray.length; index++) {
      treble += dataArray[index];
    }
    treble /= 7 * 1.6
    if (treble > 1) {
      treble = 1;
    }
    
    // TODO: Turn 0.8 into a into a variable 
    treble_amp = 0.8 * (treble ** 3);
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
  shockwaveFilter.time = 0.02 * Math.sin(phase) + 0.1;
  shockwaveFilter.center = [
    (mouseX - app.renderer.width / 2) / 1.04 + app.renderer.width / 2 - parallaxX - 33,
    (mouseY - app.renderer.height / 2) / 1.04 + app.renderer.height / 2 - parallaxY - 13
  ];
});
