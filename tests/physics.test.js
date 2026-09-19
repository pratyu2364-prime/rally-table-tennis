import test from 'node:test';
import assert from 'node:assert/strict';
import { Match, Ball, TABLE, integrate, launchReturn, serve } from '../src/physics.js';

test('table bounce preserves a live rally and reverses vertical velocity', () => {
  const b=new Ball(); Object.assign(b,{x:0,y:TABLE.height+.03,z:-.65,vy:-2,vz:-2,last:0,bounces:0,live:true});
  const events=integrate(b,.01);
  assert.ok(b.vy>0); assert.equal(b.bounces,1); assert.equal(events[0].type,'bounce');
});
test('second bounce awards the striker the point',()=>{
  const b=new Ball(); Object.assign(b,{y:TABLE.height+.025,z:-.6,vy:-2,vz:0,last:0,bounces:1,live:true});
  assert.equal(integrate(b,.01).find(e=>e.type==='point').winner,0);
});
test('a shot that misses the table awards the receiver',()=>{
  const b=new Ball(); Object.assign(b,{x:1.4,y:.1,z:-1,vy:-2,last:0,bounces:0,live:true});
  assert.equal(integrate(b,.05).find(e=>e.type==='point').winner,1);
});
test('a low ball collides with the net',()=>{
  const b=new Ball(); Object.assign(b,{y:.83,z:.005,vz:-3,vy:0,last:0,live:true});
  assert.ok(integrate(b,.01).some(e=>e.type==='net'));
  assert.ok(b.vz>0);
});
test('serve rotates every two points and every point after deuce',()=>{
  const m=new Match(); assert.equal(m.server,0);m.point(0);assert.equal(m.server,0);m.point(1);assert.equal(m.server,1);
  m.score=[10,10];assert.equal(m.server,0);m.point(0);assert.equal(m.server,1);assert.equal(m.winner,null);
  m.point(0);assert.equal(m.winner,0);
});
test('11–10 is not game; 12–10 is game',()=>{
  const m=new Match();m.score=[10,10];m.point(0);assert.equal(m.winner,null);m.point(0);assert.equal(m.winner,0);
});
test('a return crosses the net and lands on the receiving half',()=>{
  for(const spin of ['flat','top','back']){
    const b=new Ball();Object.assign(b,{x:0,y:1.02,z:1.45,live:true});launchReturn(b,0,.25,spin,0);
    let bounced=false;
    for(let i=0;i<240 && b.live;i++)for(const e of integrate(b,1/240)){
      assert.notEqual(e.type,'net',spin+' hit net');
      if(e.type==='bounce'){assert.ok(b.z<0 && b.z>=-TABLE.halfLength);bounced=true;break;}
    }
    assert.ok(bounced,spin+' did not land');
  }
});
test('both players serve onto their own half then the receiving half',()=>{
  for(const server of [0,1]){
    const b=new Ball();serve(b,server,.3);const bounces=[];
    for(let i=0;i<300&&b.live;i++)for(const e of integrate(b,1/240)){
      assert.notEqual(e.type,'net','serve hits net');
      if(e.type==='bounce')bounces.push(Math.sign(b.z));
      if(bounces.length===2)break;
    }
    assert.deepEqual(bounces.slice(0,2),server===0?[1,-1]:[-1,1]);
  }
});
test('wide angled returns at all spin and pace settings land legally',()=>{
  for(const side of [0,1])for(const x of [-.6,.6])for(const spin of ['flat','top','back'])for(const power of [0,.85]){
    const b=new Ball();Object.assign(b,{x,y:1.2,z:side===0?1.5:-1.5,live:true});launchReturn(b,side,-x,spin,power);
    let landed=false;
    for(let i=0;i<240&&b.live;i++){
      const events=integrate(b,1/240);assert.ok(!events.some(e=>e.type==='net'));
      if(events.some(e=>e.type==='bounce')){landed=true;assert.ok(Math.abs(b.x)<TABLE.halfWidth);break;}
    }
    assert.ok(landed);
  }
});
