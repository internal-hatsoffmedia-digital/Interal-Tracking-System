import React,{useEffect,useState} from 'react';
import {Text,View,TouchableOpacity} from 'react-native';
import {supabase} from '../services/supabase';
import {useWorkspaceProfile} from '../services/WorkspaceContext';
import {coordinatorMetrics} from '../services/coordinatorMetrics';
type Summary=ReturnType<typeof coordinatorMetrics>;
export function CoordinatorOverview(){
 const profile=useWorkspaceProfile();const [rows,setRows]=useState<Summary>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(false);const [expanded,setExpanded]=useState<string|null>(null);
 async function load(){
  setError('');setLoading(true);
  try{
   if(!profile?.team_id)throw new Error('Your coordination team is not linked. Ask your administrator to link you and your coordinators to the same team.');
   const people=await supabase.from('profiles').select('id,full_name').eq('team_id',profile.team_id).eq('role','project_coordinator').eq('is_active',true);
   if(people.error)throw new Error(people.error.message);
   const coordinators=people.data||[];
   if(!coordinators.length){setRows([]);return;}
   const ids=coordinators.map(person=>person.id);
   async function pages(table:string,columns:string,key:string,values:string[]){
    if(!values.length)return [];
    const result:any[]=[];
    for(let offset=0;;offset+=500){const response=await supabase.from(table).select(columns).in(key,values).order('id').range(offset,offset+499);if(response.error)throw new Error(response.error.message);const page=response.data||[];result.push(...page);if(page.length<500)break;}
    return result;
   }
   const projects=await pages('projects','id,name,created_by,status','created_by',ids);
   const assignments=await pages('task_assignments','id,task_id,assigned_by,status','assigned_by',ids);
   const [createdTasks,projectTasks,assignedTasks]=await Promise.all([
    pages('tasks','id,title,project_id,created_by,status,due_date','created_by',ids),
    pages('tasks','id,title,project_id,created_by,status,due_date','project_id',projects.map(p=>p.id)),
    pages('tasks','id,title,project_id,created_by,status,due_date','id',assignments.map(a=>a.task_id))]);
   const tasks=Array.from(new Map([...createdTasks,...projectTasks,...assignedTasks].map(task=>[task.id,task])).values());
   const date=new Date();const today=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
   setRows(coordinatorMetrics(coordinators,projects,tasks,assignments,today));
  }catch(e:any){setRows([]);setError(e.message || 'Unable to load coordinator activity.');}finally{setLoading(false);}
 }
 useEffect(()=>{if(profile?.role==='associate_lead')void load();},[profile?.id,profile?.team_id]);
 if(profile?.role!=='associate_lead')return null;
 return <View style={{marginBottom:20}}><Text style={{color:'white',fontSize:18,fontWeight:'700'}}>Coordinator Activity</Text>
 <TouchableOpacity accessibilityRole="button" disabled={loading} onPress={load}><Text style={{color:'#ffcc00',paddingVertical:12}}>{loading?'Loading…':'Refresh coordinator activity'}</Text></TouchableOpacity>
 {error?<Text accessibilityRole="alert" style={{color:'#fca5a5'}}>{error}</Text>:null}
 {!loading&&!error&&!rows.length?<Text style={{color:'#94a3b8'}}>No active coordinators are linked to your team.</Text>:null}
 {rows.map(row=><View key={row.id} style={{backgroundColor:'#111827',padding:16,borderRadius:12,marginBottom:12}}>
 <TouchableOpacity accessibilityRole="button" onPress={()=>setExpanded(expanded===row.id?null:row.id)}><Text style={{color:'white',fontWeight:'700'}}>{row.name}</Text></TouchableOpacity>
 <Text style={{color:'#cbd5e1',marginTop:8}}>{row.projects.length} projects created · {row.assignmentsMade} assignments made</Text>
 <Text style={{color:'#cbd5e1',marginTop:8}}>{row.pending} pending · {row.overdue} overdue · {row.completed} delivered tasks</Text>
 {expanded===row.id?<View>{row.projects.map(project=><Text key={project.id} style={{color:'#cbd5e1',marginTop:8}}>{project.name} · {project.status.replace(/_/g,' ')}</Text>)}{row.tasks.map(task=><Text key={task.id} style={{color:'#cbd5e1',marginTop:8}}>{task.title} · {task.status.replace(/_/g,' ')}</Text>)}</View>:null}
 </View>)}</View>;
}
