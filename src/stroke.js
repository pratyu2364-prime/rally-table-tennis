import {clamp} from './physics.js';

// X/Z are controlled by the hand. No ball position is used to animate this paddle.
export class Paddle{
  constructor(){this.x=this.targetX=.12;this.z=this.targetZ=1.53;this.y=1.13;this.vx=this.vz=0;}
  update(dt){
    this.targetX=clamp(this.targetX,-1.05,1.05);this.targetZ=clamp(this.targetZ,1.2,1.82);
    const x=this.x,z=this.z,a=1-Math.exp(-22*dt),v=1-Math.exp(-dt/.05);
    this.x+=(this.targetX-this.x)*a;this.z+=(this.targetZ-this.z)*a;
    this.vx+=(clamp((this.x-x)/dt,-3,3)-this.vx)*v;
    this.vz+=(clamp((this.z-z)/dt,-2.5,2.5)-this.vz)*v;
    this.y=1.13+(1.53-this.z)*.1;
  }
}
export function crossedPaddle(oldZ,b,oldPz,p,tolerance=.145){
  return b.last===1&&b.bounces===1&&oldZ-oldPz<0&&b.z-p.z>=0&&Math.abs(b.x-p.x)<tolerance&&Math.abs(b.y-p.y)<.34;
}
// Collision response, not a solved trajectory toward a guaranteed landing point.
// Forward normal velocity adds energy; tangential brushing changes spin/placement.
export function strike(b,p,preset='flat'){
  const pace=clamp(Math.abs(b.vz)*.78+.9-p.vz*1.05,2.2,7.3);
  const brush=clamp(-p.vz*.48+(preset==='top'?.8:preset==='back'?-.75:0),-1.3,1.6);
  b.vx=b.vx*.2+clamp(p.vx,-3,3)*.42+(b.x-p.x)*1.1;
  b.vz=-pace;
  b.vy=clamp(2.4-(pace-3.6)*.42-(b.y-1.13)*.5-brush*.1,.85,3.1);
  b.spin=brush*1.1;b.curve=clamp(p.vx*.95,-2.6,2.6);
  b.last=0;b.bounces=0;b.serving=false;b.netTouch=false;b.live=true;
  return {pace,spin:brush,side:b.curve,label:Math.abs(b.curve)>.45?(brush>.2?'Top + sidespin':'Sidespin'):brush>.2?'Topspin':brush<-.2?'Backspin':'Block'};
}
