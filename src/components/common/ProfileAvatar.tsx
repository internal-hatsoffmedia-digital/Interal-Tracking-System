import {useState} from 'react';
export default function ProfileAvatar({src,name}:{src?:string|null;name:string}) {
 const [failed,setFailed]=useState<string|null>(null);
 return src && failed!==src ? <img src={src} alt={`${name} profile`} onError={()=>setFailed(src)} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'inherit'}}/> : <span aria-label={`${name} profile`}>{name.slice(0,1).toUpperCase()||'U'}</span>;
}
