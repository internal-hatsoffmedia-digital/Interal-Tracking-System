import {useEffect,useRef,useState} from 'react';
import {NavLink,useLocation,useNavigate} from 'react-router-dom';
import {LayoutDashboard,CheckSquare,ClipboardList,CalendarDays,Timer,FolderKanban,BriefcaseBusiness,Users,UserRound,BarChart3,Settings,Target,LogOut,X,ArrowUpRight,Sparkles} from 'lucide-react';
import {useAuth} from '../../context/AuthContext';
const groups=[
 {name:'Your workspace',items:[['Dashboard','/dashboard',LayoutDashboard],['My Work','/my-work',CheckSquare],['Tasks','/tasks',ClipboardList],['Planner','/planner',CalendarDays],['Timesheet','/timesheet',Timer],['Projects','/projects',FolderKanban]]},
 {name:'Studio',items:[['Clients','/clients',BriefcaseBusiness],['Teams','/teams',Users],['Employees','/employees',UserRound],['Performance','/performance',BarChart3],['Reports','/reports',BarChart3]]},
 {name:'Sales & Marketing',items:[['Sales Tracker','/sales',Target]]},
] as const;
export default function Sidebar(){
 const {profile,signOut}=useAuth();const location=useLocation();const navigate=useNavigate();const [open,setOpen]=useState(false);const [signingOut,setSigningOut]=useState(false);const [error,setError]=useState('');const panel=useRef<HTMLElement>(null);
 const close=()=>{setOpen(false);window.dispatchEvent(new CustomEvent('hatsoff:close-mobile-sidebar'));};
 useEffect(()=>{const toggle=()=>setOpen(v=>!v);const hide=()=>setOpen(false);window.addEventListener('hatsoff:toggle-mobile-sidebar',toggle);window.addEventListener('hatsoff:close-mobile-sidebar',hide);return()=>{window.removeEventListener('hatsoff:toggle-mobile-sidebar',toggle);window.removeEventListener('hatsoff:close-mobile-sidebar',hide);};},[]);
 useEffect(()=>{if(!open)return;const previous=document.activeElement as HTMLElement;const old=document.body.style.overflow;document.body.style.overflow='hidden';panel.current?.querySelector<HTMLButtonElement>('button')?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);window.dispatchEvent(new CustomEvent('hatsoff:close-mobile-sidebar'));}if(e.key==='Tab'){const nodes=Array.from(panel.current?.querySelectorAll<HTMLElement>('a,button:not([disabled])')??[]).filter(el=>el.getClientRects().length);const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}};window.addEventListener('keydown',key);return()=>{document.body.style.overflow=old;window.removeEventListener('keydown',key);previous?.focus();};},[open]);
 async function logout(){setSigningOut(true);try{await signOut();close();navigate('/login',{replace:true});}catch{setError('Unable to sign out. Please retry.');}finally{setSigningOut(false);}}
 const name=profile?.full_name||'Internal User';
 return <>{open&&<button tabIndex={-1} aria-label="Close navigation backdrop" className="future-nav-backdrop" onClick={close}/>}
 <aside ref={panel} className={`future-sidebar ${open?'is-open':''}`} aria-label="Main navigation">
 <div className="future-brand"><NavLink to="/dashboard" onClick={close} aria-label="Hatsoff home"><img src="/hatsoff-brand.svg" alt="Hatsoff Media"/><span>HATSOFF<small>INTERNAL FORCE<span className="brand-dot"/></small></span></NavLink><button className="future-mobile-close" aria-label="Close navigation" onClick={close}><X size={19}/></button></div>
 <nav>{groups.map(group=><div className="future-nav-group" key={group.name}><p>{group.name}</p>{group.items.map(([label,path,Icon])=><NavLink to={path} onClick={close} key={path} className={({isActive})=>`future-nav-link ${isActive?'is-active':''}`}><Icon size={18} strokeWidth={1.7}/><span>{label}</span>{location.pathname===path&&<span className="nav-active-dot"/>}</NavLink>)}</div>)}
 <div className="future-studio-note"><Sparkles size={18}/><span>Focus. Create.<br/><strong>Deliver.</strong></span><ArrowUpRight size={17}/></div>
 </nav>
 <div className="future-sidebar-footer"><NavLink to="/settings" onClick={close} className={({isActive})=>`future-nav-link ${isActive?'is-active':''}`}><Settings size={18}/><span>Settings</span></NavLink><div className="future-account"><span className="future-avatar">{name.slice(0,1).toUpperCase()}</span><span><strong>{name}</strong><small>{profile?.role?.replaceAll('_',' ')||'Account'}</small></span><button title="Sign out" aria-label="Sign out" disabled={signingOut} onClick={()=>void logout()}><LogOut size={17}/></button></div>{error&&<p role="alert">{error}</p>}</div>
 </aside></>;
}
