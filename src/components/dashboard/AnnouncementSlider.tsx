import {useEffect,useRef,useState} from 'react';
import {Cake,ChevronLeft,ChevronRight,Pause,Play} from 'lucide-react';
type Slide={key:string;image:string;title:string;birthday:boolean};
export default function AnnouncementSlider({slides,paused=false}:{slides:Slide[];paused?:boolean}){
  const [index,setIndex]=useState(0),[stopped,setStopped]=useState(false),[focused,setFocused]=useState(false),[explicitPlay,setExplicitPlay]=useState(false);
  const touch=useRef<{x:number;y:number}|null>(null);
  useEffect(()=>{
    if(paused||stopped||(focused&&!explicitPlay)||slides.length<2||(!explicitPlay&&window.matchMedia('(prefers-reduced-motion: reduce)').matches))return;
    const timer=setInterval(()=>setIndex(i=>(i+1)%slides.length),6000);return()=>clearInterval(timer);
  },[paused,stopped,focused,explicitPlay,slides.length]);
  if(!slides.length)return null;
  const active=slides[index%slides.length];
  return <div className="announcement-carousel" role="region" aria-roledescription="carousel" aria-label="Studio image slider" onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchEnd={e=>{if(!touch.current)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;touch.current=null;if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy))setIndex(i=>(i+(dx<0?1:-1)+slides.length)%slides.length);}} onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false);}}>
    <div className="announcement-slide" role="group" aria-roledescription="slide" aria-label={`${index%slides.length+1} of ${slides.length}`}><img key={active.key} src={active.image} alt={active.title}/><div className="announcement-caption"><div>{active.birthday&&<span><Cake size={14}/>Birthday celebration</span>}<h3>{active.title}</h3></div><span>{index%slides.length+1} / {slides.length}</span></div></div>
    {slides.length>1&&<div className="announcement-controls"><button type="button" aria-label="Previous image" onClick={()=>setIndex(i=>(i%slides.length-1+slides.length)%slides.length)}><ChevronLeft size={18}/></button><div className="announcement-dots">{slides.map((slide,i)=><button type="button" key={slide.key} aria-label={`Show image ${i+1}`} aria-pressed={i===index%slides.length} onClick={()=>setIndex(i)}/>)}</div>{!paused&&<button type="button" aria-label={stopped?'Play slideshow':'Pause slideshow'} onClick={()=>{setStopped(!stopped);setExplicitPlay(stopped);}}>{stopped?<Play size={15}/>:<Pause size={15}/>}</button>}<button type="button" aria-label="Next image" onClick={()=>setIndex(i=>(i+1)%slides.length)}><ChevronRight size={18}/></button></div>}
  </div>;
}
