import React,{useEffect,useState} from 'react';
import {Text,View} from 'react-native';
import {NativePage,Field,mobileStyles as s} from '../components/NativePage';
import {workspaceRows,localDate,completed,validDate} from '../services/workspaceData';
export function ReportsScreen(){
 const [data,setData]=useState<{tasks:any[];projects:any[];hours:any[]}>({tasks:[],projects:[],hours:[]});
 const [loading,setLoading]=useState(false);const [error,setError]=useState('');const [from,setFrom]=useState('');const [to,setTo]=useState('');
 async function load(){setLoading(true);setError('');try{const [tasks,projects,hours]=await Promise.all([workspaceRows('tasks','id,title,status,due_date,created_at,project_id'),workspaceRows('projects','id,name,is_active,completed_assets,total_assets_required'),workspaceRows('timesheets','id,work_date,total_hours')]);setData({tasks,projects,hours});}catch(e:any){setError(e.message);}finally{setLoading(false);}}
 useEffect(()=>{void load();},[]);
 const valid=(!from||validDate(from))&&(!to||validDate(to))&&(!from||!to||from<=to);
 const inRange=(date:string)=>(!from||date>=from)&&(!to||date<=to);
 const tasks=data.tasks.filter(t=>inRange(t.created_at.slice(0,10)));const delivered=tasks.filter(t=>completed(t.status)).length;
 const stats=[['Total tasks',tasks.length],['Completion rate',`${tasks.length?Math.round(delivered/tasks.length*100):0}%`],['Delivered',delivered],['Overdue',tasks.filter(t=>t.due_date&&t.due_date<localDate()&&!completed(t.status)).length],['Logged hours',data.hours.filter(h=>inRange(h.work_date)).reduce((sum,h)=>sum+Number(h.total_hours||0),0).toFixed(1)],['Active projects',data.projects.filter(p=>p.is_active).length]];
 const statuses:Record<string,number>=tasks.reduce((result:Record<string,number>,task)=>({...result,[task.status]:(result[task.status]||0)+1}),{});
 return <NativePage title="Reports & insights" loading={loading} error={error} onRefresh={load}><Text style={s.subtitle}>Visible workspace data. Task filters use creation date; hours use work date. Project totals show current active projects.</Text><Field label="From (YYYY-MM-DD)" value={from} onChange={setFrom}/><Field label="To (YYYY-MM-DD)" value={to} onChange={setTo}/>{!valid?<Text accessibilityRole="alert" style={s.text}>Enter valid dates with From before To.</Text>:error?null:<><View style={s.row}>{stats.map(([label,value])=><View key={label} style={[s.card,{width:'47%'}]}><Text style={s.subtitle}>{label}</Text><Text style={s.title}>{value}</Text></View>)}</View><View style={s.card}><Text style={s.heading}>Workflow</Text>{Object.entries(statuses).map(([label,count])=><Text key={label} style={s.text}>{label.replace(/_/g,' ')}: {count}</Text>)}{!tasks.length?<Text style={s.text}>No tasks in this period.</Text>:null}</View><Text style={s.heading}>Project deliverables</Text>{data.projects.filter(p=>p.is_active).map(p=><View key={p.id} style={s.card}><Text style={s.heading}>{p.name}</Text><Text style={s.text}>{p.completed_assets||0} / {p.total_assets_required||0} delivered</Text></View>)}</>}</NativePage>;
}
