import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
  await page.goto(process.env.RALLY_URL||'http://localhost:8087');await page.locator('#start:not([disabled])').waitFor();
  await page.screenshot({path:'/tmp/rally-mobile.png'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.tap('#start');await page.tap('[data-spin="back"]');
  assert.equal((await page.evaluate(()=>window.__rally)).spin,'back');
  await page.evaluate(()=>{window.touchTrace=[];for(const event of ['pointerdown','pointermove','pointerup','pointercancel'])addEventListener(event,e=>window.touchTrace.push({event,type:e.pointerType,x:e.clientX,y:e.clientY,target:e.target.id,mode:window.__rally.mode}));});
  const before=(await page.evaluate(()=>window.__rally)).px;
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:150,y:680}]});await page.waitForTimeout(150);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:195,y:650}]});await page.waitForTimeout(150);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:240,y:620}]});await page.waitForTimeout(150);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(800);
  console.log(JSON.stringify(await page.evaluate(()=>({trace:window.touchTrace,state:window.__rally})),null,0));
  assert.ok((await page.evaluate(()=>window.__rally)).px>before+.3,'touch drag moves paddle');
  assert.ok((await page.evaluate(()=>window.__rally)).pz<1.46,'vertical touch movement changes racket depth');
  await page.tap('#serve');await page.waitForTimeout(2000);await page.screenshot({path:'/tmp/rally-mobile-playing.png'});
  assert.ok(['playing','between','ready'].includes((await page.evaluate(()=>window.__rally)).mode));
  await page.tap('#pause');assert.equal((await page.evaluate(()=>window.__rally)).mode,'paused');await page.tap('#resume');
  assert.notEqual((await page.evaluate(()=>window.__rally)).mode,'paused');assert.deepEqual(errors,[]);
  console.log('PASS: mobile layout, real touch drag, spin selection, serve, pause/resume; no browser errors.');
}finally{await browser.close();}
