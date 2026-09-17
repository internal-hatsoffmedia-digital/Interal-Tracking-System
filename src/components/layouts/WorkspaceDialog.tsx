import {useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import type {ReactNode} from 'react';
export default function WorkspaceDialog({titleId,children,onClose}:{titleId:string;children:ReactNode;onClose:()=>void}){
 const panel=useRef<HTMLDivElement>(null);const close=useRef(onClose);
 useEffect(()=>{close.current=onClose;},[onClose]);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const el=panel.current;el?.focus();
  const keyboard=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();close.current();}if(e.key==='Tab'&&el){const nodes=Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]')).filter(n=>n.getClientRects().length);const first=nodes[0],last=nodes[nodes.length-1];if(!first){e.preventDefault();el.focus();}else if(e.shiftKey&&(document.activeElement===first||document.activeElement===el)){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||document.activeElement===el)){e.preventDefault();first.focus();}}};
  document.addEventListener('keydown',keyboard);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',keyboard);previous?.focus();};
 },[]);
 return createPortal(<div className="workspace-dialog-backdrop"><div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="workspace-dialog">{children}</div></div>,document.body);
}
