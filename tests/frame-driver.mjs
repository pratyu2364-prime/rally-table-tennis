// Offline clock used only by tests/capture. Runs the unchanged game's own RAF
// callback once per frame, with its normal 240 Hz physics and real input events.
export async function installFrameDriver(page){
  await page.addInitScript(()=>{
    let now=0,id=0;const callbacks=new Map();
    Object.defineProperty(performance,'now',{value:()=>now});
    window.requestAnimationFrame=cb=>{callbacks.set(++id,cb);return id;};
    window.cancelAnimationFrame=id=>callbacks.delete(id);
    window.__advance=ms=>{now+=ms;const frame=[...callbacks.values()];callbacks.clear();for(const cb of frame)cb(now);};
    window.__impacts=[];document.addEventListener('rally-impact',e=>window.__impacts.push(e.detail));
    let seed=142;Math.random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  });
}
export async function advance(page,frames=1){for(let i=0;i<frames;i++)await page.evaluate(()=>window.__advance(1000/30));}
export async function followBall(page,width,height,stroke=true){
  const s=await page.evaluate(()=>window.__rally);const b=s.ball;
  if(s.mode==='ready'&&s.server===0)await page.keyboard.press('Space');
  const t=b.vz>0?(1.53-b.z)/b.vz:1;
  const target=b.last===1?b.x+b.vx*Math.max(0,t)+.5*b.curve*t*t:s.px;
  const brushing=stroke&&b.last===1&&t<.28&&t>-.1;
  const z=brushing?1.68-Math.min(1,(.28-t)/.28)*.25:1.68;
  const side=brushing?(.11-t)*.65*(s.rally%4<2?1:-1):0;
  await page.mouse.move((Math.max(-1.02,Math.min(1.02,target+side))/2.35+.5)*width,((z-1.53)/1.5+.65)*height);
  return s;
}
