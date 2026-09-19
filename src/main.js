import {createCourt} from './scene.js';
import {Ball,Match,clamp,integrate,launchReturn,serve} from './physics.js';
import {Paddle,strike,crossedPaddle} from './stroke.js';
import {ImpactAudio} from './audio.js';

const $=id=>document.getElementById(id);
const levels={casual:{speed:1.12,reaction:.26,error:.065},club:{speed:1.7,reaction:.17,error:.036},pro:{speed:2.5,reaction:.09,error:.014}};
let court;
try{court=createCourt($('court'));}catch(error){$('loading-error').hidden=false;$('start').textContent='Court unavailable';console.error(error);}
if(court)boot();
function boot(){
  let match=new Match(),ball=new Ball(),mode='intro',resumeMode='ready',difficulty='club',spin='flat';
  let paddle=new Paddle(),px=.12,pvx=0,py=1.13,pz=1.53,pvz=0,ax=0,ay=1.02,aiTarget=0,aiClock=0,timer=0,rally=0,best=0,matchBest=0,lastStroke=null;
  let sound=true,last=performance.now(),acc=0,playingTime=0,aiShot=0;
  const audio=new ImpactAudio();
  const keys=new Set();let drag=null;const coarse=matchMedia('(pointer:coarse)').matches;
  try{best=Number(localStorage.getItem('rally-best'))||0;}catch{}
  $('best').textContent=best;
  if(coarse)$('move-hint').textContent='Slide in two dimensions · Push for pace · Brush for spin';
  function tone(kind,strength=1){document.dispatchEvent(new CustomEvent('rally-impact',{detail:{kind,strength,x:ball.x,time:performance.now()}}));if(sound)audio.play(kind,strength,ball.x);}
  function updateSound(){$('sound').textContent=sound?'Sound on':'Sound off';$('sound').setAttribute('aria-label',sound?'Turn sound off':'Turn sound on');}
  function message(text){$('message').textContent=text;}
  function scores(){
    $('you-score').textContent=String(match.score[0]).padStart(2,'0');$('ai-score').textContent=String(match.score[1]).padStart(2,'0');
    $('your-serve').style.opacity=match.server===0?'1':'0';$('ai-serve').style.opacity=match.server===1?'1':'0';
    $('match-rule').textContent=match.score.every(s=>s>=10)?'DEUCE · WIN BY 2':'TO 11 · WIN BY 2';
  }
  function ready(){
    mode='ready';timer=.95;ball=new Ball();ball.last=match.server;ball.x=match.server===0?px*.5:ax*.5;ball.z=match.server===0?1.15:-1.15;
    $('serve').disabled=match.server===1;$('serve').innerHTML=match.server===0?'Serve <span>SPACE ↗</span>':'Receiving…';
    message(match.server===0?'Your serve · click Serve or press Space':'Rally AI is serving');scores();
  }
  function serveNow(){if(mode!=='ready'||match.server!==0)return;startBall();}
  function startBall(){serve(ball,match.server,match.server===0?px:ax);mode='playing';rally=0;aiClock=0;aiTarget=ball.x;playingTime=0;$('rally-count').textContent='0';$('serve').disabled=true;$('serve').innerHTML='In play <span>KEEP IT GOING</span>';message('Push forward for pace. Brush diagonally for spin.');}
  function start(){
    difficulty=$('difficulty').value;match=new Match();matchBest=0;paddle=new Paddle();px=paddle.x;pz=paddle.z;py=paddle.y;pvx=pvz=0;ax=0;ay=1.02;lastStroke=null;keys.clear();drag=null;
    audio.enable(sound).catch(()=>{sound=false;updateSound();});
    $('intro').hidden=true;$('footer').hidden=true;for(const id of ['scoreboard','controls','live-stats','pause','touch-zone'])$(id).hidden=false;
    document.body.classList.add('playing');court.setPlaying(true);$('modal').close();ready();
  }
  function point(e){
    match.point(e.winner);tone('point');scores();mode='between';timer=1.3;
    message((e.winner===0?'Your point':'AI point')+' · '+e.reason);$('serve').disabled=true;
    if(match.winner!==null){mode='over';timer=.8;}
  }
  function recordHit(side){
    rally++;matchBest=Math.max(matchBest,rally);if(rally>best){best=rally;try{localStorage.setItem('rally-best',String(best));}catch{}$('best').textContent=best;}
    $('rally-count').textContent=rally;court.hit(side);tone('hit',Math.hypot(ball.vx,ball.vy,ball.vz)/5);
    if(rally===1)message('');if(rally===5)message('Finding your rhythm.');if(rally===10)message('Ten shots. Stay in the flow.');
    if(side===0){aiClock=0;const time=(-1.51-ball.z)/ball.vz;const l=levels[difficulty];aiTarget=clamp(ball.x+ball.vx*time+(Math.random()-.5)*l.error*2,-.98,.98);}
  }
  function step(dt){
    if(['paused','intro','over'].includes(mode))return;
    if(keys.has('ArrowLeft')||keys.has('a'))paddle.targetX-=dt*1.8;
    if(keys.has('ArrowRight')||keys.has('d'))paddle.targetX+=dt*1.8;
    if(keys.has('ArrowUp')||keys.has('w'))paddle.targetZ-=dt*1.25;
    if(keys.has('ArrowDown')||keys.has('s'))paddle.targetZ+=dt*1.25;
    const oldPz=paddle.z;paddle.update(dt);px=paddle.x;py=paddle.y;pz=paddle.z;pvx=paddle.vx;pvz=paddle.vz;
    ay+=((ball.last===0&&ball.live&&ball.z<-.45?clamp(ball.y,.87,1.58):1.02)-ay)*Math.min(1,dt*18);
    if(mode==='ready'){ball.x=match.server===0?px*.5:ax*.5;timer-=dt;if(match.server===1&&timer<=0)startBall();return;}
    if(mode==='between'){timer-=dt;if(timer<=0)ready();return;}
    aiClock+=dt;playingTime+=dt;
    if(ball.last===0 && aiClock>levels[difficulty].reaction){
      if(ball.serving)aiTarget=ball.x;
      ax+=clamp(aiTarget-ax,-levels[difficulty].speed*dt,levels[difficulty].speed*dt);
    }else if(ball.last===1)ax+=clamp(-ax,-dt*.35,dt*.35);
    const oldZ=ball.z;const events=integrate(ball,dt);
    for(const e of events){if(e.type==='bounce'){court.impact(e.x,e.z);tone('bounce',Math.abs(ball.vy)/3);}if(e.type==='net')tone('net');if(e.type==='point'){point(e);return;}if(e.type==='let'){mode='between';timer=1.2;message('Let · net on serve. Play it again.');return;}}
    if(ball.live&&ball.bounces===1&&ball.y>.79&&ball.y<1.67){
      if(crossedPaddle(oldZ,ball,oldPz,paddle,difficulty==='casual'?.18:.145)){
        ball.z=pz;lastStroke=strike(ball,paddle,spin);$('shot-style').textContent=lastStroke.label;recordHit(0);
      }else if(ball.last===0&&oldZ> -1.5&&ball.z<= -1.5&&Math.abs(ball.x-ax)<.13){
        ball.z=-1.5;aiShot++;const range=difficulty==='casual'?.38:difficulty==='club'?.61:.68;
        const target=(Math.random()*2-1)*range;const aiSpin=aiShot%4===0?'back':aiShot%3===0?'top':'flat';
        launchReturn(ball,1,target,aiSpin,difficulty==='pro'?.7:.1);recordHit(1);
      }
    }
    if(playingTime>3&&rally===0)message('');
  }
  function showResult(){
    const win=match.winner===0;
    $('modal-content').innerHTML=`<div class="eyebrow">MATCH COMPLETE</div><h2>${win?'That’s your game.':'Good game. Again?'}</h2><div class="result-score">${match.score[0]}<span>:</span>${match.score[1]}</div><p>You ${win?'beat':'played'} the ${difficulty} opponent.<br>Your longest rally: <b>${matchBest} shots</b>.</p><button id="rematch" class="primary">Play again <span>↗</span></button><button id="back-club" class="secondary">Back to the club</button>`;
    $('rematch').onclick=start;$('back-club').onclick=home;$('modal').showModal();
  }
  function home(){mode='intro';keys.clear();$('modal').close();$('intro').hidden=false;$('footer').hidden=false;for(const id of ['scoreboard','controls','live-stats','pause','touch-zone'])$(id).hidden=true;document.body.classList.remove('playing');court.setPlaying(false);message('');}
  function pause(type='pause'){
    if(mode==='paused')return;
    resumeMode=mode;if(mode!=='intro'&&mode!=='over')mode='paused';keys.clear();drag=null;
    const help=type==='help';
    $('modal-content').innerHTML=help?`<div class="eyebrow">A QUICK WARM-UP</div><h2>Make your stroke.</h2><p>Your racket follows your hand across and toward/away from the table. It no longer follows the ball. A small contact-height allowance keeps mouse play accessible.</p><ul><li><b>Mouse:</b> left/right positions the racket. Push upward as you meet the ball for more pace; pull backward to soften the return.</li><li><b>Spin:</b> brush diagonally at contact for sidespin and topspin. Faster is not always better: overhit shots can go out.</li><li><b>Touch:</b> slide in two dimensions in the space below the table.</li><li><b>Keyboard:</b> arrows or WASD move in two dimensions; Space serves. 1 / 2 / 3 changes the rubber angle bias (Natural / Topspin / Backspin).</li><li>First to 11, win by 2. P or Esc pauses.</li></ul><button id="resume" class="primary">${resumeMode==='intro'?'Got it':'Back to the table'} <span>↗</span></button>`:`<div class="eyebrow">TAKE A BREATH</div><h2>The table can wait.</h2><p>Your match is paused at ${match.score[0]} : ${match.score[1]}.</p><button id="resume" class="primary">Keep playing <span>↗</span></button><button id="restart" class="secondary">Restart match</button><button id="back-club" class="secondary">Back to the club</button>`;
    $('resume').onclick=resume;if($('restart'))$('restart').onclick=start;if($('back-club'))$('back-club').onclick=home;$('modal').showModal();
  }
  function resume(){if(mode==='over'){home();return;}$('modal').close();if(mode==='paused')mode=resumeMode;last=performance.now();acc=0;}
  function setSpin(value){spin=value;document.querySelectorAll('[data-spin]').forEach(el=>{el.classList.toggle('active',el.dataset.spin===value);el.setAttribute('aria-pressed',String(el.dataset.spin===value));});}
  $('start').disabled=false;$('start').innerHTML='<span>Step up to the table</span><span>↗</span>';
  $('start').onclick=start;$('serve').onclick=serveNow;$('pause').onclick=()=>pause();$('help').onclick=()=>pause('help');
  $('sound').onclick=async()=>{sound=!sound;try{await audio.enable(sound);updateSound();if(sound)tone('bounce');}catch{sound=false;updateSound();}};updateSound();$('close-modal').onclick=resume;
  $('modal').addEventListener('cancel',e=>{e.preventDefault();resume();});
  document.querySelectorAll('[data-spin]').forEach(el=>el.onclick=()=>setSpin(el.dataset.spin));
  function ignored(e){return !!e.target.closest('button,select,dialog,a');}
  addEventListener('pointerdown',e=>{if(ignored(e)||mode==='intro'||mode==='paused'||mode==='over')return;if(e.pointerType!=='mouse')drag={id:e.pointerId,x:e.clientX,y:e.clientY,px:paddle.targetX,pz:paddle.targetZ};});
  addEventListener('pointermove',e=>{if(mode==='intro'||mode==='paused'||mode==='over'||ignored(e))return;if(e.pointerType==='mouse'){paddle.targetX=clamp((e.clientX/innerWidth-.5)*2.35,-1.05,1.05);paddle.targetZ=clamp(1.53+(e.clientY/innerHeight-.65)*1.5,1.2,1.82);}else if(drag&&drag.id===e.pointerId){paddle.targetX=clamp(drag.px+(e.clientX-drag.x)/innerWidth*2.7,-1.05,1.05);paddle.targetZ=clamp(drag.pz+(e.clientY-drag.y)/innerHeight*1.8,1.2,1.82);}});
  const release=()=>{drag=null;};addEventListener('pointerup',release);addEventListener('pointercancel',release);
  addEventListener('keydown',e=>{
    if(e.target instanceof HTMLSelectElement)return;
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Escape'].includes(e.key))e.preventDefault();
    if(e.repeat)return;keys.add(e.key);
    if(e.key===' '){if(mode==='intro')start();else serveNow();}
    if(['1','2','3'].includes(e.key))setSpin({1:'flat',2:'top',3:'back'}[e.key]);
    if(e.key==='p'||e.key==='Escape'){if($('modal').open)resume();else if(!['intro','over'].includes(mode))pause();}
  });
  addEventListener('keyup',e=>keys.delete(e.key));
  addEventListener('blur',()=>{release();keys.clear();if(['ready','playing','between'].includes(mode))pause();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&['ready','playing','between'].includes(mode))pause();});
  // Read-only diagnostics for reproducible browser verification; no game mutations.
  Object.defineProperty(window,'__rally',{get:()=>({mode,score:[...match.score],winner:match.winner,server:match.server,rally,best,spin,px,py,pz,pvx,pvz,ax,lastStroke:lastStroke?{...lastStroke}:null,ball:{...ball},drawCalls:court.renderer.info.render.calls})});
  function frame(now){
    const dt=Math.min((now-last)/1000,.1);last=now;
    if(mode==='over'&&timer>0){timer-=dt;if(timer<=0)showResult();}
    if(mode!=='paused'){acc+=dt;while(acc>=1/240){step(1/240);acc-=1/240;}}
    $('speed').textContent=ball.live?String(Math.round(Math.hypot(ball.vx,ball.vy,ball.vz)*3.6)):'0';
    court.render(dt,mode==='intro'?null:{ball,px,py,pz,pvz,ax,ay,pvx,spin});requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
