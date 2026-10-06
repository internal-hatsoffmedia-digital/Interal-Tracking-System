import {useState} from 'react';
export default function ProfilePhotoEditor({value,onChange}:{value:string;onChange:(value:string)=>void}) {
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function upload(file?:File) {
  if(!file)return;
  setError('');
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setError('Choose a JPG, PNG, or WebP image under 5 MB.');return;}
  setBusy(true);const url=URL.createObjectURL(file);
  try {const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const context=canvas.getContext('2d');if(!context)throw new Error();const side=Math.min(image.width,image.height);context.drawImage(image,(image.width-side)/2,(image.height-side)/2,side,side,0,0,256,256);onChange(canvas.toDataURL('image/jpeg',.8));}catch{setError('Unable to read this image. Try another photo.');}finally{URL.revokeObjectURL(url);setBusy(false);}
 }
 return <div className="profile-photo-editor"><label>Upload profile photo<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e=>{void upload(e.target.files?.[0]);e.target.value='';}}/></label><p>Square crop · JPG, PNG or WebP · up to 5 MB. Select Save Changes to save your picture.</p><div className="profile-photo-options">{['female','male'].map(kind=><button type="button" aria-pressed={value===`/avatars/${kind}.svg`} key={kind} onClick={()=>onChange(`/avatars/${kind}.svg`)}><img src={`/avatars/${kind}.svg`} alt=""/>{kind==='female'?'Female avatar':'Male avatar'}</button>)}<button type="button" onClick={()=>onChange('')}>Use initials</button></div>{busy&&<p role="status">Preparing photo…</p>}{error&&<p role="alert">{error}</p>}</div>;
}
