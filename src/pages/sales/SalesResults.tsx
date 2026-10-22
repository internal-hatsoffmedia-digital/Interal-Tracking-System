import {useState,type ReactNode} from 'react';
export default function SalesResults({filterKey,count=0,disabled=false,children,label='Show results',requireApply=true}:{filterKey:string;count?:number;disabled?:boolean;children:(limit:number)=>ReactNode;label?:string;requireApply?:boolean}){
 const [applied,setApplied]=useState<string|null>(null),[limit,setLimit]=useState(25);
 const visible=!requireApply||applied===filterKey;
 return <>{requireApply&&<div className="finance-actions"><button className="finance-primary-button" disabled={disabled} onClick={()=>{setApplied(visible?null:filterKey);setLimit(25);}}>{visible?'Hide results':label}</button></div>}{visible?<>{children(limit)}{count>limit&&<div className="finance-actions"><span>Showing {Math.min(limit,count)} of {count}</span><button onClick={()=>setLimit(n=>n+25)}>Show 25 more</button></div>}</>:<p className="finance-chart-note">Choose your filters, then select {label.toLowerCase()} to view this section.</p>}</>;
}
