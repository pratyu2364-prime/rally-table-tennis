import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { clamp } from './physics.js';

export function createCourt(container){
  const mobile=()=>innerWidth<700;
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,mobile()?1.6:2));renderer.setSize(innerWidth,innerHeight);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  container.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#20342e');scene.fog=new THREE.FogExp2('#263d32',.035);
  const env=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();
  const envTarget=env.fromScene(room,.04);scene.environment=envTarget.texture;scene.environmentIntensity=.28;room.dispose();env.dispose();
  const camera=new THREE.PerspectiveCamera(mobile()?50:43,innerWidth/innerHeight,.05,60);
  const mat=(color,roughness=.65,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const green=mat('#0c382f',.68),edge=mat('#122d29',.4),metal=mat('#303e37',.28,.65),cream=mat('#d8d9bd',.52),wood=mat('#8c6542',.6);
  function mesh(geometry,material,x=0,y=0,z=0,parent=scene){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  function box(w,h,d,m,x,y,z,parent){return mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);}
  function cyl(r1,r2,h,m,x,y,z,parent){return mesh(new THREE.CylinderGeometry(r1,r2,h,20),m,x,y,z,parent);}
  function beam(a,b,r,m,parent=scene){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);const o=cyl(r,r,delta.length(),m,0,0,0,parent);o.position.copy(start.add(end).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return o;}
  function textTexture(text,color='#e4e1c6',background=null,size=128){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');if(background){ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);}ctx.fillStyle=color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${size}px Arial`;ctx.fillText(text,512,130);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
  function label(text,w,h,x,y,z,color,bg,size){const m=new THREE.MeshBasicMaterial({map:textTexture(text,color,bg,size),transparent:!bg,side:THREE.DoubleSide});return mesh(new THREE.PlaneGeometry(w,h),m,x,y,z);}
  // A real-scale, 2.74 × 1.525 m table, with separate halves and a painted edge.
  box(1.525,.045,2.74,green,0,.7375,0);
  for(const x of [-.751,.751])box(.018,.0015,2.72,cream,x,.761,0);
  for(const z of [-1.357,1.357])box(1.525,.0015,.018,cream,0,.761,z);
  box(.003,.0015,2.7,cream,0,.761,0);
  for(const x of [-.742,.742])box(.04,.1,2.71,edge,x,.686,0);
  for(const z of [-1.34,1.34])box(1.5,.1,.04,edge,0,.686,z);
  const nearLogo=label('R A L L Y',.35,.072,0,.68,1.363,'#cdd9bb');nearLogo.castShadow=false;
  const sideLogo=label('CLUB SERIES / 01',.5,.06,.765,.684,.68,'#b6c9ae');sideLogo.rotation.y=Math.PI/2;
  for(const z of [-.82,.82]){
    for(const x of [-.53,.53]){beam([x,.67,z],[x*1.07,.09,z+.08],.025,metal);cyl(.043,.043,.055,edge,x*1.07,.055,z+.08);}
    beam([-.55,.25,z+.04],[.55,.25,z+.04],.018,metal);
  }
  for(const x of [-.52,.52]){beam([x,.34,-.82],[x,.65,.65],.013,metal);beam([x,.34,.82],[x,.65,-.65],.013,metal);}
  // Fine woven net, white top tape, tension cords and clamp assemblies.
  const netPoints=[];for(let x=-.81;x<=.81;x+=.023)netPoints.push(x,.765,0,x,.9125,0);
  for(let y=.773;y<.9125;y+=.018)netPoints.push(-.81,y,0,.81,y,0);
  const netGeo=new THREE.BufferGeometry();netGeo.setAttribute('position',new THREE.Float32BufferAttribute(netPoints,3));
  scene.add(new THREE.LineSegments(netGeo,new THREE.LineBasicMaterial({color:'#bdc5aa',transparent:true,opacity:.57})));
  box(1.65,.013,.012,cream,0,.9125,0);box(1.65,.006,.009,edge,0,.767,0);
  for(const x of [-.824,.824]){cyl(.011,.013,.21,metal,x,.823,0);box(.095,.019,.075,metal,x,.714,0);beam([x,.9,0],[x*1.03,.725,.03],.004,cream);}
  // Warm oak flooring, made locally with a deterministic parquet texture.
  const floorCanvas=document.createElement('canvas');floorCanvas.width=1024;floorCanvas.height=1024;
  const fc=floorCanvas.getContext('2d');fc.fillStyle='#746244';fc.fillRect(0,0,1024,1024);
  let seed=13;const rand=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let row=0;row<24;row++){for(let j=-1;j<5;j++){const x=j*260+(row%2)*130,y=row*44;const v=Math.floor(rand()*16);fc.fillStyle=`rgb(${118+v},${100+v},${72+v})`;fc.fillRect(x+1,y+1,258,42);for(let k=0;k<24;k++){fc.strokeStyle=`rgba(53,35,18,${rand()*.11})`;fc.beginPath();const yy=y+rand()*43;fc.moveTo(x,yy);fc.lineTo(x+260,yy+rand()*2);fc.stroke();}}}
  const floorTex=new THREE.CanvasTexture(floorCanvas);floorTex.colorSpace=THREE.SRGBColorSpace;floorTex.wrapS=floorTex.wrapT=THREE.RepeatWrapping;floorTex.repeat.set(3,4);floorTex.anisotropy=8;
  box(16,.08,20,new THREE.MeshStandardMaterial({map:floorTex,roughness:.54}),0,-.055,0);
  const courtPaint=mat('#d5c49d',.8);for(const x of [-2.3,2.3])box(.025,.002,7.4,courtPaint,x,.001,0);
  for(const z of [-3.7,3.7])box(4.625,.002,.025,courtPaint,0,.001,z);
  const floorMark=label('01',.65,.32,-1.6,.008,2.65,'#d7c5a0');floorMark.rotation.x=-Math.PI/2;
  const wall=mat('#304337',.93),wallDark=mat('#1a3027',.85);
  box(14,6,.2,wall,0,3,-6);box(.2,6,17,wall,-7,3,1);box(.2,6,17,wall,7,3,1);
  box(14,1.2,.1,wallDark,0,.6,-5.86);
  for(let x=-6.8;x<7;x+=.38)box(.019,1.1,.04,mat('#4b5c43'),x,.65,-5.78);
  box(14,.07,.14,wood,0,1.22,-5.8);
  // Back-wall club identity, illuminated sign and acoustic timber slats.
  label('R A L L Y',4.3,1.07,0,3.02,-5.85,'#ede3c5');label('T A B L E   T E N N I S   C L U B',3.8,.34,0,2.35,-5.83,'#abb79b',null,70);
  for(const x of [-4.8,4.8]){box(1.45,2.4,.12,edge,x,2.9,-5.78);label(x<0?'01':'PLAY',1.3,1.3,x,3.03,-5.70,x<0?'#e6955e':'#b9cdb0','#1a332a',x<0?190:110);label(x<0?'FIND YOUR FLOW':'ONE MORE RALLY',1.25,.3,x,2.26,-5.69,'#d3c9a7',null,60);}
  for(let x=2.9;x<6.7;x+=.13)box(.045,1.05,.1,wood,x,4.7,-5.8);
  // High windows on the left and architectural ceiling beams.
  const windowMat=new THREE.MeshBasicMaterial({color:'#cbd0b3'});
  for(let z=-4.5;z<4;z+=2.3){box(.035,2.2,1.8,windowMat,-6.88,3.35,z);for(const zz of [z-.9,z,z+.9])box(.08,2.3,.05,edge,-6.82,3.35,zz);box(.08,.05,1.85,edge,-6.82,3.4,z);}
  for(let z=-5;z<7;z+=3){box(14,.18,.18,edge,0,5.3,z);}
  const lampMat=new THREE.MeshBasicMaterial({color:'#fff0c9'});
  for(const z of [-2.8,1.6]){box(3.6,.06,.27,edge,0,4.8,z);box(3.4,.012,.22,lampMat,0,4.76,z);for(const x of [-1.4,1.4])beam([x,4.84,z],[x,5.3,z],.006,metal);}
  // Club barriers and benches frame the court without blocking play.
  const barrierMat=mat('#233f33',.92);
  for(const x of [-3.05,3.05])for(const z of [-2.1,.25,2.6]){box(.035,.66,2.22,barrierMat,x,.4,z);for(const zz of [z-1.06,z+1.06]){beam([x,.07,zz],[x,.76,zz],.014,metal);beam([x-.18,.025,zz],[x+.18,.025,zz],.014,metal);}const l=label('rally',.7,.23,x+(x>0?-.022:.022),.43,z,'#a3b99b');l.rotation.y=x>0?-Math.PI/2:Math.PI/2;}
  for(const x of [-4.8,4.8]){box(.56,.055,2.8,wood,x,.43,-2.5);box(.045,.36,2.8,wood,x+(x>0?.24:-.24),.63,-2.5);for(const z of [-3.5,-1.5])for(const dx of [-.2,.2])box(.04,.4,.04,metal,x+dx,.2,z);}
  // Towel, bottle, spare balls and a pair of leafy planters.
  box(.38,.04,.48,cream,4.8,.48,-2.3);cyl(.042,.045,.25,mat('#8fbaaa',.25,.2),4.8,.59,-1.65);cyl(.024,.024,.03,edge,4.8,.735,-1.65);
  for(const x of [-5.7,5.7]){cyl(.27,.2,.45,mat('#9b7759'),x,.225,-4.55);for(let j=0;j<12;j++){const a=j*2.4;const top=[x+Math.sin(a)*.4,.7+rand()*.65,-4.55+Math.cos(a)*.35];beam([x,.4,-4.55],top,.009,mat('#496646'));const leaf=mesh(new THREE.SphereGeometry(1,10,6),mat(j%2?'#527153':'#36573d'),...top);leaf.scale.set(.1,.3,.06);leaf.rotation.set(.5,a,.7);}}
  scene.add(new THREE.HemisphereLight('#e4e7cc','#4c4330',1));
  const key=new THREE.SpotLight('#ffecd0',65,20,Math.PI/3,.65,1.6);key.position.set(-1.7,5,2);key.target.position.set(0,0,0);key.castShadow=true;key.shadow.mapSize.set(1536,1536);key.shadow.bias=-.00025;key.shadow.normalBias=.015;scene.add(key,key.target);
  const rim=new THREE.SpotLight('#d5efdd',70,18,Math.PI/2.8,.75,1.6);rim.position.set(2,4,-3);rim.target.position.set(0,.7,0);scene.add(rim,rim.target);
  const windowLight=new THREE.DirectionalLight('#ffe4b6',1.3);windowLight.position.set(-5,4,1);scene.add(windowLight);
  const backLight=new THREE.PointLight('#f8da9d',18,8,2);backLight.position.set(0,3.6,-4.8);scene.add(backLight);
  function paddle(color){const g=new THREE.Group();scene.add(g);const blade=cyl(.091,.091,.012,wood,0,0,0,g);blade.rotation.x=Math.PI/2;blade.scale.z=1.12;for(const s of [-1,1]){const rubber=cyl(.087,.087,.003,mat(s===1?color:'#242c28',.92),0,0,s*.0075,g);rubber.rotation.x=Math.PI/2;rubber.scale.z=1.12;}const grip=box(.036,.12,.023,wood,0,-.137,0,g);grip.rotation.z=.07;for(let i=0;i<5;i++)box(.034,.004,.024,edge,0,-.105-i*.012,0,g);return g;}
  const player=paddle('#ce493c'),opponent=paddle('#303b37');player.position.set(.35,1,1.55);opponent.position.set(-.2,1,-1.55);opponent.rotation.z=.2;
  player.traverse(o=>o.castShadow=false);opponent.traverse(o=>o.castShadow=false);
  renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
  const ball=mesh(new THREE.SphereGeometry(.023,24,16),mat('#fff7df',.4),.2,1.2,.7);ball.castShadow=false;
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;const sc=shadowCanvas.getContext('2d');const gradient=sc.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(0,0,0,.5)');gradient.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=gradient;sc.fillRect(0,0,64,64);
  const shadow=mesh(new THREE.PlaneGeometry(.17,.17),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}),0,.764,0);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
  const trail=[];for(let i=0;i<9;i++){const m=mesh(new THREE.SphereGeometry(.021,8,6),new THREE.MeshBasicMaterial({color:'#ffe7b0',transparent:true,opacity:0,depthWrite:false}));m.castShadow=false;m.receiveShadow=false;trail.push(m);}
  const rings=[];for(let i=0;i<4;i++){const r=mesh(new THREE.RingGeometry(.027,.036,32),new THREE.MeshBasicMaterial({color:'#ecba74',side:THREE.DoubleSide,transparent:true,opacity:0,depthWrite:false}),0,.766,0);r.rotation.x=-Math.PI/2;r.castShadow=false;r.userData.life=0;rings.push(r);}
  let ringIndex=0,playing=false,blend=0,time=0,shake=0;const swings=[0,0];const look=new THREE.Vector3(),targetLook=new THREE.Vector3(),targetPos=new THREE.Vector3();const history=[];
  const resize=()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.fov=mobile()?50:43;camera.updateProjectionMatrix();};addEventListener('resize',resize);
  function render(dt,state){
    time+=dt;blend+=((playing?1:0)-blend)*Math.min(1,dt*3);const small=mobile();
    const hero=small?new THREE.Vector3(3.3,3.7,5.2):new THREE.Vector3(3.15,2.55,4.3);
    const play=small?new THREE.Vector3(0,3.15,4.9):new THREE.Vector3(0,2.55,3.85);
    targetPos.copy(hero).lerp(play,blend);targetLook.set(small?0:-.65,.72,0).lerp(new THREE.Vector3(0,.64,-.12),blend);
    if(!playing){targetPos.x+=Math.sin(time*.12)*.09;}
    camera.position.copy(targetPos);look.copy(targetLook);shake*=Math.exp(-dt*20);camera.position.y+=Math.sin(time*90)*shake;camera.lookAt(look);
    if(state){const b=state.ball;ball.position.set(b.x,b.y,b.z);player.position.set(state.px,state.py,state.pz);opponent.position.set(state.ax,state.ay,-1.53);player.rotation.y=clamp(-state.pvx*.1,-.5,.5);player.rotation.z=-.15-state.px*.22;opponent.rotation.z=.15-state.ax*.2;player.rotation.x=(state.spin==='top'?-.18:state.spin==='back'?.22:0)+clamp(state.pvz*.12,-.25,.25);
      history.length=0;if(b.live)for(let i=0;i<10;i++)history.push(new THREE.Vector3(b.x-b.vx*i*.004,b.y-b.vy*i*.004,b.z-b.vz*i*.004));
    }else{ball.position.set(Math.sin(time*.7)*.24,1.05+Math.abs(Math.sin(time*1.7))*.32,.55);player.rotation.y=Math.sin(time*.5)*.1;}
    opponent.rotation.x=0;
    [player,opponent].forEach((p,i)=>{swings[i]=Math.max(0,swings[i]-dt);const stroke=Math.sin(swings[i]/.2*Math.PI);if(i===1)p.position.z+=stroke*.08;if(state)p.rotation.x+=(i===0?-1:1)*stroke*.18;});
    trail.forEach((m,i)=>{if(history[i+1]){m.position.copy(history[i+1]);m.material.opacity=(1-i/9)*.19;m.scale.setScalar(1-i*.06);}else m.material.opacity=0;});
    const onTable=Math.abs(ball.position.x)<.77&&Math.abs(ball.position.z)<1.38;shadow.position.set(ball.position.x,onTable?.763:.003,ball.position.z);shadow.material.opacity=clamp(1-(ball.position.y-(onTable?.76:0))*.6,.12,.8);shadow.scale.setScalar(1+Math.max(0,ball.position.y-.76)*1.2);
    rings.forEach(r=>{r.userData.life=Math.max(0,r.userData.life-dt);r.material.opacity=r.userData.life*1.6;r.scale.setScalar(1+(1-r.userData.life/.35)*3);});
    renderer.render(scene,camera);
  }
  return {render,setPlaying(v){playing=v;},impact(x,z){const r=rings[ringIndex++%4];r.position.set(x,.766,z);r.userData.life=.35;},hit(side){swings[side]=.2;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)shake=.003;},renderer};
}
