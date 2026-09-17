import {useEffect,useRef,useState} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {Menu,ChevronDown,LogOut,User,Command} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
import WorkspaceSearch from './WorkspaceSearch';
import ProjectNotifications from './ProjectNotifications';
import ThemeToggle from './ThemeToggle';
export default function Topbar(){
 const {profile,signOut}=useAuth();const location=useLocation();const navigate=useNavigate();const [open,setOpen]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [now,setNow]=useState(new Date());const dropdown=useRef<HTMLDivElement>(null);
 useEffect(()=>{const timer=setInterval(()=>setNow(new Date()),60000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{if(!open)return;const dismiss=(e:PointerEvent)=>{if(!dropdown.current?.contains(e.target as Node))setOpen(false);};const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setOpen(false);};document.addEventListener('pointerdown',dismiss);document.addEventListener('keydown',key);return()=>{document.removeEventListener('pointerdown',dismiss);document.removeEventListener('keydown',key);};},[open]);
 const page=({'my-work':'My Work',sales:'Sales Tracker','task-assignments':'Task Assignments'} as Record<string,string>)[location.pathname.slice(1)]||location.pathname.slice(1).replace(/^./,c=>c.toUpperCase());
 const name=profile?.full_name||'Internal User';
 async function logout(){setBusy(true);try{await signOut();navigate('/login',{replace:true});}catch{setError('Unable to sign out. Please retry.');}finally{setBusy(false);}}
 return <header className="future-topbar"><button className="future-menu-button" aria-label="Open navigation" onClick={()=>window.dispatchEvent(new CustomEvent('hatsoff:toggle-mobile-sidebar'))}><Menu size={21}/></button>
 <div className="future-breadcrumb"><Command size={16}/><span>Workspace</span><span>/</span><strong>{page}</strong></div><WorkspaceSearch/>
 <div className="future-header-actions"><span className="future-date">{now.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</span><ThemeToggle/><ProjectNotifications/><div className="future-profile" ref={dropdown}><button aria-label="Account menu" aria-expanded={open} onClick={()=>setOpen(!open)} className="future-profile-button"><span className="future-avatar">{name.slice(0,1).toUpperCase()}</span><ChevronDown size={14}/></button>{open&&<div className="future-profile-popover"><strong>{name}</strong><p>{profile?.role?.replaceAll('_',' ')}</p><Link to="/settings" onClick={()=>setOpen(false)}><User size={16}/>My Profile</Link><button disabled={busy} onClick={()=>void logout()}><LogOut size={16}/>{busy?'Signing out…':'Sign out'}</button>{error&&<p role="alert">{error}</p>}</div>}</div></div>
 </header>;
}
