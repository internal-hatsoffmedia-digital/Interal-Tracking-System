import {Moon,Sun} from 'lucide-react';
import {useState} from 'react';

export function initializeTheme() {
  let theme: string|null=null;
  try {theme=localStorage.getItem('hatsoff-theme');} catch { /* Storage may be disabled. */ }
  document.documentElement.dataset.theme=theme==='dark'||theme==='light'?theme:window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
}
export default function ThemeToggle() {
  const [dark,setDark]=useState(document.documentElement.dataset.theme==='dark');
  return <button className="theme-toggle" aria-label={dark?'Switch to light mode':'Switch to dark mode'} title={dark?'Switch to light mode':'Switch to dark mode'} onClick={()=>{
    const next=!dark;setDark(next);document.documentElement.dataset.theme=next?'dark':'light';
    try{localStorage.setItem('hatsoff-theme',next?'dark':'light');}catch{/* Keep the session preference. */}
  }}>{dark?<Sun size={18}/>:<Moon size={18}/>}<span className="hidden sm:inline">{dark?'Light':'Dark'}</span></button>;
}
