export function coordinatorMetrics(
  coordinators: {id:string;full_name:string}[],
  projects: {id:string;name:string;created_by:string|null;status:string}[],
  tasks: {id:string;title:string;project_id:string;created_by:string|null;status:string;due_date:string|null}[],
  assignments: {id:string;task_id:string;assigned_by:string|null;status:string}[],
  today:string,
) {
  return coordinators.map(person=>{
    const managedProjects=projects.filter(project=>project.created_by===person.id);
    const assigned=assignments.filter(assignment=>assignment.assigned_by===person.id);
    const work=tasks.filter(task=>task.created_by===person.id || managedProjects.some(project=>project.id===task.project_id) || assigned.some(assignment=>assignment.task_id===task.id));
    const complete=(status:string)=>['approved_delivered','approved_and_delivered','completed'].includes(status);
    return {id:person.id,name:person.full_name,projects:managedProjects,assignmentsMade:assigned.length,
      completed:work.filter(task=>complete(task.status)).length,
      pending:work.filter(task=>!complete(task.status)).length,
      overdue:work.filter(task=>!complete(task.status)&&task.due_date&&task.due_date<today).length,
      tasks:work};
  });
}
