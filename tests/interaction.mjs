import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {installFrameDriver,advance,followBall} from './frame-driver.mjs';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:900,height:600}});const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
  await installFrameDriver(page);await page.goto(process.env.RALLY_URL||'http://localhost:8087');await advance(page);
  await page.keyboard.press('Space');await advance(page,3);
  await page.mouse.move(450,480);await advance(page,20);const back=await page.evaluate(()=>window.__rally);
  await page.mouse.move(450,290);await advance(page,2);const forward=await page.evaluate(()=>window.__rally);
  assert.ok(forward.pz<back.pz&&forward.pvz<-.2,'vertical cursor movement produces forward racket velocity');
  await advance(page,20);await page.keyboard.down('ArrowDown');await advance(page,6);await page.keyboard.up('ArrowDown');
  assert.ok((await page.evaluate(()=>window.__rally)).pz>forward.pz,'keyboard depth control');
  await page.mouse.move(450,390);await advance(page,30);await page.keyboard.press('Space');
  const heights=[];for(let i=0;i<27;i++){await advance(page);heights.push((await page.evaluate(()=>window.__rally)).py);}
  assert.ok(Math.max(...heights)-Math.min(...heights)<.00001,'idle paddle does not follow the ball');
  // Fresh match, now use forward and diagonal strokes through real pointer input.
  await page.keyboard.press('p');await page.evaluate(()=>document.getElementById('restart').click());await advance(page,3);
  let maxRally=0,brushed=false,drive=false;const strokes=[];
  for(let i=0;i<660;i++){
    const s=await followBall(page,900,600,true);maxRally=Math.max(maxRally,s.rally);
    if(s.lastStroke){brushed ||= Math.abs(s.lastStroke.side)>.4;drive ||= s.lastStroke.pace>4;}
    if(s.lastStroke&&strokes.at(-1)?.pace!==s.lastStroke.pace)strokes.push(s.lastStroke);
    await advance(page);if(maxRally>=4&&brushed&&drive)break;
  }
  console.log(JSON.stringify({maxRally,brushed,drive,strokes}));
  assert.ok(maxRally>=4&&brushed&&drive,'real input must produce rally, sidespin, and pace');
  await page.keyboard.press('p');const paused=await page.evaluate(()=>window.__rally);await advance(page,20);assert.deepEqual((await page.evaluate(()=>window.__rally)).ball,paused.ball);
  await page.keyboard.press('p');await advance(page);assert.notEqual((await page.evaluate(()=>window.__rally)).mode,'paused');
  const impacts=await page.evaluate(()=>window.__impacts);assert.ok(impacts.some(e=>e.kind==='hit')&&impacts.some(e=>e.kind==='bounce'));
  assert.deepEqual(errors,[]);console.log('PASS: 2D pointer + keyboard, no automatic jump, actual drives/sidespin, rallies, pause, audio events.');
}finally{await browser.close();}
