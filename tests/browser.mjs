import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const errors=[];const width=1000;const page=await browser.newPage({viewport:{width,height:700}});
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const base=process.env.RALLY_URL||'http://localhost:8087';
try{
  await page.goto(base);await page.locator('#start:not([disabled])').waitFor();
  await page.screenshot({path:'/tmp/rally-desktop.png'});
  await page.selectOption('#difficulty','casual');await page.click('#start');await page.waitForTimeout(1000);
  assert.equal((await page.evaluate(()=>window.__rally)).mode,'ready');
  await page.keyboard.press('2');assert.equal((await page.evaluate(()=>window.__rally)).spin,'top');
  await page.keyboard.press('1');await page.keyboard.press('Space');
  let maxRally=0,playerReturn=false;const deadline=Date.now()+55000;
  while(Date.now()<deadline){
    const s=await page.evaluate(()=>window.__rally);maxRally=Math.max(maxRally,s.rally);
    if(s.ball.last===0&&s.rally>=2)playerReturn=true;
    if(s.mode==='ready'&&s.server===0)await page.keyboard.press('Space');
    const t=s.ball.vz>0?(1.5-s.ball.z)/s.ball.vz:0;
    const target=Math.max(-1.02,Math.min(1.02,s.ball.x+s.ball.vx*t));
    await page.mouse.move((target/2.35+.5)*width,500);
    if(maxRally>=6)break;
    await page.waitForTimeout(45);
  }
  console.log(JSON.stringify({maxRally,playerReturn,state:await page.evaluate(()=>window.__rally)}));
  assert.ok(playerReturn,'player must return the ball with real pointer movement');assert.ok(maxRally>=4,'AI and player must sustain a rally');
  await page.screenshot({path:'/tmp/rally-playing.png'});
  await page.keyboard.press('p');const paused=await page.evaluate(()=>window.__rally);assert.equal(paused.mode,'paused');await page.waitForTimeout(600);assert.deepEqual((await page.evaluate(()=>window.__rally)).ball,paused.ball);
  await page.click('#resume');assert.notEqual((await page.evaluate(()=>window.__rally)).mode,'paused');
  await page.keyboard.press('p');await page.click('#restart');assert.deepEqual((await page.evaluate(()=>window.__rally)).score,[0,0]);
  // Missing on purpose must progress to a completed match, with no synthetic state changes.
  const finishBy=Date.now()+360000;let previousScore='';
  while(Date.now()<finishBy){
    const s=await page.evaluate(()=>window.__rally);if(s.mode==='over')break;
    if(s.score.join(':')!==previousScore){previousScore=s.score.join(':');console.log('Match score: '+previousScore);}
    if(s.mode==='ready'&&s.server===0){await page.mouse.move(width/2,500);await page.waitForTimeout(250);await page.keyboard.press('Space');}
    await page.mouse.move(width-10,500);await page.waitForTimeout(150);
  }
  const finished=await page.evaluate(()=>window.__rally);console.log('Match final: '+JSON.stringify(finished));assert.equal(finished.mode,'over');assert.equal(finished.winner,1);
  await page.locator('#rematch').waitFor();await page.click('#rematch');assert.deepEqual((await page.evaluate(()=>window.__rally)).score,[0,0]);
  console.log('Desktop: real pointer rally, spin selection, pause freeze, restart, full match and rematch passed.');await page.close();
  const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base);await phone.locator('#start:not([disabled])').waitFor();await phone.waitForTimeout(700);await phone.screenshot({path:'/tmp/rally-mobile.png'});
  assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await phone.tap('#start');await phone.tap('[data-spin="back"]');assert.equal((await phone.evaluate(()=>window.__rally)).spin,'back');
  const before=(await phone.evaluate(()=>window.__rally)).px;
  const cdp=await phone.context().newCDPSession(phone);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:680}]});await phone.waitForTimeout(150);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:680}]});await phone.waitForTimeout(150);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:240,y:680}]});await phone.waitForTimeout(150);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await phone.waitForTimeout(800);
  assert.ok((await phone.evaluate(()=>window.__rally)).px>before+.3,'touch drag moves paddle');
  await phone.tap('#serve');await phone.waitForTimeout(1200);await phone.screenshot({path:'/tmp/rally-mobile-playing.png'});
  assert.ok(['playing','between','ready'].includes((await phone.evaluate(()=>window.__rally)).mode));
  await phone.tap('#pause');assert.equal((await phone.evaluate(()=>window.__rally)).mode,'paused');await phone.tap('#resume');
  console.log('Mobile: layout, real touch drag, spin, serve and pause passed.');assert.deepEqual(errors,[]);console.log('No browser errors.');
}finally{await browser.close();}
