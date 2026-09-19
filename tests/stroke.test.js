import test from 'node:test';
import assert from 'node:assert/strict';
import {Ball,integrate} from '../src/physics.js';
import {Paddle,strike,crossedPaddle} from '../src/stroke.js';
const incoming=()=>Object.assign(new Ball(),{x:0,y:1.13,z:1.5,vx:0,vy:1,vz:3.8,last:1,bounces:1,live:true});
test('forward movement adds pace; retreat absorbs pace',()=>{
  const forward=incoming(),block=incoming(),retreat=incoming();
  strike(forward,{x:0,vx:0,vz:-1});strike(block,{x:0,vx:0,vz:0});strike(retreat,{x:0,vx:0,vz:1});
  assert.ok(Math.abs(forward.vz)>Math.abs(block.vz)+.8);
  assert.ok(Math.abs(retreat.vz)<Math.abs(block.vz)-.8);
});
test('opposite diagonal strokes create opposite sidespin and curve',()=>{
  const l=incoming(),r=incoming();strike(l,{x:0,vx:-1,vz:-.5});strike(r,{x:0,vx:1,vz:-.5});
  assert.ok(l.curve<0&&r.curve>0);assert.ok(l.spin>0&&r.spin>0);
  const lx=l.x,rx=r.x;for(let i=0;i<50;i++){integrate(l,1/240);integrate(r,1/240);}
  assert.ok(l.x<lx&&r.x>rx);
});
test('paddle position is controlled only by input, never ball height',()=>{
  const p=new Paddle();for(let i=0;i<240;i++)p.update(1/240);const y=p.y;
  for(let i=0;i<240;i++)p.update(1/240);assert.equal(p.y,y);
  p.targetZ=1.25;for(let i=0;i<240;i++)p.update(1/240);
  assert.ok(p.z<1.3);assert.ok(Math.abs(p.y-y)<.05);
});
test('swept contact includes the racket moving forward into the ball',()=>{
  const b=incoming();b.z=1.46;
  const p={x:0,y:1.13,z:1.43};assert.equal(crossedPaddle(1.42,b,1.5,p),true);
  p.x=.7;assert.equal(crossedPaddle(1.42,b,1.5,p),false);
});
test('ordinary blocks and moderate drives produce legal playable returns',()=>{
  for(const vz of [0,-.4,-.8,.4]){
    const b=incoming();strike(b,{x:0,vx:0,vz});let landed=false;
    for(let i=0;i<240&&b.live;i++){
      const e=integrate(b,1/240);assert.ok(!e.some(e=>e.type==='net'));
      if(e.some(e=>e.type==='bounce')){assert.ok(b.z<0);landed=true;break;}
    }
    assert.ok(landed);
  }
});
test('spin changes speed and lateral kick at a table bounce',()=>{
  const top=Object.assign(incoming(),{y:.79,z:-.7,vy:-2,vz:-3,last:0,bounces:0,spin:1,curve:1});
  const back=Object.assign(incoming(),{y:.79,z:-.7,vy:-2,vz:-3,last:0,bounces:0,spin:-1,curve:-1});
  integrate(top,.01);integrate(back,.01);
  assert.ok(Math.abs(top.vz)>Math.abs(back.vz)+.1);
  assert.ok(top.vx>0&&back.vx<0);
});
