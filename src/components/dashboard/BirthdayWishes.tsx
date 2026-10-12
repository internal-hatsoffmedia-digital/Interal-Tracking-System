import {useEffect,useRef,useState} from 'react';
import type {RealtimeChannel} from '@supabase/supabase-js';
import {MessageCircle,Send} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import {useAuth} from '../../context/AuthContext';
import {studioDay,validBirthdayWish,type BirthdayWish} from '../../lib/dashboardCelebrations';

export default function BirthdayWishes({announcementId,day}:{announcementId:string;day:string}){
  const {profile,session}=useAuth();
  const [wishes,setWishes]=useState<BirthdayWish[]>([]),[text,setText]=useState('');
  const [ready,setReady]=useState(false),[sending,setSending]=useState(false),[error,setError]=useState('');
  const channel=useRef<RealtimeChannel|null>(null),lastSent=useRef(0);
  useEffect(()=>{
    if(!session||day!==studioDay())return;
    let live=true;
    const room=supabase.channel(`birthday-wishes:${announcementId}:${day}`,{config:{private:true,broadcast:{self:true,ack:true}}});
    channel.current=room;
    void supabase.realtime.setAuth(session.access_token).then(()=>{
      if(!live)return;
      room.on('broadcast',{event:'wish'},({payload})=>{
        if(!live||studioDay()!==day||!validBirthdayWish(payload,announcementId,day))return;
        setWishes(current=>current.some(w=>w.id===payload.id)?current:[...current,payload].slice(-100));
      }).subscribe(status=>{
        if(!live)return;
        setReady(status==='SUBSCRIBED');
        if(status==='CHANNEL_ERROR'||status==='TIMED_OUT')setError('Live wishes could not connect. Please refresh to reconnect.');
      });
    }).catch(()=>{if(live)setError('Live wishes could not connect.');});
    // Clear mounted/offscreen browser tabs as soon as the studio day ends.
    const expire=()=>{if(studioDay()!==day){setWishes([]);setText('');setReady(false);void supabase.removeChannel(room);}};
    const timer=window.setInterval(expire,1000);
    document.addEventListener('visibilitychange',expire);
    return()=>{live=false;channel.current=null;clearInterval(timer);document.removeEventListener('visibilitychange',expire);void supabase.removeChannel(room);};
  },[announcementId,day,session]);
  async function send(event:React.FormEvent){
    event.preventDefault();
    if(!ready||!profile||!text.trim()||studioDay()!==day||sending)return;
    if(Date.now()-lastSent.current<5000){setError('Please wait a few seconds before another wish.');return;}
    setSending(true);setError('');
    const payload:BirthdayWish={id:crypto.randomUUID(),announcementId,day,author:(profile.full_name||'Colleague').slice(0,100),text:text.trim().slice(0,280)};
    try{
      const result=await channel.current?.send({type:'broadcast',event:'wish',payload});
      if(result!=='ok')throw new Error('Your wish could not be delivered. Please try again.');
      if(studioDay()===day){setWishes(current=>current.some(w=>w.id===payload.id)?current:[...current,payload].slice(-100));setText('');lastSent.current=Date.now();}
    }catch(e){setError(e instanceof Error?e.message:'Unable to send wish.');}finally{setSending(false);}
  }
  return <section className="birthday-wishes" aria-label="Birthday wishes"><div className="birthday-wishes-heading"><MessageCircle size={17}/><strong>Send a birthday wish</strong><span>Live · today only</span></div>
    <p>Visible to colleagues connected now. Wishes disappear at midnight IST and have no saved history.</p>
    <div className="birthday-wish-list" role="log" aria-live="polite">{wishes.map(w=><article key={w.id}><strong>{w.author}</strong><span>{w.text}</span></article>)}{!wishes.length&&<p>Be the first to share a wish while you’re here.</p>}</div>
    {error&&<p role="alert">{error}</p>}
    <form onSubmit={e=>void send(e)}><label className="sr-only" htmlFor={`wish-${announcementId}`}>Birthday message</label><input id={`wish-${announcementId}`} placeholder={ready?'Write a birthday wish…':'Connecting to live wishes…'} maxLength={280} value={text} onChange={e=>setText(e.target.value)} disabled={!ready||sending}/><button disabled={!ready||sending||!text.trim()} type="submit"><Send size={16}/>{sending?'Sending…':'Send'}</button></form>
  </section>;
}
