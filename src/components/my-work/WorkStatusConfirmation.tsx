import {CheckCircle2} from 'lucide-react';
import WorkspaceDialog from '../layouts/WorkspaceDialog';
export default function WorkStatusConfirmation({status,taskTitle,onClose,onConfirm}:{status:string;taskTitle?:string;onClose:()=>void;onConfirm:()=>void}){return (
<WorkspaceDialog compact titleId="my-work-confirm-title" onClose={onClose}>
        <header className="workspace-dialog-header work-confirm-header">
          <div className="work-confirm-icon"><CheckCircle2 size={24}/></div>
          <div><p className="work-confirm-eyebrow">MY WORK</p><h2 id="my-work-confirm-title">{status==='accepted'?'Accept task':status==='in_progress'?'Start task':'Complete task'}</h2></div>
          <button className="work-confirm-close" aria-label="Close confirmation" onClick={onClose}>×</button>
        </header>
        <div className="workspace-dialog-body work-confirm-body">
          <p>{status==='completed'?'Submit your finished work to the Project Coordinator for review.':status==='in_progress'?'Ready to begin? This marks your assignment as in progress.':'Accept this assignment so your coordinator knows you have picked it up.'}</p>
          <div className="work-confirm-task"><span>Task</span><strong>{taskTitle}</strong></div>
        </div>
        <footer className="work-confirm-footer"><button className="work-confirm-cancel" onClick={onClose}>Cancel</button><button className="work-confirm-primary" onClick={onConfirm}>{status==='accepted'?'Accept task':status==='in_progress'?'Start task':'Submit for review'}</button></footer>
      </WorkspaceDialog>
);}
