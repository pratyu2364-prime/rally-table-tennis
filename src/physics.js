export const TABLE={height:.76,halfWidth:.7625,halfLength:1.37,net:.1525,radius:.02};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export class Match{
  constructor(){this.score=[0,0];this.winner=null;}
  get server(){const n=this.score[0]+this.score[1];return n>=20?n%2:Math.floor(n/2)%2;}
  point(w){if(this.winner!==null)return;this.score[w]++;if(this.score[w]>=11&&this.score[w]-this.score[1-w]>=2)this.winner=w;}
}
export class Ball{
  constructor(){Object.assign(this,{x:0,y:1.05,z:1.15,vx:0,vy:0,vz:0,spin:0,curve:0,last:0,bounces:0,live:false,serving:false,serveBounce:0,netTouch:false});}
}
export function serve(b,server,x=0){
  Object.assign(b,new Ball(),{x:x*.5,z:server===0?1.15:-1.15,y:1.07,vy:-1.1,vz:server===0?-3.4:3.4,last:server,live:true,serving:true});
}
export function launchReturn(b,side,target,spin='flat',power=0){
  const t=(spin==='back'?.72:spin==='top'?.57:.64)-clamp(power,0,1)*.07;
  const g=9.81+(spin==='top'?.9:spin==='back'?-.7:0);
  const tz=side===0?-.88:.88;
  b.vx=(clamp(target,-.63,.63)-b.x)/t;
  b.vz=(tz-b.z)/t;
  b.vy=(TABLE.height+TABLE.radius-b.y+.5*g*t*t)/t;
  b.spin=g-9.81;b.curve=b.vx*.07;b.last=side;b.bounces=0;b.serving=false;b.netTouch=false;b.live=true;
}
export function integrate(b,dt){
  if(!b.live)return [];
  const events=[],oldY=b.y,oldZ=b.z;
  b.vy-=(9.81+b.spin)*dt;b.vx+=(b.curve-.025*b.vx)*dt;b.vz-=b.vz*.025*dt;
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;
  const point=(winner,reason)=>{b.live=false;events.push({type:'point',winner,reason});};
  if(oldZ*b.z<=0 && Math.abs(b.x)<TABLE.halfWidth+.03 && b.y<TABLE.height+TABLE.net+TABLE.radius && b.y>TABLE.height-.04){
    b.z=Math.sign(oldZ||1)*.026;b.vz*=-.22;b.vx*=.6;b.netTouch=true;events.push({type:'net'});
  }
  const level=TABLE.height+TABLE.radius;
  if(oldY>=level && b.y<=level && b.vy<0 && Math.abs(b.x)<=TABLE.halfWidth+TABLE.radius*.5 && Math.abs(b.z)<=TABLE.halfLength+TABLE.radius*.5){
    b.y=level;b.vy=-b.vy*.88;b.vx=b.vx*.96+b.curve*.045;
    b.vz=b.vz*.97+Math.sign(b.vz)*b.spin*.09;b.spin*=.85;b.curve*=.93;
    const half=b.z>0?0:1;
    events.push({type:'bounce',x:b.x,z:b.z});
    if(b.serving && b.serveBounce===0){
      if(half!==b.last)point(1-b.last,'Serve missed your half');else b.serveBounce=1;
    }else if(half===b.last){point(1-b.last,'Ball stayed on the wrong side');}
    else if(b.serving && b.netTouch){b.live=false;events.push({type:'let'});}
    else{b.serving=false;b.bounces++;if(b.bounces>1)point(b.last,'Double bounce');}
  }
  if(b.live&&(b.y<.02 || Math.abs(b.z)>3.6 || Math.abs(b.x)>3))point(b.bounces>0?b.last:1-b.last,b.bounces>0?'No return':'Ball out');
  return events;
}
