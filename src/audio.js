// Short plastic-shell transients with separate table/rubber resonances. Also used
// by the offline demo renderer, so its impact audio is the actual game's sound.
export function impactSamples(kind,sampleRate=48000,strength=1){
  const table=kind==='bounce',net=kind==='net';
  const duration=net?.065:table?.115:.075;
  const samples=new Float32Array(Math.ceil(duration*sampleRate));
  const modes=table?[[980,.31,.010],[1840,.23,.006],[3280,.12,.003],[360,.09,.022]]:
    net?[[210,.07,.009],[640,.08,.005]]:[[1380,.26,.006],[2670,.19,.004],[4120,.11,.0025],[520,.06,.012]];
  let seed=417,previous=0;const volume=Math.min(1.4,Math.max(.25,strength));
  for(let i=0;i<samples.length;i++){
    const t=i/sampleRate;seed=(seed*16807)%2147483647;const noise=seed/2147483647*2-1;
    const transient=(noise-previous)*Math.exp(-t/(net?.006:.0013))*(net?.11:.2);previous=noise;
    let value=transient;
    for(const [f,a,decay] of modes)value+=Math.sin(2*Math.PI*f*t)*a*Math.exp(-t/decay);
    // A quiet early wall reflection, not a long synthetic musical tail.
    if(i>sampleRate*.036)value+=samples[i-Math.round(sampleRate*.036)]*.065;
    samples[i]=Math.max(-.95,Math.min(.95,value*volume));
  }
  return samples;
}
export class ImpactAudio{
  constructor(){this.context=null;this.enabled=false;}
  async enable(value){
    this.enabled=value;if(!value)return;
    this.context??=new (window.AudioContext||window.webkitAudioContext)();
    if(this.context.state==='suspended')await this.context.resume();
  }
  play(kind,strength=1,x=0){
    if(!this.enabled||!this.context||kind==='point')return;
    const ctx=this.context,data=impactSamples(kind,ctx.sampleRate,strength);
    const buffer=ctx.createBuffer(1,data.length,ctx.sampleRate);buffer.copyToChannel(data,0);
    const source=ctx.createBufferSource();source.buffer=buffer;
    const pan=ctx.createStereoPanner();pan.pan.value=Math.max(-.65,Math.min(.65,x*.6));
    const gain=ctx.createGain();gain.gain.value=.8;source.connect(pan);pan.connect(gain);gain.connect(ctx.destination);
    source.start();source.onended=()=>{source.disconnect();pan.disconnect();gain.disconnect();};
  }
}
