import {useCallback,useEffect,useRef,useState} from 'react';
import {ImagePlus,Megaphone} from 'lucide-react';
import {supabase} from '../../lib/supabase';
import {useAuth} from '../../context/AuthContext';
import {studioDay} from '../../lib/dashboardCelebrations';
import AnnouncementSlider from './AnnouncementSlider';
import './announcements.css';
type Announcement={id:string;title:string;image_data:string;images?:string[]|null;birthday_on?:string|null;created_at:string};
export default function Announcements({hero=false}:{hero?:boolean}){
 const {profile}=useAuth();const admin=profile?.role==='admin';
 const [loaded,setLoaded]=useState<{user:string;rows:Announcement[]}|null>(null);
 const rows=loaded&&loaded.user===profile?.id?loaded.rows:[];
 const [editing,setEditing]=useState(false),[title,setTitle]=useState(''),[images,setImages]=useState<string[]>([]);
 const [birthday,setBirthday]=useState(false),[date,setDate]=useState(()=>studioDay());
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const [day,setDay]=useState(()=>studioDay());const userId=profile?.id??'';
 const imageCache=useRef<{user:string;images:Map<string,Pick<Announcement,'image_data'|'images'>>}>({user:'',images:new Map()});
 const request=useRef(0);
 const load=useCallback(async()=>{
   const current=++request.current;
   const r=await supabase.from('workspace_announcements').select('id,title,birthday_on,created_at').order('created_at',{ascending:false}).limit(40);
   if(current!==request.current)return;
   if(r.error){setError('Announcements could not load. Please refresh.');return;}
   if(imageCache.current.user!==userId)imageCache.current={user:userId,images:new Map()};
   const cache=imageCache.current.images;
   const shown=r.data.filter(row=>!row.birthday_on||row.birthday_on===studioDay()).slice(0,10);
   const wanted=new Set(shown.map(row=>row.id));
   for(const id of cache.keys())if(!wanted.has(id))cache.delete(id);
   const missing=shown.filter(row=>!cache.has(row.id)).map(row=>row.id);
   if(missing.length){
     const media=await supabase.from('workspace_announcements').select('id,image_data,images').in('id',missing);
     if(current!==request.current)return;
     if(media.error){setError('Announcement images could not load. Please refresh.');return;}
     for(const row of media.data)cache.set(row.id,row);
   }
   setLoaded({user:userId,rows:r.data.map(row=>({...row,...cache.get(row.id),image_data:cache.get(row.id)?.image_data??''}))});
 },[userId]);
 useEffect(()=>{
   const initial=setTimeout(()=>void load(),0),check=()=>{setDay(studioDay());void load();};
   const poll=setInterval(check,60000),rollover=setInterval(()=>setDay(studioDay()),1000);
   window.addEventListener('focus',check);
   const c=supabase.channel('dashboard-announcements').on('postgres_changes',{event:'*',schema:'public',table:'workspace_announcements'},()=>void load()).subscribe();
   return()=>{clearTimeout(initial);clearInterval(poll);clearInterval(rollover);window.removeEventListener('focus',check);void supabase.removeChannel(c);};
 },[load]);
 const visible=rows.filter(r=>r.image_data&&(!r.birthday_on||r.birthday_on===day));
 const slides=visible.flatMap(row=>(row.images?.length?row.images:[row.image_data]).map((image,i)=>({row,image,key:`${row.id}-${i}`})));
 async function selectFiles(files:FileList|null){
   if(!files?.length)return;setError('');setBusy(true);setImages([]);
   try{
     if(files.length>8)throw new Error('Choose up to 8 images per announcement.');
     const next:string[]=[];
     for(const file of Array.from(files)){
       if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Choose JPG, PNG or WebP images up to 10 MB each.');
       const bitmap=await createImageBitmap(file);
       try{
         const scale=Math.min(1,1280/bitmap.width,1280/bitmap.height),canvas=document.createElement('canvas');
         canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
         const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image processing is unavailable.');
         ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);const data=canvas.toDataURL('image/webp',.78);
         if(data.length>2000000)throw new Error('An image is too detailed; choose a smaller image.');next.push(data);
       }finally{bitmap.close();}
     }
     if(next.reduce((n,s)=>n+s.length,0)>6000000)throw new Error('Choose fewer or smaller images; combined limit is 6 MB.');
     setImages(next);
   }catch(e){setError(e instanceof Error?e.message:'Unable to read images.');}finally{setBusy(false);}
 }
 async function publish(){
   if(!admin||!images.length||!title.trim())return;
   setBusy(true);setError('');
   const r=await supabase.from('workspace_announcements').insert({title:title.trim(),image_data:images[0],images,birthday_on:birthday?date:null,created_by:profile.id});
   if(r.error)setError(r.error.message);else{setEditing(false);setImages([]);setTitle('');setBirthday(false);await load();}setBusy(false);
 }
 async function remove(id:string){
   if(!window.confirm('Permanently remove this announcement and its images?'))return;
   setBusy(true);setError('');const r=await supabase.from('workspace_announcements').delete().eq('id',id).select('id').single();
   if(r.error)setError(r.error.message);else await load();setBusy(false);
 }
 if(!admin&&!visible.length&&!error)return null;
 return <section aria-label="Announcements" className={`dashboard-announcements ${hero?'dashboard-hero-banner':''}`}><header><div><span className="announcement-eyebrow">TEAM UPDATES</span><h2><Megaphone size={18}/>Team highlights</h2></div>{admin&&<button disabled={busy} onClick={()=>setEditing(!editing)}><ImagePlus size={16}/>{editing?'Cancel':'Add images'}</button>}</header>
 {error&&<p role="alert" className="announcement-error">{error}</p>}
 {editing&&admin&&<form className="announcement-editor" onSubmit={e=>{e.preventDefault();void publish();}}><fieldset disabled={busy}><label>Title / image description<input maxLength={180} required value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Images · up to 8<input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e=>void selectFiles(e.target.files)}/></label><label className="announcement-checkbox"><input type="checkbox" checked={birthday} onChange={e=>setBirthday(e.target.checked)}/>Birthday celebration</label>{birthday&&<label>Birthday date (IST)<input type="date" min={day} required value={date} onChange={e=>setDate(e.target.value)}/><small>Shown on this date only. Colleagues can send 24-hour wishes in the automatic Birthdays & wishes section.</small></label>}</fieldset><div className="announcement-previews">{images.map((image,i)=><img key={i} src={image} alt={`Selected image ${i+1}`}/>)}</div>{images.length>0&&<div><p className="announcement-eyebrow">UNPUBLISHED SLIDER PREVIEW</p><AnnouncementSlider slides={images.map((image,i)=>({key:String(i),image,title:title||`Image ${i+1}`,birthday}))} paused/></div>}<button className="announcement-primary" disabled={busy||!images.length||!title.trim()}>{busy?'Preparing…':'Publish announcement'}</button></form>}
 {slides.length>0&&<AnnouncementSlider slides={slides.map(s=>({key:s.key,image:s.image,title:s.row.title,birthday:!!s.row.birthday_on}))} paused={editing}/>}

 {!visible.length&&!editing&&(hero?<div className="announcement-hero-placeholder"><img src="/studio-hero.svg" alt=""/><div><h3>Good work starts here.</h3><p>Plan, create and deliver.<br/>Together.</p></div></div>:<p className="announcement-empty">Your team’s next update will appear here.</p>)}
 {admin&&rows.length>0&&<details className="announcement-manage"><summary>Manage announcements ({rows.length})</summary>{rows.map(r=><div key={r.id}><span>{r.title}{r.birthday_on?` · Birthday ${r.birthday_on}`:''}</span><button disabled={busy} onClick={()=>void remove(r.id)}>Remove</button></div>)}</details>}
 </section>;
}
