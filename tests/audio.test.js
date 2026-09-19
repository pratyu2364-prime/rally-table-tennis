import test from 'node:test';
import assert from 'node:assert/strict';
import {impactSamples} from '../src/audio.js';
test('impacts have finite bounded samples and decay rapidly',()=>{
  for(const kind of ['hit','bounce','net']){
    const data=impactSamples(kind);assert.ok(data.length<6000);
    assert.ok(data.every(n=>Number.isFinite(n)&&Math.abs(n)<=1));
    const energy=a=>a.reduce((s,x)=>s+x*x,0);
    assert.ok(energy(data.slice(0,1000))>energy(data.slice(2000))*10);
  }
});
test('table and rubber impacts are distinct; stronger collisions are louder',()=>{
  const table=impactSamples('bounce'),rubber=impactSamples('hit');
  assert.notEqual(table.length,rubber.length);
  const peak=a=>Math.max(...a.map(Math.abs));
  assert.ok(peak(impactSamples('hit',48000,1.2))>peak(impactSamples('hit',48000,.4))*2);
});
