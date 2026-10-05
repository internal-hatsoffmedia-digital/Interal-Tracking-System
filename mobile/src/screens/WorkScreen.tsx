import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { acceptAssignment, assignTask, getAssignments, WorkAssignment } from '../services/assignments.service';
import { getTasks } from '../services/tasks.service';
import { getEmployees } from '../services/employees.service';
import { useWorkspaceProfile } from '../services/WorkspaceContext';
import { canManageWork } from '../services/access';
export function WorkScreen({ownOnly}: {ownOnly: boolean}) {
  const profile = useWorkspaceProfile();
  const [rows,setRows] = useState<WorkAssignment[]>([]);
  const [tasks,setTasks] = useState<{id:string;title:string}[]>([]);
  const [people,setPeople] = useState<{id:string;full_name:string}[]>([]);
  const [taskId,setTaskId] = useState(''); const [employeeId,setEmployeeId] = useState('');
  const [loading,setLoading] = useState(false);const [busy,setBusy] = useState(false);const [error,setError] = useState('');
  const manager = !ownOnly && canManageWork(profile);
  async function load() {
    setLoading(true);setError('');
    try {
      setRows(await getAssignments(ownOnly));
      if (manager) {
        const [work,employees] = await Promise.all([getTasks(),getEmployees()]);
        setTasks(work);setPeople(employees.filter(person=>person.is_active));
      }
    } catch(e:any) { setError(e.message || 'Unable to load work.'); }
    finally {setLoading(false);}
  }
  useEffect(()=>{void load();},[ownOnly,profile?.id]);
  async function action(fn:()=>Promise<unknown>) {
    setBusy(true);setError('');
    try {await fn();await load();} catch(e:any){setError(e.message || 'Unable to save.');} finally{setBusy(false);}
  }
  return <ScrollView style={styles.page} refreshControl={<RefreshControl refreshing={loading} onRefresh={load}/> }>
    <Text style={styles.title}>{ownOnly?'My Work':'Team Work'}</Text>
    {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text>:null}
    {manager ? <View style={styles.card}>
      <Text style={styles.text}>Assign a task</Text>
      {tasks.length===0?<Text style={styles.text}>Create a task in an active project first.</Text>:null}
      {tasks.map(task=><TouchableOpacity key={task.id} accessibilityRole="button" onPress={()=>setTaskId(task.id)}><Text style={styles.text}>{taskId===task.id?'✓ ':''}{task.title}</Text></TouchableOpacity>)}
      <Text style={styles.text}>Employee</Text>
      {people.map(person=><TouchableOpacity key={person.id} accessibilityRole="button" onPress={()=>setEmployeeId(person.id)}><Text style={styles.text}>{employeeId===person.id?'✓ ':''}{person.full_name}</Text></TouchableOpacity>)}
      <TouchableOpacity accessibilityRole="button" disabled={busy || !taskId || !employeeId} onPress={()=>action(()=>assignTask(taskId,employeeId))}><Text style={styles.action}>{busy?'Saving…':'Assign Task'}</Text></TouchableOpacity>
    </View>:null}
    {!loading && !error && rows.length===0?<Text style={styles.text}>No assignments available.</Text>:null}
    {rows.map(row=><View key={row.id} style={styles.card}>
      <Text style={styles.text}>{row.task?.title || 'Task details unavailable'}</Text>
      <Text style={styles.text}>{row.employee?.full_name || 'Employee'} · {row.status.replace(/_/g,' ')}</Text>
      <Text style={styles.text}>Assigned by: {row.assigner_name || 'Not recorded / unavailable'}</Text>
      <Text style={styles.text}>{row.assigned_at ? new Date(row.assigned_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST' : 'Assignment time not recorded'}</Text>
      {row.task?.due_date?<Text style={styles.text}>Due {row.task.due_date}</Text>:null}
      {ownOnly && row.status==='assigned'?<TouchableOpacity accessibilityRole="button" disabled={busy} onPress={()=>action(()=>acceptAssignment(row.id))}><Text style={styles.action}>Accept Assignment</Text></TouchableOpacity>:null}
    </View>)}
  </ScrollView>;
}
const styles=StyleSheet.create({page:{flex:1,padding:16,backgroundColor:'#ffffff'},title:{fontSize:22,fontWeight:'700',color:'#111111',marginBottom:16},card:{padding:16,backgroundColor:'#ffffff',borderRadius:12,marginBottom:12},text:{color:'#555555',marginBottom:10},error:{color:'#111111',backgroundColor:'#fff7d6',padding:12,marginBottom:12},action:{color:'#111111',backgroundColor:'#ffcc00',padding:12,borderRadius:10,textAlign:'center',fontWeight:'700'}});
