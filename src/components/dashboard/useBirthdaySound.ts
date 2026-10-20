import {useEffect,useState} from 'react';

// A short local chime: no external audio downloads or notification permissions.
export default function useBirthdaySound(day:string,hasBirthday:boolean,userId:string){
 const [needsClick,setNeedsClick]=useState(false);
 useEffect(()=>{
  if(!hasBirthday||!userId)return;
  const key=`birthday-chime:${userId}:${day}`;
  let stopped=false,playing=false,context:AudioContext|undefined;
  const heard=()=>{try{return localStorage.getItem(key)==='played';}catch{return false;}};
  if(heard())return;
  const play=async()=>{
   if(stopped||playing||document.hidden||heard())return;
   playing=true;
   try{
    const audio=new AudioContext();context=audio;
    if(audio.state!=='running')await audio.resume();
    if(stopped||context!==audio||audio.state!=='running'||heard())return;
    const start=audio.currentTime;
    [523.25,659.25,783.99].forEach((frequency,index)=>{
     const tone=audio.createOscillator(),volume=audio.createGain();
     tone.type='sine';tone.frequency.value=frequency;
     volume.gain.setValueAtTime(0,start+index*.16);
     volume.gain.linearRampToValueAtTime(.12,start+index*.16+.02);
     volume.gain.exponentialRampToValueAtTime(.001,start+index*.16+.4);
     tone.connect(volume);volume.connect(audio.destination);
     tone.start(start+index*.16);tone.stop(start+index*.16+.42);
    });
    try{localStorage.setItem(key,'played');}catch{/* Storage may be disabled. */}
    setNeedsClick(false);
    document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);document.removeEventListener('click',unlock);
    window.setTimeout(()=>{if(audio.state!=='closed')void audio.close();},1000);
   }catch{if(!stopped)setNeedsClick(true);}finally{playing=false;}
  };
  const unlock=()=>{if(context?.state==='running')return;void context?.close();context=undefined;playing=false;void play();};
  const visible=()=>{if(!document.hidden)void play();};
  queueMicrotask(()=>{if(!stopped)setNeedsClick(!heard());});
  document.addEventListener('pointerdown',unlock);document.addEventListener('keydown',unlock);document.addEventListener('click',unlock);
  document.addEventListener('visibilitychange',visible);
  void play();
  return()=>{stopped=true;document.removeEventListener('pointerdown',unlock);document.removeEventListener('keydown',unlock);document.removeEventListener('click',unlock);document.removeEventListener('visibilitychange',visible);void context?.close();};
 },[day,hasBirthday,userId]);
 return hasBirthday&&needsClick;
}
