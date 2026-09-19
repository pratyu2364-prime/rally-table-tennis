import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {installFrameDriver,advance,followBall} from '../tests/frame-driver.mjs';
import {impactSamples} from '../src/audio.js';

const folder=resolve(process.argv[2]);const framesDir=resolve(process.argv[3]);
const url=process.env.RALLY_URL||'http://localhost:8087';
const ffmpeg=process.env.FFMPEG||'ffmpeg';
const width=1920,height=1080,fps=30,seconds=15,count=fps*seconds;
mkdirSync(folder,{recursive:true});mkdirSync(framesDir,{recursive:true});
let events=[],maxRally=0;const errors=[];
let resume=0;while(resume<count&&existsSync(join(framesDir,`frame-${String(resume).padStart(4,'0')}.jpg`)))resume++;
// Short browser sessions avoid a long-lived software-renderer capture crash.
// Replaying the same seeded input restores exact simulation state; old frames
// are not re-recorded, and rasterization is skipped during the replay only.
for(let start=Math.min(resume,count-1);start<count;start+=90){
 const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-gpu-watchdog']});
 try{
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(e.message));
  await installFrameDriver(page);await page.goto(url);await advance(page);
  await page.evaluate(()=>{document.getElementById('difficulty').value='casual';});
  const end=Math.min(count,start+90);
  for(let i=0;i<end;i++){
    if(i===0)await page.evaluate(skip=>window.__skipCaptureDraw=skip,start>0);
    if(i===start)await page.evaluate(()=>window.__skipCaptureDraw=false);
    if(i===30)await page.keyboard.press('Space');
    if(i>=55){const s=await followBall(page,width,height,true);maxRally=Math.max(maxRally,s.rally);}
    await advance(page);
    if(i>=start){
      await page.screenshot({path:join(framesDir,`frame-${String(i).padStart(4,'0')}.jpg`),type:'jpeg',quality:95});
      if(i===20)await page.screenshot({path:join(folder,'club.png')});
      if(i===240)await page.screenshot({path:join(folder,'screenshot.png')});
      if(i%30===0)console.log(`Captured ${i}/${count} frames; rally ${maxRally}`);
    }
  }
  events=await page.evaluate(()=>window.__impacts);
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
 console.log(`Capture batch complete: ${Math.min(count,start+90)}/${count}`);
}
assert.ok(maxRally>=4,'demo must show a real rally');
// Mix the same impact synthesis at the captured simulation timestamps.
const rate=48000,pcm=new Float32Array(rate*seconds);
for(const event of events){
  if(event.kind==='point')continue;
  const sample=impactSamples(event.kind,rate,event.strength);
  const start=Math.round((event.time-2*1000/fps)/1000*rate);
  for(let i=0;i<sample.length;i++)if(start+i>=0&&start+i<pcm.length)pcm[start+i]+=sample[i]*.8;
}
const wav=Buffer.alloc(44+pcm.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(pcm.length*2,40);
for(let i=0;i<pcm.length;i++)wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,pcm[i]))*32767),44+i*2);
writeFileSync(join(framesDir,'audio.wav'),wav);
writeFileSync(join(framesDir,'capture.json'),JSON.stringify({url,width,height,fps,seconds,maxRally,events,errors},null,2));
const out=join(folder,'demo.mp4');
const encoded=spawnSync(ffmpeg,['-y','-loglevel','error','-framerate',String(fps),'-i',join(framesDir,'frame-%04d.jpg'),'-i',join(framesDir,'audio.wav'),'-c:v','libx264','-preset','slow','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart','-t',String(seconds),out],{stdio:'inherit'});
assert.equal(encoded.status,0,'video encoding');console.log(JSON.stringify({video:out,width,height,fps,seconds,maxRally,audioEvents:events.length}));
