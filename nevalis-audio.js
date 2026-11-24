/* NEVALIS sound extension — production site, 2026-11-25.
 * Add <script src="./nevalis-audio.js" defer></script> before </body> or </html>.
 * Keeps the original three-line menu button; adds ambience toggle and volume slider INSIDE that menu.
 */
(()=>{
'use strict';
const actor=document.querySelector('#actor');
const view=document.querySelector('#view');
const abstract=document.querySelector('#abstract');
const double=document.querySelector('#double');
const world=document.querySelector('#world');
const workDialog=document.querySelector('#workDialog');
const menuDialog=document.querySelector('#menuDialog');
const sectionDialog=document.querySelector('#sectionDialog');
if(!actor || !view || !world || !double){ console.warn('NEVALIS audio: world selectors not found'); return; }
const audio={
 ambience: new Audio('./audio/ambience.mp3'),
 steps: new Audio('./audio/steps.mp3'),
 connection: new Audio('./audio/connection.mp3'),
 thunder: new Audio('./audio/thunder.mp3'),
 laugh: new Audio('./audio/double_laugh.mp3')
};
audio.ambience.loop=true; audio.ambience.volume=.34;
audio.steps.loop=true; audio.steps.volume=.56;
audio.connection.volume=.9; audio.thunder.volume=.85; audio.laugh.volume=.9;
for(const node of Object.values(audio)) node.preload='auto';
let started=false, atmosphereOn=false, ambienceLevel=34, lastX=null, prevX=null;
let thunderPlayed=false, laughPlayed=false, lastFrame=0;
const THUNDER_X=5930; // approx 570 world px before entrance to the final zone (x=6503)
function play(name,restart=false){
 const track=audio[name];
 if(restart){track.pause();track.currentTime=0;}
 if(track.paused){ const p=track.play(); if(p?.catch)p.catch(()=>{}); }
}
function stop(name,rewind=false){audio[name].pause();if(rewind)audio[name].currentTime=0;}
function stopSteps(){stop('steps');}
function setAmbience(value){
 atmosphereOn=Boolean(value);
 if(atmosphereOn && started && !document.hidden)play('ambience');else stop('ambience');
 toggle.textContent=atmosphereOn?'♫ Фоновый звук: вкл.':'♫ Фоновый звук: выкл.';
 toggle.setAttribute('aria-pressed', String(atmosphereOn));
 slider.disabled=!atmosphereOn;
 volumeReadout.textContent=ambienceLevel+'%';
}
const css=document.createElement('style');
css.textContent=`
#nevalis-audio-intro{position:fixed;inset:0;z-index:100000;background:rgba(4,7,10,.93);color:#f2ece1;display:flex;align-items:center;justify-content:center;padding:20px;font-family:ui-monospace,monospace;}
#nevalis-audio-intro[hidden]{display:none}
#nevalis-audio-intro .audio-box{width:min(410px,100%);padding:30px 25px;border:1px solid #8e8574;background:#0d1115;text-align:center;box-shadow:0 25px 80px #0008}
#nevalis-audio-intro h2{font-size:30px;letter-spacing:.2em;margin:0 0 16px}
#nevalis-audio-intro p{font-size:13px;line-height:1.7;margin:0 0 24px;opacity:.75}
#nevalis-audio-intro button{display:block;width:100%;cursor:pointer;color:#faf6ee;background:#2c343a;border:1px solid #a9a092;padding:13px;margin-top:10px;font:inherit}
#nevalis-audio-intro button:hover{background:#414c51}
#nevalis-audio-control{padding:8px 0 0;border-top:1px solid #39464e;margin-top:9px}#nevalis-audio-toggle{display:block;width:100%;min-height:44px;text-align:left;border:1px solid #66757b;background:#192831;color:#f4eddb;border-radius:3px;font:14px system-ui,sans-serif;cursor:pointer;padding:11px 12px;margin-top:6px}#nevalis-audio-toggle:hover,#nevalis-audio-toggle:focus-visible{border-color:#a9e9df;background:#233941}#nevalis-audio-control[hidden]{display:none!important}#nevalis-audio-volume-label{display:flex;justify-content:space-between;align-items:center;margin:12px 3px 5px;font:13px system-ui,sans-serif;color:#d2d9d6}#nevalis-audio-volume{display:block;width:100%;margin:8px 0 8px;accent-color:#a9e9df;cursor:pointer}#nevalis-audio-volume:disabled{opacity:.45;cursor:not-allowed}
`;
document.head.append(css);
const intro=document.createElement('div'); intro.id='nevalis-audio-intro';
intro.innerHTML='<div class="audio-box" role="dialog" aria-modal="true" aria-label="Звук NEVALIS"><h2>NEVALIS</h2><p>Включить атмосферу аномальной зоны? Звуки шагов и сюжетные эффекты будут работать в обоих режимах.</p><button type="button" data-choice="on">◖)) С фоновым звуком</button><button type="button" data-choice="off">Без фонового звука</button></div>';
document.body.append(intro);
const control=document.createElement('div');
control.id='nevalis-audio-control';control.hidden=true;
control.innerHTML='<button type="button" id="nevalis-audio-toggle" aria-pressed="false">♫ Фоновый звук: выкл.</button><label id="nevalis-audio-volume-label" for="nevalis-audio-volume"><span>Громкость фона</span><output id="nevalis-audio-volume-readout">34%</output></label><input type="range" id="nevalis-audio-volume" min="0" max="100" step="1" value="34" aria-label="Громкость фонового звука">';
(menuDialog.querySelector('.menu-extra') || menuDialog).append(control);
const toggle=control.querySelector('#nevalis-audio-toggle');
const slider=control.querySelector('#nevalis-audio-volume');
const volumeReadout=control.querySelector('#nevalis-audio-volume-readout');
slider.addEventListener('input',()=>{ambienceLevel=Number(slider.value);audio.ambience.volume=ambienceLevel/100;volumeReadout.textContent=ambienceLevel+'%';});
setAmbience(false);
intro.querySelectorAll('[data-choice]').forEach(b=>b.addEventListener('click',()=>{
  started=true;intro.hidden=true;control.hidden=false;setAmbience(b.dataset.choice==='on');
  view.focus({preventScroll:true});
}));
toggle.addEventListener('click',()=>setAmbience(!atmosphereOn));
// Connection: play on actual in-world artwork click, or when opening its details from exhibition.
if(abstract)abstract.addEventListener('click',()=>{if(started)play('connection',true);});
if(workDialog)workDialog.addEventListener('close',()=>stop('connection',true));
const grid=document.querySelector('#workGrid');
if(grid)grid.addEventListener('click', e=>{
 const tile=e.target.closest?.('.work-tile');
 if(!tile)return;
 const label=tile.textContent || '';
 if(/абстрактн/i.test(label)&&started)play('connection',true);
});
// Walking uses the *existing actor's actual world position*, not key presses.
// This respects mouse/touch controls, collisions, dialogs and stops at edges.
function frame(now){
 const x=Number.parseFloat(actor.style.left);
 const dialogsOpen=Boolean(workDialog?.open||menuDialog?.open||sectionDialog?.open);
 if(Number.isFinite(x)&&started){
   const position=x+38;
   const moved=lastX!==null && Math.abs(position-lastX)>.05;
   const moving=moved && !dialogsOpen && !document.hidden;
   if(moving) play('steps'); else stopSteps();
   // Fire early as player approaches the final rupture, before its edge is visible.
   // Check one-way crossing, so walking back and forth does not re-trigger.
   if(!thunderPlayed && prevX!==null && prevX<THUNDER_X && position>=THUNDER_X){
      thunderPlayed=true;play('thunder',true);
   }
   if(!laughPlayed && !double.disabled && world.classList.contains('final-open')){
      laughPlayed=true;play('laugh',true);
   }
   prevX=position;
   lastX=position;
 }
 // On first frame actor may not yet have inline position.
 requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){stopSteps();stop('ambience');}
  else if(atmosphereOn&&started)play('ambience');
});
window.addEventListener('pagehide',()=>Object.values(audio).forEach(t=>t.pause()));
})();
